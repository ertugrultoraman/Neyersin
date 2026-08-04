/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { chromium } from "playwright";
import crypto from "node:crypto";
import fs from "node:fs";
import postgres from "postgres";
import { promisify } from "node:util";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * DIL KAPSAMI — Ingilizce sayfada Turkce metin KALMAMALI.
 *
 * Neden ayri bir test: dil.mjs tek tek kontrol ettigim yerleri dogruluyor,
 * yani "baktigim yer cevrilmis mi" diyor. Bu test tam tersini soruyor:
 * "bakmadigim bir yer Turkce kalmis mi". Canliya alindiktan sonra 83 satir
 * Turkce metin bu yuzden gozden kacmisti.
 *
 * IKI GENISLETME (profiller):
 *
 *  1. GIRIS GEREKTIREN sayfalar da taraniyor. Profil ekranlari — musterinin
 *     hesabi, sefin paneli, kuryenin teslimat listesi — disaridan gorunmedigi
 *     icin ilk surumde hic olculmemisti; hepsi Turkce kalmisti.
 *
 *  2. Yalnizca Turkce HARF aramak yetmiyor. "Puan", "Kurye", "Ana Sayfa",
 *     "Teslimat" gibi kelimelerde ozel karakter yok; eski surum bunlari
 *     Ingilizce sanip geciyordu. Artik ASCII yazilan Turkce kelimeler de
 *     yakalaniyor.
 *
 * Ozel adlar (ilce, marka, Turkce yemek adlari) beyaz listede. Kullanicinin
 * KENDI girdigi metinler (urun adi, ozgecmis, slogan) veritabanindan okunup
 * calisma aninda beyaz listeye ekleniyor — onlarin cevrilmemesi dogru
 * davranis, elle liste tutmak ise ilk urun eklendiginde bozulurdu.
 */
const KOK = "https://neyersin.local";
const TR = /[çğıöşüÇĞİÖŞÜ]/;

/**
 * Turkce harf tasimayan ama Turkce olan kelimeler.
 *
 * Ingilizce karsiliklariyla karisanlar (Panel, Menu, Market, Not) bilerek
 * disarida: bu listeye giren her kelime Ingilizce sayfada HATA demek.
 */
const ASCII_TR =
  /\b(Puan|Kurye|Sayfa|Sepet|Adres|Fiyat|Yorum|Kampanya|Ekran|Merhaba|Teslimat|Parola|Kaydet|Restoran|Hesap|Siparis|Sertifika|Yonetici|Vazgec)\w*/;

const BEYAZ =
  /Beylikdüzü|İstanbul|Ne Yersin|Şef Mangal|Gönül|Makbule|Ateş|Kırmızı|Anne Sofrası|Burger Atölyesi|Döner Vadisi|Tatlı Kaçamak|Çekirdek|Deniz Kenarı|Yeşil Kase|Kars|Pide Ustası|Baharat Yolu|Sabah Simit|Gece Lezzetleri|Hızlı Market|Kadıköy|Beşiktaş|Ataşehir|Üsküdar|Arnavutköy|Avcılar|Bağcılar|Bahçelievler|Bakırköy|Başakşehir|Bayrampaşa|Beykoz|Beyoğlu|Büyükçekmece|Çatalca|Çekmeköy|Esenler|Esenyurt|Eyüpsultan|Fatih|Gaziosmanpaşa|Güngören|Kağıthane|Kartal|Küçükçekmece|Maltepe|Pendik|Sancaktepe|Sarıyer|Silivri|Sultanbeyli|Sultangazi|Şile|Şişli|Tuzla|Ümraniye|Zeytinburnu|Adalar|Çiğ Börek|Künefe|Mantı|Poğaça|Açma|İçli|Böreği|Güllaç|Tarhana|Şalgam|Ayvalık|Menemen|Sütlaç|Baklava|Adana|Karnıyarık|İskender|Lahmacun|Ezogelin|Haydari|Mücver|Fava|Girit|Ayran|Kaşarlı|Sucuklu|Kıymalı|Kuşbaşılı|Simit|Su Böreği|Sigara Böreği|Kazandibi|Çorbası|Dürüm|Şiş|Kanat|Baget|Tabak|Patates|Salata|Limonata|Turşu|Reçel|Erişte|Yoğurt|Tereyağı|Salçası|Hamburger|Fasulye|Kola|börek|mantı|poğaça|çiğ|künefe|simit|köfte|pide|döner|kebap|meze|kısır|helva|şerbet/i;

const ACIK_YOLLAR = [
  "/", "/restoranlar", "/restoran/ates-kanat", "/hakkimizda", "/ev-hanimlari",
  "/nasil-calisir", "/hesap/giris", "/hesap/kayit", "/iletisim", "/ekranlar",
  "/isletmeler", "/seflerin-elinden", "/odeme",
  /* Sef profili: "Sef Profili" bloklu sayfa disaridan gorunuyor ama hic taranmamisti. */
  "/restoran/makbule-sef",
];

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const env = fs.readFileSync(".env.local", "utf8");
const veritabani = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(veritabani, { ssl: "require", max: 2 });

