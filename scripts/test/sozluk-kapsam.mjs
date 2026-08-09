/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi: kisa ucluler bilerek ifade olarak kullaniliyor */
import fs from "node:fs";
import path from "node:path";

/**
 * SOZLUK KAPSAMI — kullanilan her anahtarin karsiligi var mi?
 *
 * NEDEN AYRI BIR TEST: `ceviri()` bulamadigi anahtari OLDUGU GIBI donduruyor
 * (bkz. lib/sozluk.ts). Yani karsiligi yazilmamis bir anahtar sayfayi
 * patlatmiyor, sessizce ekrana "altinSef.baslik" yaziyor.
 *
 * Bunu ne typecheck ne de dil-kapsam yakaliyor:
 *   - typecheck: anahtar `string` tipinde, her metin gecerli.
 *   - dil-kapsam: Ingilizce sayfada TURKCE metin ariyor. "altinSef.baslik"
 *     duz ASCII oldugu icin cevrilmis sanip gecti — Altin Sef sayfasinin
 *     11 anahtari bu yuzden aylarca eksik kaldi.
 *
 * Bu test tarayici da veritabani da acmiyor: kaynagi okuyup karsilastiriyor,
 * saniyenin altinda bitiyor. Yeni bir metin eklerken Ingilizcesini unutmak
 * artik derlemeden once burada goruluyor.
 */
const KAYNAK = "src";
const SOZLUK = "src/lib/sozluk.ts";

const cikti = [];
const hatalar = [];
const ok = (m) => cikti.push(`  OK  ${m}`);
const bad = (m) => { hatalar.push(m); cikti.push(`  X   ${m}`); };

/* ── 1. Sozlukte TANIMLI anahtarlar ── */
const sozlukKaynagi = fs.readFileSync(SOZLUK, "utf8");

/*
 * Anahtarlar tek bir nesne sabitinde, iki bosluk girintiyle duruyor. Nesneyi
 * `import` edip Object.keys demek daha saglam olurdu ama dosya TypeScript;
 * test icin ayri bir derleme adimi acmaya degmiyor.
 */
const tanimli = new Set();
const tekrarli = [];
for (const eslesme of sozlukKaynagi.matchAll(/^ {2}"([^"]+)":\s*\{/gm)) {
  const anahtar = eslesme[1];
  /* Ayni anahtar iki kez yazilirsa JS sessizce SONUNCUYU tutuyor. */
  if (tanimli.has(anahtar)) tekrarli.push(anahtar);
  tanimli.add(anahtar);
}

if (tanimli.size < 100) {
  bad(`sozluk okunamadi — yalnizca ${tanimli.size} anahtar bulundu, bicim degismis olabilir`);
  console.log(cikti.join("\n"));
  process.exit(1);
}
ok(`sozlukte ${tanimli.size} anahtar tanimli`);

tekrarli.length === 0
  ? ok("tekrar eden anahtar yok")
  : bad(`${tekrarli.length} anahtar iki kez yazilmis (ilki olu): ${tekrarli.join(", ")}`);

/* ── 2. Her anahtarin hem tr hem en karsiligi olmali ── */
const eksikDil = [];
for (const eslesme of sozlukKaynagi.matchAll(/^ {2}"([^"]+)":\s*\{([\s\S]*?)\n? {2}\},?$/gm)) {
  const [, anahtar, govde] = eslesme;
  const trVar = /\btr:\s*["'`]\s*\S/.test(govde);
  const enVar = /\ben:\s*["'`]\s*\S/.test(govde);
  if (!trVar || !enVar) eksikDil.push(`${anahtar} (${!trVar ? "tr" : "en"} bos)`);
}
eksikDil.length === 0
  ? ok("her anahtarin tr ve en karsiligi dolu")
  : bad(`${eksikDil.length} anahtarda dil eksik: ${eksikDil.slice(0, 5).join(", ")}`);

/* ── 3. Kaynakta KULLANILAN anahtarlar ── */

/**
 * Cagri icindeki dizge sabitleri: `c("x.y")`, `hataMetni("x.y")` ve
 * `ceviri(await aktifDil())("x.y")` bicimindeki zincirli cagri.
 *
 * Yalnizca `ad.parca` kalibina uyanlara bakiliyor; yol ("/panel"), MIME turu
 * ve dosya adlari bu kalibin disinda kaliyor.
 */
const CAGRI = /(?:\b[a-zA-Z_$][\w$]*|\))\(\s*["']([a-zA-Z][\w]*\.[\w]+)["']/g;

/**
 * Anahtara BENZEYEN ama anahtar olmayan dizgeler.
 *
 * Listeye eklerken dikkat: buraya giren gercek bir eksigi de gizler. Yalnizca
 * kalibi tesadufen tutturan cagrilar yaziliyor.
 */
const YOKSAY = new Set(["process.env", "node.js"]);

/* Sozlugun kendisi taranmiyor: icindeki dizgeler tanim, kullanim degil. */
const sozlukTamYol = path.resolve(SOZLUK);

const kullanim = new Map(); // anahtar -> ilk gorulen yer

function dosyalariGez(klasor) {
  for (const girdi of fs.readdirSync(klasor, { withFileTypes: true })) {
    const tamYol = path.join(klasor, girdi.name);
    if (girdi.isDirectory()) { dosyalariGez(tamYol); continue; }
    if (!/\.(ts|tsx)$/.test(girdi.name)) continue;
    if (path.resolve(tamYol) === sozlukTamYol) continue;

    const icerik = fs.readFileSync(tamYol, "utf8");
    for (const eslesme of icerik.matchAll(CAGRI)) {
      const anahtar = eslesme[1];
      if (YOKSAY.has(anahtar)) continue;
      if (!kullanim.has(anahtar)) {
        const satir = icerik.slice(0, eslesme.index).split("\n").length;
        kullanim.set(anahtar, `${tamYol.replace(/\\/g, "/")}:${satir}`);
      }
    }
  }
}
dosyalariGez(KAYNAK);

ok(`kaynakta ${kullanim.size} anahtar kullanimi tarandi`);

/* ── 4. Kullanilip tanimlanmamis olanlar ── */
const eksik = [...kullanim].filter(([anahtar]) => !tanimli.has(anahtar));

if (eksik.length === 0) {
  ok("kullanilan her anahtarin karsiligi var");
} else {
  bad(`${eksik.length} anahtarin sozlukte karsiligi YOK — ekranda anahtar adi gorunur:`);
  for (const [anahtar, yer] of eksik) cikti.push(`        ${anahtar}  ←  ${yer}`);
}

console.log(cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
