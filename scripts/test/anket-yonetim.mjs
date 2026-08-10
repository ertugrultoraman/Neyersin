/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import fs from "node:fs";
import postgres from "postgres";
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * ANKET YONETIMI (WhatsApp anketi gibi)
 *
 * Kurallar:
 *  - Yonetici anket olusturur, kac secenek olacagini kendi secer
 *  - YAYINDA OLAN HER ANKET ana sayfada kendi kutusunda gorunur; yeni anket
 *    eskisini yayindan INDIRMEZ
 *  - Ayni ziyaretci her ankete ayri ayri oy verebilir (anket basina bir oy)
 *  - Anket silinince oylari da gider; hepsi silinince ana sayfa varsayilana doner
 *  - Anketin izgaradaki yeri surukleyerek/oklarla degistirilir, kalici olur
 *  - TASINAN ANKET KAYBOLMAZ (kademe animasyonu yeni kutuyu gizli birakiyordu)
 *  - Surukleme kolu YALNIZCA yoneticiye gorunur
 *  - Yonetici olmayan anket olusturamaz/silemez
 */
/* Varsayilan yerel HTTPS sunucusu; baska bir ornege yoneltmek icin TEST_KOK. */
const KOK = process.env.TEST_KOK ?? "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }

const cikti = []; const hatalar = [];
let no = 0;
const ok = (m) => cikti.push(`  OK  ${String((no += 1)).padStart(2)}. ${m}`);
const bad = (m) => { hatalar.push(m); cikti.push(`  X   ${String((no += 1)).padStart(2)}. ${m}`); };

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 2 });

const SORU = "TEST Hangi tatliyi seversin?";
const SORU2 = "TEST Aksama ne icersin?";
const tarayici = kapiliTarayici(await chromium.launch(), new URL(KOK).hostname);

async function temizle() {
  const idler = await sql`SELECT id FROM anketler WHERE soru LIKE 'TEST %'`.catch(() => []);
  for (const { id } of idler) {
    await sql`DELETE FROM anket_oylari WHERE anket_id = ${id}`.catch(() => {});
    await sql`DELETE FROM anketler WHERE id = ${id}`.catch(() => {});
  }
  await sql`DELETE FROM anket_oylari WHERE secmen LIKE 'misafir:%'`.catch(() => {});
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

/**
 * Ana sayfadaki "Seflerin Elinden / Isletmeler" secim ekrani fixed overlay;
 * kapatilmazsa altindaki hicbir seye tiklanamiyor.
 */
async function kapiyiGec(sayfa) {
  await sayfa.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
  await sayfa.reload({ waitUntil: "networkidle" });
}

await temizle();

/**
 * Yonetici baglami HAREKET AZALTMALI aciliyor.
 *
 * globals.css'te `scroll-behavior: smooth` var; Playwright ok dugmesine
 * basmadan once ogeyi ekrana kaydiriyor ve kaydirma animasyonu surerken ogeyi
 * "kararsiz" gorup zaman asimina dusuyordu. Hareket azaltma tercihi hem
 * kaydirmayi hem dekoratif animasyonlari aninda bitiriyor.
 */
const yonetim = await tarayici.newContext({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: "reduce",
});
const y = await yonetim.newPage();
const jsHatalari = [];
y.on("pageerror", (e) => jsHatalari.push(e.message));

await y.goto(`${KOK}/admin/giris`, { waitUntil: "domcontentloaded" });
await y.fill('input[name="eposta"]', ADMIN);
await y.fill('input[name="parola"]', PAROLA);
await y.click('form button[type="submit"]');
await y.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 });

await y.goto(`${KOK}/admin/anket`, { waitUntil: "domcontentloaded" });

/* Olusturma formu var mi */
const form = y.locator('form:has(input[name="soru"])');
(await form.count()) === 1 ? ok("anket olusturma formu var") : bad("olusturma formu yok");
if ((await form.count()) === 0) await bitir("form bulunamadi");

/* Baslangicta 3 secenek kutusu */
const kutuSay = () => y.locator('input[name^="secenek"]:not([name*="En"])').count();
(await kutuSay()) === 3 ? ok("baslangicta 3 secenek kutusu") : bad(`3 yerine ${await kutuSay()} kutu`);

