import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, View } from "react-native";

import { bosluk, renk, yaricap, yazi, yaziAilesi } from "ortak";
import { Metin } from "ortak/ui";

/**
 * MARKA ŞERİDİ — web'deki sarı başlığın uygulamadaki karşılığı.
 *
 * Şerit SARI ve yazı MÜREKKEP: sitenin üst bandıyla aynı. Uygulamanın açılış
 * ekranı beyaz bir listeyle başlıyordu ve markadan hiçbir iz taşımıyordu;
 * telefonunda on tane yemek uygulaması olan biri için hangi uygulamada
 * olduğunu söyleyen tek şey bu şerit.
 *
 * MENÜ DÜĞMESİ SOLDA, logonun önünde: kategoriler oradan açılıyor. Sağa
 * konsaydı tek elle kullanımda başparmağın en zor ulaştığı köşeye düşerdi —
 * ve web'de de menü, markanın bulunduğu tarafta duruyor.
 */
export function MarkaSerit({
  ustBosluk,
  menuAc,
  suzgecSayisi,
}: {
  /** Çentik boşluğu — şerit onun altından değil, İÇİNDEN başlıyor. */
  ustBosluk: number;
  menuAc: () => void;
  /** Menüde kaç süzgeç seçili — düğmenin üstünde küçük bir sayı olarak. */
  suzgecSayisi: number;
}) {
  return (
    <View
      style={{
        backgroundColor: renk.sari[500],
        paddingTop: ustBosluk + bosluk.sm,
        paddingBottom: bosluk.md,
        paddingHorizontal: bosluk.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menü"
        onPress={menuAc}
        hitSlop={10}
        style={{
          width: 42,
          height: 42,
          borderRadius: yaricap.lg,
          backgroundColor: "rgba(20, 18, 16, 0.10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons name="menu" size={24} color={renk.murekkep} />

        {/* Seçili süzgeç sayısı — menüyü açmadan da görünsün. */}
        {suzgecSayisi > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              borderRadius: yaricap.tam,
              backgroundColor: renk.murekkep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Metin boyut="2xs" agirlik="kalin" renkli={renk.sari[500]}>
              {suzgecSayisi}
            </Metin>
          </View>
        ) : null}
      </Pressable>

      {/*
        KELİME MARKASI — web'deki `MarkaLogo` ile aynı: "Ne Yersin" + soru
        işareti. Sarı zeminde soru işareti de mürekkep rengi; sarının üstünde
        sarı bir işaret tamamen kayboluyordu (web'de de aynı düzeltme yapıldı).
      */}
      <View style={{ flex: 1 }}>
        <Metin
          baslik
          agirlik="kalin"
          renkli={renk.murekkep}
          style={{ ...yazi["2xl"], fontFamily: yaziAilesi.baslik, letterSpacing: -0.5 }}
        >
          Ne Yersin?
        </Metin>
        <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[800]}>
          Komşunun mutfağından, kapına kadar
        </Metin>
      </View>
    </View>
  );
}
