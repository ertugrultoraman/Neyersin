import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, katalog, renk, yaricap } from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = katalog(api);

/**
 * HAKKINDA — "biz kimiz" ve "nasıl şef olunur".
 *
 * UZUN ANLATI SAYFALARI TARAYICIDA AÇILIYOR: hakkımızda, ev hanımları,
 * işletmeler ve nasıl çalışır sayfaları sürekli düzenlenen, görselli
 * sayfalar. Uygulamaya kopyalansalardı web'de değişen her cümle burada eski
 * hâliyle kalırdı — bağlantı, eskimeyen tek çözüm.
 *
 * ŞEF OLMA ADIMLARI ise burada duruyor: dört kısa madde ve başvuru düğmesinin
 * hemen üstünde olması gereken bilgi. Başvurmadan önce insanların sorduğu tek
 * şey bu.
 */
export default function HakkindaEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const veri = useVeri(() => uclar.hakkinda(), "hakkinda");

  if (veri.yukleniyor) {
    return (
      <View style={{ flex: 1, backgroundColor: renk.beyaz, justifyContent: "center" }}>
        <Stack.Screen options={{ title: "Hakkında" }} />
        <ActivityIndicator color={renk.sari[600]} />
      </View>
    );
  }

  const h = veri.veri;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      contentContainerStyle={{
        paddingTop: kenar.top + bosluk.xl,
        paddingHorizontal: bosluk.xl,
        paddingBottom: kenar.bottom + bosluk["3xl"],
        gap: bosluk.lg,
      }}
    >
      <Stack.Screen options={{ title: "Hakkında" }} />

      <View>
        <Metin baslik boyut="3xl">
          {h?.ad ?? "Ne Yersin?"}
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil}>
          {h?.slogan ?? ""}
        </Metin>
      </View>

      {h?.aciklama ? (
        <Metin boyut="sm" renkli={renk.kahve[800]}>
          {h.aciklama}
        </Metin>
      ) : null}

      {/* ŞEF OLMA YOLU — başvuru düğmesinin hemen üstünde. */}
      {(h?.sefOlmaAdimlari ?? []).length > 0 ? (
        <View style={{ gap: bosluk.sm }}>
          <Metin baslik boyut="xl">
            Nasıl şef olunur?
          </Metin>
          {(h?.sefOlmaAdimlari ?? []).map((adim) => (
            <View key={adim.no} style={{ flexDirection: "row", gap: bosluk.md }}>
              <Metin baslik boyut="lg" renkli={renk.sari[600]}>
                {adim.no}
              </Metin>
              <View style={{ flex: 1, gap: 2 }}>
                <Metin boyut="sm" agirlik="kalin">
                  {adim.baslik}
                </Metin>
                <Metin boyut="2xs" renkli={renk.kahve[700]}>
                  {adim.metin}
                </Metin>
              </View>
            </View>
          ))}
          <Dugme
            baslik="Başvuru yap"
            onPress={() => yonlendir.push("/basvuru")}
            tamGenislik
          />
        </View>
      ) : null}

      {/* İLETİŞİM — telefon ve e-posta dokununca açılıyor. */}
      <View style={{ gap: bosluk.sm }}>
        <Metin baslik boyut="xl">
          Bize ulaş
        </Metin>

        {h?.telefon ? (
          <Satir
            ikon="phone-outline"
            etiket={h.telefon}
            onPress={() => Linking.openURL(`tel:${h.telefon.replace(/\s/g, "")}`)}
          />
        ) : null}
        {h?.eposta ? (
          <Satir
            ikon="email-outline"
            etiket={h.eposta}
            onPress={() => Linking.openURL(`mailto:${h.eposta}`)}
          />
        ) : null}
        {h?.adres ? <Satir ikon="map-marker-outline" etiket={h.adres} /> : null}
      </View>

      {/* SİTEDEKİ SAYFALAR */}
      {(h?.sayfalar ?? []).length > 0 ? (
        <View style={{ gap: bosluk.sm }}>
          <Metin baslik boyut="xl">
            Daha fazlası
          </Metin>
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            Bu sayfalar tarayıcıda açılıyor.
          </Metin>
          {(h?.sayfalar ?? []).map((s) => (
            <Satir
              key={s.adres}
              ikon="open-in-new"
              etiket={s.baslik}
              onPress={() => Linking.openURL(s.adres)}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Satir({
  ikon,
  etiket,
  onPress,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  etiket: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      disabled={!onPress}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        paddingHorizontal: bosluk.md,
        paddingVertical: bosluk.md,
      }}
    >
      <MaterialCommunityIcons name={ikon} size={18} color={renk.sari[600]} />
      <Metin boyut="sm" style={{ flex: 1 }}>
        {etiket}
      </Metin>
      {onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={18} color={renk.kahve[300]} />
      ) : null}
    </Pressable>
  );
}
