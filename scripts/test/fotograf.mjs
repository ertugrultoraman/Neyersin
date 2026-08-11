/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import postgres from "postgres";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * PROFIL FOTOGRAFI — yuklenen yerde degil, GORUNMESI gereken yerde.
 *
 * Fotograf hesap sayfasindan (/hesabim) yukleniyor ama asil isi mutfagin
 * herkese acik sayfasinda: adin ustundeki buyuk yuvarlak gorsel. Yukleme
 * kaydedip sayfa gostermezse iki taraf da kendi basina "calisiyor" gorunur.
 *
 * Olculen sey yalnizca "gorsel var mi" degil; NEREDE ve NE BUYUKLUKTE oldugu
 * da olculuyor: gorsel isim ETIKETININ USTUNDE, yuvarlak ve iri olmali.
 * Sirf varliga bakan bir kontrol, gorsel menunun dibine 40 piksellik bir nokta
 * olarak dusse de gecerdi.
 *
 * Test kendi copunu topluyor: fotografi kaldirip hesabi bastaki hâline
 * dondururuyor.
 *
 * Kullanim:  npm run test:fotograf
 *   TEST_FOTOGRAF=<dosya.png>  — kendi gorselinle calistir (ekran goruntusu icin)
 *   TEST_EKRAN=<hedef.png>     — mutfak sayfasinin ekran goruntusunu kaydet
 */
const KOK = process.env.TEST_KOK ?? "https://neyersin.local";
const TEST_PAROLA = process.env.TEST_PAROLA;

if (!process.env.ADMIN_PASSWORD) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }
if (!TEST_PAROLA) { console.error("TEST_PAROLA yok — once: npm run hesap:test"); process.exit(2); }
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL yok."); process.exit(2); }

/** Deneme mutfagini isleten hesap — `npm run hesap:test` ile aciliyor. */
const SAHIP = "ornek@gmail.com";

/** 8x8 duz renk PNG: icerigi onemsiz, gecerli bir gorsel olmasi yeterli. */
const KUCUK_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR42mN4saULK2IYWhIA0WOJgafJQlkAAAAASUVORK5CYII=";

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const tarayici = kapiliTarayici(await chromium.launch(), new URL(KOK).hostname);

let dosya = process.env.TEST_FOTOGRAF;
if (!dosya) {
  dosya = path.join(os.tmpdir(), "ny-deneme-portre.png");
  fs.writeFileSync(dosya, Buffer.from(KUCUK_PNG, "base64"));
}

async function fotografAl() {
  const [s] = await sql`SELECT fotograf_url FROM hesaplar WHERE eposta = ${SAHIP}`;
  return s?.fotograf_url ?? null;
}

let no = 0;
/* Testten ONCEKI fotograf — sonunda aynen geri konuyor. */
const oncekiFotograf = await fotografAl();

