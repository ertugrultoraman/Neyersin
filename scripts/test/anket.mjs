/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import fs from "node:fs";
import postgres from "postgres";
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * ANKET
 *
 * Kurallar:
 *  - Oy vermeden yuzdeler GORUNMEZ (surude etkisi olmasin)
 *  - Oy verince yuzdeler ve toplam oy sayisi gorunur
 *  - Ayni kisi ikinci kez oy veremez (sayac sismez)
 *  - Yonetici kimin ne oy verdigini gorur
 */
const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 2 });

const tarayici = kapiliTarayici(await chromium.launch());

async function bitir(patlama) {
  // Test oylarini temizle
  await sql`DELETE FROM anket_oylari WHERE secmen LIKE 'misafir:%'`.catch(() => {});
  await sql.end().catch(() => {});
  await tarayici.close().catch(() => {});
  if (patlama) cikti.push(`  !   test yarida kesildi: ${String(patlama).split("\n")[0]}`);
  console.log(cikti.join("\n"));
  const sorun = hatalar.length + (patlama ? 1 : 0);
  console.log("\n" + (sorun === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${sorun} SORUN`));
  process.exit(sorun === 0 ? 0 : 1);
}
process.on("unhandledRejection", (e) => void bitir(e));
process.on("uncaughtException", (e) => void bitir(e));

// Temiz baslangic
await sql`DELETE FROM anket_oylari WHERE secmen LIKE 'misafir:%'`.catch(() => {});

const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 1000 } });
const s = await baglam.newPage();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

// ============ 1. OY VERMEDEN YUZDE GORUNMEZ ============
await s.goto(KOK, { waitUntil: "networkidle" });
await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
await s.reload({ waitUntil: "networkidle" });

const anket = s.locator('aside[aria-labelledby="anket-basligi"]');
(await anket.count()) === 1 ? ok(1, "anket ana sayfada var") : bad(1, "anket yok");
if ((await anket.count()) === 0) await bitir("anket bulunamadi");

const oncesi = await anket.innerText();
/Genelde ne yemeyi tercih ediyorsunuz/i.test(oncesi)
  ? ok(2, "anket sorusu dogru")
  : bad(2, `soru yanlis: ${oncesi.slice(0, 60)}`);

oncesi.includes("%") ? bad(3, "oy vermeden yuzde gorunuyor") : ok(3, "oy vermeden yuzde gizli");

const secenekler = await anket.locator('button[name="secenek"]').count();
secenekler === 5 ? ok(4, "5 secenek var") : bad(4, `secenek sayisi: ${secenekler}`);

// ============ 2. OY VER ============
await anket.locator('button[value="manti"]').click();
await s.waitForFunction(
  () => document.querySelector('aside[aria-labelledby="anket-basligi"]')?.textContent?.includes("%"),
  null,
  { timeout: 20000 },
).then(() => ok(5, "oy verince yuzdeler acildi")).catch(() => bad(5, "yuzdeler acilmadi"));

const sonrasi = await anket.innerText();
/1 kişi oy verdi|kişi oy verdi/.test(sonrasi)
  ? ok(6, "toplam oy sayisi gorunuyor")
  : bad(6, `oy sayisi yok: ${sonrasi.slice(0, 80)}`);

/senin oyun/i.test(sonrasi) ? ok(7, "kendi oyu isaretli") : bad(7, "kendi oyu isaretlenmemis");

const kayit = await sql`SELECT secenek, girisli FROM anket_oylari WHERE secmen LIKE 'misafir:%'`;
kayit.length === 1 && kayit[0].secenek === "manti"
  ? ok(8, "oy veritabanina yazildi")
  : bad(8, `veritabani: ${JSON.stringify(kayit)}`);

// ============ 3. AYNI KISI IKINCI KEZ OY VEREMEZ ============
await s.reload({ waitUntil: "networkidle" });
const tekrar = await anket.innerText();
tekrar.includes("%") ? ok(9, "yeniden girince sonuc gosteriliyor") : bad(9, "sonuc kayboldu");

const sayim = await sql`SELECT COUNT(*)::int AS n FROM anket_oylari WHERE secmen LIKE 'misafir:%'`;
sayim[0].n === 1 ? ok(10, "tekrar oy sayaci sismiyor") : bad(10, `oy sayisi: ${sayim[0].n}`);

// ============ 4. BASKA ZIYARETCI AYRI SAYILIYOR ============
const ikinci = await tarayici.newContext();
const s2 = await ikinci.newPage();
await s2.goto(KOK, { waitUntil: "networkidle" });
await s2.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
await s2.reload({ waitUntil: "networkidle" });
const anket2 = s2.locator('aside[aria-labelledby="anket-basligi"]');
(await anket2.innerText()).includes("%")
  ? bad(11, "yeni ziyaretci oy vermeden sonucu goruyor")
  : ok(11, "yeni ziyaretci once oy vermeli");
await anket2.locator('button[value="pizza"]').click();
await s2.waitForTimeout(2500);
await ikinci.close();

const sayim2 = await sql`SELECT COUNT(*)::int AS n FROM anket_oylari WHERE secmen LIKE 'misafir:%'`;
sayim2[0].n === 2 ? ok(12, "ikinci ziyaretci ayri sayildi") : bad(12, `toplam: ${sayim2[0].n}`);

// ============ 5. YONETICI EKRANI ============
await s.goto(`${KOK}/admin/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="eposta"]', ADMIN);
await s.fill('input[name="parola"]', PAROLA);
await s.click('button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 });

await s.goto(`${KOK}/admin/anket`, { waitUntil: "networkidle" });
const yonetici = await s.locator("body").innerText();
/Mantı/.test(yonetici) && /Pizza/.test(yonetici)
  ? ok(13, "yonetici oylari goruyor")
  : bad(13, "yonetici ekraninda oylar yok");
/Misafir/.test(yonetici) ? ok(14, "misafir oylari ayirt ediliyor") : bad(14, "misafir etiketi yok");
/*
 * Toplam SABIT 2 varsayiliyordu; girisli hesaplarin (hesap:...) eski oylari
 * temizlenmedigi icin gercek toplam daha buyuk olabiliyor ve test ceviri
 * dogru calisirken bile kaliyordu. Beklenen sayi veritabanindan okunuyor.
 */
const gercekToplam = await sql`SELECT COUNT(*)::int AS n FROM anket_oylari WHERE anket_id = 'varsayilan'`;
/* Sablon dizesinde `\b` GERI SILME karakteri; sinir icin cift ters bolu sart. */
new RegExp(`\\b${gercekToplam[0].n} oy\\b`).test(yonetici)
  ? ok(15, `toplam oy sayisi dogru (${gercekToplam[0].n})`)
  : bad(15, `toplam yanlis, beklenen ${gercekToplam[0].n}`);

jsHatalari.length === 0 ? ok(16, "JS hatasi yok") : bad(16, `JS: ${jsHatalari.join(" | ")}`);

await bitir();
