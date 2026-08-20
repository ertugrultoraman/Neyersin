import type {
  MutfakMenusuDto,
  MutfakOzetiDto,
  MutfakSiparisDto,
  MutfakUrunDto,
  UrunKaydetGirdisi,
} from "../tipler";
import type { ApiIstemcisi } from "./istemci";

const TABAN = "/api/mobil/v1/mutfak";

/**
 * MUTFAK UÇLARI — şefin/işletmenin kendi paneli.
 *
 * Sipariş uçlarından ayrı bir dosya: oradakiler MÜŞTERİNİN kendi siparişine
 * bakıyor, buradakiler mutfağa DÜŞEN siparişlere. Aynı dosyada olsalardı
 * "detay" ile "tahtadaki satır" birbirine karışırdı.
 *
 * Hepsi rol istiyor (sef / isletme / admin); sunucu tarafı `korumali` ile
 * sarılı. Uygulamada sekmenin gizli olması yalnızca görsel bir önlem.
 */
export function mutfak(api: ApiIstemcisi) {
  return {
    /** Panelin üstündeki sayılar: bugünkü sipariş, ciro, bekleyen iş. */
    ozet: () => api.get<MutfakOzetiDto>(`${TABAN}/ozet`),

    siparisler: () => api.get<MutfakSiparisDto[]>(`${TABAN}/siparisler`),

    /**
     * "Hazır" — kurye artık alabilir.
     *
     * Cevap siparişin GÜNCEL HÂLİ: liste baştan çekilmeden satır yerinde
     * güncelleniyor.
     */
    hazir: (siparisNo: string) =>
      api.post<MutfakSiparisDto>(`${TABAN}/siparis/${encodeURIComponent(siparisNo)}/hazir`),

    /** Menü + bölüm listesi. Bölümler aynı cevapta: form onlarsız çizilemiyor. */
    menu: () => api.get<MutfakMenusuDto>(`${TABAN}/urunler`),

    /** Ürün ekler ya da günceller (`id` varsa günceller). */
    urunKaydet: (girdi: UrunKaydetGirdisi) =>
      api.post<MutfakUrunDto>(`${TABAN}/urunler`, girdi),

    /**
     * Ürünü menüden kaldırır.
     *
     * `istek` üzerinden çağrılıyor çünkü istemcide DELETE kısayolu yok —
     * silme uygulamada tek yerde geçiyor, onun için ayrı bir yöntem eklemek
     * yerine genel yol kullanıldı.
     */
    urunSil: (id: string) =>
      api.istek<{ id: string; ad: string }>(`${TABAN}/urun/${encodeURIComponent(id)}`, {
        yontem: "DELETE",
      }),
  };
}
