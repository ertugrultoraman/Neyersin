import { Text, type TextProps, type TextStyle } from "react-native";

import { renk, yazi, yaziAilesi } from "../src/tasarim";

/**
 * Uygulamanın tek metin bileşeni.
 *
 * Ham `<Text>` kullanılmıyor: React Native'in varsayılanı sistem yazı tipi ve
 * siyah renk. Marka yazı tipini her kullanımda elle vermek gerekseydi, bir
 * yerde unutulduğunda ekranda tek bir sistem fontlu satır kalır ve bu göze
 * ancak cihazda bakınca çarpardı.
 */

type Tur = keyof typeof yazi;
type Agirlik = "normal" | "orta" | "kalin";

export type MetinProps = TextProps & {
  /** Tipografi ölçeği (bkz. ortak/tasarim → yazi). */
  boyut?: Tur;
  /** Başlıklar yuvarlak Baloo, gövde Manrope. */
  baslik?: boolean;
  agirlik?: Agirlik;
  renkli?: string;
  ortala?: boolean;
};

export function Metin({
  boyut = "md",
  baslik = false,
  agirlik = "normal",
  renkli,
  ortala = false,
  style,
  ...kalan
}: MetinProps) {
  const aile = baslik
    ? agirlik === "normal"
      ? yaziAilesi.baslikOrta
      : yaziAilesi.baslik
    : agirlik === "kalin"
      ? yaziAilesi.govdeKalin
      : agirlik === "orta"
        ? yaziAilesi.govdeOrta
        : yaziAilesi.govde;

  const temel: TextStyle = {
    ...yazi[boyut],
    fontFamily: aile,
    color: renkli ?? (baslik ? renk.baslik : renk.metin),
    ...(ortala ? { textAlign: "center" } : null),
    ...(baslik ? { letterSpacing: -0.015 * yazi[boyut].fontSize } : null),
  };

  return <Text style={[temel, style]} {...kalan} />;
}
