import { kuponUygula } from "@/content/kampanyalar";
import { restoranCoz } from "../restoran-listesi";
import { urunCoz } from "../mutfak-menusu";
import { kalemBirimFiyati, tutarlariHesapla, type SiparisKalemi } from "../siparis";
import type { SepetGirdisi, SepetOzetiDto, SiparisKalemDto } from "./tipler";

/**
 * SEPET ÖZETİ — uygulamanın gönderdiği kimlikleri paraya çeviren tek yer.
 *
 * Uygulama fiyat göndermiyor, göndermemeli (bkz. SepetGirdisi). Burada her
 * ürün `urunCoz` ile yeniden çözülüyor; bu, ödeme akışının kullandığı
 * fonksiyonun AYNISI. İkisi ayrı olsaydı sepette görünen tutar ile çekilen
 * tutar ayrışabilirdi.
 *
 * Ekstralar da ÜRÜNÜN KENDİ listesinden doğrulanıyor: uygulama yalnızca ekstra
 * kimliği yolluyor, adı ve fiyatı sunucudan geliyor. Aksi hâlde "0 TL ekstra
 * peynir" göndermek mümkün olurdu.
 */
export async function sepetOzeti(girdi: SepetGirdisi): Promise<SepetOzetiDto | null> {
  const restoran = await restoranCoz(girdi.restoranSlug);
  if (!restoran) return null;

  const kalemler: SiparisKalemi[] = [];
  const dusenKalemler: string[] = [];

  for (const istenen of girdi.kalemler) {
    const adet = Math.min(99, Math.max(1, Math.trunc(istenen.adet)));
    const urun = await urunCoz(girdi.restoranSlug, istenen.urunId);

    /*
     * Fiyatı girilmemiş (taslak) ürün de düşüyor. Menüde görünüyor ama
     * sipariş edilemiyor — 0 TL'ye satılmasındansa sepetten çıkması doğru.
     */
    if (!urun || urun.taslak || urun.fiyat <= 0) {
      dusenKalemler.push(istenen.urunId);
      continue;
    }

    const secilenler = (istenen.ekstraIdler ?? [])
      .map((id) => urun.ekstralar?.find((e) => e.id === id))
      .filter((e) => e !== undefined);

    kalemler.push({
      /*
       * Satır kimliği ürün + seçili ekstralardan türüyor: aynı ürünün farklı
       * ekstra bileşimi ayrı satır. Web tarafındaki `satirIdUret` ile aynı
       * kural — iki platformun sepeti aynı biçimde gruplansın.
       */
      satirId:
        secilenler.length === 0
          ? urun.id
          : `${urun.id}::${secilenler.map((e) => e.id).sort().join(",")}`,
      urunId: urun.id,
      ad: urun.ad,
      fiyat: urun.fiyat,
      adet,
      ...(secilenler.length > 0
        ? { ekstralar: secilenler.map((e) => ({ id: e.id, ad: e.ad, fiyat: e.fiyat })) }
        : {}),
    });
  }

  const araToplam = kalemler.reduce((t, k) => t + kalemBirimFiyati(k) * k.adet, 0);

  /*
   * Kupon İKİ KEZ değerlendiriliyor gibi görünüyor ama sebebi var:
   * `tutarlariHesapla` geçersiz kuponu sessizce yok sayıp indirimi sıfırlıyor.
   * Kullanıcıya "kupon neden tutmadı" diyebilmek için sebebi ayrıca almak
   * gerekiyor — sessiz sıfır, kişinin kodu yanlış yazdığını fark etmesini
   * engellerdi.
   */
  const kuponKodu = girdi.kuponKodu?.trim();
  const kuponSonucu = kuponKodu ? kuponUygula(kuponKodu, araToplam) : undefined;

  return {
    kalemler: kalemler.map(
      (k): SiparisKalemDto => ({
        satirId: k.satirId,
        urunId: k.urunId,
        ad: k.ad,
        fiyat: k.fiyat,
        adet: k.adet,
        ...(k.ekstralar ? { ekstralar: k.ekstralar } : {}),
      }),
    ),
    tutarlar: tutarlariHesapla(kalemler, girdi.restoranSlug, kuponKodu, restoran),
    dusenKalemler,
    ...(kuponSonucu && !kuponSonucu.gecerli ? { kuponHatasi: kuponSonucu.hata } : {}),
  };
}
