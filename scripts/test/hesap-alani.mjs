/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi: kisa ucluler bilerek ifade olarak kullaniliyor */
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";
import fs from "node:fs";
import postgres from "postgres";

/**
 * HESABIM ALANI REGRESYONU
 *
 * 1. Sol menu her rolde ayni (musteri / sef / kurye)
 * 2. Siparislerim hesap alaninin altinda, sekmeler dogru
 * 3. Parola ve e-posta ayarlari ayri sayfalarda
 * 4. E-posta degisimi: parola + yeni adrese kod
 * 5. Adres degisince SIPARISLER TASINIYOR (ilk-siparis kuponu istismari kapali)
 */
const KOK = "https://neyersin.local";
const cikti = [];
const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 2 });

const damga = Date.now().toString().slice(-8);
const ESKI = `alan-${damga}@neyersin.test`;
const YENI = `yeni-${damga}@neyersin.test`;
const PAROLA = "NyTest!7kQm3";
const SIPARIS_NO = `NY-TEST-${damga}`;

const tarayici = kapiliTarayici(await chromium.launch());

async function bitir(patlama) {
  await sql`DELETE FROM siparisler WHERE siparis_no = ${SIPARIS_NO}`.catch(() => {});
  await sql`DELETE FROM dogrulama_kodlari WHERE eposta IN (${ESKI}, ${YENI})`.catch(() => {});
  await sql`DELETE FROM hesaplar WHERE eposta IN (${ESKI}, ${YENI})`.catch(() => {});
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

const koduOku = async (eposta, amac) => {
  const r = await sql`
    SELECT duz_kod FROM dogrulama_kodlari
    WHERE eposta = ${eposta} AND amac = ${amac} AND kullanildi = FALSE
    ORDER BY olusturma_tarihi DESC LIMIT 1`;
  return r[0]?.duz_kod ?? null;
};

const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 950 } });
const s = await baglam.newPage();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

