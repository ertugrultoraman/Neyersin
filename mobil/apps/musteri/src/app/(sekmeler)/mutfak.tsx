import { Sayfa, Yakinda } from "ortak/ui";

/**
 * MUTFAK — şef ve işletme hesaplarının sipariş tahtası.
 *
 * İşletme ÇALIŞANI yalnızca bu ekranı görüyor; fiyat ve çalışma saati
 * yönetimi sahibe ait (bkz. lib/oturum.ts → isletmeSahibiMi).
 */
export default function MutfakEkrani() {
  return (
    <Sayfa baslik="Gelen siparişler">
      <Yakinda ne="Sipariş tahtası, hazırlama adımları ve menü yönetimi; mutfak uçları açıldığında bu ekrana gelecek." />
    </Sayfa>
  );
}