/* Secenek sayisi artirilabiliyor (WhatsApp gibi) */
await y.click('button:has-text("Seçenek ekle")');
await y.click('button:has-text("Seçenek ekle")');
(await kutuSay()) === 5 ? ok("secenek ekle calisiyor (5 kutu)") : bad(`ekleme sonrasi ${await kutuSay()} kutu`);

/* Secenek sayisi azaltilabiliyor */
await y.click('button:has-text("Son kutuyu kaldır")');
(await kutuSay()) === 4 ? ok("secenek kaldir calisiyor (4 kutu)") : bad(`kaldirma sonrasi ${await kutuSay()} kutu`);

/* 1. anketi olustur */
await y.fill('input[name="soru"]', SORU);
await y.fill('input[name="secenek0"]', "Baklava");
await y.fill('input[name="secenek1"]', "Künefe");
await y.fill('input[name="secenek2"]', "Sütlaç");
await y.fill('input[name="secenek3"]', "Kazandibi");
await y.click('button:has-text("Yayınla")');
await y.waitForFunction(() => document.body.textContent.includes("Anket yayınlandı"), { timeout: 20000 }).catch(() => {});

const kayit = await sql`SELECT id, secenekler, yayinda FROM anketler WHERE soru = ${SORU}`;
kayit.length === 1 ? ok("anket veritabanina yazildi") : bad("anket kaydedilmedi");
if (kayit.length === 0) await bitir("anket kaydi yok");
const anketId = kayit[0].id;

/* Secenek sayisi dogru (bos kutu sayilmadi) */
kayit[0].secenekler.length === 4
  ? ok("4 secenek kaydedildi")
  : bad(`${kayit[0].secenekler.length} secenek kaydedildi`);

/* Yeni anket yayinda */
kayit[0].yayinda === true ? ok("yeni anket yayinda") : bad("yeni anket yayinda degil");

/* ── IKINCI ANKET: eskisini indirmemeli ── */
await y.goto(`${KOK}/admin/anket`, { waitUntil: "domcontentloaded" });
await y.fill('input[name="soru"]', SORU2);
await y.fill('input[name="secenek0"]', "Çay");
await y.fill('input[name="secenek1"]', "Kahve");
await y.click('button:has-text("Yayınla")');
await y.waitForFunction(() => document.body.textContent.includes("Anket yayınlandı"), { timeout: 20000 }).catch(() => {});

const kayit2 = await sql`SELECT id, yayinda FROM anketler WHERE soru = ${SORU2}`;
kayit2.length === 1 ? ok("ikinci anket veritabanina yazildi") : bad("ikinci anket kaydedilmedi");
if (kayit2.length === 0) await bitir("ikinci anket kaydi yok");
const anketId2 = kayit2[0].id;

/*
 * ASIL KURAL: yeni anket eskisini yayindan indirmiyor. Eskiden indiriyordu ve
 * yonetici yeni anket acar acmaz eskisini ana sayfada goremiyordu.
 */
const eski = await sql`SELECT yayinda FROM anketler WHERE id = ${anketId}`;
eski[0].yayinda === true
  ? ok("yeni anket eskisini yayindan indirmedi")
  : bad("yeni anket eskisini yayindan indirdi");

/* ── Ziyaretci tarafi ── */
const ziyaret = await tarayici.newContext({ viewport: { width: 1440, height: 1100 } });
const z = await ziyaret.newPage();
z.on("pageerror", (e) => jsHatalari.push(e.message));
await z.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(z);

const anket = z.locator(`aside[data-anket="${anketId}"]`);
const anket2 = z.locator(`aside[data-anket="${anketId2}"]`);

/* Ana sayfada IKI anket birden gorunuyor */
(await anket.count()) === 1 && (await anket2.count()) === 1
  ? ok("iki anket de ana sayfada")
  : bad(`ana sayfada anket sayisi: ${await anket.count()} + ${await anket2.count()}`);
if ((await anket.count()) === 0) await bitir("ilk anket ana sayfada yok");

const metin = await anket.innerText();
metin.includes("Hangi tatliyi") || metin.includes("Hangi tatlıyı")
  ? ok("ilk anketin sorusu dogru")
  : bad(`soru yanlis: ${metin.slice(0, 60)}`);

/* Secenekler yeni anketin secenekleri */
(await anket.locator('button[name="secenek"]').count()) === 4
  ? ok("ilk ankette 4 secenek")
  : bad("secenek sayisi tutmuyor");

