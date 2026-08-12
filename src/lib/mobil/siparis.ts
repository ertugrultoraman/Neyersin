import { depoAl } from "../depo";
import type { KayitliSiparis } from "../depo/tipler";
import { musteriIptalEdebilirMi, tamamlandiMi } from "../siparis";
import type { SiparisDetayDto, SiparisKalemDto, SiparisOzetDto } from "./tipler";

/**
 * Sipariş kayıtlarını mobil sözleşmesine çeviren katman.
 *
 * SAHİPLİK DENETİMİ BURADA, uçlarda değil. Bir siparişin kime ait olduğunu
 * sorgulamak her uçta tekrar edilseydi, yeni bir uç eklendiğinde kontrolü
 * unutmak yeterdi — herkesin başkasının adresini ve telefonunu okuyabildiği
 * bir açık, tek satırlık bir unutmadan doğardı.
 */

const epostaEsit = (a: string | undefined, b: string) =>
  (a ?? "").trim().toLocaleLowerCase("tr") === b.trim().toLocaleLowerCase("tr");

function ozet(s: KayitliSiparis): SiparisOzetDto {
  return {
    siparisNo: s.siparisNo,
    restoranSlug: s.restoranSlug,
    restoranAdi: s.restoranAdi,
    durum: s.durum,
    tutarlar: s.tutarlar,
    olusturmaTarihi: s.olusturmaTarihi,
    guncellemeTarihi: s.guncellemeTarihi,
    kalemSayisi: s.kalemler.reduce((t, k) => t + k.adet, 0),
  };
}

/** Müşterinin kendi siparişleri, yeniden eskiye. */
export async function siparisListesi(eposta: string, limit = 50): Promise<SiparisOzetDto[]> {
  const depo = await depoAl();
  const kayitlar = await depo.listele({ musteriEpostasi: eposta, limit });
  return kayitlar.map(ozet);
}

/**
 * Tek siparişin ayrıntısı.
 *
 * `null` iki durumu birden anlatıyor: sipariş yok, ya da var ama BAŞKASININ.
 * Ayrı ayrı cevap verilseydi ("var ama senin değil") sipariş numaralarının
 * geçerliliği dışarıdan denenebilir hâle gelirdi.
 */
export async function siparisDetayi(
  siparisNo: string,
  eposta: string,
): Promise<SiparisDetayDto | null> {
  const depo = await depoAl();
  const s = await depo.bul(siparisNo);
  if (!s || !epostaEsit(s.musteri?.eposta, eposta)) return null;

  return {
    ...ozet(s),
    kalemler: s.kalemler.map(
      (k): SiparisKalemDto => ({
        satirId: k.satirId,
        urunId: k.urunId,
        ad: k.ad,
        fiyat: k.fiyat,
        adet: k.adet,
        ...(k.ekstralar ? { ekstralar: k.ekstralar } : {}),
      }),
    ),
    adres: s.adres,
    not: s.not,
    odemeYontemi: s.odemeYontemi,
    /*
     * Değerlendirme yalnızca tamamlanmış siparişe yazılabiliyor. Aynı sipariş
     * için ikinci yorumun engellenmesi yorum katmanının işi; burada yalnızca
     * "sipariş bu aşamaya geldi mi" sorusu cevaplanıyor.
     */
    yorumlanabilir: tamamlandiMi(s.durum),
  };
}

export type IptalSonucu = { tamam: true } | { tamam: false; sebep: string };

/**
 * Müşterinin kendi siparişini iptal etmesi.
 *
 * İki koruma da SUNUCUDA (web'deki `hesabim/actions.ts` ile aynı kurallar):
 *  1. Sipariş gerçekten bu kişiye mi ait?
 *  2. Durum iptale uygun mu? Ödenmiş sipariş iade gerektirdiği için buradan
 *     iptal edilemiyor, yöneticiden geçiyor.
 */
export async function siparisIptal(siparisNo: string, eposta: string): Promise<IptalSonucu> {
  const depo = await depoAl();
  const s = await depo.bul(siparisNo);
  if (!s || !epostaEsit(s.musteri?.eposta, eposta)) {
    return { tamam: false, sebep: "Sipariş bulunamadı." };
  }

  if (!musteriIptalEdebilirMi(s.durum)) {
    return {
      tamam: false,
      sebep:
        s.durum === "iptal"
          ? "Bu sipariş zaten iptal edilmiş."
          : "Bu sipariş artık iptal edilemez. Destek ekibiyle iletişime geç.",
    };
  }

  await depo.durumGuncelle(siparisNo, "iptal", {
    odemeMesaji: `Sipariş ${eposta} tarafından uygulamadan iptal edildi.`,
  });
  return { tamam: true };
}
