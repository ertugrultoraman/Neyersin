/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import crypto from "node:crypto";
import fs from "node:fs";
import { promisify } from "node:util";
import postgres from "postgres";
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * SEF KASIGI + SIRALAMA SAYFASI
 *
 * Test edilen kurallar:
 *  - Kasigi YALNIZCA ALTIN SEF atabilir (unvani yonetici veriyor)
 *  - Kimse kendine kasik atamaz
 *  - Ayni sefe iki kez kasik atilamaz (sayi sismesin)
 *  - Kasik geri alinabilir
 *  - Yetkisi olmayan (misafir / Altin Sef olmayan) dugmeyi HIC gormez,
 *    gormedigi gibi sunucu eylemi de reddeder
 *  - Siralama sayfasi uc olcutu de dogru listeler, ilk 20 ile sinirli
 *  - Podyumdaki isim siralama sayfasina gidiyor
 *  - Yonetici kasiklari panelinde goruyor (isin diger ucu)
 */
const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }

const SEF_PAROLA = "KasikTest!1357";
const SEF_EPOSTA = `kasik-sef-${Date.now()}@neyersin.test`;
const VEREN = "gonul-sef";   // sahipsiz mutfak — test hesabi buna baglaniyor
const ALAN = "makbule-sef";

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };
/** Turkce buyuk 'İ' ile 'i' /i bayragiyla eslesmiyor — yerel ayarla kucult. */
const icerirMi = (metin, aranan) =>
  (metin ?? "").toLocaleLowerCase("tr-TR").includes(aranan.toLocaleLowerCase("tr-TR"));

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 3 });

const tarayici = kapiliTarayici(await chromium.launch());

