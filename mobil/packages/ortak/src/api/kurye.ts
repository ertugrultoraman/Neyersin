import type {
  DurumGirdisi,
  KonumGirdisi,
  KuryeAdimGirdisi,
  KuryeDurumuDto,
  KuryeOzetiDto,
  KuryeTeslimatiDto,
  SiparisDurumu,
  TeklifDto,
  VardiyaPlaniDto,
} from "../tipler";
import type { ApiIstemcisi } from "./istemci";

const TABAN = "/api/mobil/v1/kurye";

const yol = (parca: string) => encodeURIComponent(parca);

/**
 * KURYE UÇLARI.
 *
 * Yalnızca kurye uygulamasından çağrılıyor ama ortak pakette duruyor: adresler
 * sözleşmenin parçası ve müşteri uygulaması da bir gün kurye bilgisine
 * (canlı takip) bakacak. Sunucu tarafı rol beyaz listesiyle korunuyor, yani
 * yanlışlıkla müşteri uygulamasından çağrılması 403 dönüyor.
 */
export function kurye(api: ApiIstemcisi) {
  return {
    teslimatlar: () => api.get<KuryeTeslimatiDto[]>(`${TABAN}/teslimatlar`),

    adim: (siparisNo: string, hedef: KuryeAdimGirdisi["hedef"]) =>
      api.post<{ siparisNo: string; durum: SiparisDurumu }>(
        `${TABAN}/teslimat/${yol(siparisNo)}/durum`,
        { hedef },
      ),

    /* --- Vardiya ------------------------------------------------------- */

    durum: () => api.get<KuryeDurumuDto>(`${TABAN}/durum`),

    durumYaz: (girdi: DurumGirdisi) => api.post<KuryeDurumuDto>(`${TABAN}/durum`, girdi),

    /**
     * Konum bildirimi.
     *
     * `isaret` alıyor çünkü bu istek arka planda ve sık atılıyor: ekran
     * kapandığında ya da kurye çevrimdışı olduğunda uçuşta olan bildirim
     * iptal edilebilmeli, yoksa çevrimdışı olduktan sonra da bir istek daha
     * gidip kuryeyi bir süre daha çevrimiçi gösterirdi.
     */
    konum: (girdi: KonumGirdisi, isaret?: AbortSignal) =>
      api.post<Record<string, never>>(`${TABAN}/konum`, girdi, { isaret }),

    /* --- Teklifler ----------------------------------------------------- */

    teklifler: (isaret?: AbortSignal) => api.get<TeklifDto[]>(`${TABAN}/teklifler`, { isaret }),

    /** Kabul edilirse teslimatın TAMAMI dönüyor — açık adres ve telefonlarla. */
    teklifKabul: (siparisNo: string) =>
      api.post<KuryeTeslimatiDto>(`${TABAN}/teklif/${yol(siparisNo)}/kabul`),

    teklifRet: (siparisNo: string) =>
      api.post<Record<string, never>>(`${TABAN}/teklif/${yol(siparisNo)}/ret`),

    /* --- Vardiya planı --------------------------------------------------- */

    vardiyalar: () => api.get<VardiyaPlaniDto>(`${TABAN}/vardiyalar`),

    /**
     * Rezervasyon ve iptal PLANIN TAMAMINI dönüyor.
     *
     * Yalnızca "tamam" dönseydi ekran ya kendi tahminiyle güncellenir (doluluk
     * sayısı yanlış kalır) ya da arkasından ikinci bir istek atardı. Sunucu
     * zaten güncel listeyi elinde tutuyor.
     */
    vardiyaRezerve: (id: string) => api.post<VardiyaPlaniDto>(`${TABAN}/vardiya/${yol(id)}/rezerve`),

    vardiyaIptal: (id: string) => api.post<VardiyaPlaniDto>(`${TABAN}/vardiya/${yol(id)}/iptal`),

    /* --- Özet ---------------------------------------------------------- */

    ozet: () => api.get<KuryeOzetiDto>(`${TABAN}/ozet`),
  };
}
