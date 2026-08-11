import fs from "node:fs";
import path from "node:path";

/**
 * SUNUCU EYLEMI KAPSAMI — `"use server"` dosyasindan yalnizca async fonksiyon
 * disari verilebilir mi?
 *
 * NEDEN AYRI BIR TEST: `"use server"` bir modulun HER export'u sunucu eylemi
 * sayiliyor. Oraya konan bir sabit istemci paketinde degerini kaybediyor —
 * dizi olmasi gereken sey bir eylem referansina donusuyor.
 *
 * Bunu hicbir mevcut adim yakalamiyor:
 *   - typecheck: TypeScript gercek modulu goruyor, tip dogru, sessiz gecer.
 *   - next build / lint: derleme temiz biter.
 *   - tam-kontrol: tarayici testi, ama yalnizca ziyaret edilen ekrani gorur.
 *
 * Gercek olay: `KAPATMA_SURELERI` sabiti app/isletme/saat-actions.ts icinde
 * duruyordu. Isletme paneli acilir acilmaz tarayicida
 * `KAPATMA_SURELERI.map is not a function` firlatip sayfayi komple beyaz
 * ekrana dusuruyordu; sunucu tarafi 200 dondugu icin gunlukte de iz yoktu.
 * Sabit lib/calisma-saatleri.ts'e tasindi (iki tarafin da okuyabildigi yer).
 *
 * Bu test tarayici da veritabani da acmiyor: kaynagi okuyor, saniyenin
 * altinda bitiyor.
 */
const KAYNAK = "src";

const cikti = [];
const hatalar = [];
const ok = (m) => cikti.push(`  OK  ${m}`);
const bad = (m) => { hatalar.push(m); cikti.push(`  X   ${m}`); };

/**
 * Izin verilen export bicimleri.
 *
 * `type` ve `interface` derlemede siliniyor, calisma zamaninda export
 * olusturmuyorlar — bu yuzden serbestler.
 */
const IZINLI = [
  /^export\s+async\s+function\s/,
  /^export\s+default\s+async\s+function\s/,
  /^export\s+type\s/,
  /^export\s+interface\s/,
];

const dosyalar = [];
function dosyalariGez(klasor) {
  for (const girdi of fs.readdirSync(klasor, { withFileTypes: true })) {
    const tamYol = path.join(klasor, girdi.name);
    if (girdi.isDirectory()) { dosyalariGez(tamYol); continue; }
    if (/\.(ts|tsx)$/.test(girdi.name)) dosyalar.push(tamYol);
  }
}
dosyalariGez(KAYNAK);

/* Dosyanin BASINDAKI yonerge aranıyor; metin icinde gecen "use server" degil. */
const sunucuDosyalari = dosyalar.filter((y) =>
  /^\s*(?:\/\*[\s\S]*?\*\/\s*)?["']use server["']\s*;/.test(fs.readFileSync(y, "utf8")),
);

if (sunucuDosyalari.length === 0) {
  bad("hic 'use server' dosyasi bulunamadi — tarama bozulmus olabilir");
  console.log(cikti.join("\n"));
  process.exit(1);
}
ok(`${sunucuDosyalari.length} adet "use server" dosyasi tarandi`);

const kusurlar = [];
for (const yol of sunucuDosyalari) {
  const satirlar = fs.readFileSync(yol, "utf8").split("\n");
  satirlar.forEach((satir, i) => {
    if (!/^export\s/.test(satir)) return;
    if (IZINLI.some((k) => k.test(satir))) return;
    kusurlar.push({
      yer: `${yol.replace(/\\/g, "/")}:${i + 1}`,
      satir: satir.trim().slice(0, 90),
    });
  });
}

if (kusurlar.length === 0) {
  ok('"use server" dosyalarinin tamami yalnizca async fonksiyon disari veriyor');
} else {
  bad(`${kusurlar.length} export sunucu eylemi DEGIL — istemcide degerini kaybeder:`);
  for (const k of kusurlar) cikti.push(`        ${k.satir}\n          ←  ${k.yer}`);
  cikti.push("        (sabitleri lib/ altinda, iki tarafin da okudugu bir module tasi)");
}

console.log("\nSUNUCU EYLEMI KAPSAMI\n" + cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
