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
 *  - Yayinlanan anket ana sayfaya cikar, eskisi kendiliginden iner
 *  - Anket silinince oylari da gider, ana sayfa varsayilana doner
 *  - Anketin izgaradaki yeri surukleyerek/oklarla degistirilir, kalici olur
 *  - Surukleme kolu YALNIZCA yoneticiye gorunur
 *  - Yonetici olmayan anket olusturamaz/silemez
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

const SORU = "TEST Hangi tatliyi seversin?";
const tarayici = kapiliTarayici(await chromium.launch());

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

/* ── Yonetici girisi ── */
const yonetim = await tarayici.newContext({ viewport: { width: 1440, height: 1100 } });
const y = await yonetim.newPage();
const jsHatalari = [];
y.on("pageerror", (e) => jsHatalari.push(e.message));

await y.goto(`${KOK}/admin/giris`, { waitUntil: "domcontentloaded" });
await y.fill('input[name="eposta"]', ADMIN);
await y.fill('input[name="parola"]', PAROLA);
await y.click('form button[type="submit"]');
await y.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 });

await y.goto(`${KOK}/admin/anket`, { waitUntil: "domcontentloaded" });

/* 1) Olusturma formu var mi */
const form = y.locator('form:has(input[name="soru"])');
(await form.count()) === 1 ? ok(1, "anket olusturma formu var") : bad(1, "olusturma formu yok");
if ((await form.count()) === 0) await bitir("form bulunamadi");

/* 2) Baslangicta 3 secenek kutusu */
const kutuSay = () => y.locator('input[name^="secenek"]:not([name*="En"])').count();
(await kutuSay()) === 3 ? ok(2, "baslangicta 3 secenek kutusu") : bad(2, `3 yerine ${await kutuSay()} kutu`);

/* 3) Secenek sayisi artirilabiliyor (WhatsApp gibi) */
await y.click('button:has-text("Seçenek ekle")');
await y.click('button:has-text("Seçenek ekle")');
(await kutuSay()) === 5 ? ok(3, "secenek ekle calisiyor (5 kutu)") : bad(3, `ekleme sonrasi ${await kutuSay()} kutu`);

/* 4) Secenek sayisi azaltilabiliyor */
await y.click('button:has-text("Son kutuyu kaldır")');
(await kutuSay()) === 4 ? ok(4, "secenek kaldir calisiyor (4 kutu)") : bad(4, `kaldirma sonrasi ${await kutuSay()} kutu`);

/* 5) Anket olustur */
await y.fill('input[name="soru"]', SORU);
await y.fill('input[name="secenek0"]', "Baklava");
await y.fill('input[name="secenek1"]', "Künefe");
await y.fill('input[name="secenek2"]', "Sütlaç");
await y.fill('input[name="secenek3"]', "Kazandibi");
await y.click('button:has-text("Yayınla")');
await y.waitForFunction(() => document.body.textContent.includes("Anket yayınlandı"), { timeout: 20000 }).catch(() => {});

const kayit = await sql`SELECT id, secenekler, yayinda FROM anketler WHERE soru = ${SORU}`;
kayit.length === 1 ? ok(5, "anket veritabanina yazildi") : bad(5, "anket kaydedilmedi");
if (kayit.length === 0) await bitir("anket kaydi yok");
const anketId = kayit[0].id;

/* 6) Secenek sayisi dogru (bos kutu sayilmadi) */
kayit[0].secenekler.length === 4
  ? ok(6, "4 secenek kaydedildi")
  : bad(6, `${kayit[0].secenekler.length} secenek kaydedildi`);

/* 7) Yeni anket yayinda */
kayit[0].yayinda === true ? ok(7, "yeni anket yayinda") : bad(7, "yeni anket yayinda degil");

/* ── Ziyaretci tarafi ── */
const ziyaret = await tarayici.newContext({ viewport: { width: 1440, height: 1100 } });
const z = await ziyaret.newPage();
z.on("pageerror", (e) => jsHatalari.push(e.message));
await z.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(z);

const anket = z.locator('aside[aria-labelledby="anket-basligi"]');
const metin = await anket.innerText();

/* 8) Ana sayfada YENI anket gorunuyor */
metin.includes("Hangi tatliyi") || metin.includes("Hangi tatlıyı")
  ? ok(8, "yeni anket ana sayfada")
  : bad(8, `ana sayfada eski anket duruyor: ${metin.slice(0, 60)}`);

/* 9) Secenekler yeni anketin secenekleri */
(await anket.locator('button[name="secenek"]').count()) === 4
  ? ok(9, "ana sayfada 4 secenek")
  : bad(9, "secenek sayisi tutmuyor");

/* 10) Anket kampanya izgarasinin icinde (ayri serit degil) */
const izgaradaMi = await z.evaluate(() => {
  const a = document.querySelector('aside[aria-labelledby="anket-basligi"]');
  return Boolean(a?.closest("#kampanyalar"));
});
izgaradaMi ? ok(10, "anket kampanya izgarasinda") : bad(10, "anket izgaranin disinda kalmis");

/* 11) Ziyaretciye surukleme kolu GORUNMUYOR */
(await z.locator('text=Sürükleyerek taşı').count()) === 0
  ? ok(11, "ziyaretciye surukleme kolu gorunmuyor")
  : bad(11, "ziyaretci surukleme kolunu goruyor");

/* 12) Oy ver */
await anket.locator('button:has-text("Künefe")').click();
await z.waitForFunction(
  () => document.querySelector('aside[aria-labelledby="anket-basligi"]')?.textContent?.includes("%"),
  { timeout: 20000 },
);
const oylar = await sql`SELECT anket_id, secenek FROM anket_oylari WHERE secmen LIKE 'misafir:%'`;
oylar.length === 1 && oylar[0].anket_id === anketId
  ? ok(12, "oy yeni ankete yazildi")
  : bad(12, "oy yanlis ankete/hic yazilmadi");

