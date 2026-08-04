/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi: kisa ucluler bilerek ifade olarak kullaniliyor */
import { chromium } from "playwright";
import { kapiliTarayici, kapiyiGec } from "./yardim.mjs";
import fs from "node:fs";
import postgres from "postgres";

/**
 * HESAP GUVENLIGI REGRESYONU
 *
 * 1. Kayitta ikinci adim: e-posta dogrulama kodu
 * 2. Parolami unuttum -> koda gore parola sifirlama
 * 3. Profilde parola degistirme
 * 4. Yonetici panelinde dogrulama gorunurlugu
 *
 * Not: SMTP kapaliyken kod veritabaninda duz metin tutuluyor (yonetici
 * paneline dusmesi icin). Test kodu ORADAN okuyor — gercek posta beklemiyor.
 */
const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) { console.error("ADMIN_PASSWORD yok"); process.exit(2); }

const cikti = [];
const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 2 });

const TEST_EPOSTA = `test-${Date.now().toString().slice(-8)}@neyersin.test`;
const ILK_PAROLA = "NyTest!7kQm3";
const YENI_PAROLA = "yenideneme54321";
const SON_PAROLA = "sondeneme98765";

const tarayici = kapiliTarayici(await chromium.launch());

async function bitir(patlama) {
  await sql`DELETE FROM dogrulama_kodlari WHERE eposta = ${TEST_EPOSTA}`.catch(() => {});
  await sql`DELETE FROM hesaplar WHERE eposta = ${TEST_EPOSTA}`.catch(() => {});
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

/** SMTP kapaliyken kod duz metin saklaniyor; testte oradan okunuyor. */
async function koduOku(amac) {
  const r = await sql`
    SELECT duz_kod FROM dogrulama_kodlari
    WHERE eposta = ${TEST_EPOSTA} AND amac = ${amac} AND kullanildi = FALSE
    ORDER BY olusturma_tarihi DESC LIMIT 1
  `;
  return r[0]?.duz_kod ?? null;
}

const baglam = await tarayici.newContext({ viewport: { width: 1280, height: 950 } });
const s = await baglam.newPage();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

// ============ 1. KAYIT — IKINCI ADIM ============
await s.goto(`${KOK}/hesap/kayit`, { waitUntil: "networkidle" });
await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));

await s.fill('input[name="ad"]', "Test Kullanici");
await s.fill('input[name="eposta"]', TEST_EPOSTA);
await s.fill('input[name="parola"]', ILK_PAROLA);
await s.click('button[type="submit"]');

/*
 * Sabit beklemek yerine kod alaninin cikmasini bekliyoruz: sunucunun ilk
 * istegi tablo gocleriyle birlikte birkac saniye surebiliyor ve sabit 3 sn
 * yetmiyordu.
 */
const kodAlaniVar = await s
  .waitForSelector('input[name="kod"]', { timeout: 40000 })
  .then(() => true)
  .catch(() => false);
kodAlaniVar ? ok(1, "kayittan sonra dogrulama kodu ekrani cikiyor") : bad(1, "kod ekrani cikmadi");

/\/hesabim/.test(s.url()) === false
  ? ok(2, "kod girilmeden oturum acilmiyor")
  : bad(2, "dogrulamadan hesaba girildi");

const kayitKodu = await koduOku("kayit");
kayitKodu && /^\d{6}$/.test(kayitKodu)
  ? ok(3, "6 haneli kod uretildi")
  : bad(3, `kod uretilmedi: ${kayitKodu}`);
if (!kayitKodu) await bitir("kod uretilmedigi icin devam edilemiyor");

// Yanlis kod reddedilmeli
await s.fill('input[name="kod"]', kayitKodu === "000000" ? "111111" : "000000");
await s.click('form button[type="submit"]');
/*
 * Uyariyi tek bir [role=alert] locator'iyla okumak hataliydi: sayfada birden
 * cok uyari olabildigi icin strict mode patliyor ve kontrol hep basarisiz
 * gorunuyordu. Gövdenin tamaminda metni bekliyoruz.
 */
const kodReddedildi = await s
  .waitForFunction(() => /Kod yanlış/.test(document.body.innerText), null, { timeout: 20000 })
  .then(() => true)
  .catch(() => false);
kodReddedildi ? ok(4, "yanlis kod reddediliyor") : bad(4, "yanlis kod reddedilmedi");

