/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import crypto from "node:crypto";
import fs from "node:fs";
import { promisify } from "node:util";
import postgres from "postgres";
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * SEF ROZETLERI — en cok siparis alan ucun podyumu.
 *
 * Test edilen kurallar:
 *  - Sayim yalnizca ODENMIS ve iptal edilmemis siparisleri iceriyor
 *  - Odeme bekleyen / basarisiz / iptal siparisler sayilmiyor
 *  - Rozet YALNIZCA sef mutfaklarina veriliyor; ticari restoran daha cok
 *    satsa bile podyuma cikmiyor
 *  - Podyum ana sayfada, rozet kartta / profilde / sef panelinde gorunuyor
 *  - Bos basamak soru isaretiyle duruyor (bolum gizlenmiyor)
 *  - Ingilizce dilde rozet adlari da cevriliyor
 *  - Yonetici tam siralamayi gorebiliyor (isin diger ucu)
 */
const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }

const SEF_PAROLA = "RozetTest!2468";
const SEF_EPOSTA = `rozet-sef-${Date.now()}@neyersin.test`;

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

/**
 * Turkce metinde buyuk/kucuk harf duyarsiz arama.
 *
 * `/rozetli şef/i` KULLANILMAZ: arayuzdeki etiketler `text-transform:uppercase`
 * ile buyutuluyor ve `innerText` bu haliyle donuyor — "Rozetli" ekranda
 * "ROZETLİ" oluyor. JavaScript'in `i` bayragi Unicode katlamasi yapiyor ve
 * noktali "İ" (U+0130) ile "i" ESLESMIYOR; kart ekranda dururken test
 * "kart yok" diyordu. Turkce yerel ayarla kucultmek tek dogru yol.
 */
const kucult = (metin) => (metin ?? "").toLocaleLowerCase("tr-TR");
const icerirMi = (metin, aranan) => kucult(metin).includes(kucult(aranan));

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 3 });

const ON_EK = "NY-ROZET-";
/**
 * Yarisin taraflari.
 *
 * `gonul-sef` SAHIPSIZ oldugu icin sef paneli testinde kullaniliyor:
 * `hesaplar.restoran_slug` benzersiz, sahipli bir mutfaga ikinci hesap
 * baglanamiyor (makbule-sef'in gercek bir sahibi var).
 */
const BIRINCI = { slug: "makbule-sef", ad: "Makbule Şef" };
const IKINCI = { slug: "gonul-sef", ad: "Gönül Şef" };
const TICARI = { slug: "hizli-market", ad: "Hızlı Market" };

const SATIS_DURUMU = ["odendi", "hazir", "yolda", "teslim-edildi"];

/** Mutfak basina satis sayisi — uygulamanin saydigi kuralla birebir ayni. */
async function satisSayilari() {
  const satirlar = await sql`
    SELECT restoran_slug, COUNT(*)::int AS adet FROM siparisler
    WHERE durum = ANY(${SATIS_DURUMU}) GROUP BY restoran_slug`;
  return new Map(satirlar.map((r) => [r.restoran_slug, r.adet]));
}

const tarayici = kapiliTarayici(await chromium.launch());

