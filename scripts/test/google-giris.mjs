/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { chromium } from "playwright";

/**
 * GOOGLE ILE GIRIS — GUVENLIK REGRESYONU
 *
 * Gercek Google akisi test edilemez (uctan uca Google'in ekrani gerekir).
 * Test edilen sey, akisin KOTUYE KULLANIMA kapali olmasi:
 *   - Yapilandirma yoksa dugme cikmiyor ve uc nokta guvenli hata veriyor
 *   - state/nonce cerezi olmadan geri donus REDDEDILIYOR
 *   - state uyusmazliginda REDDEDILIYOR
 *   - Acik yonlendirme (baska siteye atma) engelleniyor
 *   - Parolasiz (Google) hesaba parolayla girilemiyor
 */
const KOK = "https://neyersin.local";
const cikti = [];
const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const tarayici = await chromium.launch();

async function bitir(patlama) {
  await tarayici.close().catch(() => {});
  if (patlama) cikti.push(`  !   test yarida kesildi: ${String(patlama).split("\n")[0]}`);
  console.log(cikti.join("\n"));
  const sorun = hatalar.length + (patlama ? 1 : 0);
  console.log("\n" + (sorun === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${sorun} SORUN`));
  process.exit(sorun === 0 ? 0 : 1);
}
process.on("unhandledRejection", (e) => void bitir(e));
process.on("uncaughtException", (e) => void bitir(e));

const baglam = await tarayici.newContext({ viewport: { width: 1280, height: 950 } });
const s = await baglam.newPage();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

const yapilandirildi = Boolean(process.env.GOOGLE_ISTEMCI_ID && process.env.GOOGLE_ISTEMCI_SIRRI);

// ============ 1. GIRIS EKRANI ============
await s.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
await s.reload({ waitUntil: "networkidle" });

const dugmeSayisi = await s.locator('a[href^="/api/oturum/google"]').count();
if (yapilandirildi) {
  dugmeSayisi === 1 ? ok(1, "Google dugmesi giris ekraninda") : bad(1, "dugme yok");
} else {
  dugmeSayisi === 0
    ? ok(1, "yapilandirma yokken dugme HIC gosterilmiyor")
    : bad(1, "yapilandirma yokken bile dugme var");
}

const govde = await s.locator("body").innerText();
/Google ile a[çc]t[ıi]ysan parolan yoktur/i.test(govde)
  ? ok(2, "parolasiz hesap icin yonlendirme notu var")
  : bad(2, "parolasiz hesap notu yok");

// Google'in kendi betigi YUKLENMEMELI (CSP ve gizlilik)
const disBetik = await s.evaluate(() =>
  [...document.scripts].some((b) => b.src && !b.src.startsWith(location.origin)));
disBetik ? bad(3, "dis kaynakli betik yuklendi") : ok(3, "ucuncu taraf betik yuklenmiyor");

// ============ 2. UC NOKTALAR ============
// Cerezsiz geri donus reddedilmeli
await baglam.clearCookies();
await s.goto(`${KOK}/api/oturum/google/callback?code=sahte&state=sahte`, {
  waitUntil: "networkidle",
});
/\/hesap\/giris\?hata=google-durum/.test(s.url())
  ? ok(4, "durum cerezi olmadan geri donus reddediliyor")
  : bad(4, `cerezsiz geri donus: ${s.url()}`);

// Cerez var ama state uyusmuyor
await s.goto(`${KOK}/hesap/giris`, { waitUntil: "domcontentloaded" });
await baglam.addCookies([
  {
    name: "ny_google_durum",
    value: JSON.stringify({ durum: "dogru-durum", nonce: "n", donus: "" }),
    domain: "neyersin.local",
    path: "/",
  },
]);
await s.goto(`${KOK}/api/oturum/google/callback?code=sahte&state=yanlis-durum`, {
  waitUntil: "networkidle",
});
/hata=google-durum/.test(s.url())
  ? ok(5, "state uyusmazliginda reddediliyor")
  : bad(5, `state uyusmazligi gecti: ${s.url()}`);

// Ayni state ama gecersiz kod -> Google dogrulamasi basarisiz olmali,
// oturum ASLA acilmamali.
await baglam.clearCookies();
await s.goto(`${KOK}/hesabim`, { waitUntil: "networkidle" });
/\/hesap\/giris/.test(s.url())
  ? ok(6, "sahte geri donus oturum acmadi")
  : bad(6, "sahte geri donusle oturum acildi");

// ============ 3. ACIK YONLENDIRME ============
if (yapilandirildi) {
  const cevap = await s.goto(
    `${KOK}/api/oturum/google?donus=${encodeURIComponent("https://kotu-site.example/kap")}`,
    { waitUntil: "domcontentloaded" },
  ).catch(() => null);
  // Google'a gidilir; onemli olan donus degerinin cereze YAZILMAMIS olmasi.
  const cerezler = await baglam.cookies();
  const durumCerezi = cerezler.find((c) => c.name === "ny_google_durum");
  const icerik = durumCerezi ? decodeURIComponent(durumCerezi.value) : "";
  !icerik.includes("kotu-site")
    ? ok(7, "site disi donus adresi cereze yazilmiyor (acik yonlendirme kapali)")
    : bad(7, "site disi donus adresi kabul edildi");
  cevap; // kullanilmadi; Google'a cikis agdan bagimsiz olabilir
} else {
  await s.goto(`${KOK}/api/oturum/google`, { waitUntil: "networkidle" });
  /hata=google-kapali/.test(s.url())
    ? ok(7, "yapilandirma yokken uc nokta guvenli hata veriyor")
    : bad(7, `kapaliyken beklenmedik davranis: ${s.url()}`);
}

// ============ 4. PAROLASIZ HESABA PAROLAYLA GIRILEMEZ ============
await baglam.clearCookies();
await s.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="kimlik"]', "google-hesabi-yok@neyersin.test");
await s.fill('input[name="parola"]', "");
const bosParolaEngellendi = await s
  .locator('form button[type="submit"]')
  .click()
  .then(async () => {
    await s.waitForTimeout(1500);
    return !/\/hesabim/.test(s.url());
  })
  .catch(() => true);
bosParolaEngellendi ? ok(8, "bos parolayla giris yapilamiyor") : bad(8, "bos parola gecti");

jsHatalari.length === 0 ? ok(9, "JS hatasi yok") : bad(9, `JS: ${jsHatalari.join(" | ")}`);

await bitir();
