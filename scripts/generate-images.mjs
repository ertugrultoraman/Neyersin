#!/usr/bin/env node
/**
 * Ne Yersin? — AI görsel üretimi ve Vercel Blob'a yükleme
 * ============================================================================
 *
 * Akış:  prompt kaydı → AI görsel API'si → PNG buffer → Vercel Blob (public CDN)
 *        → `src/content/generated/images.json` manifestine public URL yazılır.
 *
 * Bu script BUILD/AUTHORING zamanında elle çalıştırılır, istek başına değil.
 * Üretilen URL'ler manifestle birlikte commit edilir; böylece Vercel'de yeni
 * bir build maliyet doğurmadan aynı görselleri CDN'den servis eder.
 *
 * Kullanım:
 *   npm run images:generate                # eksik görselleri üret
 *   npm run images:generate -- --force     # hepsini yeniden üret
 *   npm run images:generate -- --only=home/hero,veri/hero
 *   npm run images:generate -- --dry-run   # hiçbir çağrı yapmadan planı göster
 *   npm run images:generate -- --provider=google
 *
 * Gerekli ortam değişkenleri (.env.local veya Vercel env):
 *   BLOB_READ_WRITE_TOKEN   — Vercel Blob yazma tokenı
 *   IMAGE_PROVIDER          — openai | google | replicate | pollinations
 *                             (pollinations ücretsizdir ve anahtar istemez)
 *   + seçilen sağlayıcının anahtarı (bkz. .env.example)
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { put } from "@vercel/blob";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROMPT_DOSYASI = path.join(KOK, "src/content/image-prompts.json");
const MANIFEST_DOSYASI = path.join(KOK, "src/content/generated/images.json");

/**
 * Görsel dili iki stilde yürür:
 *  - "vektor" (varsayılan) → site içi anlatım görselleri, marka paletinde illüstrasyon
 *  - "foto"                → menü/yemek kartları, gerçek yemek fotoğrafı görünümü
 * Prompt kaydındaki `style` alanı hangisinin uygulanacağını belirler.
 */
const STIL_EKLERI = {
  vektor: [
    "Flat vector editorial illustration with friendly rounded shapes and soft thick outlines",
    "warm brand palette: golden yellow #FFC220, light cream #FFF9EF, deep espresso brown #3B2412, small tomato red accents",
    "soft long shadows, subtle paper grain texture, gentle depth",
    "balanced composition with generous negative space",
    "absolutely no text, no lettering, no numbers, no logos, no watermarks, no signatures",
    "professional, modern, appetizing and optimistic mood",
  ].join(", "),
  foto: [
    "professional food photography, 45 degree angle, natural soft window light from the side",
    "shallow depth of field, creamy bokeh background, crisp focus on the dish",
    "served on simple ceramic tableware over a warm wooden or stone surface",
    "fresh garnish, natural steam, glistening appetizing texture",
    "food magazine / restaurant menu quality, high detail, realistic colors",
    "absolutely no text, no lettering, no menu cards, no logos, no watermarks",
  ].join(", "),
};

const YASAKLAR = {
  vektor:
    "text, words, letters, typography, watermark, logo, signature, blurry, distorted anatomy, extra limbs, low quality",
  foto: "text, words, letters, typography, watermark, logo, signature, illustration, cartoon, 3d render, plastic looking food, oversaturated, messy plating, low quality",
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const bayrak = (ad) => argv.includes(`--${ad}`);
const deger = (ad) => {
  const bulunan = argv.find((a) => a.startsWith(`--${ad}=`));
  return bulunan ? bulunan.slice(ad.length + 3) : undefined;
};

if (bayrak("help") || bayrak("h")) {
  console.log(
    [
      "Ne Yersin? görsel üretimi",
      "",
      "  --dry-run           API çağrısı yapmadan planı yazdır",
      "  --force             Manifestte olanları da yeniden üret",
      "  --only=a,b          Sadece bu anahtarları üret",
      "  --provider=NAME     openai | google | replicate | pollinations",
      "  --concurrency=N     Paralel istek sayısı (varsayılan 2)",
    ].join("\n"),
  );
  process.exit(0);
}

const KURU = bayrak("dry-run");
const ZORLA = bayrak("force");
const SADECE = deger("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const PARALEL = Number(deger("concurrency") ?? 2);

// ---------------------------------------------------------------------------
// Ortam değişkenleri
// ---------------------------------------------------------------------------

for (const dosya of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(KOK, dosya));
  } catch {
    // dosya yok — sorun değil, Vercel'de env zaten enjekte edilir
  }
}

