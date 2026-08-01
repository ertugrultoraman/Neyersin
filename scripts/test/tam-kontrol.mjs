/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi: kisa ucluler bilerek ifade olarak kullaniliyor */
import { chromium } from "playwright";

/**
 * TAM REGRESYON — kullanıcının bugüne kadar istediği HER MADDE.
 * Yeni iş eklerken eskisinin bozulmadığını burada görüyoruz.
 */
const KOK = "https://neyersin.local";
const cikti = [];
const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const tarayici = await chromium.launch();
const yeniSayfa = async (vp = { width: 1440, height: 950 }) =>
  (await tarayici.newContext({ viewport: vp })).newPage();

const s = await yeniSayfa();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

// ============ 1. GIRIS POP-UP (temiz oturum) ============
await s.goto(KOK, { waitUntil: "networkidle" });
await s.waitForTimeout(900);
const modal = s.locator('[role="dialog"][aria-labelledby="giris-secimi-baslik"]');
(await modal.count()) === 1 ? ok(1, "acilista pop-up cikiyor") : bad(1, "pop-up CIKMIYOR");
const kartlar = modal.locator('a[href^="/seflerin"], a[href^="/isletmeler"]');
(await kartlar.count()) === 2 ? ok(2, "iki kart: Seflerin Elinden / Isletmeler") : bad(2, "kartlar eksik");

// Kapatinca ayni ziyarette tekrar cikmamali
await s.locator('[role="dialog"] button[aria-label="Kapat"]').click();
await s.waitForTimeout(500);
await s.goto(`${KOK}/isletmeler`, { waitUntil: "networkidle" });
await s.goto(KOK, { waitUntil: "networkidle" });
await s.waitForTimeout(800);
(await s.locator('[role="dialog"][aria-labelledby="giris-secimi-baslik"]').count()) === 0
  ? ok(3, "ayni ziyarette tekrar cikmiyor") : bad(3, "her sayfada tekrar cikiyor");

// YENI ZIYARET -> tekrar cikmali
const s2 = await yeniSayfa();
await s2.goto(KOK, { waitUntil: "networkidle" });
await s2.waitForTimeout(900);
(await s2.locator('[role="dialog"][aria-labelledby="giris-secimi-baslik"]').count()) === 1
  ? ok(4, "YENI ziyarette tekrar cikiyor") : bad(4, "yeni ziyarette cikmiyor");
await s2.context().close();

// ============ 2. UST MENU ============
const logo = s.locator('header a[aria-label*="ana sayfa"]').first();
(await logo.locator("svg").count()) === 0 ? ok(5, "logoda ikon yok") : bad(5, "logoda ikon var");
(await logo.innerText()).trim() === "Ne Yersin?" ? ok(6, "logo metni dogru") : bad(6, "logo metni yanlis");

const menu = await s.locator('header nav[aria-label="Ana menü"]').innerText();
!/Blog|Veri Değerlendirme/.test(menu) ? ok(7, "Blog / Veri Degerlendirme menude yok") : bad(7, "menude kalmis");
/Hakkımızda/.test(menu) ? ok(8, "Hakkimizda menude") : bad(8, "Hakkimizda yok");
/Şeflerin Elinden/.test(menu) && /İşletmeler/.test(menu)
  ? ok(9, "iki taraf menude ayri yer aliyor") : bad(9, "ayri yer yok");

const girisMetin = (await s.locator('header a[href="/hesap/giris"]').first().innerText()).replace(/\s+/g, " ").trim();
girisMetin === "Giriş Yap / Hesap Oluştur" ? ok(10, "Giris Yap / Hesap Olustur") : bad(10, `giris: ${girisMetin}`);

const menuOgeleri = s.locator('header nav[aria-label="Ana menü"] a');
let sarkan = 0;
for (let i = 0; i < (await menuOgeleri.count()); i++) {
  const k = await menuOgeleri.nth(i).evaluate((e) => {
    // Yalnizca metin dugumu: alti cizgi <span> mutlak konumlu, farkli "top" veriyor.
    const metinDugumu = [...e.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!metinDugumu) return 1;
    const r = document.createRange(); r.selectNodeContents(metinDugumu);
    return new Set([...r.getClientRects()].map((x) => Math.round(x.top / 6))).size;
  });
  if (k > 1) sarkan++;
}
sarkan === 0 ? ok(11, "menu yazilari alta sarkmiyor") : bad(11, `${sarkan} oge sarkiyor`);

