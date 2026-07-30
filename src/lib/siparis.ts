import { ilceGecerliMi } from "@/content/istanbul";
import type { OdemeYontemi } from "@/content/odeme";
import { restoranBul } from "@/content/restoranlar";

export type SiparisKalemi = {
  urunId: string;
  ad: string;
  fiyat: number;
  adet: number;
};

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
};

export type Tutarlar = {
  araToplam: number;
  teslimatUcreti: number;
  toplam: number;
  minSepet: number;
  minSepetKarsilandi: boolean;
};

export type SiparisDurumu = "odeme-bekliyor" | "odendi" | "odeme-basarisiz";

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

export function tutarlariHesapla(
  kalemler: SiparisKalemi[],
  restoranSlug: string,
): Tutarlar {
  const restoran = restoranBul(restoranSlug);
  const araToplam = kalemler.reduce((t, k) => t + k.fiyat * k.adet, 0);
  const minSepet = restoran?.minSepet ?? 0;
  const teslimatUcreti = restoran?.teslimatUcreti ?? 0;

  return {
    araToplam,
    teslimatUcreti,
    toplam: araToplam + teslimatUcreti,
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
    /** Ödeme sağlayıcısı kaynaklı hata (iyzico yapılandırması, iletişim vb.). */
    | "odeme",
    string
  >
>;

/**
 * Sunucu tarafında da çalışan tek doğrulama kaynağı — istemcideki form
 * kontrolleri bunu tekrar etmez, aynı fonksiyonu çağırır.
 */
export function siparisDogrula(girdi: SiparisGirdisi): DogrulamaHatalari {
  const hatalar: DogrulamaHatalari = {};
  const restoran = restoranBul(girdi.restoranSlug);

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
    const tutarlar = tutarlariHesapla(girdi.kalemler, girdi.restoranSlug);
    if (!tutarlar.minSepetKarsilandi) {
      hatalar.minSepet = `Minimum sepet tutarı ${tutarlar.minSepet} TL. Sepetinize ${
        tutarlar.minSepet - tutarlar.araToplam
      } TL daha ekleyin.`;
    }
  }

  return hatalar;
}

export function telefonNormalize(telefon: string): string {
  const temiz = telefon.replace(/[\s()-]/g, "");
  return temiz.startsWith("0") ? temiz : `0${temiz}`;
}
