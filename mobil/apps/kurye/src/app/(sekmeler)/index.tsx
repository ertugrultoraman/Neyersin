import { Sayfa, Yakinda } from "ortak/ui";

/**
 * TEKLIFLER — kuryeye dusen is teklifleri.
 *
 * Teklif geldiginde push bildirimi caliyor; ekran acikken de liste kendini
 * tazeliyor. Her teklifin bir gecerlilik suresi var (bkz. TeklifDto) ve
 * geri sayim bittiginde teklif listeden dusuyor.
 */
export default function TekliflerEkrani() {
  return (
    <Sayfa baslik="Teklifler" altBaslik="Yakinindaki isler">
      <Yakinda ne="Is teklifleri, kabul/ret akisi ve geri sayim; kurye uclari acildiginda bu ekrana gelecek." />
    </Sayfa>
  );
}