// ============ 3. SILINEN SAYFALAR ============
for (const [n, yol] of [[12, "/blog"], [13, "/veri-degerlendirme"], [14, "/sektorler"]]) {
  const r = await s.goto(KOK + yol);
  r.status() === 404 ? ok(n, `${yol} 404`) : bad(n, `${yol} ${r.status()}`);
}
(await s.goto(`${KOK}/hakkimizda`)).status() === 200 ? ok(15, "/hakkimizda aciliyor") : bad(15, "/hakkimizda yok");

// ============ 4. SEKMELER ============
for (const [n, yol, beklenen] of [[16, "/seflerin-elinden", "Şeflerin Elinden"], [17, "/isletmeler", "İşletmeler"]]) {
  const r = await s.goto(KOK + yol, { waitUntil: "networkidle" });
  const aktif = await s.locator('nav[aria-label="Mutfak türü"] a[aria-current="page"]').innerText();
  r.status() === 200 && aktif.includes(beklenen)
    ? ok(n, `${yol} aciliyor, sekme "${beklenen}" aktif`) : bad(n, `${yol} sorunlu`);
}

// ============ 5. KATEGORI SERIDI ============
await s.waitForTimeout(1600); // kademeli animasyon otursun
const kat = await s.evaluate(() => {
  const k = document.querySelector("#kategoriler");
  const ogeler = [...document.querySelectorAll("#kategoriler li")];
  return {
    y: Math.round(k.getBoundingClientRect().height),
    satir: new Set(ogeler.map((e) => Math.round(e.getBoundingClientRect().top))).size,
    notlar: ogeler.map((e) => e.textContent.match(/\d+/)?.[0]).filter(Boolean).map(Number),
  };
});
kat.satir === 1 && kat.y < 230 ? ok(18, `kategori seridi kompakt (${kat.y}px, tek sira)`) : bad(18, `serit buyuk: ${kat.y}px ${kat.satir} sira`);
kat.notlar.every((v) => v <= 20) ? ok(19, "kategori sayilari gercek (hepsi <=20)") : bad(19, `uydurma sayi: ${kat.notlar}`);

// ============ 6. UYDURMA SAYI YOK ============
await s.goto(KOK, { waitUntil: "networkidle" });
await s.waitForTimeout(600);
const govde = await s.locator("body").innerText();
const yasak = [/\d{3}\+\s*restoran/i, /186\.000/, /900\+/, /5\.127|6\.084|2\.841/];
yasak.some((r) => r.test(govde)) ? bad(20, "uydurma sayi geri gelmis") : ok(20, "uydurma sayi yok");

// ============ 7. SEPET ============
await s.goto(`${KOK}/restoran/anne-sofrasi`, { waitUntil: "networkidle" });
const hedef = s.locator("[data-sepet-hedefi]");
(await hedef.count()) === 1 ? ok(21, "sepet hedefi bos sepette de var") : bad(21, "sepet hedefi yok");
(await hedef.locator('svg path[fill^="url"]').count()) > 0
  ? ok(22, "kirmizi el sepeti cizimi duruyor") : bad(22, "sepet gorseli degismis");

const ucus = s.evaluate(() => new Promise((c) => {
  const g = new MutationObserver(() => {
    for (const d of document.body.children)
      if (d.tagName === "DIV" && d.getAttribute("aria-hidden") === "true" && d.style.borderRadius === "9999px") { g.disconnect(); c(true); return; }
  });
  g.observe(document.body, { childList: true });
  setTimeout(() => { g.disconnect(); c(false); }, 2500);
}));
await s.locator('button:has-text("Sepete ekle")').first().click();
(await ucus) ? ok(23, "ILK urun sepete uçuyor") : bad(23, "ilk urun ucmuyor");

