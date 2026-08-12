import { Sayfa, Yakinda } from "ortak/ui";

/**
 * KEŞFET — müşterinin ana ekranı.
 *
 * Gerçek içeriği (adres seçimi, arama, kategori rayı, restoran listesi)
 * katalog uçları açıldığında geliyor. Liste FlashList ile çizilecek:
 * restoran listesi uzun ve 120 Hz'de FlatList kare atlıyor.
 */
export default function KesfetEkrani() {
  return (
    <Sayfa baslik="Ne yersin?" altBaslik="Beylikdüzü / İstanbul">
      <Yakinda ne="Restoran listesi, arama ve kategoriler; sunucudaki katalog uçları açıldığında bu ekrana gelecek." />
    </Sayfa>
  );
}