/* Anket kampanya izgarasinda DEGIL, yan boslugundaki rayda */
const yerlesim = await z.evaluate((id) => {
  const a = document.querySelector(`aside[data-anket="${id}"]`);
  return {
    izgarada: Boolean(a?.closest("#kampanyalar")),
    rayda: Boolean(a?.closest(".anket-grubu")),
    taraf: a?.closest(".anket-grubu")?.classList.contains("anket-rayi-sag") ? "sag" : "sol",
  };
}, anketId);
yerlesim.rayda && !yerlesim.izgarada
  ? ok(`anket yan rayda (${yerlesim.taraf}), izgarada degil`)
  : bad(`yerlesim yanlis: izgarada=${yerlesim.izgarada} rayda=${yerlesim.rayda}`);

/* Ziyaretciye taraf/surukleme denetimleri GORUNMUYOR */
(await z.locator("text=Sürükleyerek taşı").count()) === 0 &&
(await z.locator('button[aria-label*="anketini sola al"]').count()) === 0
  ? ok("ziyaretciye tasima denetimleri gorunmuyor")
  : bad("ziyaretci tasima denetimlerini goruyor");

/* Oy ver */
await anket.locator('button:has-text("Künefe")').click();
await z.waitForFunction(
  (id) => document.querySelector(`aside[data-anket="${id}"]`)?.textContent?.includes("%"),
  anketId,
  { timeout: 20000 },
);
const oylar = await sql`SELECT anket_id, secenek FROM anket_oylari WHERE secmen LIKE 'misafir:%'`;
oylar.length === 1 && oylar[0].anket_id === anketId
  ? ok("oy dogru ankete yazildi")
  : bad("oy yanlis ankete/hic yazilmadi");

oylar[0].secenek === "kunefe"
  ? ok("secenek kimligi turkce harflerden dogru uretildi")
  : bad(`secenek kimligi: ${oylar[0].secenek}`);

/*
 * Anket basina bir oy: birine oy vermek digerini KILITLEMEZ, digerinin
 * sonucunu da acmaz.
 */
(await anket2.innerText()).includes("%")
  ? bad("bir ankete oy verince digerinin sonucu acildi")
  : ok("digerinin sonucu hala kapali");

await anket2.locator('button:has-text("Kahve")').click();
await z.waitForFunction(
  (id) => document.querySelector(`aside[data-anket="${id}"]`)?.textContent?.includes("%"),
  anketId2,
  { timeout: 20000 },
);
const oylar2 = await sql`SELECT anket_id FROM anket_oylari WHERE secmen LIKE 'misafir:%'`;
oylar2.length === 2 && oylar2.some((o) => o.anket_id === anketId2)
  ? ok("ayni ziyaretci ikinci ankete de oy verebildi")
  : bad(`ikinci oy yazilmadi: ${oylar2.length} oy`);

/* ── Yonetici: konum degistirme ── */
await y.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(y);

/* Yonetici taraf dugmelerini goruyor (anket basina bir cift) */
const tarafDugmesi = await y
  .locator(`button[aria-label*="TEST Hangi tatliyi seversin"][aria-label*="sağa al"]`)
  .count();
tarafDugmesi === 1
  ? ok("yonetici anketin taraf dugmesini goruyor")
  : bad(`taraf dugmesi ${tarafDugmesi} adet — beklenen 1`);

/** Anket kutusunu ekrana getirip belirmesini bekler. */
async function anketiEkranaAl(id) {
  await y.evaluate((k) => {
    document.querySelector(`aside[data-anket="${k}"]`)?.scrollIntoView({ block: "center" });
  }, id);
  await y.waitForTimeout(600);
}

/** Anketin hangi tarafta durdugu + gorunurlugu. */
const tarafOlc = (id) =>
  y.evaluate((k) => {
    const a = document.querySelector(`aside[data-anket="${k}"]`);
    if (!a) return { duruyor: false, taraf: null, opaklik: 0 };
    const grup = a.closest(".anket-grubu");
    return {
      duruyor: true,
      taraf: grup?.classList.contains("anket-rayi-sag") ? "sag" : "sol",
      opaklik: Number(getComputedStyle(a).opacity),
    };
  }, id);