const SAGLAYICI = deger("provider") ?? process.env.IMAGE_PROVIDER ?? "openai";

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

const renk = {
  bilgi: (s) => `[36m${s}[0m`,
  ok: (s) => `[32m${s}[0m`,
  uyari: (s) => `[33m${s}[0m`,
  hata: (s) => `[31m${s}[0m`,
  soluk: (s) => `[90m${s}[0m`,
};

function boyutSec(oran) {
  const [g, y] = String(oran).split("/").map(Number);
  const r = g / y;
  if (r > 1.15) return { width: 1536, height: 1024, etiket: "1536x1024" };
  if (r < 0.87) return { width: 1024, height: 1536, etiket: "1024x1536" };
  return { width: 1024, height: 1024, etiket: "1024x1024" };
}

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/** Anahtardan kararlı bir sayı üretir — seed'i sabitlemek için (djb2). */
function tohumla(metin) {
  let h = 5381;
  for (let i = 0; i < metin.length; i += 1) h = ((h << 5) + h + metin.charCodeAt(i)) >>> 0;
  return h % 1_000_000;
}

/** Hız sınırı (429 / kuyruk dolu) hataları daha uzun beklemeyi hak eder. */
const hizSiniriMi = (mesaj) => /\b429\b|too many requests|queue full|rate limit/i.test(mesaj);

async function tekrarDene(etiket, fn, deneme = 4) {
  let sonHata;
  for (let i = 1; i <= deneme; i += 1) {
    try {
      return await fn();
    } catch (err) {
      sonHata = err;
      if (i < deneme) {
        const gecikme = (hizSiniriMi(err.message) ? 10_000 : 1500) * 2 ** (i - 1);
        console.log(
          renk.uyari(`   ↻ ${etiket} başarısız (${i}/${deneme}): ${err.message} — ${gecikme}ms sonra tekrar`),
        );
        await bekle(gecikme);
      }
    }
  }
  throw sonHata;
}

// ---------------------------------------------------------------------------
// Sağlayıcılar — hepsi PNG/JPEG buffer döndürür
// ---------------------------------------------------------------------------