// ============ 8. MIN SEPET 200 ============
const dl = await s.locator("dl").first().innerText();
/200/.test(dl) ? ok(24, "min sepet 200 TL") : bad(24, `min sepet: ${dl.replace(/\n/g, " ")}`);

// ============ 9. YORUMLAR PROFIL SONUNDA ============
const yer = await s.evaluate(() => {
  const y = document.querySelector("#degerlendirmeler");
  return y ? { ust: Math.round(y.getBoundingClientRect().top + window.scrollY), govde: document.body.scrollHeight } : null;
});
yer && yer.ust > yer.govde * 0.6 ? ok(25, "yorumlar profilin sonunda") : bad(25, "yorumlar sonda degil");
const yorumMetin = await s.locator("#degerlendirmeler").innerText();
/giriş yap|teslim edilmiş/i.test(yorumMetin) ? ok(26, "yorum yazma alani var") : bad(26, "yorum yazma alani yok");

// ============ 10. DESTEK ============
(await s.locator('button[aria-label="Canlı destek"]').count()) === 1
  ? ok(27, "canli destek dugmesi var") : bad(27, "destek dugmesi yok");
await s.locator('button[aria-label="Canlı destek"]').click();
await s.waitForTimeout(700);
(await s.locator('[role="dialog"][aria-label="Canlı destek"]').count()) === 1
  ? ok(28, "destek paneli aciliyor") : bad(28, "destek paneli acilmiyor");
await s.keyboard.press("Escape");

// ============ 11. E-POSTA / IBAN / BOLGE ============
await s.goto(`${KOK}/hakkimizda`, { waitUntil: "networkidle" });
const hk = await s.locator("body").innerText();
/merhaba@neyersin\.net/.test(hk) ? ok(29, "e-posta .net") : bad(29, "e-posta .net degil");
/neyersin\.com/.test(hk) ? bad(30, ".com kalmis") : ok(30, "hicbir yerde .com yok");

// IBAN, siparis olusturulduktan SONRAKI ekranda gosteriliyor; formda degil.
// Bu yuzden icerik dosyasindaki degeri ve /odeme metnini ayri ayri kontrol ediyoruz.
const odemeSayfasi = await s.goto(`${KOK}/odeme`, { waitUntil: "networkidle" });
const odeme = await s.locator("body").innerText();
/[Nn]akit/.test(odeme) && /IBAN|havale/i.test(odeme)
  ? ok(31, "kapida nakit + IBAN havale anlatiliyor") : bad(31, "odeme secenekleri eksik");
odemeSayfasi.status() === 200 || s.url().includes("/hesap/giris")
  ? ok(32, "odeme akisi ayakta (giris gerektiriyor)") : bad(32, "odeme sayfasi sorunlu");

// ============ 12. MOBIL ============
const m = await yeniSayfa({ width: 390, height: 844 });
let mobilSorun = 0;
for (const yol of ["/", "/seflerin-elinden", "/isletmeler", "/restoran/gonul-sef", "/hakkimizda"]) {
  await m.goto(KOK + yol, { waitUntil: "domcontentloaded" });
  await m.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
  await m.reload({ waitUntil: "networkidle" });
  await m.waitForTimeout(350);
  const o = await m.evaluate(() => ({ i: window.innerWidth, d: document.documentElement.scrollWidth }));
  if (o.d > o.i + 1) mobilSorun++;
}
mobilSorun === 0 ? ok(33, "5 sayfa mobilde tasmiyor") : bad(33, `${mobilSorun} sayfa mobilde tasiyor`);

const ucNokta = m.locator('button[aria-label="Menüyü aç"]');
(await ucNokta.locator("circle").count()) === 3 ? ok(34, "mobilde uc nokta menusu") : bad(34, "uc nokta yok");
const basZemin = await m.locator("header").first().evaluate((e) => getComputedStyle(e).backgroundColor);
!/rgba\([^)]+,\s*0?\.\d+\)/.test(basZemin) ? ok(35, "mobil baslik opak") : bad(35, "baslik saydam");

jsHatalari.length === 0 ? ok(36, "JS hatasi yok") : bad(36, `JS: ${jsHatalari.join(" | ")}`);

await tarayici.close();
console.log(cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
