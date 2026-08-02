import { ilceGecerliMi } from "@/content/istanbul";
import { kuponUygula } from "@/content/kampanyalar";
import type { OdemeYontemi } from "@/content/odeme";
import { MIN_SEPET, restoranBul, type Restoran } from "@/content/restoranlar";

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

export type SiparisDurumu = "odeme-bekliyor" | "odendi" | "odeme-basarisiz" | "iptal";

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
    minSepetKarsilandi: araToplam >= minSepet,
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
export function siparisDogrula(
  girdi: SiparisGirdisi,
  /** Şef mutfakları sabit içerikte yok — çözülmüş kayıt buradan geçirilir. */
  cozulenRestoran?: Restoran,
): DogrulamaHatalari {
  const hatalar: DogrulamaHatalari = {};
  const restoran = cozulenRestoran ?? restoranBul(girdi.restoranSlug);

  if (!restoran) {
    hatalar.restoran = "Restoran bulunamadı.";
  }
  if (!girdi.kalemler || girdi.kalemler.length === 0) {
    hatalar.kalemler = "Sepetiniz boş.";
  }

  const temizTelefon = (girdi.musteri.telefon ?? "").replace(/[\s()-]/g, "");

  if (!girdi.musteri.adSoyad || girdi.musteri.adSoyad.trim().length < 5) {
    hatalar.adSoyad = "Ad ve soyadınızı girin.";
  }
  if (!TELEFON_DESENI.test(temizTelefon)) {
    hatalar.telefon = "Telefonu 5XXXXXXXXX biçiminde girin.";
  }
  if (!EPOSTA_DESENI.test(girdi.musteri.eposta ?? "")) {
    hatalar.eposta = "Geçerli bir e-posta adresi girin.";
  }

  if (!ilceGecerliMi(girdi.adres.ilce ?? "")) {
    hatalar.ilce = "Listeden bir İstanbul ilçesi seçin.";
  } else if (restoran && !restoran.teslimat.includes(girdi.adres.ilce)) {
    hatalar.ilce = `${restoran.ad}, ${girdi.adres.ilce} ilçesine teslimat yapmıyor.`;
  }
  if (!girdi.adres.mahalle || girdi.adres.mahalle.trim().length < 2) {
    hatalar.mahalle = "Mahalle bilgisi gerekli.";
  }
  if (!girdi.adres.acikAdres || girdi.adres.acikAdres.trim().length < 10) {
    hatalar.acikAdres = "Cadde/sokak bilgisini içeren açık adres girin.";
  }
  if (!girdi.adres.binaNo || girdi.adres.binaNo.trim().length === 0) {
    hatalar.binaNo = "Bina numarası gerekli.";
  }

  if (restoran && girdi.kalemler?.length > 0) {
    const tutarlar = tutarlariHesapla(girdi.kalemler, girdi.restoranSlug, undefined, restoran);
    if (!tutarlar.minSepetKarsilandi) {
      hatalar.minSepet = `Minimum sepet tutarı ${tutarlar.minSepet} TL. Sepetinize ${
        tutarlar.minSepet - tutarlar.araToplam
      } TL daha ekleyin.`;
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
