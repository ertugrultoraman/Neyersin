import type {
  MutfakMenusuDto,
  MutfakOzetiDto,
  MutfakSiparisDto,
  MutfakUrunDto,
  SefProfiliDto,
  SefProfiliGirdisi,
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

    /** Şefin kendi profili — mutfağın "kim pişiriyor" tarafı. */
    profil: () => api.get<SefProfiliDto>(`${TABAN}/profil`),

    /**
     * Profili kaydeder.
     *
     * GALERİ VE ALTIN ŞEF bu girdide YOK ve olmamalı: kareler ayrı bir uçtan
     * yükleniyor, unvanı yalnızca yönetici veriyor. Sunucu ikisini de mevcut
     * kayıttan koruyor.
     */
    profilKaydet: (girdi: SefProfiliGirdisi) =>
      api.post<{ basari: string }>(`${TABAN}/profil`, girdi),

    /**
     * Mutfaktan bir kare yükler.
     *
     * TELEFONDAN YÜKLEME asıl yeri: fotoğraf zaten telefonda çekiliyor.
     * `uri` cihazın yerel dosya adresi; React Native'in fetch'i bu biçimi
     * (uri + name + type) multipart gövdeye kendisi çeviriyor.
     */
    kareYukle: (dosya: { uri: string; ad: string; tur: string }) => {
      const form = new FormData();
      form.append("kare", {
        uri: dosya.uri,
        name: dosya.ad,
        type: dosya.tur,
      } as unknown as Blob);
      return api.post<{ galeri: string[] }>(`${TABAN}/kare`, form);
    },

    kareSil: (url: string) =>
      api.istek<{ galeri: string[] }>(`${TABAN}/kare`, {
        yontem: "DELETE",
        sorgu: { url },
      }),
  };
}
