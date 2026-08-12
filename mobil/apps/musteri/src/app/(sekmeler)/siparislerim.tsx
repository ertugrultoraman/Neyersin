import { Sayfa, Yakinda } from "ortak/ui";

/**
 * SİPARİŞLERİM — geçmiş ve devam eden siparişler.
 *
 * Devam eden sipariş varsa en üstte canlı takip kartı duracak; kurye konumu
 * buradan haritaya açılacak.
 */
export default function SiparislerimEkrani() {
  return (
    <Sayfa baslik="Siparişlerim">
      <Yakinda ne="Sipariş geçmişi ve canlı teslimat takibi; sipariş uçları açıldığında bu ekrana gelecek." />
    </Sayfa>
  );
}
