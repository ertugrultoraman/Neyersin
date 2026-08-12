import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { DOKUNMA_HEDEFI, bosluk, renk, yaricap, yazi, yaziAilesi } from "../src/tasarim";

import { Metin } from "./Metin";

/**
 * Etiketli metin girdisi.
 *
 * Odaklanınca çerçeve marka sarısına dönüyor — web'deki `focus:border-sari-500/60`
 * karşılığı. Bu animasyon Reanimated'e taşınmadı: renk geçişi tek seferlik ve
 * dokunma anında olmuyor, JS thread'de kalması kare bütçesini etkilemiyor.
 *
 * Hata metni ALANIN ALTINDA duruyor ve `accessibilityLabel`e de giriyor;
 * yalnızca kırmızı çerçeve gösterilseydi ekran okuyucu kullanan biri neyin
 * yanlış olduğunu hiç öğrenemezdi.
 */
export type AlanProps = TextInputProps & {
  etiket: string;
  hata?: string;
};

export function Alan({ etiket, hata, style, ...kalan }: AlanProps) {
  const [odakli, setOdakli] = useState(false);

  const cerceve = hata ? renk.domates : odakli ? renk.sari[500] : renk.cizgi;

  return (
    <View style={{ gap: bosluk.xs }}>
      <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[700]} style={{ letterSpacing: 0.4 }}>
        {etiket.toLocaleUpperCase("tr-TR")}
      </Metin>

      <TextInput
        accessibilityLabel={hata ? `${etiket}. Hata: ${hata}` : etiket}
        placeholderTextColor={renk.kahve[300]}
        onFocus={(o) => {
          setOdakli(true);
          kalan.onFocus?.(o);
        }}
        onBlur={(o) => {
          setOdakli(false);
          kalan.onBlur?.(o);
        }}
        style={[
          {
            minHeight: DOKUNMA_HEDEFI,
            paddingHorizontal: bosluk.lg,
            paddingVertical: bosluk.md,
            borderRadius: yaricap.lg,
            borderWidth: hata || odakli ? 2 : 1,
            borderColor: cerceve,
            backgroundColor: renk.beyaz,
            color: renk.kahve[900],
            fontFamily: yaziAilesi.govdeOrta,
            ...yazi.md,
          },
          style,
        ]}
        {...kalan}
      />

      {hata ? (
        <Metin boyut="xs" agirlik="orta" renkli={renk.domatesKoyu}>
          {hata}
        </Metin>
      ) : null}
    </View>
  );
}