// ============ HAZIRLIK: dogrulanmis bir musteri hesabi ============
await s.goto(`${KOK}/hesap/kayit`, { waitUntil: "networkidle" });
await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
await s.fill('input[name="ad"]', "Alan Testi");
await s.fill('input[name="eposta"]', ESKI);
await s.fill('input[name="parola"]', PAROLA);
await s.click('button[type="submit"]');
await s.waitForSelector('input[name="kod"]', { timeout: 40000 });
const kayitKodu = await koduOku(ESKI, "kayit");
if (!kayitKodu) await bitir("kayit kodu uretilmedi");
await s.fill('input[name="kod"]', kayitKodu);
await s.click('form button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/hesabim", { timeout: 25000 });
ok(1, "kayit tamamlandi ve /hesabim aciliyor");

// Gecmis siparis: e-posta degisince tasinmali
await sql`
  INSERT INTO siparisler (
    siparis_no, durum, odeme_yontemi, restoran_slug, restoran_adi, ilce,
    musteri_ad, musteri_telefon, toplam, olusturma_tarihi, guncelleme_tarihi, govde
  )
  VALUES (
    ${SIPARIS_NO}, 'odendi', 'havale', 'gonul-sef', 'Gönül Şef', 'Beylikdüzü',
    'Alan Testi', '05357259794', 200, now(), now(), ${sql.json({
    siparisNo: SIPARIS_NO,
    restoranSlug: "gonul-sef",
    restoranAdi: "Gönül Şef",
    durum: "odendi",
    odemeYontemi: "havale",
    olusturmaTarihi: new Date().toISOString(),
    kalemler: [{ satirId: "t1", urunId: "t1", ad: "Test", fiyat: 200, adet: 1 }],
    tutarlar: { araToplam: 200, teslimatUcreti: 0, indirim: 0, toplam: 200, minSepet: 200, minSepetKarsilandi: true },
    musteri: { adSoyad: "Alan Testi", telefon: "05357259794", eposta: ESKI },
    adres: { ilce: "Beylikdüzü", mahalle: "Test", acikAdres: "Test sokak no 1", binaNo: "1" },
  })}
  )`;

// ============ 1. SOL MENU ============
const menuMetni = await s.locator('nav[aria-label="Hesap menüsü"]').innerText();
["Hesabım", "Siparişlerim", "E-posta ayarları", "Parola değiştir"].every((b) => menuMetni.includes(b))
  ? ok(2, "sol menude dort bolum de var")
  : bad(2, `menu: ${menuMetni.replace(/\n/g, " | ")}`);

// Basliklar alta kirilmamali
const kirilma = await s.locator('nav[aria-label="Hesap menüsü"] a > span:first-child').evaluateAll(
  (ler) => ler.filter((e) => e.getClientRects().length > 1).length,
);
kirilma === 0 ? ok(3, "menu basliklari tek satirda") : bad(3, `${kirilma} baslik alta kiriliyor`);

// ============ 2. SIPARISLERIM ============
await s.click('nav[aria-label="Hesap menüsü"] a[href="/hesabim/siparisler"]');
await s.waitForURL(/\/hesabim\/siparisler/, { timeout: 20000 });
const sipMetni = await s.locator("body").innerText();
sipMetni.includes(SIPARIS_NO) ? ok(4, "siparis listede gorunuyor") : bad(4, "siparis gorunmuyor");
!sipMetni.includes("Aldığım siparişler")
  ? ok(5, "musteride sekme yok")
  : bad(5, "musteride sekme cikti");
(await s.locator('nav[aria-label="Hesap menüsü"]').count()) === 1
  ? ok(6, "siparisler sayfasinda da sol menu duruyor")
  : bad(6, "sol menu kayboldu");

// Eski adres yonlendirmesi
await s.goto(`${KOK}/siparislerim`, { waitUntil: "networkidle" });
/\/hesabim\/siparisler/.test(s.url())
  ? ok(7, "eski /siparislerim adresi yonlendiriyor")
  : bad(7, `yonlendirme yok: ${s.url()}`);

// ============ 3. PAROLA SAYFASI ============
await s.goto(`${KOK}/hesabim`, { waitUntil: "networkidle" });
(await s.locator('input[name="mevcutParola"]').count()) === 0
  ? ok(8, "parola formu ozet sayfasinda acik degil")
  : bad(8, "parola formu hala ozette");

await s.click('nav[aria-label="Hesap menüsü"] a[href="/hesabim/parola"]');
await s.waitForURL(/\/hesabim\/parola/, { timeout: 20000 });
(await s.locator('input[name="mevcutParola"]').count()) === 1
  ? ok(9, "parola sayfasi tiklaninca aciliyor")
  : bad(9, "parola formu acilmadi");

// ============ 4. E-POSTA AYARLARI ============
await s.click('nav[aria-label="Hesap menüsü"] a[href="/hesabim/eposta"]');
await s.waitForURL(/\/hesabim\/eposta/, { timeout: 20000 });
const epostaMetni = await s.locator("body").innerText();
epostaMetni.includes(ESKI) ? ok(10, "kayitli adres gosteriliyor") : bad(10, "adres gorunmuyor");
/*
 * Rozet CSS ile buyuk harfe cevriliyor (text-transform: uppercase), bu yuzden
 * innerText "DOĞRULANDI" donuyor. Buyuk/kucuk harf duyarsiz bakiyoruz.
 */
/do[ğg]ruland[ıi]/i.test(epostaMetni)
  ? ok(11, "dogrulama durumu gosteriliyor")
  : bad(11, "durum yok");

/*
 * Gonderme dugmesi, ALANI ICEREN forma sabitleniyor. Duz 'form button[...]'
 * secicisi basliktaki "Cikis yap" formunu yakaliyor (DOM'da once geliyor) ve
 * test kendi oturumunu kapatiyordu.
 */
const epostaGonder = 'form:has(input[name="yeniEposta"]) button[type="submit"]';
const kodGonder = 'form:has(input[name="kod"]) button[type="submit"]';

// Yanlis parola reddedilmeli
await s.fill('input[name="yeniEposta"]', YENI);
await s.fill('input[name="parola"]', "bilerekyanlis");
await s.click(epostaGonder);
await s.waitForFunction(() => /Parolan yanlış/.test(document.body.innerText), null, { timeout: 20000 })
  .then(() => ok(12, "yanlis parola ile adres degistirilemiyor"))
  .catch(() => bad(12, "yanlis parola kabul edildi"));

// Dogru parola -> kod adimi
await s.fill('input[name="yeniEposta"]', YENI);
await s.fill('input[name="parola"]', PAROLA);
await s.click(epostaGonder);
await s.waitForSelector('input[name="kod"]', { timeout: 30000 })
  .then(() => ok(13, "kod adimi aciliyor"))
  .catch(() => bad(13, "kod adimi acilmadi"));

// Kod YENI adrese gitmeli
const epostaKodu = await koduOku(YENI, "eposta");
epostaKodu ? ok(14, "kod YENI adrese uretildi") : bad(14, "yeni adrese kod yok");
if (!epostaKodu) await bitir("eposta kodu yok");

// Kod girilmeden adres degismemeli
const araKayit = await sql`SELECT eposta FROM hesaplar WHERE eposta = ${ESKI}`;
araKayit.length === 1 ? ok(15, "kod girilmeden adres degismiyor") : bad(15, "adres erken degisti");

await s.fill('input[name="kod"]', epostaKodu);
await s.click(kodGonder);
await s.waitForFunction(() => /Adresin .* olarak değişti/.test(document.body.innerText), null, { timeout: 30000 })
  .then(() => ok(16, "kod dogrulaninca adres degisiyor"))
  .catch(() => bad(16, "adres degismedi"));

// ============ 5. TASIMA VE KUPON ISTISMARI ============
const yeniHesap = await sql`SELECT eposta, eposta_dogrulandi FROM hesaplar WHERE eposta = ${YENI}`;
yeniHesap.length === 1 ? ok(17, "hesap yeni adresle acildi") : bad(17, "yeni hesap yok");
const eskiHesap = await sql`SELECT eposta FROM hesaplar WHERE eposta = ${ESKI}`;
eskiHesap.length === 0 ? ok(18, "eski kayit silindi") : bad(18, "eski kayit duruyor");

const tasinan = await sql`
  SELECT lower(govde->'musteri'->>'eposta') AS eposta FROM siparisler WHERE siparis_no = ${SIPARIS_NO}`;
tasinan[0]?.eposta === YENI
  ? ok(19, "gecmis siparis yeni adrese TASINDI")
  : bad(19, `siparis tasinmadi: ${tasinan[0]?.eposta}`);

/*
 * Kupon istismari kapali mi? "Ilk siparise ozel" kupon e-posta basina
 * sayiliyor; siparis tasindigi icin yeni adres de "ilk siparis" sayilmamali.
 */
const sayim = await sql`
  SELECT COUNT(*)::int AS adet FROM siparisler
  WHERE lower(govde->'musteri'->>'eposta') = ${YENI} AND durum NOT IN ('odeme-basarisiz','iptal')`;
sayim[0].adet > 0
  ? ok(20, "yeni adres 'ilk siparis' sayilmiyor (kupon istismari kapali)")
  : bad(20, "yeni adres ilk siparis gorunuyor");

// Oturum yeni adresle tazelendi mi?
await s.goto(`${KOK}/hesabim`, { waitUntil: "networkidle" });
(await s.locator("body").innerText()).includes(YENI)
  ? ok(21, "oturum yeni adresle devam ediyor")
  : bad(21, "oturum eski adreste kaldi");

// Siparis gecmisi yeni adreste de gorunuyor mu?
await s.goto(`${KOK}/hesabim/siparisler`, { waitUntil: "networkidle" });
(await s.locator("body").innerText()).includes(SIPARIS_NO)
  ? ok(22, "siparis gecmisi yeni adreste de duruyor")
  : bad(22, "gecmis kayboldu");

// ============ 6. CIKIS YAP ============
/*
 * Cikis, hesap alaninin HER sayfasinda gorunmeli: musteri profilinden cikis
 * yapacak yer yoktu, kullanici siteden cikamiyordu.
 */
const cikisDugmesi = 'form button:has-text("Çıkış yap")';
(await s.locator(cikisDugmesi).count()) === 1
  ? ok(23, "cikis dugmesi hesap alaninda gorunuyor")
  : bad(23, "cikis dugmesi yok");

await s.click(cikisDugmesi);
await s.waitForURL((u) => new URL(u).pathname === "/", { timeout: 20000 })
  .then(() => ok(24, "cikis yapinca ana sayfaya donuluyor"))
  .catch(() => bad(24, `cikis sonrasi adres: ${s.url()}`));

// Oturum gercekten kapandi mi?
await s.goto(`${KOK}/hesabim`, { waitUntil: "networkidle" });
/\/hesap\/giris/.test(s.url())
  ? ok(25, "cikistan sonra hesap alani kapali (oturum gercekten bitti)")
  : bad(25, "cikistan sonra hesap alani hala acik");

// ============ 7. MISAFIR ============
const misafir = await tarayici.newContext();
const m = await misafir.newPage();
for (const yol of ["/hesabim", "/hesabim/parola", "/hesabim/eposta", "/hesabim/siparisler"]) {
  await m.goto(KOK + yol, { waitUntil: "networkidle" });
  if (!/\/hesap\/giris/.test(m.url())) bad(26, `${yol} misafire acik`);
}
hatalar.some((h) => h.includes("misafire acik")) || ok(26, "hesap alani misafire kapali");
await misafir.close();

jsHatalari.length === 0 ? ok(27, "JS hatasi yok") : bad(27, `JS: ${jsHatalari.join(" | ")}`);

await bitir();
