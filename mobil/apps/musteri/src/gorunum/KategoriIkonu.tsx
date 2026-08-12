import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import type { KategoriIkonAdi } from "ortak";

/**
 * Kategori ikonları.
 *
 * Sunucu bir GÖRSEL ADRESİ değil ikon ADI gönderiyor (bkz. KategoriDto):
 * ikonlar vektör ve bulundukları rayın rengine göre boyanıyor. Eşleme burada
 * çünkü seçilen simge takımı uygulamaya ait bir karar — sunucu "bu kategori
 * kebap" demekle yetiniyor.
 *
 * Web'deki elle çizilmiş SVG'ler taşınmadı: react-native-svg bağımlılığı
 * eklemek, on iki simge için paket boyutu ve bir de köprü maliyeti demekti.
 * `@expo/vector-icons` zaten kurulu ve simgeler yazı tipi olarak geliyor.
 *
 * DÖNER için birebir simge yok; `taco` (dürüm) en yakın okunanı. Kebap
 * `grill`, tavuk `food-drumstick` aldığı için üçü birbirine karışmıyor.
 */
const ESLEME: Record<KategoriIkonAdi, keyof typeof MaterialCommunityIcons.glyphMap> = {
  burger: "hamburger",
  pizza: "pizza",
  doner: "taco",
  tavuk: "food-drumstick",
  kebap: "grill",
  "ev-yemegi": "food-variant",
  tatli: "cupcake",
  kahve: "coffee",
  borek: "food-croissant",
  balik: "fish",
  vegan: "leaf",
  market: "cart",
};

export function KategoriIkonu({
  ikon,
  boyut = 24,
  renkli,
}: {
  ikon: KategoriIkonAdi;
  boyut?: number;
  renkli: string;
}) {
  return <MaterialCommunityIcons name={ESLEME[ikon]} size={boyut} color={renkli} />;
}