try {
  const [satir] = await sql`SELECT restoran_slug FROM hesaplar WHERE eposta = ${SAHIP}`;
  const slug = satir?.restoran_slug;
  if (!slug) {
    bad((no += 1), `${SAHIP} bir mutfaga bagli degil`);
    throw new Error("deneme hesabinin mutfagi yok");
  }

  const baglam = await tarayici.newContext({ ignoreHTTPSErrors: true });
  const sayfa = await baglam.newPage();

  await sayfa.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
  await sayfa.fill('input[name="kimlik"]', SAHIP);
  await sayfa.fill('input[name="parola"]', TEST_PAROLA);
  await sayfa.locator('form:has(input[name="kimlik"])').locator('button[type="submit"]').click();
  await sayfa.waitForURL((u) => !/\/hesap\/giris/.test(String(u)), { timeout: 25000 });

  // ═══════════════ 1. YUKLEME ═══════════════
  await sayfa.goto(`${KOK}/hesabim`, { waitUntil: "networkidle" });
  const alan = sayfa.locator('form:has(input[name="fotograf"])');
  (await alan.count()) > 0
    ? ok((no += 1), "hesap sayfasinda fotograf alani var")
    : bad((no += 1), "/hesabim'da fotograf alani yok");

  await sayfa.setInputFiles('input[name="fotograf"]', dosya);
  await alan.locator('button[type="submit"]').click();
  await sayfa.waitForSelector("text=Fotoğraf kaydedildi", { timeout: 30000 }).catch(() => {});

  const url = await fotografAl();
  url
    ? ok((no += 1), "fotograf yuklendi ve adresi hesaba yazildi")
    : bad((no += 1), "fotograf kaydedilmedi — hesapta adres yok");
  if (!url) throw new Error("yukleme basarisiz");

  // ═══════════════ 2. MUTFAK SAYFASINDA GORUNUYOR MU ═══════════════
  await sayfa.goto(`${KOK}/restoran/${slug}`, { waitUntil: "networkidle" });

  /*
   * `next/image` adresi `/_next/image?url=...` olarak yeniden yaziyor; gorsel
   * kodlanmis hâliyle src'nin icinde duruyor.
   */
  const gorsel = sayfa.locator(`img[src*="${encodeURIComponent(url).slice(0, 60)}"]`).first();
  (await gorsel.count()) > 0
    ? ok((no += 1), "fotograf mutfak sayfasinda basiliyor")
    : bad((no += 1), "mutfak sayfasinda fotograf yok — yukleme ile sayfa birbirini gormuyor");

  if ((await gorsel.count()) > 0) {
    const kutu = await gorsel.boundingBox();
    const baslik = await sayfa.locator("h1").first().boundingBox();

    kutu && baslik && kutu.y + kutu.height <= baslik.y + 4
      ? ok((no += 1), "fotograf mutfagin ADININ USTUNDE")
      : bad((no += 1), `fotograf ismin ustunde degil: ${JSON.stringify({ kutu, baslik })}`);

    kutu && kutu.width >= 110
      ? ok((no += 1), `fotograf iri (${Math.round(kutu.width)} piksel)`)
      : bad((no += 1), `fotograf kucuk kalmis: ${Math.round(kutu?.width ?? 0)} piksel`);

    /* Yuvarlaklik: kose yaricapi genisligin yarisi kadarsa daire demektir. */
    const yuvarlak = await gorsel.evaluate((el) => {
      const kap = el.parentElement;
      if (!kap) return false;
      return parseFloat(getComputedStyle(kap).borderTopLeftRadius) >= kap.clientWidth / 2 - 1;
    });
    yuvarlak
      ? ok((no += 1), "fotograf yuvarlak")
      : bad((no += 1), "fotograf yuvarlak degil");

    if (process.env.TEST_EKRAN) {
      await sayfa.screenshot({ path: process.env.TEST_EKRAN });
    }
  }

  /* Misafir de goruyor mu — fotograf herkese acik, oturuma bagli degil. */
  const misafirBaglam = await tarayici.newContext({ ignoreHTTPSErrors: true });
  const misafir = await misafirBaglam.newPage();
  await misafir.goto(`${KOK}/restoran/${slug}`, { waitUntil: "networkidle" });
  (await misafir.locator(`img[src*="${encodeURIComponent(url).slice(0, 60)}"]`).count()) > 0
    ? ok((no += 1), "giris yapmamis ziyaretci de fotografi goruyor")
    : bad((no += 1), "fotograf yalnizca giris yapana gorunuyor");
  await misafirBaglam.close();

  // ═══════════════ 3. KALDIRMA ═══════════════
  await sayfa.goto(`${KOK}/hesabim`, { waitUntil: "networkidle" });
  await sayfa.locator('button:has-text("Fotoğrafı kaldır")').click();
  await sayfa.waitForSelector("text=Fotoğraf kaldırıldı", { timeout: 30000 }).catch(() => {});

  (await fotografAl()) === null
    ? ok((no += 1), "fotograf kaldirildi")
    : bad((no += 1), "kaldirma islemedi — adres hesapta duruyor");

  await sayfa.goto(`${KOK}/restoran/${slug}`, { waitUntil: "networkidle" });
  (await sayfa.locator(`img[src*="${encodeURIComponent(url).slice(0, 60)}"]`).count()) === 0
    ? ok((no += 1), "kaldirilan fotograf mutfak sayfasindan da dustu")
    : bad((no += 1), "kaldirilan fotograf mutfak sayfasinda duruyor");

  await baglam.close();
} catch (hata) {
  bad((no += 1), `beklenmeyen hata: ${String(hata?.message ?? hata).split("\n")[0]}`);
} finally {
  await tarayici.close();
  /* Hesap testten once nasilsa oyle kalsin. */
  await sql`UPDATE hesaplar SET fotograf_url = ${oncekiFotograf} WHERE eposta = ${SAHIP}`
    .catch(() => {});
  await sql.end();
}

console.log("\nPROFIL FOTOGRAFI\n" + cikti.join("\n"));
if (hatalar.length > 0) {
  console.error(`\n${hatalar.length} kontrol basarisiz.`);
  process.exit(1);
}
console.log(`\n${no}/${no} kontrol gecti.`);
