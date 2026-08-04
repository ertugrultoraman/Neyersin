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

/* ── Siparis akisi Ingilizce mi? (turistin gercekten yurudugu yol) ── */
const e = await (await tarayici.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
e.on("pageerror", (t) => jsHatalari.push(String(t)));

/* Dili EN yap */
await e.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(e);
await e.locator('header button[aria-label="İngilizce"]').first().click();
await e.waitForFunction(() => document.documentElement.lang === "en", { timeout: 20000 });

/* 13) Restoran listesi Ingilizce */
await e.goto(`${KOK}/restoranlar`, { waitUntil: "networkidle" });
const liste = await e.locator("main").innerText();
liste.includes("All restaurants") || liste.includes("Sort")
  ? ok(13, "restoran listesi Ingilizce")
  : bad(13, `restoran listesi Turkce: ${liste.slice(0, 60)}`);

/* 14) Menu sayfasi Ingilizce (bolum basliklari ve urun aciklamalari) */
await e.goto(`${KOK}/restoran/ates-kanat`, { waitUntil: "networkidle" });
const menu = await e.locator("main").innerText();
menu.includes("Wings") ? ok(14, "menu bolum basligi Ingilizce") : bad(14, "bolum basligi Turkce");

/* 15) Urun aciklamasi Ingilizce (icerik verisi) */
menu.includes("House hot sauce") || menu.includes("ranch dip")
  ? ok(15, "urun aciklamasi Ingilizce")
  : bad(15, "urun aciklamasi Turkce kaldi");

/* 16) Sepete ekle dugmesi Ingilizce */
(await e.locator('button:has-text("Add to cart")').count()) > 0
  ? ok(16, "sepete ekle dugmesi Ingilizce")
  : bad(16, "sepete ekle dugmesi Turkce");

/* 17) Sepete ekleyip cekmeceyi ac */
await e.locator('button:has-text("Add to cart")').first().click();
await e.waitForTimeout(1200);
const cekmece = await e.locator("body").innerText();
cekmece.includes("Subtotal") || cekmece.includes("Go to checkout")
  ? ok(17, "sepet cekmecesi Ingilizce")
  : bad(17, "sepet cekmecesi Turkce kaldi");

/* 18) SSS Ingilizce */
await e.goto(KOK, { waitUntil: "networkidle" });
await kapiyiGec(e);
const sss = await e.locator("#sss").innerText();
sss.includes("Which areas does") || sss.toLowerCase().includes("frequently asked")
  ? ok(18, "SSS Ingilizce")
  : bad(18, `SSS Turkce kaldi: ${sss.slice(0, 60)}`);

/* 19) Giris sayfasi Ingilizce */
await e.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
/* Etiketler CSS ile buyuk harfe cevriliyor; duyarsiz karsilastiriliyor. */
const girisMetni = (await e.locator("body").innerText()).toLowerCase();
girisMetni.includes("sign in") && girisMetni.includes("email or username")
  ? ok(19, "giris sayfasi Ingilizce")
  : bad(19, "giris sayfasi Turkce kaldi");

/* 20) SUNUCU hata mesaji da Ingilizce (yanlis parola) */
/* Giris formundaki alan adi "kimlik": e-posta VEYA kullanici adi kabul ediyor. */
/*
 * HER KOSUDA BENZERSIZ adres: sabit adresle tekrar tekrar denendiginde
 * kaba kuvvet kilidi devreye giriyor ve gelen mesaj "cok fazla deneme"
 * oluyordu. Ceviri dogru calisirken bile test kaliyordu.
 */
await e.fill('input[name="kimlik"]', `olmayan-${Date.now()}@example.com`);
await e.fill('input[name="parola"]', "YanlisParola123!");
/*
 * Secici GIRIS FORMUNA baglaniyor: sayfada sepet cekmecesi gibi baska
 * formlar da var ve "ilk submit dugmesi" onlardan birine denk gelebiliyor.
 */
const girisFormu = e.locator('form:has(input[name="kimlik"])');
await girisFormu.locator('button[type="submit"]').click();
/*
 * Sabit sure beklemek yaniltiyordu: sunucu eylemi donmeden govde okunup
 * "ceviri yok" sanilıyordu. Uyarinin kendisi bekleniyor.
 */
await girisFormu.locator('[role="alert"]').first().waitFor({ timeout: 20000 }).catch(() => {});
const hataMetni = await girisFormu.locator('[role="alert"]').first().innerText().catch(() => "");
hataMetni.toLowerCase().includes("incorrect username") ||
hataMetni.toLowerCase().includes("incorrect") ||
hataMetni.toLowerCase().includes("not found") ||
/* Kilit devreye girmisse o mesajin cevrilmis olmasi da gecerli bir sonuc. */
hataMetni.toLowerCase().includes("too many failed attempts")
  ? ok(20, "sunucu hata mesaji Ingilizce")
  : bad(20, `sunucu hatasi Turkce kaldi: ${hataMetni.slice(0, 120).replace(/\n/g, " ")}`);

/* 21) Hakkimizda sayfasi Ingilizce (icerik dosyasindan gelen uzun metinler) */
await e.goto(`${KOK}/hakkimizda`, { waitUntil: "networkidle" });
const hakkinda = await e.locator("main, body").first().innerText();
hakkinda.includes("A plate of food carries") || hakkinda.includes("The decisions we made")
  ? ok(21, "hakkimizda Ingilizce")
  : bad(21, `hakkimizda Turkce kaldi: ${hakkinda.slice(0, 80).replace(/\n/g, " ")}`);

/* 22) Ev Hanimlari sayfasi Ingilizce */
await e.goto(`${KOK}/ev-hanimlari`, { waitUntil: "networkidle" });
const evh = await e.locator("main, body").first().innerText();
evh.includes("Four steps from application") || evh.includes("Your own digital shop")
  ? ok(22, "ev-hanimlari Ingilizce")
  : bad(22, `ev-hanimlari Turkce kaldi: ${evh.slice(0, 80).replace(/\n/g, " ")}`);

/* 23) Nasil calisir sayfasi Ingilizce */
await e.goto(`${KOK}/nasil-calisir`, { waitUntil: "networkidle" });
const nasil = (await e.locator("main, body").first().innerText()).toLowerCase();
nasil.includes("how it works") || nasil.includes("to your door")
  ? ok(23, "nasil-calisir Ingilizce")
  : bad(23, "nasil-calisir Turkce kaldi");

/* 24) JS hatasi yok */
jsHatalari.length === 0 ? ok(24, "JS hatasi yok") : bad(24, `JS hatasi: ${jsHatalari[0]}`);

await bitir();
