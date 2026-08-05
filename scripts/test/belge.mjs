/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import fs from "node:fs";
import postgres from "postgres";
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * BASVURU BELGELERI
 *
 * Test edilen kurallar:
 *  - Sef/ev hanimi basvurusuna PDF ve fotograf eklenebiliyor
 *  - Belge veritabanina yaziliyor ve basvuruya bagli
 *  - Yonetici belgeleri basvuru kartinda goruyor
 *  - Belge indirme yolu YALNIZCA yoneticiye acik (misafir 404 aliyor)
 *  - Kabul edilmeyen tur (ör. .exe) reddediliyor
 *  - Isletme basvurusu (iletisim formu) artik KAYDEDILIYOR ve belgeleri
 *    yonetici destek listesinde gorunuyor
 */
const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };
const icerirMi = (metin, aranan) =>
  (metin ?? "").toLocaleLowerCase("tr-TR").includes(aranan.toLocaleLowerCase("tr-TR"));

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 3 });

const DAMGA = Date.now();
const EPOSTA = `belge-${DAMGA}@neyersin.test`;
const AD = `Belge Testi ${DAMGA}`;
const ISLETME = `Belge Lokantasi ${DAMGA}`;

const tarayici = kapiliTarayici(await chromium.launch());

async function temizle() {
  const idler = await sql`SELECT id FROM basvurular WHERE eposta = ${EPOSTA}`.catch(() => []);
  for (const { id } of idler) {
    await sql`DELETE FROM belgeler WHERE sahip_id = ${id}`.catch(() => {});
  }
  await sql`DELETE FROM basvurular WHERE eposta = ${EPOSTA}`.catch(() => {});
  const talepler = await sql`SELECT id FROM destek_talepleri WHERE eposta = ${EPOSTA}`.catch(() => []);
  for (const { id } of talepler) {
    await sql`DELETE FROM belgeler WHERE sahip_id = ${id}`.catch(() => {});
  }
  await sql`DELETE FROM destek_talepleri WHERE eposta = ${EPOSTA}`.catch(() => {});
  await sql`DELETE FROM hesaplar WHERE eposta = ${EPOSTA}`.catch(() => {});
}

async function bitir(patlama) {
  await temizle();
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

/** Kucuk ama gecerli bir PDF — gercek dosya yuklendigini dogrulamak icin. */
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
  "utf8",
);
/** 1x1 saydam PNG. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

await temizle();

/* ════════════ 1. KURAL KAYNAKTA ════════════ */
const kaynak = fs.readFileSync("src/lib/belge.ts", "utf8");
/AZAMI_BOYUT\s*=\s*5\s*\*\s*1024\s*\*\s*1024/.test(kaynak)
  ? ok(1, "dosya basina 5 MB siniri tanimli")
  : bad(1, "boyut siniri beklenenden farkli");
fs.readFileSync("next.config.ts", "utf8").includes("bodySizeLimit")
  ? ok(2, "sunucu eylemi govde siniri yukseltilmis")
  : bad(2, "bodySizeLimit ayarlanmamis — cok dosyali basvuru dusecek");

/* ════════════ 2. SEF BASVURUSU + BELGE ════════════ */
const sayfa = await (await tarayici.newContext({ viewport: { width: 1280, height: 1100 } })).newPage();
const jsHatalari = [];
sayfa.on("pageerror", (e) => jsHatalari.push(e.message));

await sayfa.goto(`${KOK}/hesap/basvuru`, { waitUntil: "networkidle" });
(await sayfa.locator('input[type="file"][name="belge"]').count()) === 1
  ? ok(3, "basvuru formunda belge alani var")
  : bad(3, "belge alani yok");

await sayfa.fill('input[name="ad"]', AD);
await sayfa.fill('input[name="telefon"]', "5001112233");
await sayfa.fill('input[name="eposta"]', EPOSTA);
await sayfa.fill('input[name="parola"]', "BelgeTest!2468");
await sayfa.fill('textarea[name="mesaj"]', "Yirmi yildir kendi mutfagimda yemek pisiriyorum, belgelerim ektedir.");

