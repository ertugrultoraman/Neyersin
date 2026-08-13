/**
 * MOBİL UÇ HIZ SINIRI.
 *
 * NEDEN: giriş ucunda kaba kuvvet sayacı vardı (bkz. lib/giris-sinirlayici.ts)
 * ama giriş YAPILDIKTAN sonra hiçbir sınır yoktu. Çalınan tek bir jetonla
 * teklif yoklaması, konum bildirimi ve sipariş oluşturma sınırsız çağrılabilir;
 * bu hem veritabanını hem faturayı hedef alır. Bozuk bir uygulama sürümünün
 * sonsuz döngüye girmesi de aynı sonucu verir — ve o senaryo kötü niyetten
 * daha olası.
 *
 * BELLEKTE TUTULUYOR, VERİTABANINDA DEĞİL. Bilinçli bir denge:
 * teklif yoklaması 5 saniyede bir geliyor ve her yoklamaya bir veritabanı
 * yazması eklemek, korumaya çalıştığımız yükü kendi elimizle üretmek olurdu.
 *
 * BUNUN BEDELİ ŞU: Vercel'de her istek ayrı bir sunucu örneğine düşebiliyor ve
 * her örnek kendi sayacını tutuyor. Yani gerçek sınır, buradaki sayının örnek
 * sayısıyla çarpımı. Bu bir DAĞITIK KOTA DEĞİL, kaçak yapan tek bir istemciyi
 * durduran bir emniyet supabı — bir istemci genelde aynı sıcak örneğe düşüyor.
 * Dağıtık ve gerçek sınır, kenar katmanının işi (Vercel WAF kuralları).
 *
 * Giriş ucu buraya BAĞLI DEĞİL: orada sayaç veritabanında, çünkü parola deneme
 * saldırısı örnekler arasına bilerek dağıtılabilir ve orada kaybetmek hesabın
 * kendisini kaybetmek demek.
 */

/** İstek sınıfları — her birinin ayrı bütçesi var. */
export type HizSinifi =
  /** Uygulamanın döngüsel sorguları: teklif, konum, durum, listeler. */
  | "yoklama"
  /** Durum değiştiren istekler: kabul, ret, rezervasyon, teslimat adımı. */
  | "yazma"
  /** Pahalı ve nadir olması gereken işler: sipariş oluşturma. */
  | "agir";

type Kural = { pencereMs: number; azami: number };

/**
 * Sınırlar UYGULAMANIN GERÇEK RİTMİNE göre seçildi, tahminle değil:
 *
 *  - Yoklama: uygulama 5 sn'de bir soruyor → dakikada 12. Sınır 90, yani ~7
 *    kat pay. Ekran değişiminde ve öne gelişte fazladan istek atılıyor;
 *    dar bir sınır normal kullanımı keserdi.
 *  - Yazma: bir teslimatta en fazla birkaç adım var. 40 fazlasıyla yeterli.
 *  - Ağır: aynı kişinin dakikada 5'ten fazla sipariş vermesi gerçek bir
 *    kullanım değil.
 */
const KURALLAR: Record<HizSinifi, Kural> = {
  yoklama: { pencereMs: 60_000, azami: 90 },
  yazma: { pencereMs: 60_000, azami: 40 },
  agir: { pencereMs: 60_000, azami: 5 },
};

/** Bellek sınırsız büyümesin: bu sayıyı aşınca süresi dolanlar atılıyor. */
const TEMIZLEME_ESIGI = 2_000;

type Pencere = { sayac: number; bitis: number };

const pencereler = new Map<string, Pencere>();

function temizle(simdi: number) {
  if (pencereler.size < TEMIZLEME_ESIGI) return;
  for (const [anahtar, p] of pencereler) {
    if (p.bitis <= simdi) pencereler.delete(anahtar);
  }
}

export type HizSonucu = { izinli: true } | { izinli: false; kalanSaniye: number };

/**
 * Bir isteği sayar ve bütçe aşıldıysa reddeder.
 *
 * SABİT PENCERE kullanılıyor, kayan pencere değil: kayan pencere her anahtar
 * için zaman damgası listesi tutmayı gerektiriyor ve buradaki amaç kaçağı
 * durdurmak, adaleti mikrosaniye hassasiyetinde ölçmek değil.
 */
export function hizSayacinaEkle(sinif: HizSinifi, kimlik: string): HizSonucu {
  const kural = KURALLAR[sinif];
  const simdi = Date.now();
  const anahtar = `${sinif}|${kimlik}`;

  temizle(simdi);

  const mevcut = pencereler.get(anahtar);
  if (!mevcut || mevcut.bitis <= simdi) {
    pencereler.set(anahtar, { sayac: 1, bitis: simdi + kural.pencereMs });
    return { izinli: true };
  }

  mevcut.sayac += 1;
  if (mevcut.sayac > kural.azami) {
    return { izinli: false, kalanSaniye: Math.max(1, Math.ceil((mevcut.bitis - simdi) / 1000)) };
  }
  return { izinli: true };
}

/** Testler ve yerel deneme için — üretimde çağrılmıyor. */
export function hizSayaclariniSifirla(): void {
  pencereler.clear();
}
