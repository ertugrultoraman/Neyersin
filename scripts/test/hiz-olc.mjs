/**
 * SAYFA HIZI OLCUMU
 *
 * Her sayfayi iki kez cagirir:
 *   1. istek  — soguk (dev modda o sayfa o an derlenir)
 *   2. istek  — sicak (gercek kullanicinin gordugu sureye daha yakin)
 *
 * Amac tahmin degil OLCUM: hangi sayfa gercekten yavas, once onu gorelim.
 */
const KOK = process.argv[2] ?? "http://localhost:3000";

const YOLLAR = [
  "/",
  "/seflerin-elinden",
  "/isletmeler",
  "/restoranlar",
  "/restoran/gonul-sef",
  "/restoran/anne-sofrasi",
  "/hakkimizda",
  "/nasil-calisir",
  "/hesap/giris",
];

async function olc(yol) {
  const bas = performance.now();
  const cevap = await fetch(KOK + yol, {
    headers: { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" },
  });
  await cevap.arrayBuffer();
  return { ms: Math.round(performance.now() - bas), durum: cevap.status };
}

console.log(`Olculen kok: ${KOK}\n`);
console.log("yol".padEnd(26), "soguk".padStart(8), "sicak".padStart(8), "  durum");
console.log("-".repeat(56));

const sicakSureler = [];
for (const yol of YOLLAR) {
  const soguk = await olc(yol);
  const sicak = await olc(yol);
  sicakSureler.push({ yol, ms: sicak.ms });
  console.log(
    yol.padEnd(26),
    `${soguk.ms}ms`.padStart(8),
    `${sicak.ms}ms`.padStart(8),
    `  ${sicak.durum}`,
  );
}

sicakSureler.sort((a, b) => b.ms - a.ms);
console.log("\nEN YAVAS 3 (sicak):");
for (const s of sicakSureler.slice(0, 3)) console.log(`  ${s.ms}ms  ${s.yol}`);

const ort = Math.round(sicakSureler.reduce((t, s) => t + s.ms, 0) / sicakSureler.length);
console.log(`\nOrtalama (sicak): ${ort}ms`);
