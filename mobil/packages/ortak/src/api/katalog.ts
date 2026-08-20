import type {
  AnasayfaDto,
  AnketDto,
  HakkindaDto,
  KategoriDto,
  SiralamaDto,
  SiralamaOlcutu,
  RestoranDetayDto,
  RestoranOzetDto,
  SepetGirdisi,
  SepetOzetiDto,
} from "../tipler";
import type { ApiIstemcisi } from "./istemci";

/**
 * KATALOG UÇLARI — adreslerin tek kaynağı.
 *
 * Ekranlar `api.get("/api/mobil/v1/katalog/…")` yazmıyor. Adres ekranın içine
 * gömülseydi bir uç taşındığında hangi ekranların kırıldığı ancak çalışma
 * anında görülürdü; burada tek dosya değişiyor ve tip uyuşmazlığı derlemede
 * yakalanıyor.
 *
 * Uçlar JETON İSTEMİYOR ama istemci yine de varsa gönderiyor: sunucu tarafı
 * `acik()` ile sarılı, yani oturum varsa çözüyor. İleride "son sipariş
 * verdiğin mutfak" gibi kişisel alanlar eklenirse istemci tarafında değişiklik
 * gerekmeyecek.
 */

const TABAN = "/api/mobil/v1/katalog";

export type RestoranSuzgeci = {
  kategori?: string;
  ara?: string;
  tur?: "sef" | "isletme";
};

/**
 * Sorgu dizesi.
 *
 * Boş/uzunluğu sıfır değerler ATILIYOR: `?ara=` göndermek sunucuda boş arama
 * demek ve şu an zararsız, ama süzgeç listesinin "hangi anahtarlar gerçekten
 * seçili" bilgisini bulanıklaştırıyor — önbellek anahtarı olarak da kullanılan
 * bu dizenin, aynı sonucu veren iki farklı hâli olmamalı.
 */
function sorgu(suzgec: RestoranSuzgeci): string {
  const parcalar = new URLSearchParams();
  if (suzgec.kategori) parcalar.set("kategori", suzgec.kategori);
  const ara = suzgec.ara?.trim();
  if (ara) parcalar.set("ara", ara);
  if (suzgec.tur) parcalar.set("tur", suzgec.tur);
  const metin = parcalar.toString();
  return metin ? `?${metin}` : "";
}

export function katalog(api: ApiIstemcisi) {
  return {
    restoranlar: (suzgec: RestoranSuzgeci = {}) =>
      api.get<RestoranOzetDto[]>(`${TABAN}/restoranlar${sorgu(suzgec)}`),

    restoran: (slug: string) =>
      api.get<RestoranDetayDto>(`${TABAN}/restoran/${encodeURIComponent(slug)}`),

    kategoriler: () => api.get<KategoriDto[]>(`${TABAN}/kategoriler`),

    /**
     * Keşfet ekranının üst bölümü — web ana sayfasının karşılığı.
     *
     * Mutfak listesinden AYRI: liste süzgeçlerle (kategori, arama) her
     * değiştiğinde yenileniyor, bu bölüm ise sabit. Aynı uçta olsalardı
     * kullanıcı her harf yazdığında kampanyalar ve anket de yeniden inerdi.
     */
    anasayfa: () => api.get<AnasayfaDto>(`${TABAN}/anasayfa`),

    /**
     * Şef sıralaması — üç ölçüt (sipariş, beğeni, kaşık).
     *
     * Sekme değiştirince yeniden isteniyor ama cevap üç sayıyı da taşıdığı
     * için satırın altındaki ayrıntı beklemeden çiziliyor.
     */
    siralama: (olcut: SiralamaOlcutu = "siparis") =>
      api.get<SiralamaDto>(`${TABAN}/siralama?olcut=${olcut}`),

    /** Marka bilgisi, iletişim, şef olma adımları ve sitedeki uzun sayfalar. */
    hakkinda: () => api.get<HakkindaDto>(`${TABAN}/hakkinda`),

    /**
     * Ankete oy verir; cevap GÜNCEL SAYILAR.
     *
     * Oy gönderip sonucu görmek için ikinci bir istek atılmıyor: kullanıcı
     * seçeneğe dokunduğu anda yüzdeleri görmeli, bir tur daha beklememeli.
     *
     * `cihaz`: girişsiz oy verenin kimliği (bkz. ortak/native →
     * cihazKimligiAl). Web'de bunun karşılığı çerezdeki misafir kimliği.
     */
    anketOyVer: (girdi: { anketId: string; secenekId: string; cihaz: string }) =>
      api.post<AnketDto>("/api/mobil/v1/anket/oy", girdi),

    /**
     * Sepetin parasını sunucu hesaplıyor.
     *
     * Katalogla aynı dosyada çünkü aynı sözleşmenin parçası: uygulama ürün
     * kimliği gönderiyor, fiyatı buradan öğreniyor. Adresi `/katalog` altında
     * değil, ayrı — sepet bir liste değil, bir hesap.
     */
    sepetOzeti: (girdi: SepetGirdisi) =>
      api.post<SepetOzetiDto>("/api/mobil/v1/sepet/ozet", girdi),
  };
}