const damga = Date.now().toString().slice(-8);
const MUSTERI = `dil-musteri-${damga}@neyersin.test`;
const SEF = `dil-sef-${damga}@neyersin.test`;
const KURYE = `dil-kurye-${damga}@neyersin.test`;
const PAROLA = "NyTest!7kQm3";
/** Sahipsiz bir slug — gercek bir sefin profilini calmasin. */
const SEF_SLUG = "gonul-sef";

const tarayici = kapiliTarayici(await chromium.launch());

async function bitir(patlama) {
  await sql`DELETE FROM dogrulama_kodlari WHERE eposta IN (${MUSTERI}, ${SEF}, ${KURYE})`.catch(() => {});
  await sql`DELETE FROM hesaplar WHERE eposta IN (${MUSTERI}, ${SEF}, ${KURYE})`.catch(() => {});
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

/* ── Kullanicinin kendi girdigi metinler: cevrilmemeleri DOGRU ── */
const scrypt = promisify(crypto.scrypt);
async function parolaOzetle(parola) {
  const tuz = crypto.randomBytes(16).toString("hex");
  return `${tuz}:${(await scrypt(parola, tuz, 64)).toString("hex")}`;
}

const kullaniciMetinleri = new Set();
/* Testin kendi actigi hesaplarin adlari — henuz veritabaninda yoklar. */
for (const ad of ['Dil Testi', 'Dil Sefi', 'Dil Kuryesi']) kullaniciMetinleri.add(ad);
/* Hesap ve mutfak adlari da kullanici verisi — 'Sef Ornek', 'Dil Kuryesi' cevrilmez. */
for (const satir of await sql`SELECT ad FROM hesaplar`.catch(() => [])) {
  if (satir.ad) kullaniciMetinleri.add(String(satir.ad).trim());
}
for (const satir of await sql`SELECT ad FROM sef_mutfaklari`.catch(() => [])) {
  if (satir.ad) kullaniciMetinleri.add(String(satir.ad).trim());
}
for (const satir of await sql`SELECT ad, aciklama, birim FROM mutfak_urunleri`.catch(() => [])) {
  for (const alan of [satir.ad, satir.aciklama, satir.birim]) {
    if (alan) kullaniciMetinleri.add(String(alan).trim());
  }
}
for (const satir of await sql`
  SELECT biyografi, sertifikalar, uzmanlik, slogan, alim_adresi FROM sef_profilleri`.catch(() => [])) {
  for (const alan of Object.values(satir)) {
    if (!alan) continue;
    for (const parca of String(alan).split("\n")) {
      if (parca.trim()) kullaniciMetinleri.add(parca.trim());
    }
  }
}

/** Satir kullanicinin kendi yazdigi bir metni ICERIYOR mu? */
const kullaniciYazmis = (satir) =>
  [...kullaniciMetinleri].some((m) => m.length > 2 && satir.includes(m));

/* ── Tarama ── */
async function tara(sayfa, yol) {
  await sayfa.goto(KOK + yol, { waitUntil: "networkidle" }).catch(() => {});
  await sayfa.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi")).catch(() => {});
  const metin = await sayfa.locator("body").innerText().catch(() => "");
  if (!metin) return null;
  return [...new Set(
    metin.split("\n").map((x) => x.trim())
      /* Tek harf: profil avatarindaki bas harf ("Ş") — ozel ad, cevrilmez. */
      .filter((x) => x.length > 1 && (TR.test(x) || ASCII_TR.test(x)))
      .filter((x) => !BEYAZ.test(x) && !kullaniciYazmis(x)),
  )];
}

async function kontrolEt(no, sayfa, yol, etiket = yol) {
  const kalan = await tara(sayfa, yol);
  if (kalan === null) { bad(no, `${etiket} acilmadi`); return; }
  kalan.length === 0
    ? ok(no, `${etiket} tamamen Ingilizce`)
    : bad(no, `${etiket}: ${kalan.length} Turkce satir — ${kalan.slice(0, 3).map((x) => x.slice(0, 52)).join(" | ")}`);
}

/** Ingilizce secilmis, kapisi gecilmis yeni bir tarayici baglami. */
async function enBaglam() {
  const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 1200 } });
  await baglam.addCookies([{ name: "ny_dil", value: "en", url: KOK }]);
  return baglam;
}

