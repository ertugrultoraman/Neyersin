/**
 * YATAY TASMA TESHISI
 *
 * Telefon genisliginde hangi sayfa saga kayiyor ve BUNU HANGI OGE yapiyor?
 * Tahmin etmek yerine olcuyoruz: viewport'tan genis her ogeyi etiketiyle
 * birlikte listeler.
 */
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
const GENISLIK = 390; // iPhone 14 genisligi

const HERKESE_ACIK = [
  "/",
  "/restoranlar",
  "/seflerin-elinden",
  "/isletmeler",
  "/restoran/gonul-sef",
  "/hesap/giris",
  "/hesap/kayit",
  "/hesap/sifremi-unuttum",
  "/hesap/basvuru",
  "/nasil-calisir",
  "/hakkimizda",
  "/ev-hanimlari",
  "/iletisim",
];

const YONETICI = [
  "/admin",
  "/admin/hesaplar",
  "/admin/urunler",
  "/admin/fiyatlar",
  "/admin/destek",
  "/admin/dogrulamalar",
  "/admin/yorumlar",
  "/admin/basvurular",
];

const t = kapiliTarayici(await chromium.launch());
const baglam = await t.newContext({ viewport: { width: GENISLIK, height: 844 }, isMobile: true });
const s = await baglam.newPage();

/**
 * Sayfayi GERCEKTEN iten ogeleri bulur.
 *
 * Genis olmak tek basina yetmiyor: kayan duyuru seridi 3964px ama ust
 * kapsayicisi onu kirptigi icin sayfayi itmiyor. Bir ust ogede overflow
 * hidden/auto/scroll varsa o dal atlanmali — yoksa gercek suclu gozden kacar.
 */
async function tasanlar() {
  return s.evaluate((g) => {
    const kirpiliyorMu = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const x = getComputedStyle(p).overflowX;
        if (x === "hidden" || x === "auto" || x === "scroll" || x === "clip") return true;
      }
      return false;
    };

    const sonuc = [];
    for (const el of document.querySelectorAll("body *")) {
      const k = el.getBoundingClientRect();
      if (k.right <= g + 1) continue;
      if (k.width === 0 || k.height === 0) continue;
      const stil = getComputedStyle(el);
      if (stil.overflowX === "auto" || stil.overflowX === "scroll") continue;
      if (kirpiliyorMu(el)) continue;
      sonuc.push({
        etiket: el.tagName.toLowerCase(),
        sinif: (el.className || "").toString().slice(0, 80),
        genislik: Math.round(k.width),
        sag: Math.round(k.right),
        metin: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 45),
      });
    }
    return sonuc.slice(0, 5);
  }, GENISLIK);
}

async function kontrolEt(yol) {
  /*
   * Acilis pop-up'i kapatildiktan sonra sayfa bazen kendini yeniliyor;
   * olcumu o an yaparsak "execution context destroyed" ile patliyordu.
   * Bu yuzden once isaret konuyor, SONRA temiz bir yukleme yapiliyor.
   */
  await s.goto(KOK + yol, { waitUntil: "domcontentloaded" }).catch(() => {});
  await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi")).catch(() => {});
  await s.goto(KOK + yol, { waitUntil: "networkidle" }).catch(() => {});
  await s.waitForTimeout(500);

  const kaydi = await s
    .evaluate((g) => ({ govde: document.documentElement.scrollWidth, viewport: g }), GENISLIK)
    .catch(() => null);
  if (!kaydi) {
    console.log(`  ?   ${yol}  (olculemedi)`);
    return false;
  }
  const tasiyor = kaydi.govde > kaydi.viewport + 1;
  if (!tasiyor) {
    console.log(`  OK  ${yol}`);
    return false;
  }
  console.log(`  X   ${yol}  (sayfa ${kaydi.govde}px, ekran ${kaydi.viewport}px)`);
  for (const o of await tasanlar()) {
    console.log(`         <${o.etiket}> ${o.genislik}px  "${o.metin}"`);
    console.log(`           class: ${o.sinif}`);
  }
  return true;
}

console.log(`=== HERKESE ACIK (${GENISLIK}px) ===`);
let sorunlu = 0;
for (const yol of HERKESE_ACIK) if (await kontrolEt(yol)) sorunlu += 1;

if (PAROLA) {
  await s.goto(`${KOK}/admin/giris`, { waitUntil: "networkidle" });
  await s.fill('input[name="eposta"]', ADMIN);
  await s.fill('input[name="parola"]', PAROLA);
  await s.click('button[type="submit"]');
  await s.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 }).catch(() => {});

  console.log(`\n=== YONETICI (${GENISLIK}px) ===`);
  for (const yol of YONETICI) if (await kontrolEt(yol)) sorunlu += 1;
}

console.log(`\n${sorunlu === 0 ? "TASMA YOK" : `${sorunlu} SAYFA TASIYOR`}`);
await t.close();
