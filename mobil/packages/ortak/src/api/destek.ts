import type { DestekDto, DestekGirdisi } from "../tipler";
import type { ApiIstemcisi } from "./istemci";

const TABAN = "/api/mobil/v1/destek";

/**
 * DESTEK UÇLARI — her rol için.
 *
 * Kurye istemcisindeki `destek`/`destekAc` ile aynı işi yapıyor ama ROL
 * KISITI YOK: müşteri, şef ve işletme de buradan geçiyor. Talepler tek bir
 * listeye düşüyor — yönetici iki ayrı ekran gezmek zorunda kalmasın.
 *
 * Kurye uygulaması kendi ucunu kullanmaya devam ediyor: orada ekran zaten
 * kurulmuş durumda ve iki uç aynı depoyu okuyor.
 */
export function destek(api: ApiIstemcisi) {
  return {
    /** Yetkilinin telefonu + kişinin kendi talepleri. */
    ozet: () => api.get<DestekDto>(TABAN),

    /**
     * Yeni talep açar ve listenin güncel hâlini döndürür.
     *
     * Mesaj en az 10 karakter olmalı (sunucu kuralı): "yardım" diye tek
     * kelimelik bir talep, yöneticinin geri dönüp sormasından başka bir şey
     * üretmiyor.
     */
    ac: (girdi: DestekGirdisi) => api.post<DestekDto>(TABAN, girdi),
  };
}
