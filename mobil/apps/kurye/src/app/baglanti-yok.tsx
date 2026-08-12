import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, renk } from "ortak";

import { useOturum } from "ortak/oturum";
import { Bosluk, Dugme } from "ortak/ui";
import { Metin } from "ortak/ui";

/**
 * BAĞLANTI YOK — cihazda geçerli jeton var ama sunucuya ulaşılamadı.
 *
 * Bu ekran bilerek giriş ekranından AYRI. Kullanıcıyı giriş formuna
 * düşürseydik, parolasını yeniden yazardı ve o da başarısız olurdu — sorun
 * kimlikte değil, bağlantıda. Burada tek anlamlı eylem tekrar denemek.
 *
 * Çıkış düğmesi de var: kalıcı bir sorunda (ör. sunucu adresi değişti)
 * kullanıcı hesabını değiştirebilmeli, ekranda kilitli kalmamalı.
 */
export default function BaglantiYokEkrani() {
  const { tazele, cikisYap } = useOturum();
  const kenar = useSafeAreaInsets();
  const [deniyor, setDeniyor] = useState(false);

  async function tekrarDene() {
    setDeniyor(true);
    try {
      await tazele();
    } finally {
      setDeniyor(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: renk.beyaz,
        justifyContent: "center",
        paddingHorizontal: bosluk.xl,
        paddingTop: kenar.top,
        paddingBottom: kenar.bottom,
      }}
    >
      <Metin baslik boyut="2xl" ortala>
        Bağlantı kurulamadı
      </Metin>

      <Bosluk y={bosluk.md} />

      <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
        İnternet bağlantını kontrol edip tekrar dene. Oturumun açık kalmaya
        devam ediyor.
      </Metin>

      <Bosluk y={bosluk["2xl"]} />

      <Dugme baslik="Tekrar dene" onPress={tekrarDene} bekliyor={deniyor} tamGenislik />

      <Bosluk y={bosluk.md} />

      <Dugme baslik="Çıkış yap" tur="sade" onPress={cikisYap} pasif={deniyor} tamGenislik />
    </View>
  );
}
