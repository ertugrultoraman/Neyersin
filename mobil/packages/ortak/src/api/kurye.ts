import type { KuryeAdimGirdisi, KuryeTeslimatiDto, SiparisDurumu } from "../tipler";
import type { ApiIstemcisi } from "./istemci";

const TABAN = "/api/mobil/v1/kurye";

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
        `${TABAN}/teslimat/${encodeURIComponent(siparisNo)}/durum`,
        { hedef },
      ),
  };
}