async function girisYap(sayfa, kimlik) {
  await sayfa.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
  await sayfa.fill('input[name="kimlik"]', kimlik);
  await sayfa.fill('input[name="parola"]', PAROLA);
  const form = sayfa.locator('form:has(input[name="kimlik"])');
  await form.locator('button[type="submit"]').click();
  await sayfa.waitForURL((u) => !/\/hesap\/giris/.test(String(u)), { timeout: 25000 });
}

/* ════════════ 1. HERKESE ACIK SAYFALAR ════════════ */
const acikSayfa = await (await enBaglam()).newPage();
let no = 0;
for (const yol of ACIK_YOLLAR) await kontrolEt((no += 1), acikSayfa, yol);

/*
 * ════════════ 2. INSAN KAPISI ════════════
 *
 * Diger butun kontroller bileti hazir yazilmis bir baglamda kosuyor
 * (kapiliTarayici), yani kapiyi HIC gormuyorlar. Oysa yabanci bir
 * ziyaretcinin gordugu ILK ekran o; canliya alinana kadar Turkce kaldigi
 * fark edilmemisti. Burada bilerek BILETSIZ bir baglam aciliyor.
 */
{
  const hamBaglam = await tarayici.hamBaglam({ viewport: { width: 1440, height: 1000 } });
  await hamBaglam.addCookies([{ name: "ny_dil", value: "en", url: KOK }]);
  const kapiSayfasi = await hamBaglam.newPage();
  await kapiSayfasi.goto(KOK, { waitUntil: "networkidle" }).catch(() => {});
  const metin = await kapiSayfasi.locator("body").innerText().catch(() => "");
  const kalan = [...new Set(
    metin.split("\n").map((x) => x.trim())
      .filter((x) => x.length > 1 && (TR.test(x) || ASCII_TR.test(x)) && !BEYAZ.test(x)),
  )];
  no += 1;
  if (!/robot/i.test(metin)) bad(no, "insan kapisi hic gorunmedi — bilet sizmis olabilir");
  else if (kalan.length > 0) bad(no, `insan kapisi: ${kalan.length} Turkce satir — ${kalan[0].slice(0, 52)}`);
  else ok(no, "insan kapisi tamamen Ingilizce");

  /* Kapida dil dugmesi olmali: cerezi olmayan ziyaretci dilini secebilsin. */
  no += 1;
  (await kapiSayfasi.locator('button[aria-label="Turkish"]').count()) > 0
    ? ok(no, "insan kapisinda dil dugmesi var")
    : bad(no, "insan kapisinda dil dugmesi yok — cerezsiz ziyaretci dil secemiyor");
  await hamBaglam.close();
}

/* ════════════ 3. MUSTERININ HESAP ALANI ════════════ */
await sql`
  INSERT INTO hesaplar (eposta, ad, parola_hash, rol, olusturma_tarihi, eposta_dogrulandi)
  VALUES (${MUSTERI}, 'Dil Testi', ${await parolaOzetle(PAROLA)}, 'musteri', NOW(), TRUE)`;

const musteriSayfa = await (await enBaglam()).newPage();
await girisYap(musteriSayfa, MUSTERI);
for (const yol of ["/hesabim", "/hesabim/siparisler", "/hesabim/eposta", "/hesabim/parola"]) {
  await kontrolEt((no += 1), musteriSayfa, yol, `musteri ${yol}`);
}

/* ════════════ 4. SEFIN PANELI VE PROFILI ════════════ */
await sql`
  INSERT INTO hesaplar (eposta, ad, parola_hash, rol, restoran_slug, olusturma_tarihi, eposta_dogrulandi)
  VALUES (${SEF}, 'Dil Sefi', ${await parolaOzetle(PAROLA)}, 'sef', ${SEF_SLUG}, NOW(), TRUE)`;

const sefSayfa = await (await enBaglam()).newPage();
await girisYap(sefSayfa, SEF);
/* Kendi paneli: urun yonetimi + profil formu + "Diger profiller" seridi. */
await kontrolEt((no += 1), sefSayfa, "/panel", "sef /panel");
/* Kendi profil sayfasi: duzenleme yetkisi acik. */
await kontrolEt((no += 1), sefSayfa, `/panel/${SEF_SLUG}`, "sef kendi profili");
/* Baskasinin profili: yalnizca goruntuleme dali. */
await kontrolEt((no += 1), sefSayfa, "/panel/makbule-sef", "sef baska profil");

/* ════════════ 5. KURYENIN PANELI ════════════ */
await sql`
  INSERT INTO hesaplar (eposta, ad, parola_hash, rol, olusturma_tarihi, eposta_dogrulandi)
  VALUES (${KURYE}, 'Dil Kuryesi', ${await parolaOzetle(PAROLA)}, 'kurye', NOW(), TRUE)`;

const kuryeSayfa = await (await enBaglam()).newPage();
await girisYap(kuryeSayfa, KURYE);
await kontrolEt((no += 1), kuryeSayfa, "/panel", "kurye /panel");

await bitir();
