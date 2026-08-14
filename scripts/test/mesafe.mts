/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { havadanKm, MUTFAK_KONUMU, siparisMesafesiKm } from "../../src/lib/mesafe";

/**
 * TESLİMAT MESAFESİ — kuryeye gösterilen km'nin testi.
 *
 * NEDEN AYRI TEST: bu sayı kuryenin iş kabul etme kararını etkiliyor ve
 * yanlışlığı hiçbir yerde hata vermez — yalnızca yanlış bir rakam gösterir.
 * En kırılgan yer mahalle adının normalleştirilmesi: müşteri "Marmara",
 * "Marmara Mah." ya da "MARMARA MAHALLESİ" yazabiliyor ve üçü de aynı yere
 * düşmezse teklifin bazısında km görünür, bazısında görünmez.
 *
 *   npx tsx scripts/test/mesafe.mts
 */

const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (m: string) => cikti.push(`  OK  ${m}`);
const bad = (m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${m}`);
};

/* --- 1. Aynı nokta sıfır km --- */
havadanKm(MUTFAK_KONUMU, MUTFAK_KONUMU) === 0
  ? ok("ayni nokta 0 km")
  : bad("ayni nokta 0 km olmali");

/* --- 2. Mahalle yazımının her hâli aynı sayıyı vermeli --- */
const yazimlar = ["Marmara", "Marmara Mah.", "MARMARA MAHALLESİ", "  marmara mahalle  "];
const sonuclar = yazimlar.map((m) => siparisMesafesiKm({ ilce: "Beylikdüzü", mahalle: m }));
if (sonuclar.every((s) => s !== null && s === sonuclar[0])) {
  ok(`mahalle yazimi fark etmiyor (${yazimlar.length} yazim -> ${sonuclar[0]} km)`);
} else {
  bad(`mahalle yazimlari ayri sonuc verdi: ${JSON.stringify(sonuclar)}`);
}

/* --- 3. Türkçe harfler --- */
for (const mahalle of ["Gürpınar", "Dereağzı", "Büyükşehir", "Barış", "Yakuplu", "Kavaklı"]) {
  const km = siparisMesafesiKm({ ilce: "Beylikdüzü", mahalle });
  km !== null ? ok(`${mahalle} taniniyor (${km} km)`) : bad(`${mahalle} taninmadi`);
}

/* --- 4. Tanınmayan mahalle: uydurma sayı yerine null --- */
siparisMesafesiKm({ ilce: "Beylikdüzü", mahalle: "Olmayan Mahalle" }) === null
  ? ok("bilinmeyen mahalle null donuyor")
  : bad("bilinmeyen mahallede sayi uretilmis");

/* --- 5. Teslimat bölgesi dışı --- */
siparisMesafesiKm({ ilce: "Kadıköy", mahalle: "Marmara" }) === null
  ? ok("bolge disi ilce null donuyor")
  : bad("bolge disi ilce icin mesafe uretilmis");

/* --- 6. Beylikdüzü içi mesafeler makul bantta --- */
const hepsi = ["Gürpınar", "Dereağzı", "Büyükşehir", "Kavaklı", "Adnan Kahveci", "Cumhuriyet",
  "Barış", "Marmara", "Sahil", "Yakuplu"]
  .map((m) => siparisMesafesiKm({ ilce: "Beylikdüzü", mahalle: m }))
  .filter((k): k is number => k !== null);

hepsi.length === 10 ? ok("10 mahallenin hepsi tanimli") : bad(`${hepsi.length} mahalle tanindi, 10 olmali`);
hepsi.every((k) => k >= 0.8 && k <= 8)
  ? ok(`tum mesafeler 0,8-8 km bandinda (en uzak ${Math.max(...hepsi)} km)`)
  : bad(`bant disi mesafe var: ${JSON.stringify(hepsi)}`);

/* --- 7. Tek ondalık --- */
hepsi.every((k) => Math.round(k * 10) === k * 10)
  ? ok("mesafeler tek ondalikli")
  : bad(`ondalik fazlasi var: ${JSON.stringify(hepsi)}`);

console.log(cikti.join("\n"));
console.log(
  "\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`),
);
process.exit(hatalar.length === 0 ? 0 : 1);
