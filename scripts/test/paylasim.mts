import { KADEMELER, siparisPaylasimi } from "../../src/lib/kurye-tarife";

/**
 * SİPARİŞ PAYLAŞIMI — para hesabının testi.
 *
 * NEDEN AYRI TEST: buradaki hata sessizdir. Yanlış bir oran ya da bir kuruş
 * kayması hiçbir yerde hata vermez, yalnızca yanlış para dağıtır — ve ay
 * sonunda mutabakat tutmadığında fark edilir. Üstelik kurye teklifte gördüğü
 * rakamı hakedişinde bulamazsa güven biter.
 *
 *   npx tsx scripts/test/paylasim.mts
 */

const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (m: string) => cikti.push(`  OK  ${m}`);
const bad = (m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${m}`);
};

const yakin = (a: number, b: number) => Math.abs(a - b) < 0.005;

/* --- 1. Oranlar her kademede tam %100 mü? --- */
for (const k of KADEMELER) {
  const toplam = k.kurye + k.platform + k.satici;
  if (yakin(toplam, 1)) ok(`kademe <${k.ustSinir}: oranlar toplami %100`);
  else bad(`kademe <${k.ustSinir}: oranlar toplami ${(toplam * 100).toFixed(2)}% (100 olmali)`);
}

/* --- 2. Kademe sınırları --- */
const kademeSinavi = [
  { taban: 255, beklenen: 0.25, ad: "225-400 arasi" },
  { taban: 399.99, beklenen: 0.25, ad: "400'un hemen altinda" },
  { taban: 400, beklenen: 0.18, ad: "tam 400 (ust kademeye ait)" },
  { taban: 649.99, beklenen: 0.18, ad: "650'nin hemen altinda" },
  { taban: 650, beklenen: 0.15, ad: "tam 650 (ust kademeye ait)" },
  { taban: 5000, beklenen: 0.15, ad: "cok yuksek tutar" },
];
for (const s of kademeSinavi) {
  const p = siparisPaylasimi({ araToplam: s.taban, teslimatUcreti: 0, indirim: 0 });
  if (yakin(p.oranlar.kurye, s.beklenen)) ok(`${s.ad}: kurye orani %${s.beklenen * 100}`);
  else bad(`${s.ad}: kurye orani %${p.oranlar.kurye * 100}, beklenen %${s.beklenen * 100}`);
}

/* --- 3. Teslimat ücreti havuza giriyor mu? --- */
{
  const p = siparisPaylasimi({ araToplam: 300, teslimatUcreti: 30, indirim: 0 });
  if (yakin(p.taban, 330)) ok("teslimat ucreti havuza dahil (300+30=330)");
  else bad(`havuz ${p.taban}, beklenen 330`);
  if (yakin(p.kurye, 82.5)) ok("330 TL'nin %25'i kuryeye: 82,50");
  else bad(`kurye ${p.kurye}, beklenen 82.50`);
  if (yakin(p.platform, 33)) ok("330 TL'nin %10'u platforma: 33,00");
  else bad(`platform ${p.platform}, beklenen 33.00`);
  if (yakin(p.satici, 214.5)) ok("kalan saticiya: 214,50");
  else bad(`satici ${p.satici}, beklenen 214.50`);
}

/* --- 4. Kupon üçe bölünüp herkesten düşüyor mu? --- */
{
  const p = siparisPaylasimi({ araToplam: 300, teslimatUcreti: 30, indirim: 60 });
  if (yakin(p.kisiBasiIndirim, 20)) ok("60 TL kupon kisi basi 20 TL");
  else bad(`kisi basi ${p.kisiBasiIndirim}, beklenen 20`);
  if (yakin(p.kurye, 62.5)) ok("kurye 82,50 - 20 = 62,50");
  else bad(`kurye ${p.kurye}, beklenen 62.50`);
  if (yakin(p.platform, 13)) ok("platform 33 - 20 = 13,00");
  else bad(`platform ${p.platform}, beklenen 13.00`);
  if (yakin(p.satici, 194.5)) ok("satici 214,50 - 20 = 194,50");
  else bad(`satici ${p.satici}, beklenen 194.50`);
}

/* --- 5. EN KRİTİK: üç payın toplamı her zaman ödenen tutara eşit mi? --- */
{
  let sapma = 0;
  for (let ara = 225; ara <= 1200; ara += 7.31) {
    for (const teslimat of [0, 19.9, 30]) {
      for (const indirim of [0, 25, 50, 99.99, ara * 0.2]) {
        const p = siparisPaylasimi({ araToplam: ara, teslimatUcreti: teslimat, indirim });
        const toplam = p.kurye + p.platform + p.satici;
        if (!yakin(toplam, p.odenen)) sapma++;
      }
    }
  }
  if (sapma === 0) ok("her senaryoda uc payin toplami odenen tutara esit (yuvarlama kacagi yok)");
  else bad(`${sapma} senaryoda paylar odenen tutari tutturmadi`);
}

/* --- 6. Uç durumlar: negatif hakediş çıkmamalı --- */
{
  const p = siparisPaylasimi({ araToplam: 250, teslimatUcreti: 0, indirim: 250 });
  if (p.kurye >= 0 && p.platform >= 0 && p.satici >= 0) ok("tam indirimde hicbir pay negatif degil");
  else bad(`negatif pay: kurye ${p.kurye}, platform ${p.platform}, satici ${p.satici}`);

  const asiri = siparisPaylasimi({ araToplam: 100, teslimatUcreti: 0, indirim: 500 });
  if (asiri.indirim <= asiri.taban) ok("havuzdan buyuk indirim havuzla sinirlaniyor");
  else bad("indirim havuzu asti");
}

console.log(cikti.join("\n"));
console.log(
  "\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`),
);
process.exit(hatalar.length === 0 ? 0 : 1);
