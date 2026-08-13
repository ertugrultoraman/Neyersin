import { ilceGecerliMi } from "@/content/istanbul";
import { kuponUygula } from "@/content/kampanyalar";
import type { OdemeYontemi } from "@/content/odeme";
import { MIN_SEPET, restoranBul, type Restoran } from "@/content/restoranlar";
import { VARSAYILAN_DIL } from "./dil";
import { ceviri, type Ceviri } from "./sozluk";

export type SecilenEkstra = { id: string; ad: string; fiyat: number };

export type SiparisKalemi = {
  /** Sepette benzersiz satır kimliği — aynı ürün farklı ekstralarla ayrı satır olur. */
  satirId: string;
  urunId: string;
  ad: string;
  /** Ürünün temel fiyatı, ekstralar hariç. */
  fiyat: number;
  adet: number;
  ekstralar?: SecilenEkstra[];
};

/** Bir kalemin ekstralar dahil birim fiyatı. */
export function kalemBirimFiyati(kalem: Pick<SiparisKalemi, "fiyat" | "ekstralar">): number {
  const ekstraToplam = kalem.ekstralar?.reduce((t, e) => t + e.fiyat, 0) ?? 0;
  return kalem.fiyat + ekstraToplam;
}

export type SiparisGirdisi = {
  restoranSlug: string;
  kalemler: SiparisKalemi[];
  musteri: {
    adSoyad: string;
    telefon: string;
    eposta: string;
  };
  adres: {
    ilce: string;
    mahalle: string;
    acikAdres: string;
    binaNo: string;
    daireNo: string;
    tarif: string;
  };
  not: string;
  /** Sepette girilen kupon kodu — sunucuda yeniden doğrulanır, istemciye güvenilmez. */
  kuponKodu?: string;
};

export type Tutarlar = {
  araToplam: number;
  teslimatUcreti: number;
  indirim: number;
  kuponKodu?: string;
  toplam: number;
  minSepet: number;
  minSepetKarsilandi: boolean;
};

/**
 * Siparişin yaşam döngüsü.
 *
 * Önceden yalnızca ödeme durumları vardı; sipariş "ödendi" olduktan sonra ne
 * olduğu takip edilemiyordu. Artık teslimatın da adımları var:
 *
 *   odeme-bekliyor → odendi → hazir → yolda → teslim-edildi
 *
 *  - `odendi`       ödeme alındı, mutfak hazırlamaya başladı
 *  - `hazir`        mutfak bitirdi, kurye alabilir
 *  - `yolda`        kurye teslim aldı, müşteriye gidiyor
 *  - `teslim-edildi` sipariş tamamlandı
 *
 * `odendi` GERİYE DÖNÜK olarak "tamamlandı" sayılan yerlerde hâlâ geçerli:
 * bu özellik eklenmeden önceki siparişler o durumda kaldı, onları bir anda
 * "yarım" göstermek yanlış olurdu (bkz. `tamamlandiMi`).
 */
export type SiparisDurumu =
  | "odeme-bekliyor"
  | "odendi"
  | "hazir"
  | "yolda"
  | "teslim-edildi"
  | "odeme-basarisiz"
  | "iptal";

/** Teslimat akışındaki sıralı adımlar — ilerlemeyi çizerken kullanılıyor. */
export const TESLIMAT_ADIMLARI: SiparisDurumu[] = ["odendi", "hazir", "yolda", "teslim-edildi"];

/**
 * Sipariş müşteriye ulaştı mı?
 *
 * `odendi` de sayılıyor: teslimat adımları sonradan eklendi, eski siparişler
 * o durumda kaldı. Değerlendirme yazma hakkı buna bakıyor — eski siparişini
 * yorumlayamayan müşteri olmasın.
 */
export function tamamlandiMi(durum: SiparisDurumu): boolean {
  return durum === "teslim-edildi" || durum === "odendi";
}

/** Kurye bu siparişi teslim alabilir mi? */
export function kuryeAlabilirMi(durum: SiparisDurumu): boolean {
  return durum === "hazir";
}

