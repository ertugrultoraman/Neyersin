import type {
  YonetimBasvurusuDto,
  YonetimDestekDto,
  YonetimFiyatTalebiDto,
  YonetimOzetiDto,
} from "../tipler";
import type { ApiIstemcisi } from "./istemci";

const TABAN = "/api/mobil/v1/yonetim";

/**
 * YÖNETİM UÇLARI — yalnızca yönetici.
 *
 * Web'deki /admin panelinin telefondaki karşılığı ve bilerek DAR: bekleyen
 * başvurular, fiyat onayları, destek talepleri. Hesap silme, rol değiştirme,
 * vekaleten giriş gibi geri dönüşü zor işler burada YOK — onlar iki kez
 * düşünülerek, masa başında yapılmalı.
 */
export function yonetim(api: ApiIstemcisi) {
  return {
    ozet: () => api.get<YonetimOzetiDto>(`${TABAN}/ozet`),

    basvurular: () => api.get<YonetimBasvurusuDto[]>(`${TABAN}/basvurular`),

    /**
     * Başvuruyu onaylar ya da reddeder.
     *
     * `rol` onayda zorunlu: yönetici kişinin ne olacağına burada karar veriyor
     * (başvuruda seçtiği tür bir talep, karar değil). `semt` mutfak açılan
     * rollerde mutfağın semti oluyor.
     */
    basvuruKarar: (
      id: string,
      girdi: { karar: "onayla" | "reddet"; rol?: string; semt?: string; not?: string },
    ) => api.post<{ basari: string }>(`${TABAN}/basvuru/${encodeURIComponent(id)}`, girdi),

    fiyatlar: () => api.get<YonetimFiyatTalebiDto[]>(`${TABAN}/fiyatlar`),

    fiyatKarar: (urunId: string, karar: "onayla" | "reddet") =>
      api.post<{ basari: string }>(`${TABAN}/fiyat/${encodeURIComponent(urunId)}`, { karar }),

    destek: () => api.get<YonetimDestekDto[]>(`${TABAN}/destek`),

    /**
     * Talebe yanıt yazar ve/veya durumunu değiştirir.
     *
     * İkisi ayrı alan: yanıt yazmak "çözüldü" demek değil — yönetici ara
     * bilgi verip talebi açık tutabilmeli.
     */
    destekGuncelle: (id: string, girdi: { yanit?: string; durum?: "acik" | "cozuldu" }) =>
      api.post<{ basari: string }>(`${TABAN}/destek/${encodeURIComponent(id)}`, girdi),
  };
}