async function temizle() {
  await sql`DELETE FROM siparisler WHERE siparis_no LIKE ${ON_EK + "%"}`.catch(() => {});
  await sql`DELETE FROM hesaplar WHERE eposta = ${SEF_EPOSTA}`.catch(() => {});
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

let sayac = 0;
async function siparisEkle(mutfak, durum) {
  const no = `${ON_EK}${String(++sayac).padStart(3, "0")}`;
  const govde = {
    siparisNo: no, restoranSlug: mutfak.slug, restoranAdi: mutfak.ad, durum,
    odemeYontemi: "havale", kalemler: [],
    musteri: { adSoyad: "Rozet Testi", telefon: "05007776655", eposta: "rozet@neyersin.test" },
    adres: { ilce: "Beylikdüzü", mahalle: "Test Mah.", acikAdres: "Deneme Cad.", binaNo: "1", daireNo: "1", tarif: "" },
    not: "", tutarlar: { araToplam: 250, teslimatUcreti: 0, indirim: 0, toplam: 250 },
    olusturmaTarihi: new Date().toISOString(),
  };
  await sql`
    INSERT INTO siparisler (
      siparis_no, durum, odeme_yontemi, restoran_slug, restoran_adi, ilce,
      musteri_ad, musteri_telefon, toplam, olusturma_tarihi, guncelleme_tarihi, govde
    ) VALUES (
      ${no}, ${durum}, 'havale', ${mutfak.slug}, ${mutfak.ad}, 'Beylikdüzü',
      'Rozet Testi', '05007776655', 250, now(), now(), ${sql.json(govde)}
    )`;
}

async function girisYap(sayfa, kimlik, parola) {
  await sayfa.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
  await sayfa.fill('input[name="kimlik"]', kimlik);
  await sayfa.fill('input[name="parola"]', parola);
  await sayfa.locator('form:has(input[name="kimlik"])').locator('button[type="submit"]').click();
  await sayfa.waitForURL((u) => !/\/hesap\/giris/.test(String(u)), { timeout: 25000 });
}

/** Ana sayfadaki "Seflerin Elinden / Isletmeler" secim ekrani ustte duruyor. */
async function secimEkraniniKapat(sayfa) {
  await sayfa.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
  await sayfa.reload({ waitUntil: "networkidle" });
}

await temizle();

/* ════════════ 1. KAYNAK KURALI ════════════ */
const kaynak = fs.readFileSync("src/lib/siparis.ts", "utf8");
/SATIS_DURUMLARI[^=]*=\s*\[\s*"odendi",\s*"hazir",\s*"yolda",\s*"teslim-edildi"\s*\]/.test(kaynak)
  ? ok(1, "satis durumlari dogru tanimli (odendi/hazir/yolda/teslim-edildi)")
  : bad(1, "SATIS_DURUMLARI listesi beklenenden farkli");

/* Postgres ve dosya adaptoru AYNI listeyi kullanmali — elle yazilmis olmamali. */
fs.readFileSync("src/lib/depo/postgres.ts", "utf8").includes("durum = ANY(${SATIS_DURUMLARI})")
  ? ok(2, "postgres adaptoru ortak durum listesini kullaniyor")
  : bad(2, "postgres adaptorunde durum listesi elle yazilmis — iki depo ayrisabilir");

/* ════════════ 2. TEST SIPARISLERI ════════════ */
/*
 * Veritabaninda ZATEN gercek siparisler olabilir (ilk kosuda makbule-sef'in
 * 1 satisi vardi ve test "3 siparis" arayip patlamisti). Bu yuzden sabit sayi
 * yazmak yerine mevcut EN YUKSEK sayinin uzerine cikiliyor: siralama gercek
 * veriden bagimsiz olarak deterministik oluyor, mevcut kayitlara dokunulmuyor.
 */
const oncekiler = await satisSayilari();
const taban = Math.max(0, ...oncekiler.values());

for (let i = 0; i < taban + 3; i += 1) {
  await siparisEkle(BIRINCI, SATIS_DURUMU[i % SATIS_DURUMU.length]);
}
// Sayilmamasi gereken uc durum — birincinin sayisini artirmamali.
for (const d of ["odeme-bekliyor", "odeme-basarisiz", "iptal"]) await siparisEkle(BIRINCI, d);
for (let i = 0; i < taban + 2; i += 1) {
  await siparisEkle(IKINCI, SATIS_DURUMU[i % SATIS_DURUMU.length]);
}
// Ticari restoran EN COK satani olsun — yine de rozet almamali.
for (let i = 0; i < taban + 5; i += 1) await siparisEkle(TICARI, "teslim-edildi");

const sonrakiler = await satisSayilari();
const birinciToplam = sonrakiler.get(BIRINCI.slug) ?? 0;
const ikinciToplam = sonrakiler.get(IKINCI.slug) ?? 0;
ok(3, `test siparisleri olusturuldu (birinci ${birinciToplam}, ikinci ${ikinciToplam} satis)`);

/* Sayilmayan durumlar gercekten disarida mi? */
const eklenenSayilan = (await sql`
  SELECT COUNT(*)::int AS adet FROM siparisler
  WHERE siparis_no LIKE ${ON_EK + "%"} AND restoran_slug = ${BIRINCI.slug}
    AND durum = ANY(${SATIS_DURUMU})`)[0].adet;
eklenenSayilan === taban + 3
  ? ok(4, "odeme bekleyen / basarisiz / iptal siparisler sayilmiyor")
  : bad(4, `birinciye ${taban + 3} sayilan siparis eklenmeliydi, ${eklenenSayilan} sayildi`);

birinciToplam > ikinciToplam && ikinciToplam > 0
  ? ok(5, "yolda/hazir/odendi/teslim-edildi siparisler sayiliyor, siralama olustu")
  : bad(5, `siralama olusmadi (birinci ${birinciToplam}, ikinci ${ikinciToplam})`);

/* ════════════ 3. ANA SAYFA PODYUMU ════════════ */
const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 1200 } });
const sayfa = await baglam.newPage();
const jsHatalari = [];
sayfa.on("pageerror", (e) => jsHatalari.push(e.message));