/* 13) Ayni kisi eski ankete de oy verebilir mi? (anket basina bir oy) */
oylar[0].secenek === "kunefe"
  ? ok(13, "secenek kimligi turkce harflerden dogru uretildi")
  : bad(13, `secenek kimligi: ${oylar[0].secenek}`);

/* ── Yonetici: konum degistirme ── */
await y.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(y);

/*
 * 14) Yonetici surukleme kolunu goruyor.
 *
 * Izgarada artik IKI surukleneblir kutu var: anket ve Sef Kasigi tanitimi.
 * Kol sayisi bu yuzden 2; tek kol beklemek anket kolunun kayboldugu anlamina
 * da gelebilirdi, o yuzden anket kutusunun kendi kolu ayrica dogrulaniyor.
 */
const kolSayisi = await y.locator('text=Sürükleyerek taşı').count();
const anketKolu = await y
  .locator('li:has(aside[aria-labelledby="anket-basligi"]) >> text=Sürükleyerek taşı')
  .count();
kolSayisi === 2 && anketKolu === 1
  ? ok(14, "yonetici iki surukleme kolunu goruyor (anket + sef kasigi)")
  : bad(14, `kol sayisi ${kolSayisi}, anket kolu ${anketKolu} — beklenen 2 ve 1`);

/* 15) Ok dugmesiyle konum degisiyor ve KALICI */
await y.click('button[aria-label="Anketi bir kutu geriye al"]');
await y.waitForTimeout(1500);
const sonrasi = await sql`SELECT sira FROM anketler WHERE id = ${anketId}`;
sonrasi[0].sira >= 0 && sonrasi[0].sira < 4
  ? ok(15, `anket konumu kaydedildi (sira=${sonrasi[0].sira})`)
  : bad(15, `konum kaydedilmedi (sira=${sonrasi[0].sira})`);

/* 16) Ziyaretci de yeni konumda goruyor */
const z2 = await (await tarayici.newContext()).newPage();
await z2.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(z2);
/*
 * Sef Kasigi kutusu da ayni izgarada bir `li`; sayilirsa anketin DOM sirasi
 * kayiyor. `sira` alani KAMPANYA kartlari arasindaki yeri anlattigi icin
 * diger ozel kutular disarida birakiliyor.
 */
const konumZiyaretci = await z2.evaluate(() => {
  const ogeler = [...document.querySelectorAll("#kampanyalar li")].filter(
    (o) => !o.querySelector('img[src*="sef-kasigi"]'),
  );
  return ogeler.findIndex((o) => o.querySelector('aside[aria-labelledby="anket-basligi"]'));
});
konumZiyaretci === sonrasi[0].sira
  ? ok(16, "ziyaretci anketi yeni konumda goruyor")
  : bad(16, `ziyaretcide konum ${konumZiyaretci}, beklenen ${sonrasi[0].sira}`);

/* ── Yonetim listesi ── */
await y.goto(`${KOK}/admin/anket`, { waitUntil: "domcontentloaded" });
const sayfa = await y.locator("main").innerText();

/* 17) Anket listede ve oy sayisi dogru */
sayfa.includes(SORU) && sayfa.includes("4 seçenek")
  ? ok(17, "anket yonetim listesinde")
  : bad(17, "anket listede gorunmuyor");

/* 18) Yayinda rozeti */
sayfa.includes("Yayında") ? ok(18, "yayin durumu gorunuyor") : bad(18, "yayin rozeti yok");

/* 19) Silme IKI ADIMLI (tek tikla oylar ucmasin) */
await y.locator(`li:has-text("${SORU}") button:has-text("Sil")`).first().click();
const onay = await y.locator('button:has-text("Evet, sil")').count();
onay === 1 ? ok(19, "silme onay istiyor") : bad(19, "silme dogrudan yapiliyor");

/* 20) Sil */
await y.locator('button:has-text("Evet, sil")').first().click();
await y.waitForTimeout(2500);
const kalan = await sql`SELECT COUNT(*)::int AS n FROM anketler WHERE id = ${anketId}`;
kalan[0].n === 0 ? ok(20, "anket silindi") : bad(20, "anket silinmedi");

/* 21) Oylari da gitti */
const kalanOy = await sql`SELECT COUNT(*)::int AS n FROM anket_oylari WHERE anket_id = ${anketId}`;
kalanOy[0].n === 0 ? ok(21, "anketin oylari da silindi") : bad(21, `${kalanOy[0].n} oy sahipsiz kaldi`);

/* 22) Ana sayfa varsayilan ankete dondu */
const z3 = await (await tarayici.newContext()).newPage();
await z3.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(z3);
const son = await z3.locator('aside[aria-labelledby="anket-basligi"]').innerText();
son.includes("Genelde ne yemeyi")
  ? ok(22, "ana sayfa varsayilan ankete dondu")
  : bad(22, `varsayilana donmedi: ${son.slice(0, 50)}`);

/* 23) Yonetici olmayan anket olusturamaz */
const yabanci = await (await tarayici.newContext()).newPage();
const cevap = await yabanci.evaluate(async (kok) => {
  const r = await fetch(`${kok}/admin/anket`, { method: "GET", redirect: "manual" });
  return r.status;
}, KOK).catch(() => 0);
cevap === 0 || cevap >= 300
  ? ok(23, "yonetim sayfasi disariya kapali")
  : bad(23, `yonetim sayfasi ${cevap} donuyor`);

/* 24) JS hatasi yok */
jsHatalari.length === 0 ? ok(24, "JS hatasi yok") : bad(24, `JS hatasi: ${jsHatalari[0]}`);

await bitir();