await sayfa.setInputFiles('input[type="file"][name="belge"]', [
  { name: "bakanlik-belgesi.pdf", mimeType: "application/pdf", buffer: PDF },
  { name: "sertifika.png", mimeType: "image/png", buffer: PNG },
]);
(await sayfa.locator("li", { hasText: "bakanlik-belgesi.pdf" }).count()) > 0
  ? ok(4, "secilen dosya listede gorunuyor")
  : bad(4, "secilen dosya listelenmedi");

await sayfa.locator('form button[type="submit"]').click();
await sayfa.waitForTimeout(4000);

const basvuru = (await sql`SELECT id FROM basvurular WHERE eposta = ${EPOSTA}`)[0];
basvuru ? ok(5, "basvuru kaydedildi") : bad(5, "basvuru kaydedilmedi");
if (!basvuru) await bitir();

const belgeler = await sql`
  SELECT ad, mime, boyut, octet_length(veri) AS gercek
  FROM belgeler WHERE sahip_tur = 'basvuru' AND sahip_id = ${basvuru.id} ORDER BY ad`;
belgeler.length === 2
  ? ok(6, "iki belge basvuruya baglandi")
  : bad(6, `${belgeler.length} belge kaydedildi`);
belgeler[0]?.gercek === belgeler[0]?.boyut && belgeler[0]?.gercek > 0
  ? ok(7, "belge icerigi eksiksiz yazildi")
  : bad(7, `icerik boyutu tutmuyor: ${belgeler[0]?.gercek} / ${belgeler[0]?.boyut}`);
belgeler.some((b) => b.mime === "application/pdf")
  ? ok(8, "PDF turu korunmus")
  : bad(8, "PDF turu kaybolmus");

/* ════════════ 3. YETKISIZ INDIREMEZ ════════════ */
const belgeId = (await sql`SELECT id FROM belgeler WHERE sahip_id = ${basvuru.id} LIMIT 1`)[0].id;
const misafir = await (await tarayici.newContext({ ignoreHTTPSErrors: true })).newPage();
const misafirCevap = await misafir.request.get(`${KOK}/admin/belge/${belgeId}`);
misafirCevap.status() === 404
  ? ok(9, "misafir belgeyi indiremiyor (404)")
  : bad(9, `misafir ${misafirCevap.status()} aldi — belge disariya acik!`);

/* ════════════ 4. YONETICI GORUYOR ════════════ */
const y = await (await tarayici.newContext({ viewport: { width: 1440, height: 1100 }, ignoreHTTPSErrors: true })).newPage();
await y.goto(`${KOK}/admin/giris`, { waitUntil: "domcontentloaded" });
await y.fill('input[name="eposta"]', ADMIN);
await y.fill('input[name="parola"]', PAROLA);
await y.click('form button[type="submit"]');
await y.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 });

await y.goto(`${KOK}/admin/basvurular`, { waitUntil: "networkidle" });
const kart = y.locator("article", { hasText: AD });
(await kart.count()) === 1 ? ok(10, "basvuru yonetici listesinde") : bad(10, "basvuru listede yok");
(await kart.locator(`a[href="/admin/belge/${belgeId}"]`).count()) === 1
  ? ok(11, "belge baglantisi kartta gorunuyor")
  : bad(11, "belge baglantisi yok");
icerirMi(await kart.innerText(), "Altın Şef yap")
  ? ok(12, "onay formunda Altin Sef secenegi var")
  : bad(12, "onay formunda Altin Sef secenegi yok");

/*
 * `page.goto` KULLANILMIYOR: PDF'e gidince tarayici indirme baslatiyor ve
 * Playwright "Download is starting" diye patliyor. Istek API'si sayfanin
 * cerezlerini paylasiyor, yetki yine yonetici oturumundan geliyor.
 */