await sayfa.goto(KOK, { waitUntil: "networkidle" });
await secimEkraniniKapat(sayfa);

const podyum = sayfa.locator('li:has(img[src*="sef-rozeti"])');
(await podyum.count()) === 3
  ? ok(6, "podyumda uc basamak var")
  : bad(6, `podyumda ${await podyum.count()} basamak cikti`);

const podyumMetni = await sayfa.locator("section:has(img[src*='sef-rozeti-altin'])").first().innerText();
podyumMetni.includes(BIRINCI.ad)
  ? ok(7, "birinci sef podyumda")
  : bad(7, `birinci (${BIRINCI.ad}) podyumda yok`);
podyumMetni.includes(IKINCI.ad)
  ? ok(8, "ikinci sef podyumda")
  : bad(8, `ikinci (${IKINCI.ad}) podyumda yok`);
!podyumMetni.includes(TICARI.ad)
  ? ok(9, "ticari restoran 5 satisla bile podyuma cikmiyor")
  : bad(9, `TICARI RESTORAN PODYUMDA: ${TICARI.ad}`);

new RegExp(`(^|\\D)${birinciToplam} sipariş`).test(podyumMetni)
  ? ok(10, `birincinin siparis sayisi yaziyor (${birinciToplam})`)
  : bad(10, `birincinin siparis sayisi (${birinciToplam}) podyumda yok`);
new RegExp(`(^|\\D)${ikinciToplam} sipariş`).test(podyumMetni)
  ? ok(11, `ikincinin siparis sayisi yaziyor (${ikinciToplam})`)
  : bad(11, `ikincinin siparis sayisi (${ikinciToplam}) podyumda yok`);

/*
 * Ucuncu basamak: satisi olan ucuncu bir sef YOKSA soru isaretiyle bos
 * durmali — bolum gizlenmemeli. Varsa o zaten podyumda gorunuyordur.
 */
const digerSefler = (await sql`SELECT slug FROM sef_mutfaklari`.catch(() => []))
  .map((r) => r.slug)
  .filter((s) => (sonrakiler.get(s) ?? 0) > 0);
if (digerSefler.length === 0) {
  podyumMetni.includes("?") && podyumMetni.includes("Bu basamak boş")
    ? ok(12, "bos ucuncu basamak soru isaretiyle duruyor, bolum gizlenmiyor")
    : bad(12, "bos basamak gosterilmiyor");
} else {
  (await podyum.count()) === 3
    ? ok(12, `ucuncu basamakta da sef var (${digerSefler.join(", ")})`)
    : bad(12, "ucuncu basamak cizilmedi");
}

/* Sirlama dogru mu: altin birincide, gumus ikincide? */
const altinKutu = sayfa.locator('li:has(img[src*="sef-rozeti-altin"])');
(await altinKutu.innerText()).includes(BIRINCI.ad)
  ? ok(13, "altin sapka en cok satana takili")
  : bad(13, "altin sapka yanlis sefte");
const gumusKutu = sayfa.locator('li:has(img[src*="sef-rozeti-gumus"])');
(await gumusKutu.innerText()).includes(IKINCI.ad)
  ? ok(14, "gumus sapka ikinciye takili")
  : bad(14, "gumus sapka yanlis sefte");

/* Podyumdaki isim sefin profiline gitmeli. */
const baglantiVar = await altinKutu.locator(`a[href="/restoran/${BIRINCI.slug}"]`).count();
baglantiVar > 0
  ? ok(15, "podyumdaki isim sefin profiline baglaniyor")
  : bad(15, "podyumdan profile baglanti yok");

