import type {
  SiparisDetayDto,
  SiparisOlusturGirdisi,
  SiparisOlusturSonucu,
  SiparisOzetDto,
} from "../tipler";
import type { ApiIstemcisi } from "./istemci";

/**
 * SİPARİŞ UÇLARI.
 *
 * Katalogdan ayrı bir dosya çünkü hepsi GİRİŞ İSTİYOR: istemci jetonu
 * otomatik ekliyor, 401 alırsa yenileme jetonuyla tazeleyip isteği bir kez
 * tekrarlıyor (bkz. api/istemci.ts). Katalog uçları jetonsuz da çalışıyor.
 */
export function siparis(api: ApiIstemcisi) {
  return {
    olustur: (girdi: SiparisOlusturGirdisi) =>
      api.post<SiparisOlusturSonucu>("/api/mobil/v1/siparis", girdi),

    listele: () => api.get<SiparisOzetDto[]>("/api/mobil/v1/siparisler"),

    detay: (siparisNo: string) =>
      api.get<SiparisDetayDto>(`/api/mobil/v1/siparis/${encodeURIComponent(siparisNo)}`),

    /**
     * İptal. Sunucu 409 döndüğünde sebep `ApiHatasi.message` içinde geliyor
     * ("artık iptal edilemez" gibi) ve olduğu gibi gösterilebiliyor.
     */
    iptal: (siparisNo: string) =>
      api.post<{ siparisNo: string }>(
        `/api/mobil/v1/siparis/${encodeURIComponent(siparisNo)}/iptal`,
      ),
  };
}
