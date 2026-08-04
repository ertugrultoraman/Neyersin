/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * DIL KAPSAMI — Ingilizce sayfada Turkce metin KALMAMALI.
 *
 * Neden ayri bir test: dil.mjs tek tek kontrol ettigim yerleri dogruluyor,
 * yani "baktigim yer cevrilmis mi" diyor. Bu test tam tersini soruyor:
 * "bakmadigim bir yer Turkce kalmis mi". Canliya alindiktan sonra 83 satir
 * Turkce metin bu yuzden gozden kacmisti.
 *
 * Ozel adlar (ilce, marka, Turkce yemek adlari) beyaz listede — onlarin
 * cevrilmemesi dogru davranis.
 */
const KOK = "https://neyersin.local";
const TR = /[çğıöşüÇĞİÖŞÜ]/;
const BEYAZ =
  /Beylikdüzü|İstanbul|Ne Yersin|Şef |Gönül|Makbule|Ateş|Kırmızı|Anne Sofrası|Burger Atölyesi|Döner Vadisi|Tatlı Kaçamak|Çekirdek|Deniz Kenarı|Yeşil Kase|Kars|Pide Ustası|Baharat Yolu|Sabah Simit|Gece Lezzetleri|Hızlı Market|Kadıköy|Beşiktaş|Ataşehir|Üsküdar|Arnavutköy|Avcılar|Bağcılar|Bahçelievler|Bakırköy|Başakşehir|Bayrampaşa|Beykoz|Beyoğlu|Büyükçekmece|Çatalca|Çekmeköy|Esenler|Esenyurt|Eyüpsultan|Fatih|Gaziosmanpaşa|Güngören|Kağıthane|Kartal|Küçükçekmece|Maltepe|Pendik|Sancaktepe|Sarıyer|Silivri|Sultanbeyli|Sultangazi|Şile|Şişli|Tuzla|Ümraniye|Zeytinburnu|Adalar|Çiğ Börek|Künefe|Mantı|Poğaça|Açma|İçli|Böreği|Güllaç|Tarhana|Şalgam|Ayvalık|Menemen|Sütlaç|Baklava|Adana|Karnıyarık|İskender|Lahmacun|Ezogelin|Haydari|Mücver|Fava|Girit|Ayran|Kaşarlı|Sucuklu|Kıymalı|Kuşbaşılı|Simit|Su Böreği|Sigara Böreği|Kazandibi|Çorbası|Dürüm|Şiş|Kanat|Baget|Tabak|Patates|Salata|Limonata|Turşu|Reçel|Erişte|Yoğurt|Tereyağı|Salçası|Hamburger|Fasulye|Kola/;

const YOLLAR = [
  "/", "/restoranlar", "/restoran/ates-kanat", "/hakkimizda", "/ev-hanimlari",
  "/nasil-calisir", "/hesap/giris", "/hesap/kayit", "/iletisim", "/ekranlar",
  "/isletmeler", "/seflerin-elinden",
];

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

const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 1200 } });
await baglam.addCookies([{ name: "ny_dil", value: "en", url: KOK }]);
const s = await baglam.newPage();

let no = 0;
for (const yol of YOLLAR) {
  no += 1;
  await s.goto(KOK + yol, { waitUntil: "networkidle" }).catch(() => {});
  await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi")).catch(() => {});
  const metin = await s.locator("body").innerText().catch(() => "");
  if (!metin) { bad(no, `${yol} acilmadi`); continue; }
  const kalan = [...new Set(
    metin.split("\n").map((x) => x.trim())/* Tek harf: profil avatarindaki bas harf ("Ş") — ozel ad, cevrilmez. */
    .filter((x) => x.length > 1 && TR.test(x) && !BEYAZ.test(x)),
  )];
  kalan.length === 0
    ? ok(no, `${yol} tamamen Ingilizce`)
    : bad(no, `${yol}: ${kalan.length} Turkce satir — ilki: ${kalan[0].slice(0, 60)}`);
}

await bitir();