/**
 * Bu sipariş şefin SATIŞ sayısına yazılır mı? (Rozet sıralamasının ölçüsü.)
 *
 * `tamamlandiMi` BİLEREK kullanılmadı: o yalnızca `odendi` ve `teslim-edildi`
 * döndürüyor. Sıralamayı ona bağlasaydık mutfakta hazırlanan (`hazir`) ya da
 * kuryede olan (`yolda`) sipariş sayımdan geçici olarak DÜŞER, teslim edilince
 * geri gelirdi; şefin rozeti gün içinde sebepsiz yere oynardı.
 *
 * Sayılmayanlar:
 *  - `odeme-bekliyor`  → parası henüz alınmadı, satış sayılmaz. Kapıda ödemeli
 *    sipariş de yönetici onaylayıp `odendi` yapana kadar burada bekler.
 *  - `odeme-basarisiz` / `iptal` → satış gerçekleşmedi.
 *
 * Böylece sayaç yalnızca ileri gider: bir sipariş sayıma girdikten sonra
 * (iptal edilmedikçe) çıkmaz.
 */
export const SATIS_DURUMLARI: SiparisDurumu[] = ["odendi", "hazir", "yolda", "teslim-edildi"];

export function satisSayilirMi(durum: SiparisDurumu): boolean {
  return SATIS_DURUMLARI.includes(durum);
}

/**
 * Müşteri siparişi hangi durumlarda kendisi iptal edebilir?
 *
 * Yalnızca henüz ödenmemiş ve mutfağa geçmemiş siparişler. Ödenmiş bir sipariş
 * için iade süreci gerektiğinden iptal yöneticiden geçer.
 */
export function musteriIptalEdebilirMi(durum: SiparisDurumu): boolean {
  return durum === "odeme-bekliyor";
}

export type Siparis = SiparisGirdisi & {
  siparisNo: string;
  olusturmaTarihi: string;
  odemeYontemi: OdemeYontemi;
  durum: SiparisDurumu;
  tutarlar: Tutarlar;
  restoranAdi: string;
};

/** NY-260730-4821 biçiminde, insan tarafından okunabilir sipariş numarası. */
export function siparisNoUret(simdi = new Date()): string {
  const yy = String(simdi.getFullYear()).slice(2);
  const aa = String(simdi.getMonth() + 1).padStart(2, "0");
  const gg = String(simdi.getDate()).padStart(2, "0");
  const rastgele = Math.floor(1000 + Math.random() * 9000);
  return `NY-${yy}${aa}${gg}-${rastgele}`;
}

/**
 * @param restoran Yönetici onayıyla açılan şef mutfakları sabit içerikte
 *   olmadığı için `restoranBul` onları bulamaz. Çağıran taraf mutfağı zaten
 *   çözmüşse (bkz. lib/restoran-listesi) buradan geçirir; geçirmezse tüm
 *   mutfaklarda aynı olan varsayılanlar kullanılır — min sepet 200 TL,
 *   teslimat ücretsiz.
 */
export function tutarlariHesapla(
  kalemler: SiparisKalemi[],
  restoranSlug: string,
  kuponKodu?: string,
  restoran?: Restoran,
): Tutarlar {
  const bilgi = restoran ?? restoranBul(restoranSlug);
  const araToplam = kalemler.reduce((t, k) => t + kalemBirimFiyati(k) * k.adet, 0);
  const minSepet = bilgi?.minSepet ?? MIN_SEPET;
  const teslimatUcreti = bilgi?.teslimatUcreti ?? 0;

  const kuponSonucu = kuponKodu?.trim() ? kuponUygula(kuponKodu, araToplam) : undefined;
  const indirim = kuponSonucu?.gecerli ? kuponSonucu.indirim : 0;

  return {
    araToplam,
    teslimatUcreti,
    indirim,
    kuponKodu: kuponSonucu?.gecerli ? kuponSonucu.kampanya.kod : undefined,
    toplam: Math.max(araToplam + teslimatUcreti - indirim, 0),
    minSepet,
    /*
     * MİNİMUM KUPON SONRASINA BAKIYOR. Önceden yalnızca `araToplam >= minSepet`
     * denetleniyordu ve bu, kuponu minimumu delmenin yolu hâline getiriyordu:
     * 225 TL'lik sepete 100 TL kupon uygulayan biri 125 TL ödüyordu. Artık
     * müşterinin kupon düşüldükten SONRA da en az bu kadar sepet tutması
     * gerekiyor.
     *
     * Teslimat ücreti sayılmıyor: minimum, mutfağın hazırladığı iş için
     * konulmuş bir eşik; teslimat ücretiyle doldurmak eşiği anlamsızlaştırırdı.
     */
    minSepetKarsilandi: araToplam - indirim >= minSepet,
  };
}

