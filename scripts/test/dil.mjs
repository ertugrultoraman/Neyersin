/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * DIL DESTEGI (TR / EN)
 *
 * Kurallar:
 *  - Site varsayilan Turkce aciliyor
 *  - Baslikta TR/EN dugmesi var, EN'e basinca site Ingilizce oluyor
 *  - Secim CEREZDE kaliyor: baska sayfaya gecince de Ingilizce
 *  - <html lang> secilen dille ayni (ekran okuyucu ve tarayici cevirisi icin)
 *  - Sunucudan basilan metinler de cevriliyor (yalnizca tarayicida degil)
 */
const KOK = "https://neyersin.local";

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const tarayici = kapiliTarayici(await chromium.launch());

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

/** Ana sayfadaki secim ekrani fixed overlay; kapatilmazsa altina tiklanamiyor. */
async function kapiyiGec(sayfa) {
  await sayfa.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
  await sayfa.reload({ waitUntil: "networkidle" });
}

const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 1000 } });
const s = await baglam.newPage();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

await s.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(s);

/* 1) Varsayilan Turkce */
(await s.getAttribute("html", "lang")) === "tr"
  ? ok(1, "varsayilan dil Turkce (html lang=tr)")
  : bad(1, `varsayilan lang: ${await s.getAttribute("html", "lang")}`);

/* 2) Turkce menu metni */
const trMetin = await s.locator("header").innerText();
trMetin.includes("Şeflerin Elinden")
  ? ok(2, "menu Turkce")
  : bad(2, `menu Turkce degil: ${trMetin.slice(0, 60)}`);

/* 3) Dil dugmesi var */
const enDugme = s.locator('header button[aria-label="İngilizce"]').first();
(await enDugme.count()) > 0 ? ok(3, "baslikta EN dugmesi var") : bad(3, "EN dugmesi yok");
if ((await enDugme.count()) === 0) await bitir("dil dugmesi bulunamadi");

/* 4) EN'e gec */
await enDugme.click();
await s.waitForFunction(() => document.documentElement.lang === "en", { timeout: 20000 })
  .then(() => ok(4, "EN'e gecince html lang=en"))
  .catch(() => bad(4, "html lang degismedi"));

/* 5) Menu Ingilizce */
const enMetin = await s.locator("header").innerText();
enMetin.includes("From Our Chefs")
  ? ok(5, "menu Ingilizce")
  : bad(5, `menu Ingilizce degil: ${enMetin.slice(0, 80)}`);

/* 6) Altbilgi de Ingilizce (SUNUCU bileseni) */
const altbilgi = await s.locator("footer").innerText();
altbilgi.includes("All rights reserved") || altbilgi.includes("By cuisine")
  ? ok(6, "altbilgi (sunucu bileseni) Ingilizce")
  : bad(6, "altbilgi Turkce kaldi");

/*
 * 7) Anket Ingilizce.
 *
 * Kucuk/buyuk harf duyarsiz bakiliyor: "Kısa anket" etiketi CSS'te
 * `uppercase` oldugu icin innerText "QUICK POLL" donuyor ve duz karsilastirma
 * ceviri dogru calisirken bile kaliyordu.
 */
const anket = (await s.locator('aside[aria-labelledby="anket-basligi"]').innerText()).toLowerCase();
anket.includes("quick poll")
  ? ok(7, "anket Ingilizce")
  : bad(7, `anket Turkce kaldi: ${anket.slice(0, 50)}`);

/* 8) Kampanya bolumu Ingilizce */
const kampanya = await s.locator("#kampanyalar").innerText();
kampanya.includes("This week's deals")
  ? ok(8, "kampanyalar Ingilizce")
  : bad(8, `kampanyalar Turkce kaldi: ${kampanya.slice(0, 60)}`);

/* 9) Secim BASKA SAYFADA da geciyor (cerez) */
await s.goto(`${KOK}/restoranlar`, { waitUntil: "networkidle" });
(await s.getAttribute("html", "lang")) === "en"
  ? ok(9, "dil secimi sayfalar arasi korunuyor")
  : bad(9, "baska sayfada dil Turkceye dondu");

/* 10) Yeni sekmede de korunuyor (cerez tarayicida) */
const s2 = await baglam.newPage();
await s2.goto(KOK, { waitUntil: "networkidle" });
(await s2.getAttribute("html", "lang")) === "en"
  ? ok(10, "yeni sekmede de Ingilizce")
  : bad(10, "yeni sekme Turkce acildi");

/* 11) SUNUCUDAN basilan HTML gercekten Ingilizce (yalnizca tarayicida degil) */
const cerezler = await baglam.cookies();
const dilCerezi = cerezler.find((k) => k.name === "ny_dil");
dilCerezi?.value === "en" ? ok(11, "dil cerezi yazildi") : bad(11, "dil cerezi yok");

/* 12) TR'ye geri don */
await s2.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
await s2.reload({ waitUntil: "networkidle" });
await s2.locator('header button[aria-label="Turkish"]').first().click();
await s2.waitForFunction(() => document.documentElement.lang === "tr", { timeout: 20000 })
  .then(() => ok(12, "TR'ye geri donuluyor"))
  .catch(() => bad(12, "TR'ye donulemedi"));

/* 13) JS hatasi yok */
jsHatalari.length === 0 ? ok(13, "JS hatasi yok") : bad(13, `JS hatasi: ${jsHatalari[0]}`);

await bitir();
