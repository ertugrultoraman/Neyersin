import { Sayfa, Yakinda } from "ortak/ui";

/**
 * AKTIF TESLIMAT — harita, rota ve teslim adimlari.
 *
 * Bu ekran acikken arka plan konum servisi calisiyor ve musterinin canli
 * takibi buradan besleniyor. Teslim tamamlaninca paylasim duruyor.
 */
export default function TeslimatEkrani() {
  return (
    <Sayfa baslik="Aktif teslimat">
      <Yakinda ne="Harita, rota ve teslim adimlari; konum uclari ve harita anahtari hazir oldugunda bu ekrana gelecek." />
    </Sayfa>
  );
}