/* ════════════ 4. MOBILDE TASMA ════════════ */
const mobil = await (await tarayici.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await mobil.goto(KOK, { waitUntil: "networkidle" });
await secimEkraniniKapat(mobil);
const tasma = await mobil.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
tasma <= 0
  ? ok(16, "mobilde yatay tasma yok")
  : bad(16, `mobilde ${tasma}px yatay tasma — podyum sayfayi itiyor`);

/* ════════════ 5. INGILIZCE ════════════ */
const enBaglam = await tarayici.newContext({ viewport: { width: 1440, height: 1200 } });
await enBaglam.addCookies([{ name: "ny_dil", value: "en", url: KOK }]);
const enSayfa = await enBaglam.newPage();
await enSayfa.goto(KOK, { waitUntil: "networkidle" });
await secimEkraniniKapat(enSayfa);
const enMetin = await enSayfa.locator("section:has(img[src*='sef-rozeti-altin'])").first().innerText();
/orders/i.test(enMetin) && !/sipariş/i.test(enMetin)
  ? ok(17, "podyum Ingilizce dilde cevrilmis")
  : bad(17, `podyumda Turkce kalinti: ${enMetin.replace(/\n+/g, " | ").slice(0, 110)}`);
/Chef badges/i.test(enMetin)
  ? ok(18, "rozet bolum basligi Ingilizce")
  : bad(18, "bolum basligi cevrilmemis");

/* ════════════ 6. SEF PROFILI VE KART ════════════ */
await sayfa.goto(`${KOK}/restoran/${BIRINCI.slug}`, { waitUntil: "networkidle" });
const profilRozeti = sayfa.locator('img[src*="sef-rozeti-altin"]');
(await profilRozeti.count()) > 0
  ? ok(19, "sef profilinde altin rozet gorunuyor")
  : bad(19, "sef profilinde rozet yok");
(await sayfa.locator("body").innerText()).includes("Altın Şapka")
  ? ok(20, "profilde rozet adi yaziyor")
  : bad(20, "profilde rozet adi yok");

await sayfa.goto(`${KOK}/restoranlar`, { waitUntil: "networkidle" });
const kartRozeti = sayfa.locator(`article:has(a[href="/restoran/${BIRINCI.slug}"]) img[src*="sef-rozeti"]`);
(await kartRozeti.count()) > 0
  ? ok(21, "restoran kartinda rozet gorunuyor")
  : bad(21, "restoran kartinda rozet yok");

const ticariKart = sayfa.locator(`article:has(a[href="/restoran/${TICARI.slug}"]) img[src*="sef-rozeti"]`);
(await ticariKart.count()) === 0
  ? ok(22, "ticari restoran kartinda rozet yok")
  : bad(22, "ticari restoran kartinda rozet cikti");

/* ════════════ 7. SEFIN KENDI PANELI ════════════ */
/*
 * Hesap SAHIPSIZ mutfaga (gonul-sef) baglaniyor: `hesaplar.restoran_slug`
 * benzersiz, makbule-sef'in gercek bir sahibi var ve ikinci hesap eklenemiyor.
 * Bu yuzden panelde beklenen rozet Gumus Sapka.
 */
const sahipli = await sql`SELECT eposta FROM hesaplar WHERE restoran_slug = ${IKINCI.slug}`;
if (sahipli.length > 0) {
  bad(23, `${IKINCI.slug} artik sahipli (${sahipli[0].eposta}) — panel testi kosulamadi`);
  bad(24, "panel rozet kutusu dogrulanamadi");
}
const sefSayfa = await (await tarayici.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
if (sahipli.length === 0) {
  await sql`
    INSERT INTO hesaplar (eposta, ad, parola_hash, rol, restoran_slug, olusturma_tarihi, eposta_dogrulandi)
    VALUES (${SEF_EPOSTA}, 'Rozet Sefi', ${await parolaOzetle(SEF_PAROLA)}, 'sef', ${IKINCI.slug}, NOW(), TRUE)`;

  await girisYap(sefSayfa, SEF_EPOSTA, SEF_PAROLA);
  await sefSayfa.goto(`${KOK}/panel/${IKINCI.slug}`, { waitUntil: "networkidle" });
  // Baslik `uppercase` — innerText "ROZET DURUMUN" donuyor (bkz. `icerirMi`).
  const panelMetni = await sefSayfa.locator("body").innerText();
  icerirMi(panelMetni, "Rozet durumun")
    ? ok(23, "sef kendi panelinde rozet durumunu goruyor")
    : bad(23, "sef panelinde rozet kutusu yok");
  /Gümüş Şapka sende/.test(panelMetni) && panelMetni.includes(`${ikinciToplam} siparişle`)
    ? ok(24, `panelde rozet ve siparis sayisi dogru (Gumus, ${ikinciToplam})`)
    : bad(24, `panelde rozet bilgisi eksik/yanlis: ${panelMetni.replace(/\n+/g, " | ").slice(0, 120)}`);
}

/* ════════════ 8. YONETICI TARAFI (isin diger ucu) ════════════ */
const yonetim = await tarayici.newContext({ viewport: { width: 1440, height: 1100 } });
const y = await yonetim.newPage();
await y.goto(`${KOK}/admin/giris`, { waitUntil: "domcontentloaded" });
await y.fill('input[name="eposta"]', ADMIN);
await y.fill('input[name="parola"]', PAROLA);
await y.click('form button[type="submit"]');
await y.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 });
/*
 * Panoya AYRICA gidiliyor: `waitForURL` adres degisince donuyor ama pano
 * artik rozet sorgusunu da yapiyor ve ozet kartlari o an henuz basilmamis
 * olabiliyor — kart "yok" gorunup test yaniltici sekilde patliyordu.
 */