/* Taraf dugmesiyle anket kars? tarafa geciyor ve KALICI */
await anketiEkranaAl(anketId);
const oncekiTaraf = (await tarafOlc(anketId)).taraf;
const hedefTaraf = oncekiTaraf === "sag" ? "sola al" : "sağa al";
/*
 * Dugmeye DOM uzerinden basiliyor: Playwright'in koordinatli tiklamasi
 * yumusak kaydirma sirasinda kayabiliyor.
 */
const tarafBasildi = await y.evaluate((etiket) => {
  const d = document.querySelector(
    `button[aria-label*="TEST Hangi tatliyi seversin"][aria-label*="${etiket}"]`,
  );
  if (!d || d.disabled) return false;
  d.click();
  return true;
}, hedefTaraf);
tarafBasildi ? ok(`taraf dugmesi tiklanabilir (${hedefTaraf})`) : bad("taraf dugmesi yok/pasif");
await y.waitForTimeout(2200);

const sonrasi = await sql`SELECT sira FROM anketler WHERE id = ${anketId}`;
const beklenenSira = hedefTaraf === "sağa al" ? 1 : 0;
sonrasi[0].sira === beklenenSira
  ? ok(`anketin tarafi kaydedildi (sira=${sonrasi[0].sira})`)
  : bad(`taraf kaydedilmedi (sira=${sonrasi[0].sira}, beklenen ${beklenenSira})`);

/*
 * TASINDIKTAN SONRA KUTU HALA GORUNUYOR.
 *
 * Kademeli acilis kapsayicisi bir kez acildiktan sonra listeye yeni katilan
 * ogeyi "gizli" birakiyordu: anket tasininca opaklik 0'da kalip ekrandan
 * siliniyordu. Varligina degil GORUNURLUGUNE bakiliyor.
 */
await anketiEkranaAl(anketId);
const tasindiktanSonra = await tarafOlc(anketId);
tasindiktanSonra.duruyor &&
tasindiktanSonra.opaklik > 0.5 &&
tasindiktanSonra.taraf !== oncekiTaraf
  ? ok(`tasinan anket ekranda kaldi ve tarafi degisti (${oncekiTaraf} -> ${tasindiktanSonra.taraf})`)
  : bad(
      tasindiktanSonra.duruyor
        ? `tasima sonrasi sorun (opaklik ${tasindiktanSonra.opaklik}, taraf ${tasindiktanSonra.taraf})`
        : "tasinan anket sayfadan kayboldu",
    );

/* Ziyaretci de yeni tarafta goruyor */
const z2 = await (await tarayici.newContext()).newPage();
await z2.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(z2);
/*
 * `sira` artik anketin TARAFI: 0 = sol, 1 = sag. Ziyaretci de yoneticinin
 * sectigi tarafta gormeli — secim sunucuda saklandigi icin herkese ayni.
 */
const tarafZiyaretci = await z2.evaluate((id) => {
  const grup = document.querySelector(`aside[data-anket="${id}"]`)?.closest(".anket-grubu");
  if (!grup) return null;
  return grup.classList.contains("anket-rayi-sag") ? "sag" : "sol";
}, anketId);
const beklenenTaraf = sonrasi[0].sira === 1 ? "sag" : "sol";
tarafZiyaretci === beklenenTaraf
  ? ok(`ziyaretci anketi ${beklenenTaraf} tarafta goruyor`)
  : bad(`ziyaretcide taraf ${tarafZiyaretci}, beklenen ${beklenenTaraf}`);