const TELEFON_DESENI = /^(0?5\d{9})$/;
const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type DogrulamaHatalari = Partial<
  Record<
    | "restoran"
    | "kalemler"
    | "minSepet"
    | "adSoyad"
    | "telefon"
    | "eposta"
    | "ilce"
    | "mahalle"
    | "acikAdres"
    | "binaNo"
    | "kupon"
    /** Ödeme sağlayıcısı kaynaklı hata (iyzico yapılandırması, iletişim vb.). */
    | "odeme",
    string
  >
>;

/**
 * Sunucu tarafında da çalışan tek doğrulama kaynağı — istemcideki form
 * kontrolleri bunu tekrar etmez, aynı fonksiyonu çağırır.
 */
/**
 * Sunucu tarafında da çalışan tek doğrulama kaynağı.
 *
 * ÇEVİRMEN DIŞARIDAN GELİYOR, burada çerez OKUNMUYOR: bu dosya ödeme formu
 * üzerinden istemci paketine de giriyor ve `next/headers` zincirini tarayıcıya
 * taşımak bütün derlemeyi bozuyordu. Çağıran sunucu eylemi ziyaretçinin
 * dilini geçiyor; verilmezse Türkçe kullanılıyor.
 */
export function siparisDogrula(
  girdi: SiparisGirdisi,
  /** Şef mutfakları sabit içerikte yok — çözülmüş kayıt buradan geçirilir. */
  cozulenRestoran?: Restoran,
  c: Ceviri = ceviri(VARSAYILAN_DIL),
): DogrulamaHatalari {
  const hatalar: DogrulamaHatalari = {};
  const restoran = cozulenRestoran ?? restoranBul(girdi.restoranSlug);

  if (!restoran) {
    hatalar.restoran = c("hata.restoranYok");
  }
  if (!girdi.kalemler || girdi.kalemler.length === 0) {
    hatalar.kalemler = c("hata.sepetBos");
  }

  const temizTelefon = (girdi.musteri.telefon ?? "").replace(/[\s()-]/g, "");

  if (!girdi.musteri.adSoyad || girdi.musteri.adSoyad.trim().length < 5) {
    hatalar.adSoyad = c("hata.adSoyad");
  }
  if (!TELEFON_DESENI.test(temizTelefon)) {
    hatalar.telefon = c("hata.telefonBicim");
  }
  if (!EPOSTA_DESENI.test(girdi.musteri.eposta ?? "")) {
    hatalar.eposta = c("hata.epostaGecersiz");
  }

  if (!ilceGecerliMi(girdi.adres.ilce ?? "")) {
    hatalar.ilce = c("hata.ilceSec");
  } else if (restoran && !restoran.teslimat.includes(girdi.adres.ilce)) {
    hatalar.ilce = c("hata.teslimatYok", {
      restoran: restoran.ad,
      ilce: girdi.adres.ilce,
    });
  }
  if (!girdi.adres.mahalle || girdi.adres.mahalle.trim().length < 2) {
    hatalar.mahalle = c("hata.mahalleGerekli");
  }
  if (!girdi.adres.acikAdres || girdi.adres.acikAdres.trim().length < 10) {
    hatalar.acikAdres = c("hata.acikAdres");
  }
  if (!girdi.adres.binaNo || girdi.adres.binaNo.trim().length === 0) {
    hatalar.binaNo = c("hata.binaNo");
  }

  if (restoran && girdi.kalemler?.length > 0) {
    /*
     * KUPON KODU DA GEÇİLİYOR. Önceden `undefined` yazıyordu, yani minimum
     * denetimi kuponu hiç görmüyordu ve kuponlu sipariş minimumun altına
     * inebiliyordu — kuralın delindiği tam yer burasıydı.
     */
    const tutarlar = tutarlariHesapla(
      girdi.kalemler,
      girdi.restoranSlug,
      girdi.kuponKodu,
      restoran,
    );
    if (!tutarlar.minSepetKarsilandi) {
      hatalar.minSepet = c("hata.minSepet", {
        tutar: tutarlar.minSepet,
        /* Eksik de kupon sonrasına göre: müşteri ne kadar daha eklemeli. */
        eksik: Math.max(0, tutarlar.minSepet - (tutarlar.araToplam - tutarlar.indirim)),
      });
    }

    if (girdi.kuponKodu?.trim()) {
      const kuponSonucu = kuponUygula(girdi.kuponKodu, tutarlar.araToplam);
      if (!kuponSonucu.gecerli) {
        hatalar.kupon = kuponSonucu.hata;
      }
    }
  }

  return hatalar;
}

export function telefonNormalize(telefon: string): string {
  const temiz = telefon.replace(/[\s()-]/g, "");
  return temiz.startsWith("0") ? temiz : `0${temiz}`;
}