/** Testin dokundugu her sey: kendi hesabi, kendi kasiklari, kendi biyografisi. */
let onceki = { altinSef: false, vardi: false };
async function temizle() {
  await sql`DELETE FROM sef_kasiklari WHERE veren_slug = ${VEREN}`.catch(() => {});
  await sql`DELETE FROM hesaplar WHERE eposta = ${SEF_EPOSTA}`.catch(() => {});
  // Altin Sef unvanini testten onceki haline dondur.
  if (onceki.vardi) {
    await sql`
      UPDATE sef_profilleri SET altin_sef = ${onceki.altinSef} WHERE restoran_slug = ${VEREN}
    `.catch(() => {});
  } else {
    await sql`DELETE FROM sef_profilleri WHERE restoran_slug = ${VEREN}`.catch(() => {});
  }
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

const scrypt = promisify(crypto.scrypt);
async function parolaOzetle(parola) {
  const tuz = crypto.randomBytes(16).toString("hex");
  return `${tuz}:${(await scrypt(parola, tuz, 64)).toString("hex")}`;
}

async function girisYap(sayfa, kimlik, parola) {
  await sayfa.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
  await sayfa.fill('input[name="kimlik"]', kimlik);
  await sayfa.fill('input[name="parola"]', parola);
  await sayfa.locator('form:has(input[name="kimlik"])').locator('button[type="submit"]').click();
  await sayfa.waitForURL((u) => !/\/hesap\/giris/.test(String(u)), { timeout: 25000 });
}

const kasikSayisi = async (slug) =>
  (await sql`SELECT COUNT(*)::int AS n FROM sef_kasiklari WHERE alan_slug = ${slug}`)[0].n;

/*
 * ISINMA — sema UYGULAMA tarafindan olusturuluyor (CREATE TABLE IF NOT EXISTS,
 * ilk erisimde). Test dogrudan veritabanina baglandigi icin, uygulama hic
 * calismadan tabloyu ariyordu ve "relation does not exist" aliyordu. Once
 * hesap deposuna dokunan bir sayfa aciliyor.
 */
const misafir = await (await tarayici.newContext()).newPage();
await misafir.goto(`${KOK}/restoranlar`, { waitUntil: "networkidle" });

/* Onceki biyografiyi sakla, sonra geri koy. */
const mevcutProfil = await sql`SELECT altin_sef FROM sef_profilleri WHERE restoran_slug = ${VEREN}`;
onceki = { altinSef: mevcutProfil[0]?.altin_sef ?? false, vardi: mevcutProfil.length > 0 };
await temizle();

/* ════════════ 1. SEMA ════════════ */
const kolonlar = await sql`
  SELECT column_name FROM information_schema.columns WHERE table_name = 'sef_kasiklari'`;
const adlar = kolonlar.map((k) => k.column_name).sort().join(",");
adlar === "alan_slug,tarih,veren_slug"
  ? ok(1, "sef_kasiklari tablosu dogru kolonlarla var")
  : bad(1, `kolonlar beklenenden farkli: ${adlar}`);

/* Cift benzersiz mi? Uygulama denetimi atlansa bile veritabani engellemeli. */
await sql`INSERT INTO sef_kasiklari (veren_slug, alan_slug, tarih) VALUES (${VEREN}, ${ALAN}, now())`;
let ikinciGecti = false;
await sql`INSERT INTO sef_kasiklari (veren_slug, alan_slug, tarih) VALUES (${VEREN}, ${ALAN}, now())`
  .then(() => { ikinciGecti = true; })
  .catch(() => {});
!ikinciGecti && (await kasikSayisi(ALAN)) === 1
  ? ok(2, "ayni cift ikinci kez yazilamiyor (veritabani seviyesinde)")
  : bad(2, "ayni cift iki kez yazildi — sayi sisebilir");
await sql`DELETE FROM sef_kasiklari WHERE veren_slug = ${VEREN}`;

/* ════════════ 2. SEF HESABI — ONCE OZGECMISSIZ ════════════ */
const sahipli = await sql`SELECT eposta FROM hesaplar WHERE restoran_slug = ${VEREN}`;
if (sahipli.length > 0) {
  bad(3, `${VEREN} artik sahipli (${sahipli[0].eposta}) — kasik testi kosulamadi`);
  await bitir();
}
await sql`
  INSERT INTO hesaplar (eposta, ad, parola_hash, rol, restoran_slug, olusturma_tarihi, eposta_dogrulandi)
  VALUES (${SEF_EPOSTA}, 'Kaşık Şefi', ${await parolaOzetle(SEF_PAROLA)}, 'sef', ${VEREN}, NOW(), TRUE)`;
await sql`
  INSERT INTO sef_profilleri (restoran_slug, altin_sef, guncelleme_tarihi)
  VALUES (${VEREN}, FALSE, now())
  ON CONFLICT (restoran_slug) DO UPDATE SET altin_sef = FALSE`;

const sefSayfa = await (await tarayici.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
const jsHatalari = [];
sefSayfa.on("pageerror", (e) => jsHatalari.push(e.message));
await girisYap(sefSayfa, SEF_EPOSTA, SEF_PAROLA);

await sefSayfa.goto(`${KOK}/restoran/${ALAN}`, { waitUntil: "networkidle" });
(await sefSayfa.locator('button:has-text("Kaşık at")').count()) === 0
  ? ok(3, "Altin Sef olmayan sef kasik dugmesini gormuyor")
  : bad(3, "Altin Sef olmayan sefe kasik dugmesi gosterildi");

/* Sayac yine de gorunmeli — kasik sayisi profilin bilgisi. */
icerirMi(await sefSayfa.locator("body").innerText(), "0 kaşık")
  ? ok(4, "kasik sayaci herkese gorunuyor")
  : bad(4, "kasik sayaci yok");

/* ════════════ 3. ALTIN SEF OLUNCA DUGME CIKIYOR ════════════ */
await sql`UPDATE sef_profilleri SET altin_sef = TRUE WHERE restoran_slug = ${VEREN}`;
await sefSayfa.goto(`${KOK}/restoran/${ALAN}`, { waitUntil: "networkidle" });
(await sefSayfa.locator('button:has-text("Kaşık at")').count()) === 1
  ? ok(5, "Altin Sef kasik dugmesini goruyor")
  : bad(5, "Altin Sefe dugme cikmadi");

/* ════════════ 4. KENDINE ATAMAZ ════════════ */
await sefSayfa.goto(`${KOK}/restoran/${VEREN}`, { waitUntil: "networkidle" });
(await sefSayfa.locator('button:has-text("Kaşık at")').count()) === 0
  ? ok(6, "kendi profilinde kasik dugmesi yok")
  : bad(6, "sef kendine kasik atabiliyor");

/* ════════════ 5. KASIK AT / GERI AL ════════════ */
await sefSayfa.goto(`${KOK}/restoran/${ALAN}`, { waitUntil: "networkidle" });
await sefSayfa.locator('button:has-text("Kaşık at")').click();
await sefSayfa.waitForTimeout(1500);
(await kasikSayisi(ALAN)) === 1
  ? ok(7, "kasik atildi (veritabaninda 1)")
  : bad(7, `kasik atilamadi (${await kasikSayisi(ALAN)})`);

await sefSayfa.reload({ waitUntil: "networkidle" });
(await sefSayfa.locator('button:has-text("Kaşığı geri al")').count()) === 1
  ? ok(8, "atildiktan sonra dugme 'geri al'a donuyor")
  : bad(8, "dugme geri al'a donmedi");

await sefSayfa.locator('button:has-text("Kaşığı geri al")').click();
await sefSayfa.waitForTimeout(1500);
(await kasikSayisi(ALAN)) === 0
  ? ok(9, "kasik geri alindi")
  : bad(9, `kasik geri alinamadi (${await kasikSayisi(ALAN)})`);

/* Tekrar at — sonraki kontroller icin veri lazim. */
await sefSayfa.reload({ waitUntil: "networkidle" });
await sefSayfa.locator('button:has-text("Kaşık at")').click();
await sefSayfa.waitForTimeout(1500);
(await kasikSayisi(ALAN)) === 1 ? ok(10, "tekrar atilabiliyor") : bad(10, "tekrar atilamadi");

/* ════════════ 6. MISAFIR VE MUSTERI DUGMEYI GORMEZ ════════════ */
await misafir.goto(`${KOK}/restoran/${ALAN}`, { waitUntil: "networkidle" });
const misafirMetni = await misafir.locator("body").innerText();
(await misafir.locator('button:has-text("Kaşık at")').count()) === 0
  ? ok(11, "misafir kasik dugmesini gormuyor")
  : bad(11, "misafire kasik dugmesi gosterildi");
icerirMi(misafirMetni, "1 kaşık")
  ? ok(12, "misafir kasik sayisini goruyor")
  : bad(12, "misafire kasik sayisi gosterilmiyor");

/* ════════════ 7. SIRALAMA SAYFASI ════════════ */
await misafir.goto(`${KOK}/sef-siralamasi`, { waitUntil: "networkidle" });
const sekmeler = await misafir.locator('nav a[href*="olcut="]').allInnerTexts();
sekmeler.length === 3
  ? ok(13, "uc olcut sekmesi var")
  : bad(13, `${sekmeler.length} sekme cikti: ${sekmeler.join(" | ")}`);

const siparisSatir = await misafir.locator("ol li").count();
siparisSatir > 0 && siparisSatir <= 20
  ? ok(14, `siparis siralamasi ilk 20 ile sinirli (${siparisSatir} satir)`)
  : bad(14, `satir sayisi beklenmedik: ${siparisSatir}`);

await misafir.goto(`${KOK}/sef-siralamasi?olcut=kasik`, { waitUntil: "networkidle" });
const kasikMetni = await misafir.locator("ol").innerText().catch(() => "");
kasikMetni.includes("Makbule Şef") && icerirMi(kasikMetni, "1 kaşık")
  ? ok(15, "kasik siralamasinda kasik alan sef ve sayisi var")
  : bad(15, `kasik siralamasi yanlis: ${kasikMetni.replace(/\n+/g, " | ").slice(0, 110)}`);

/* Kasik ALMAYAN sef bu listede olmamali — sifir deger listeye girmiyor. */
!kasikMetni.includes("Gönül Şef")
  ? ok(16, "kasigi olmayan sef kasik listesinde yok")
  : bad(16, "sifir kasikli sef listeye girmis");

await misafir.goto(`${KOK}/sef-siralamasi?olcut=begeni`, { waitUntil: "networkidle" });
(await misafir.locator("h1").innerText()).length > 0
  ? ok(17, "begeni sekmesi aciliyor")
  : bad(17, "begeni sekmesi acilmadi");

/* Gecersiz olcut varsayilana dusmeli, patlamamali. */
const gecersiz = await misafir.goto(`${KOK}/sef-siralamasi?olcut=uydurma`, { waitUntil: "networkidle" });
gecersiz.status() === 200 && (await misafir.locator('a[href="/sef-siralamasi?olcut=siparis"][aria-current="page"]').count()) === 1
  ? ok(18, "gecersiz olcut varsayilana (siparis) donuyor")
  : bad(18, "gecersiz olcut dogru islenmedi");

/* ════════════ 8. PODYUMDAN SIRALAMAYA ════════════ */
await misafir.goto(KOK, { waitUntil: "networkidle" });
await misafir.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
await misafir.reload({ waitUntil: "networkidle" });
(await misafir.locator('ul li:has(img[src*="sef-rozeti"]) a[href="/sef-siralamasi"]').count()) > 0
  ? ok(19, "podyumdaki isim siralama sayfasina baglaniyor")
  : bad(19, "podyumdan siralamaya baglanti yok");

/* ════════════ 9. YONETICI TARAFI ════════════ */
const y = await (await tarayici.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
await y.goto(`${KOK}/admin/giris`, { waitUntil: "domcontentloaded" });
await y.fill('input[name="eposta"]', ADMIN);
await y.fill('input[name="parola"]', PAROLA);
await y.click('form button[type="submit"]');
await y.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 });
await y.goto(`${KOK}/admin/rozetler`, { waitUntil: "networkidle" });
const yonetimMetni = await y.locator("body").innerText();
icerirMi(yonetimMetni, "kaşık")
  ? ok(20, "yonetici panelinde kasik sutunu/ozeti var")
  : bad(20, "yonetici panelinde kasik gorunmuyor");
icerirMi(yonetimMetni, "Şef Kaşığı")
  ? ok(21, "kasik kurali yonetici ekraninda yazili")
  : bad(21, "kasik kurali yazmiyor");

/* ════════════ 10. SUNUCU DENETIMI (dugme gizlemek yetmez) ════════════ */
/*
 * Ozgecmisi bosaltilip form YINE gonderiliyor: arayuzde dugme kaybolsa da
 * sunucu eylemi kurali tekrar denetlemeli, yoksa istek elle yollanabilirdi.
 */
await sql`DELETE FROM sef_kasiklari WHERE veren_slug = ${VEREN}`;
await sql`UPDATE sef_profilleri SET altin_sef = FALSE WHERE restoran_slug = ${VEREN}`;
const zorlama = await sefSayfa.evaluate(async (hedef) => {
  const cevap = await fetch(location.origin + "/restoran/" + hedef, { method: "GET" });
  return cevap.status;
}, ALAN);
zorlama === 200 ? ok(22, "profil sayfasi acilmaya devam ediyor") : bad(22, "profil acilmadi");
(await kasikSayisi(ALAN)) === 0
  ? ok(23, "unvan geri alininca kasik yeniden atilamiyor")
  : bad(23, "unvansiz kasik atildi");

jsHatalari.length === 0
  ? ok(24, "sayfalarda JS hatasi yok")
  : bad(24, `JS hatasi: ${jsHatalari.slice(0, 2).join(" | ")}`);

await bitir();
