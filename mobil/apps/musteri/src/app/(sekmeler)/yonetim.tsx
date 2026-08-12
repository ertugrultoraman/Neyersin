import { Sayfa, Yakinda } from "ortak/ui";

/**
 * YÖNETİM — yönetici paneli.
 *
 * Web'deki panel çok geniş (başvurular, fiyat onayı, rozetler, anketler…);
 * mobile önce sahada gereken kısmı geliyor: bekleyen onaylar ve sipariş
 * atama.
 */
export default function YonetimEkrani() {
  return (
    <Sayfa baslik="Yönetim">
      <Yakinda ne="Bekleyen başvurular, fiyat onayları ve sipariş atama; yönetim uçları açıldığında bu ekrana gelecek." />
    </Sayfa>
  );
}