const yoneticiCevap = await y.request.get(`${KOK}/admin/belge/${belgeId}`);
yoneticiCevap.status() === 200
  ? ok(13, "yonetici belgeyi acabiliyor")
  : bad(13, `yonetici ${yoneticiCevap.status()} aldi`);
const tur = yoneticiCevap.headers()["content-type"] ?? "";
tur.includes("pdf") || tur.includes("image")
  ? ok(14, `belge dogru icerik turuyle servis ediliyor (${tur})`)
  : bad(14, `content-type: ${tur}`);
(await yoneticiCevap.body()).length > 0
  ? ok(14.5, "indirilen belge bos degil")
  : bad(14.5, "indirilen belge bos");

/* ════════════ 5. KABUL EDILMEYEN TUR ════════════ */
await sayfa.goto(`${KOK}/hesap/basvuru`, { waitUntil: "networkidle" });
await sayfa.setInputFiles('input[type="file"][name="belge"]', [
  { name: "zararli.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
]);
await sayfa.waitForTimeout(600);
icerirMi(await sayfa.locator("body").innerText(), "kabul edilmiyor")
  ? ok(15, "kabul edilmeyen tur reddediliyor")
  : bad(15, "gecersiz dosya turu uyarisi cikmadi");

/* ════════════ 6. ISLETME BASVURUSU KAYDEDILIYOR ════════════ */
await sayfa.goto(`${KOK}/iletisim?konu=restoran`, { waitUntil: "networkidle" });
(await sayfa.locator('input[type="file"][name="belge"]').count()) === 1
  ? ok(16, "isletme basvurusunda belge alani var")
  : bad(16, "isletme formunda belge alani yok");

/*
 * Iletisim formunun alanlarinda `name` ozniteligi YOK (React durumu tutuyor),
 * bu yuzden `autocomplete` uzerinden hedefleniyor. `type` kullanilamaz: telefon
 * ve e-posta alanlari da duz `text`.
 */
const form = sayfa.locator("form");
await form.locator('input[autocomplete="name"]').fill(AD);
await form.locator('input[autocomplete="tel"]').fill("5001112233");
await form.locator('input[autocomplete="email"]').fill(EPOSTA);
await form.locator('input[autocomplete="organization"]').fill(ISLETME);
await form.locator("textarea").fill("Isletmemi eklemek istiyorum, ruhsatim ektedir.");
await sayfa.setInputFiles('input[type="file"][name="belge"]', [
  { name: "ruhsat.pdf", mimeType: "application/pdf", buffer: PDF },
]);
await sayfa.locator('form button[type="submit"]').click();
await sayfa.waitForTimeout(4000);

const talep = (await sql`SELECT id, no FROM destek_talepleri WHERE eposta = ${EPOSTA}`)[0];
talep
  ? ok(17, `isletme basvurusu kaydedildi (${talep.no})`)
  : bad(17, "isletme basvurusu hicbir yere kaydedilmedi");

if (talep) {
  const isletmeBelgeleri = await sql`
    SELECT ad FROM belgeler WHERE sahip_tur = 'iletisim' AND sahip_id = ${talep.id}`;
  isletmeBelgeleri.length === 1
    ? ok(18, "isletme basvurusunun belgesi kaydedildi")
    : bad(18, `${isletmeBelgeleri.length} belge kaydedildi`);

  await y.goto(`${KOK}/admin/destek`, { waitUntil: "networkidle" });
  icerirMi(await y.locator("body").innerText(), ISLETME)
    ? ok(19, "isletme basvurusu yonetici destek listesinde")
    : bad(19, "isletme basvurusu yonetici panelinde gorunmuyor");
}

jsHatalari.length === 0
  ? ok(20, "sayfalarda JS hatasi yok")
  : bad(20, `JS hatasi: ${jsHatalari.slice(0, 2).join(" | ")}`);

await bitir();