// Dogru kod
await s.fill('input[name="kod"]', kayitKodu);
await s.click('form button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/hesabim", { timeout: 20000 });
ok(5, "dogru kodla hesap acildi ve oturum basladı");

const kullanildi = await sql`
  SELECT kullanildi FROM dogrulama_kodlari WHERE eposta = ${TEST_EPOSTA} AND amac = 'kayit'
  ORDER BY olusturma_tarihi DESC LIMIT 1`;
kullanildi[0]?.kullanildi === true
  ? ok(6, "kod tek kullanimlik (tuketildi)")
  : bad(6, "kod tuketilmedi");

const dogrulandi = await sql`SELECT eposta_dogrulandi FROM hesaplar WHERE eposta = ${TEST_EPOSTA}`;
dogrulandi[0]?.eposta_dogrulandi === true
  ? ok(7, "hesap dogrulanmis isaretlendi")
  : bad(7, "hesap dogrulanmadi olarak kaldi");

// ============ 2. HESAP ALANINDA PAROLA DEGISTIRME ============
/*
 * Parola formu artik profilin ortasinda hep acik durmuyor; hesap alaninin
 * altinda kendi sayfasinda (/hesabim/parola), sol menuden tiklanarak aciliyor.
 */
await s.goto(`${KOK}/hesabim/parola`, { waitUntil: "networkidle" });
(await s.locator('input[name="mevcutParola"]').count()) === 1
  ? ok(8, "parola degistirme sayfasi aciliyor")
  : bad(8, "parola formu bulunamadi");

const parolaGonder = 'form:has(input[name="mevcutParola"]) button[type="submit"]';

/*
 * Sabit `waitForTimeout(2500)` yerine METNI BEKLIYORUZ. Soguk sunucuda (ornegin
 * .next silindikten sonraki ilk istekte) sunucu eylemi 2500 ms'yi asiyor ve
 * calisan ozellik "kabul edildi" gibi gorunuyordu.
 */
const metniBekle = (metin) =>
  s
    .waitForFunction((m) => document.body.innerText.includes(m), metin, { timeout: 30000 })
    .then(() => true)
    .catch(() => false);

// Yanlis mevcut parola reddedilmeli
await s.fill('input[name="mevcutParola"]', "bilerekyanlis123");
await s.fill('input[name="yeniParola"]', YENI_PAROLA);
await s.fill('input[name="yeniParolaTekrar"]', YENI_PAROLA);
await s.locator(parolaGonder).click();
(await metniBekle("Mevcut parolan yanlış"))
  ? ok(9, "yanlis mevcut parola reddediliyor")
  : bad(9, "yanlis mevcut parola kabul edildi");

// Dogru degisiklik
await s.fill('input[name="mevcutParola"]', ILK_PAROLA);
await s.fill('input[name="yeniParola"]', YENI_PAROLA);
await s.fill('input[name="yeniParolaTekrar"]', YENI_PAROLA);
await s.locator(parolaGonder).click();
(await metniBekle("Parolan değiştirildi"))
  ? ok(10, "parola degistirilebiliyor")
  : bad(10, "parola degistirilemedi");

// Cikis + yeni parolayla giris
await s.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
await baglam.clearCookies();
// clearCookies robot biletini de siler; kapi tekrar cikmasin diye geri yaziliyor.
await kapiyiGec(baglam);
await s.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="kimlik"]', TEST_EPOSTA);
await s.fill('input[name="parola"]', YENI_PAROLA);
await s.click('form button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/hesabim", { timeout: 20000 }).catch(() => {});
new URL(s.url()).pathname === "/hesabim"
  ? ok(11, "yeni parolayla giris yapilabiliyor")
  : bad(11, `yeni parolayla giris olmadi: ${s.url()}`);

// ============ 3. PAROLAMI UNUTTUM ============
await baglam.clearCookies();
// clearCookies robot biletini de siler; kapi tekrar cikmasin diye geri yaziliyor.
await kapiyiGec(baglam);
await s.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
(await s.locator('a[href="/hesap/sifremi-unuttum"]').count()) === 1
  ? ok(12, "giris ekraninda 'Parolami unuttum' baglantisi var")
  : bad(12, "parolami unuttum baglantisi yok");

await s.goto(`${KOK}/hesap/sifremi-unuttum`, { waitUntil: "networkidle" });
await s.fill('input[name="eposta"]', TEST_EPOSTA);
await s.click('form button[type="submit"]');

(await s
  .waitForSelector('input[name="kod"]', { timeout: 30000 })
  .then(() => true)
  .catch(() => false))
  ? ok(13, "kod + yeni parola adimi aciliyor")
  : bad(13, "ikinci adim acilmadi");

const sifreKodu = await koduOku("sifre");
sifreKodu && /^\d{6}$/.test(sifreKodu) ? ok(14, "sifirlama kodu uretildi") : bad(14, "kod yok");

await s.fill('input[name="kod"]', sifreKodu);
await s.fill('input[name="yeniParola"]', SON_PAROLA);
await s.fill('input[name="yeniParolaTekrar"]', SON_PAROLA);
await s.click('form button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/hesabim", { timeout: 20000 }).catch(() => {});
new URL(s.url()).pathname === "/hesabim"
  ? ok(15, "kodla parola sifirlandi ve oturum acildi")
  : bad(15, `sifirlama sonrasi yonlendirme: ${s.url()}`);

await baglam.clearCookies();
// clearCookies robot biletini de siler; kapi tekrar cikmasin diye geri yaziliyor.
await kapiyiGec(baglam);
await s.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="kimlik"]', TEST_EPOSTA);
await s.fill('input[name="parola"]', SON_PAROLA);
await s.click('form button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/hesabim", { timeout: 20000 }).catch(() => {});
new URL(s.url()).pathname === "/hesabim"
  ? ok(16, "sifirlanan parolayla giris yapilabiliyor")
  : bad(16, "sifirlanan parola calismadi");

// Eski parola artik gecmemeli
await baglam.clearCookies();
// clearCookies robot biletini de siler; kapi tekrar cikmasin diye geri yaziliyor.
await kapiyiGec(baglam);
await s.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="kimlik"]', TEST_EPOSTA);
await s.fill('input[name="parola"]', ILK_PAROLA);
await s.click('form button[type="submit"]');
await s.waitForTimeout(2500);
new URL(s.url()).pathname !== "/hesabim"
  ? ok(17, "eski parola artik gecersiz")
  : bad(17, "eski parola hala calisiyor");

// Var olmayan adres icin hesap ifsa edilmemeli
await s.goto(`${KOK}/hesap/sifremi-unuttum`, { waitUntil: "networkidle" });
await s.fill('input[name="eposta"]', `yok-${Date.now()}@neyersin.test`);
await s.click('form button[type="submit"]');
await s.waitForTimeout(2500);
(await s.locator("body").innerText()).includes("kayıtlı bir hesap varsa")
  ? ok(18, "olmayan adres icin hesap varligi ifsa edilmiyor")
  : bad(18, "hesap varligi ifsa ediliyor");

// ============ 4. YONETICI GORUNURLUGU ============
await baglam.clearCookies();
// clearCookies robot biletini de siler; kapi tekrar cikmasin diye geri yaziliyor.
await kapiyiGec(baglam);
await s.goto(`${KOK}/admin/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="eposta"]', ADMIN);
await s.fill('input[name="parola"]', PAROLA);
await s.click('button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 20000 });

(await s.locator('a[href="/admin/dogrulamalar"]').count()) > 0
  ? ok(19, "yonetici menusunde Dogrulamalar var")
  : bad(19, "Dogrulamalar menude yok");

await s.goto(`${KOK}/admin/dogrulamalar`, { waitUntil: "networkidle" });
const yonetici = await s.locator("body").innerText();
yonetici.includes(TEST_EPOSTA)
  ? ok(20, "test hesabi yonetici panelinde gorunuyor")
  : bad(20, "hesap yonetici panelinde yok");
/E-posta gönderimi (açık|kapalı)/.test(yonetici)
  ? ok(21, "posta altyapisinin durumu yoneticiye bildiriliyor")
  : bad(21, "posta durumu bildirilmiyor");

// Misafir bu sayfayi goremesin
const misafir = await tarayici.newContext();
const m = await misafir.newPage();
await m.goto(`${KOK}/admin/dogrulamalar`, { waitUntil: "networkidle" });
/\/admin\/giris/.test(m.url())
  ? ok(22, "dogrulamalar sayfasi misafire kapali")
  : bad(22, "misafir dogrulamalari gorebiliyor");
await misafir.close();

jsHatalari.length === 0 ? ok(23, "JS hatasi yok") : bad(23, `JS: ${jsHatalari.join(" | ")}`);

await bitir();