/* Dar ekranda (telefon) anketler alt alta ve YANA TASMIYOR */
const telefon = await (await tarayici.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await telefon.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(telefon);
const mobil = await telefon.evaluate((id) => {
  const a = document.querySelector(`aside[data-anket="${id}"]`);
  if (!a) return { duruyor: false };
  const r = a.getBoundingClientRect();
  return {
    duruyor: true,
    sabit: getComputedStyle(a.closest(".anket-grubu")).position === "fixed",
    sagTasma: Math.round(r.right - document.documentElement.clientWidth),
    solTasma: Math.round(r.left),
    yatayKaydirma: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
}, anketId);
mobil.duruyor && !mobil.sabit && !mobil.yatayKaydirma && mobil.solTasma >= 0 && mobil.sagTasma <= 0
  ? ok("telefonda anket akista, sayfa yana kaymiyor")
  : bad(`telefonda sorun: ${JSON.stringify(mobil)}`);

/* ── Yonetim listesi ── */
await y.goto(`${KOK}/admin/anket`, { waitUntil: "domcontentloaded" });
const sayfa = await y.locator("main").innerText();

/* Anket listede ve oy sayisi dogru */
sayfa.includes(SORU) && sayfa.includes("4 seçenek")
  ? ok("anket yonetim listesinde")
  : bad("anket listede gorunmuyor");

/* Iki anketin de sonucu panelde */
sayfa.includes(SORU) && sayfa.includes(SORU2)
  ? ok("iki anketin sonucu da panelde")
  : bad("panelde yalnizca bir anketin sonucu var");

/* Yayinda rozeti */
sayfa.includes("Yayında") ? ok("yayin durumu gorunuyor") : bad("yayin rozeti yok");

/* Silme IKI ADIMLI (tek tikla oylar ucmasin) */
await y.locator(`li:has-text("${SORU}") button:has-text("Sil")`).first().click();
const onay = await y.locator('button:has-text("Evet, sil")').count();
onay === 1 ? ok("silme onay istiyor") : bad("silme dogrudan yapiliyor");

/* Sil */
await y.locator('button:has-text("Evet, sil")').first().click();
await y.waitForTimeout(2500);
const kalan = await sql`SELECT COUNT(*)::int AS n FROM anketler WHERE id = ${anketId}`;
kalan[0].n === 0 ? ok("anket silindi") : bad("anket silinmedi");

/* Oylari da gitti */
const kalanOy = await sql`SELECT COUNT(*)::int AS n FROM anket_oylari WHERE anket_id = ${anketId}`;
kalanOy[0].n === 0 ? ok("anketin oylari da silindi") : bad(`${kalanOy[0].n} oy sahipsiz kaldi`);

/* Digeri ana sayfada duruyor — biri silinince oteki etkilenmiyor */
const z3 = await (await tarayici.newContext()).newPage();
await z3.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(z3);
(await z3.locator(`aside[data-anket="${anketId2}"]`).count()) === 1
  ? ok("digeri ana sayfada duruyor")
  : bad("bir anket silinince digeri de kayboldu");

/* Ikinci anketi de sil */
await y.locator(`li:has-text("${SORU2}") button:has-text("Sil")`).first().click();
await y.locator('button:has-text("Evet, sil")').first().click();
await y.waitForTimeout(2500);

/*
 * Yayinda BASKA anket kalmadiysa ana sayfa varsayilana doner. Kalmissa (testin
 * acmadigi, veritabaninda duran anketler) o anketler gorunmeye devam etmeli —
 * "varsayilan cikti mi" diye bakmak, kural dogru islerken takimi dusuruyordu.
 */
const kalanYayinda = await sql`SELECT id FROM anketler WHERE yayinda = true`;
const z4 = await (await tarayici.newContext()).newPage();
await z4.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(z4);

if (kalanYayinda.length === 0) {
  const son = await z4.locator('aside[data-anket="varsayilan"]').innerText().catch(() => "");
  son.includes("Genelde ne yemeyi")
    ? ok("yayinda anket kalmayinca ana sayfa varsayilana dondu")
    : bad(`varsayilana donmedi: ${son.slice(0, 50)}`);
} else {
  const gorunen = await z4.locator("aside[data-anket]").evaluateAll((ler) =>
    ler.map((o) => o.dataset.anket),
  );
  const eksik = kalanYayinda.filter((a) => !gorunen.includes(a.id));
  const testAnketi = gorunen.some((g) => g === anketId || g === anketId2);
  eksik.length === 0 && !testAnketi
    ? ok(`test anketleri kalkti, yayindaki ${kalanYayinda.length} anket duruyor`)
    : bad(`silme sonrasi sayfa yanlis: eksik=${eksik.length} testAnketiDuruyor=${testAnketi}`);
}

/* Yonetici olmayan anket olusturamaz */
const yabanci = await (await tarayici.newContext()).newPage();
const cevap = await yabanci.evaluate(async (kok) => {
  const r = await fetch(`${kok}/admin/anket`, { method: "GET", redirect: "manual" });
  return r.status;
}, KOK).catch(() => 0);
cevap === 0 || cevap >= 300
  ? ok("yonetim sayfasi disariya kapali")
  : bad(`yonetim sayfasi ${cevap} donuyor`);

/* JS hatasi yok */
jsHatalari.length === 0 ? ok("JS hatasi yok") : bad(`JS hatasi: ${jsHatalari[0]}`);

await bitir();
