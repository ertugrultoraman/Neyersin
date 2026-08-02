/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";
const KOK = "https://neyersin.local";

/**
 * Yonetici parolasi ORTAM DEGISKENINDEN okunuyor; daha once bu dosyaya duz
 * metin yazilmisti ve depoya girmis oluyordu.
 *
 * Kaba kuvvet kilidi testi bilerek YONETICI E-POSTASI ile yapiliyor.
 * Sinirlayici "kimlik|ip" anahtarina gore calistigi icin, boylece diger test
 * takimlarinin kullandigi "admin" kullanici adi kilitlenmiyor — aksi halde
 * guvenlik testinden sonra 15 dakika boyunca hicbir test yoneticiye giremiyordu.
 */
const PAROLA = process.env.ADMIN_PASSWORD;
const KILIT_KIMLIGI = (process.env.ADMIN_EMAILS ?? "ertugrultoraman@hotmail.com").split(",")[0].trim();
if (!PAROLA) { console.error("ADMIN_PASSWORD tanimli degil."); process.exit(2); }

const cikti = []; const hatalar = [];
const ok = (m) => cikti.push("  OK  " + m);
const bad = (m) => { hatalar.push(m); cikti.push("  X   " + m); };

const t = kapiliTarayici(await chromium.launch());
const s = await (await t.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

// --- 1. Guvenlik basliklari ---
const r = await s.goto(KOK, { waitUntil: "domcontentloaded" });
const b = r.headers();
const beklenen = {
  "content-security-policy": /frame-ancestors 'none'/,
  "strict-transport-security": /max-age=\d+/,
  "x-content-type-options": /nosniff/,
  "x-frame-options": /DENY/,
  "referrer-policy": /strict-origin/,
  "permissions-policy": /camera=\(\)/,
  "cross-origin-opener-policy": /same-origin/,
};
for (const [ad, kalip] of Object.entries(beklenen)) {
  const deger = b[ad];
  deger && kalip.test(deger) ? ok(`${ad}: var`) : bad(`${ad}: ${deger ?? "YOK"}`);
}
b["x-powered-by"] ? bad("x-powered-by sizdiriliyor") : ok("x-powered-by gizli");

// --- 2. CSP siteyi bozmadi mi ---
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));
await s.goto(`${KOK}/restoran/anne-sofrasi`, { waitUntil: "networkidle" });
await s.waitForTimeout(1200);
const gorselSayisi = await s.evaluate(() =>
  [...document.images].filter((g) => g.complete && g.naturalWidth > 0).length);
gorselSayisi > 3 ? ok(`CSP gorselleri engellemiyor (${gorselSayisi} gorsel)`) : bad(`sadece ${gorselSayisi} gorsel yuklendi`);
jsHatalari.length === 0 ? ok("CSP JS'i bozmadi") : bad(`JS: ${jsHatalari.join(" | ")}`);

// --- 3. Kaba kuvvet kilidi ---
const kb = await t.newContext();
const kp = await kb.newPage();
let kilitMesaji = null;
for (let i = 1; i <= 7; i++) {
  await kp.goto(`${KOK}/admin/giris`, { waitUntil: "domcontentloaded" });
  await kp.locator('input[name="eposta"]').fill(KILIT_KIMLIGI);
  await kp.locator('input[name="parola"]').fill(`yanlis-parola-${i}`);
  await kp.locator('button[type="submit"]').first().click();
  await kp.waitForTimeout(1200);
  const metin = await kp.locator("body").innerText();
  const m = metin.match(/Çok fazla başarısız deneme\. \d+ dakika/);
  if (m) { kilitMesaji = `${i}. denemede kilitlendi: "${m[0]}"`; break; }
}
kilitMesaji ? ok(kilitMesaji) : bad("7 yanlis denemeden sonra bile kilitlenmedi");

// Kilitliyken DOGRU parola da girmemeli
await kp.goto(`${KOK}/admin/giris`, { waitUntil: "domcontentloaded" });
await kp.locator('input[name="eposta"]').fill(KILIT_KIMLIGI);
await kp.locator('input[name="parola"]').fill(PAROLA);
await kp.locator('button[type="submit"]').first().click();
await kp.waitForTimeout(1500);
kp.url().includes("/admin/giris")
  ? ok("kilitliyken dogru parola da kabul edilmiyor") : bad("kilit dogru parolayi durdurmuyor");
await kb.close();

// --- 3b. "Ben robot degilim" kapisi ---
// `hamBaglam` bilet yazmaz: gercek bir ilk ziyaretci gibi acilir.
const kapiB = await t.hamBaglam();
const kp2 = await kapiB.newPage();
await kp2.goto(KOK, { waitUntil: "networkidle" });
(await kp2.locator("text=Ben robot değilim").count()) > 0
  ? ok("dogrulanmamis ziyaretciye kapi cikiyor")
  : bad("kapi cikmadi");
(await kp2.locator("header").count()) === 0
  ? ok("kapi acilmadan icerik HTML'e hic basilmiyor")
  : bad("icerik kapi arkasinda da geliyor");

// Kutuyu isaretlemeden gecilemez
await kp2.locator('button[type="submit"]').click({ force: true }).catch(() => {});
await kp2.waitForTimeout(800);
(await kp2.locator("text=Ben robot değilim").count()) > 0
  ? ok("kutu isaretlenmeden gecilemiyor")
  : bad("isaretlemeden gecildi");

// Isaretleyip gecince icerik geliyor
await kp2.check('input[name="insan"]');
await kp2.waitForTimeout(1100);
await kp2.locator('button[type="submit"]').click();
await kp2.waitForTimeout(2500);
(await kp2.locator("header").count()) > 0
  ? ok("dogrulayan ziyaretci siteye giriyor")
  : bad("dogrulamaya ragmen giremedi");

// Arama motoru muaf olmali (yoksa site hicbir aramada cikmaz)
const botB = await t.hamBaglam({
  userAgent:
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
});
const bp = await botB.newPage();
await bp.goto(KOK, { waitUntil: "networkidle" });
(await bp.locator("header").count()) > 0
  ? ok("Googlebot kapiya takilmiyor (SEO korunuyor)")
  : bad("Googlebot kapiya takiliyor — site aramalarda cikmaz");
await botB.close();
await kapiB.close();

// --- 4. Yetkisiz erisim ---
const mb = await t.newContext();
const mp = await mb.newPage();
for (const yol of ["/admin", "/admin/destek", "/admin/yorumlar", "/admin/hesaplar"]) {
  await mp.goto(KOK + yol, { waitUntil: "domcontentloaded" });
  mp.url().includes("/admin/giris")
    ? ok(`${yol} misafire kapali`) : bad(`${yol} ACIK! ${mp.url()}`);
}
await mb.close();

await t.close();
console.log(cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length})` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
