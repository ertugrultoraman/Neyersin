/**
 * SİPARİŞ PAYLAŞIMI — kurye, platform ve satıcı hakedişi.
 *
 * TEK KAYNAK BURASI. Aynı rakam dört yerde görünüyor: kuryenin teklif
 * kartında ("bu iş bana ne kazandırır"), özet ekranındaki kazancında,
 * satıcının hakedişinde ve yönetici panelinde. İkinci bir yerde
 * hesaplansaydı kurye teklifte gördüğü rakamı ay sonunda bulamazdı — ve bu,
 * güvenilirliği en hızlı kaybettiren hata türü.
 *
 * MODEL: TEK HAVUZ, ÜÇE BÖLÜNÜYOR.
 * Havuz müşterinin ödediği faturanın TAMAMI (ürün ara toplamı + teslimat
 * ücreti), kupon indirimi DÜŞÜLMEDEN önceki hâli. Kademeye göre üç orana
 * ayrılıyor ve oranların toplamı her kademede tam %100.
 *
 * KUPON SONRADAN DÜŞÜLÜYOR, üç tarafa eşit (%33,3). Sırası önemli: kupon
 * havuzdan önce düşülseydi indirim iki kez inerdi. Böyle olunca üç payın
 * toplamı, kasaya gerçekten giren paraya (fatura − indirim) birebir eşit
 * oluyor — yani kimse olmayan bir parayı paylaşmıyor.
 *
 * KURUŞ ARTIĞI SATICIYA YAZILIYOR. Üç oranın kuruş yuvarlaması toplamı bir
 * iki kuruş kaydırabiliyor; fark satıcı payına ekleniyor ki üç pay her zaman
 * TAM olarak ödenen tutarı versin. Kuryeye ya da platforma yazılsaydı, kurye
 * "hesapladığımdan 1 kuruş fazla/eksik" derdi; satıcı payı zaten kalan
 * bakiye olarak tanımlı.
 *
 * MESAFE YOK: siparişteki adres serbest metin ve hiçbir yerde koordinata
 * çevrilmiyor. Mesafe katsayısı eklemek, olmayan bir veriden tutar üretmek
 * olurdu.
 */

/** Bir kademenin sınırı ve oranları. Oranlar toplamı 1 olmak zorunda. */
export type PaylasimKademesi = {
  /** Bu kademenin ÜST sınırı (hariç). Son kademede sonsuz. */
  ustSinir: number;
  kurye: number;
  platform: number;
  satici: number;
};

/**
 * Kademeler — işletme kararı, 13 Ağustos 2026.
 *
 * Sınır DEĞERİ ÜST KADEMEYE ait: tam 400 TL'lik sipariş ikinci kademede,
 * tam 650 TL'lik üçüncüde. "400 ile 650 arası" ifadesinin doğal okuması bu.
 */
export const KADEMELER: readonly PaylasimKademesi[] = [
  { ustSinir: 400, kurye: 0.25, platform: 0.1, satici: 0.65 },
  { ustSinir: 650, kurye: 0.18, platform: 0.12, satici: 0.7 },
  { ustSinir: Number.POSITIVE_INFINITY, kurye: 0.15, platform: 0.1, satici: 0.75 },
];

/** Kupon bedeli üç tarafa eşit bölünüyor. */
export const KUPON_PAYI = 1 / 3;

export function kademeBul(tutar: number): PaylasimKademesi {
  return KADEMELER.find((k) => tutar < k.ustSinir) ?? KADEMELER[KADEMELER.length - 1];
}

/** Kuruşa yuvarlar — para hesabında kayan nokta artığı taşınmasın. */
const kurus = (n: number) => Math.round(n * 100) / 100;

export type Paylasim = {
  /** Komisyonun hesaplandığı tutar: ara toplam + teslimat, indirim ÖNCESİ. */
  taban: number;
  /** Uygulanan kademenin oranları — arayüz "%25" yazabilsin diye. */
  oranlar: PaylasimKademesi;
  /** Kupon indirimi (toplam) ve kişi başına düşen pay. */
  indirim: number;
  kisiBasiIndirim: number;
  /** Nihai hakedişler; toplamı ödenen tutara eşit. */
  kurye: number;
  platform: number;
  satici: number;
  /** Müşterinin ödediği tutar — üç payın toplamı. */
  odenen: number;
};

export function siparisPaylasimi(girdi: {
  araToplam: number;
  teslimatUcreti: number;
  indirim: number;
}): Paylasim {
  const taban = kurus(Math.max(0, girdi.araToplam) + Math.max(0, girdi.teslimatUcreti));
  /* İndirim havuzdan büyük olamaz: kupon doğrulaması bunu zaten engelliyor,
     ama negatif hakediş üretmemek için burada da sınırlanıyor. */
  const indirim = kurus(Math.min(Math.max(0, girdi.indirim), taban));
  const odenen = kurus(taban - indirim);

  const oranlar = kademeBul(taban);
  const kisiBasiIndirim = kurus(indirim * KUPON_PAYI);

  const kurye = kurus(Math.max(0, taban * oranlar.kurye - kisiBasiIndirim));
  const platform = kurus(Math.max(0, taban * oranlar.platform - kisiBasiIndirim));
  /* Satıcı payı KALAN BAKİYE: yuvarlama artığı burada eriyor (bkz. başlık). */
  const satici = kurus(odenen - kurye - platform);

  return {
    taban,
    oranlar,
    indirim,
    kisiBasiIndirim,
    kurye,
    platform,
    satici: Math.max(0, satici),
    odenen,
  };
}

/**
 * Kuryenin bu siparişten kazancı.
 *
 * Ayrı bir fonksiyon olarak duruyor çünkü kurye tarafındaki her yer (teklif
 * kartı, özet, dağıtım motoru) yalnızca bu sayıyla ilgileniyor ve paylaşımın
 * tamamını taşımak zorunda kalmasın.
 */
export function kuryeHakedisi(girdi: {
  araToplam: number;
  teslimatUcreti: number;
  indirim: number;
}): number {
  return siparisPaylasimi(girdi).kurye;
}

/** Ayna: src/lib/mobil/tipler.ts → UcretDokumuDto */
export type UcretDokumu = {
  siparisTutari: number;
  yuzde: number;
  kuponKesintisi: number;
  toplam: number;
};

/**
 * Kuryeye GÖSTERİLEN döküm.
 *
 * Oran ve taban da gidiyor: yalnızca toplam yazsaydı kurye neden bir işten 60,
 * diğerinden 95 TL aldığını anlayamaz ve tutar keyfî görünürdü. Kupon kesintisi
 * ayrı satır — gizlenip yalnızca düşük toplam gösterilseydi, kuryenin kuponlu
 * siparişte hesabın yanlış olduğunu düşünmesi için her sebebi olurdu.
 */
export function kuryeUcretDokumu(girdi: {
  araToplam: number;
  teslimatUcreti: number;
  indirim: number;
}): UcretDokumu {
  const p = siparisPaylasimi(girdi);
  return {
    siparisTutari: p.taban,
    yuzde: Math.round(p.oranlar.kurye * 100),
    kuponKesintisi: p.kisiBasiIndirim,
    toplam: p.kurye,
  };
}