await y.goto(`${KOK}/admin`, { waitUntil: "networkidle" });

/* Rozetli sef sayisi: satisi olan sef mutfaklari, en fazla uc. */
const beklenenRozetli = Math.min(
  3,
  [BIRINCI.slug, IKINCI.slug, ...digerSefler].filter((s) => (sonrakiler.get(s) ?? 0) > 0).length,
);
// Kart etiketi `uppercase` — innerText "ROZETLI ŞEF" donuyor.
const panoMetni = await y.locator("body").innerText();
const tumKartlar = await y.locator("dl a").allInnerTexts();
const rozetKarti = tumKartlar.find((t) => icerirMi(t, "Rozetli şef"));
rozetKarti?.includes(`${beklenenRozetli}/3`)
  ? ok(25, `yonetici panosunda 'Rozetli sef ${beklenenRozetli}/3' karti var`)
  : bad(
      25,
      `rozet karti yanlis — beklenen ${beklenenRozetli}/3, bulunan ${JSON.stringify(rozetKarti ?? "kart yok")}`,
    );

await y.goto(`${KOK}/admin/rozetler`, { waitUntil: "networkidle" });
const yonetimMetni = await y.locator("body").innerText();
yonetimMetni.includes(BIRINCI.ad) && yonetimMetni.includes(IKINCI.ad)
  ? ok(26, "yonetici siralamasinda rozetli sefler var")
  : bad(26, "yonetici siralamasinda sefler eksik");
yonetimMetni.includes(TICARI.ad) && /Ticari — yarışmıyor/.test(yonetimMetni)
  ? ok(27, "ticari restoran listede ama 'yarismiyor' isaretli")
  : bad(27, "ticari restoran yonetici listesinde dogru isaretlenmemis");
/Sıralama kuralı/.test(yonetimMetni)
  ? ok(28, "siralama kurali yonetici ekraninda yazili")
  : bad(28, "siralama kurali yazmiyor");

/* Yonetici olmayan bu sayfayi ACAMAMALI. */
const misafir = await (await tarayici.newContext()).newPage();
const cevap = await misafir.goto(`${KOK}/admin/rozetler`, { waitUntil: "domcontentloaded" });
new URL(misafir.url()).pathname === "/admin/giris"
  ? ok(29, "yonetici olmayan rozet sayfasina giremiyor")
  : bad(29, `misafir /admin/rozetler'e girdi (${cevap?.status()} — ${misafir.url()})`);

/*
 * Sefin oturumuyla da girilememeli.
 *
 * Zincir: /admin/rozetler rolu gorup /admin/giris'e atiyor, giris sayfasi da
 * zaten oturumu acik sef'i /panel'e gonderiyor. Onemli olan hangi adrese
 * dustugu degil, siralamayi GORMEMESI — kontrol icerige bakiyor.
 */
if (sahipli.length === 0) {
  await sefSayfa.goto(`${KOK}/admin/rozetler`, { waitUntil: "domcontentloaded" });
  const sefGordu = await sefSayfa.locator("body").innerText();
  const yol = new URL(sefSayfa.url()).pathname;
  yol !== "/admin/rozetler" && !/Sıralama kuralı/.test(sefGordu)
    ? ok(30, `sef oturumu yonetici rozet sayfasini goremiyor (${yol}'e atildi)`)
    : bad(30, `sef /admin/rozetler icerigini gordu (${sefSayfa.url()})`);
} else {
  bad(30, "sef oturumu acilamadigi icin rol kontrolu dogrulanamadi");
}

jsHatalari.length === 0
  ? ok(31, "sayfalarda JS hatasi yok")
  : bad(31, `JS hatasi: ${jsHatalari.slice(0, 2).join(" | ")}`);

await bitir();