const saglayicilar = {
  async openai(prompt, boyut) {
    const anahtar = process.env.OPENAI_API_KEY;
    if (!anahtar) throw new Error("OPENAI_API_KEY tanımlı değil");

    const cevap = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anahtar}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
        prompt,
        size: boyut.etiket,
        quality: "high",
        n: 1,
      }),
    });

    if (!cevap.ok) {
      throw new Error(`OpenAI ${cevap.status}: ${(await cevap.text()).slice(0, 300)}`);
    }

    const veri = await cevap.json();
    const b64 = veri?.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI yanıtında görsel verisi yok");
    return { buffer: Buffer.from(b64, "base64"), contentType: "image/png" };
  },

  async google(prompt, boyut) {
    const anahtar = process.env.GOOGLE_API_KEY;
    if (!anahtar) throw new Error("GOOGLE_API_KEY tanımlı değil");

    const model = process.env.GOOGLE_IMAGE_MODEL ?? "imagen-4.0-generate-001";
    const oran = boyut.width > boyut.height ? "16:9" : boyut.width < boyut.height ? "3:4" : "1:1";

    // Gemini görsel modelleri ("Nano Banana" dahil) Imagen'den farklı bir API
    // şekli kullanır: generateContent + inlineData, predict + bytesBase64Encoded değil.
    if (model.startsWith("gemini")) {
      const cevap = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "x-goog-api-key": anahtar, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${prompt}\n\nGörsel oranı: ${oran}.` }] }],
            generationConfig: { responseModalities: ["IMAGE"] },
          }),
        },
      );

      if (!cevap.ok) {
        throw new Error(`Google ${cevap.status}: ${(await cevap.text()).slice(0, 300)}`);
      }

      const veri = await cevap.json();
      const parcalar = veri?.candidates?.[0]?.content?.parts ?? [];
      const gorsel = parcalar.find((p) => p.inlineData)?.inlineData;
      if (!gorsel?.data) throw new Error("Gemini yanıtında görsel verisi yok");
      return {
        buffer: Buffer.from(gorsel.data, "base64"),
        contentType: gorsel.mimeType ?? "image/png",
      };
    }

    const cevap = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
      {
        method: "POST",
        headers: { "x-goog-api-key": anahtar, "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: oran, personGeneration: "allow_adult" },
        }),
      },
    );

    if (!cevap.ok) {
      throw new Error(`Google ${cevap.status}: ${(await cevap.text()).slice(0, 300)}`);
    }

    const veri = await cevap.json();
    const b64 = veri?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error("Google yanıtında görsel verisi yok");
    return { buffer: Buffer.from(b64, "base64"), contentType: "image/png" };
  },

  /**
   * Pollinations.ai — Flux tabanlı, anahtar gerektirmeyen ücretsiz görsel API'si.
   * Ücretli sağlayıcı (OpenAI/Google/Replicate) hazır olana kadar köprü olarak
   * kullanılır: aynı prompt + aynı seed hep aynı görseli verir, bu yüzden
   * yeniden üretim deterministiktir.
   *
   * Anonim tier IP başına aynı anda YALNIZCA 1 istek kabul eder ("Queue full"
   * → 429). Bu yüzden `--concurrency=1` ile çalıştırılmalı; ardışık istekler
   * arasına da küçük bir nefes payı bırakılır.
   */
  async pollinations(prompt, boyut, anahtarAdi) {
    const model = process.env.POLLINATIONS_MODEL ?? "flux";
    const url = new URL(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 1800))}`,
    );
    url.searchParams.set("width", String(boyut.width));
    url.searchParams.set("height", String(boyut.height));
    url.searchParams.set("model", model);
    url.searchParams.set("nologo", "true");
    url.searchParams.set("safe", "false");
    // Anahtardan türeyen sabit seed → aynı görsel anahtarı hep aynı kareyi üretir.
    url.searchParams.set("seed", String(tohumla(anahtarAdi)));
    if (process.env.POLLINATIONS_TOKEN) {
      url.searchParams.set("token", process.env.POLLINATIONS_TOKEN);
    }

    const cevap = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(180_000),
    });

    if (!cevap.ok) {
      throw new Error(`Pollinations ${cevap.status}: ${(await cevap.text()).slice(0, 200)}`);
    }

    const contentType = cevap.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Pollinations görsel değil "${contentType}" döndürdü`);
    }

    const buffer = Buffer.from(await cevap.arrayBuffer());
    // Hız sınırı/hata karelerinde çok küçük bir yer tutucu döner — sessizce kabul etme.
    if (buffer.length < 8 * 1024) {
      throw new Error(`Pollinations şüpheli küçük görsel döndürdü (${buffer.length} B)`);
    }
    await bekle(1200); // kuyruk slotunun serbest kaldığından emin ol
    return { buffer, contentType };
  },

  async replicate(prompt, boyut) {
    const anahtar = process.env.REPLICATE_API_TOKEN;
    if (!anahtar) throw new Error("REPLICATE_API_TOKEN tanımlı değil");

    const model = process.env.REPLICATE_IMAGE_MODEL ?? "black-forest-labs/flux-1.1-pro";
    const oran = boyut.width > boyut.height ? "16:9" : boyut.width < boyut.height ? "3:4" : "1:1";

    const cevap = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anahtar}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: { prompt, aspect_ratio: oran, output_format: "png", safety_tolerance: 2 },
      }),
    });

    if (!cevap.ok) {
      throw new Error(`Replicate ${cevap.status}: ${(await cevap.text()).slice(0, 300)}`);
    }

    const veri = await cevap.json();
    const url = Array.isArray(veri?.output) ? veri.output[0] : veri?.output;
    if (typeof url !== "string") {
      throw new Error(`Replicate çıktısı beklenen formatta değil (durum: ${veri?.status})`);
    }

    const dosya = await fetch(url);
    if (!dosya.ok) throw new Error(`Replicate görseli indirilemedi: ${dosya.status}`);
    return {
      buffer: Buffer.from(await dosya.arrayBuffer()),
      contentType: dosya.headers.get("content-type") ?? "image/png",
    };
  },
};

// ---------------------------------------------------------------------------
// Ana akış
// ---------------------------------------------------------------------------

async function main() {
  const promptlar = JSON.parse(await readFile(PROMPT_DOSYASI, "utf8"));
  const manifest = JSON.parse(await readFile(MANIFEST_DOSYASI, "utf8"));
  manifest.images ??= {};

  let hedefler = promptlar;
  if (SADECE) hedefler = hedefler.filter((p) => SADECE.includes(p.key));
  if (!ZORLA) hedefler = hedefler.filter((p) => !manifest.images[p.key]?.url);

  console.log("");
  console.log(renk.bilgi("Ne Yersin? — AI görsel üretimi"));
  console.log(renk.soluk(`  sağlayıcı : ${SAGLAYICI}`));
  console.log(renk.soluk(`  manifest  : ${Object.keys(manifest.images).length}/${promptlar.length} hazır`));
  console.log(renk.soluk(`  üretilecek: ${hedefler.length}`));
  console.log("");

  if (hedefler.length === 0) {
    console.log(renk.ok("✓ Üretilecek yeni görsel yok. (--force ile hepsini yenileyebilirsin.)"));
    return;
  }

  if (KURU) {
    for (const p of hedefler) {
      const b = boyutSec(p.aspect);
      console.log(`${renk.bilgi("•")} ${p.key} ${renk.soluk(`[${p.aspect} → ${b.etiket}]`)}`);
      console.log(renk.soluk(`  ${p.prompt.slice(0, 120)}…`));
    }
    console.log("");
    console.log(renk.uyari("Kuru çalışma (--dry-run): hiçbir API çağrısı veya yükleme yapılmadı."));
    return;
  }

  const uret = saglayicilar[SAGLAYICI];
  if (!uret) {
    throw new Error(
      `Bilinmeyen sağlayıcı "${SAGLAYICI}". Geçerli değerler: ${Object.keys(saglayicilar).join(", ")}`,
    );
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN tanımlı değil. Vercel Dashboard → Storage → Blob ile bir store " +
        "oluşturup `vercel env pull .env.local` çalıştır veya tokenı .env.local'a ekle.",
    );
  }

  const basarili = [];
  const basarisiz = [];
  const kuyruk = [...hedefler];

  async function isci(no) {
    while (kuyruk.length > 0) {
      const p = kuyruk.shift();
      if (!p) return;
      const boyut = boyutSec(p.aspect);
      const stil = p.style === "foto" ? "foto" : "vektor";
      const tamPrompt = `${p.prompt}. ${STIL_EKLERI[stil]}. Avoid: ${YASAKLAR[stil]}.`;

      try {
        console.log(`${renk.bilgi("→")} ${p.key} ${renk.soluk(`(işçi ${no}, ${boyut.etiket})`)}`);

        const { buffer, contentType } = await tekrarDene(p.key, () =>
          uret(tamPrompt, boyut, p.key),
        );

        // addRandomSuffix: false → aynı anahtar hep aynı URL'e yazılır (idempotent)
        const sonuc = await tekrarDene(`${p.key} upload`, () =>
          put(`ny/${p.key}.png`, buffer, {
            access: "public",
            contentType,
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControlMaxAge: 60 * 60 * 24 * 365,
          }),
        );

        manifest.images[p.key] = {
          url: sonuc.url,
          width: boyut.width,
          height: boyut.height,
          provider: SAGLAYICI,
          generatedAt: new Date().toISOString(),
        };
        basarili.push(p.key);
        console.log(`${renk.ok("✓")} ${p.key} ${renk.soluk(`(${(buffer.length / 1024).toFixed(0)} KB)`)}`);
        console.log(renk.soluk(`  ${sonuc.url}`));

        // Her başarılı üretimden sonra manifesti yaz — yarıda kesilse de kayıp olmaz
        await manifestYaz(manifest);
      } catch (err) {
        basarisiz.push({ key: p.key, hata: err.message });
        console.log(`${renk.hata("✗")} ${p.key}: ${err.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(PARALEL, 6)) }, (_, i) => isci(i + 1)),
  );

  console.log("");
  console.log(renk.ok(`✓ ${basarili.length} görsel üretildi ve Blob'a yüklendi.`));
  if (basarisiz.length > 0) {
    console.log(renk.hata(`✗ ${basarisiz.length} görsel başarısız:`));
    for (const b of basarisiz) console.log(renk.soluk(`  - ${b.key}: ${b.hata}`));
  }
  console.log(
    renk.soluk("  Manifest güncellendi: src/content/generated/images.json — commit etmeyi unutma."),
  );
  console.log("");

  if (basarisiz.length > 0 && basarili.length === 0) process.exitCode = 1;
}

async function manifestYaz(manifest) {
  const sirali = Object.keys(manifest.images)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: manifest.images[k] }), {});
  manifest.images = sirali;
  await writeFile(MANIFEST_DOSYASI, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

main().catch((err) => {
  console.error("");
  console.error(renk.hata(`Hata: ${err.message}`));
  console.error("");
  process.exit(1);
});
