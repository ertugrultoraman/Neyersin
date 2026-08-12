import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { bosluk, egri, golge, renk, sure, yaricap, type RestoranOzetDto } from "ortak";
import { Metin } from "ortak/ui";

const EGRI = Easing.bezier(egri.yumusak[0], egri.yumusak[1], egri.yumusak[2], egri.yumusak[3]);

/** Web'deki `RestoranKapak` yer tutucusuyla aynı palet. */
const ZEMINLER = [
  renk.sari[400],
  renk.kahve[600],
  renk.domates,
  renk.nane,
  renk.sari[600],
  renk.kahve[700],
];

/**
 * Fotoğrafı olmayan mutfağın zemini adından türüyor — aynı mutfak her açılışta
 * AYNI rengi alsın diye. Rastgele seçilseydi liste her kaydırmada renk
 * değiştirir, kullanıcı tanıdığı kartı bulamazdı.
 */
function tohum(metin: string): number {
  let t = 0;
  for (let i = 0; i < metin.length; i++) t = (t * 31 + metin.charCodeAt(i)) >>> 0;
  return t;
}

/**
 * Keşfet listesinin kartı.
 *
 * `memo` ile sarılı: FlashList kaydırırken görünür olmayan satırları geri
 * dönüştürüyor ve süzgeç değiştiğinde üst bileşen yeniden render oluyor.
 * Sarılmasaydı her tazelemede ekrandaki bütün kartlar yeniden çizilirdi —
 * 120 Hz'de kare bütçesi 8.3 ms, bu iş oraya sığmıyor.
 */
export const RestoranKarti = memo(function RestoranKarti({
  restoran,
  onPress,
}: {
  restoran: RestoranOzetDto;
  onPress: (slug: string) => void;
}) {
  const olcek = useSharedValue(1);
  const animasyon = useAnimatedStyle(() => ({ transform: [{ scale: olcek.value }] }));

  const zemin = ZEMINLER[tohum(restoran.slug) % ZEMINLER.length];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${restoran.ad}, ${restoran.mutfak}`}
      onPress={() => onPress(restoran.slug)}
      onPressIn={() => {
        olcek.value = withTiming(0.97, { duration: sure.ani, easing: EGRI });
      }}
      onPressOut={() => {
        olcek.value = withTiming(1, { duration: sure.hizli, easing: EGRI });
      }}
    >
      <Animated.View
        style={[
          {
            borderRadius: yaricap["2xl"],
            backgroundColor: renk.beyaz,
            boxShadow: golge.yumusak,
            overflow: "hidden",
          },
          animasyon,
        ]}
      >
        <View style={{ height: 152, backgroundColor: zemin }}>
          {restoran.gorselUrl ? (
            <Image
              source={{ uri: restoran.gorselUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              /*
               * `transition` expo-image'in kendi çözülme animasyonu; JS
               * thread'e uğramadan çalışıyor. Görsel önbellekten gelirse
               * anında, ağdan gelirse yumuşak açılıyor.
               */
              transition={sure.normal}
            />
          ) : (
            /* Fotoğraf yoksa baş harf — web'deki yer tutucunun karşılığı. */
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Metin baslik boyut="4xl" renkli="rgba(255,255,255,0.55)">
                {restoran.ad.charAt(0)}
              </Metin>
            </View>
          )}

          {!restoran.acik ? (
            /*
             * Kapalı mutfak listeden ÇIKARILMIYOR, üstü örtülüyor: kullanıcı
             * dün sipariş verdiği yeri bugün hiç bulamazsa uygulamanın
             * bozulduğunu düşünür. Menüsüne bakabiliyor, sipariş veremiyor.
             */
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundColor: "rgba(20, 18, 16, 0.55)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Metin baslik boyut="lg" renkli={renk.beyaz}>
                Şu an kapalı
              </Metin>
            </View>
          ) : null}
        </View>

        <View style={{ padding: bosluk.lg, gap: bosluk.xs }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
            <Metin baslik boyut="lg" style={{ flex: 1 }} numberOfLines={1}>
              {restoran.ad}
            </Metin>
            {restoran.puan > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <MaterialCommunityIcons name="star" size={16} color={renk.sari[600]} />
                <Metin boyut="sm" agirlik="kalin">
                  {restoran.puan.toFixed(1)}
                </Metin>
                <Metin boyut="xs" renkli={renk.metinIkincil}>
                  ({restoran.yorumSayisi})
                </Metin>
              </View>
            ) : (
              /* Puanı olmayan mutfak sıfır yıldız GÖSTERMİYOR — web'de de öyle. */
              <Metin boyut="xs" renkli={renk.metinIkincil}>
                Yeni
              </Metin>
            )}
          </View>

          <Metin boyut="sm" renkli={renk.metinIkincil} numberOfLines={1}>
            {restoran.mutfak}
          </Metin>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.md,
              marginTop: bosluk.xs,
            }}
          >
            <Bilgi ikon="clock-outline" metin={restoran.teslimatSuresi} />
            <Bilgi
              ikon="moped-outline"
              metin={
                restoran.teslimatUcreti === 0 ? "Ücretsiz" : `${restoran.teslimatUcreti} ₺`
              }
            />
            <Bilgi ikon="map-marker-outline" metin={restoran.semt} />
          </View>

          {restoran.rozetler.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.xs, marginTop: bosluk.xs }}>
              {restoran.rozetler.map((rozet) => (
                <View
                  key={rozet}
                  style={{
                    backgroundColor: renk.sari[100],
                    paddingHorizontal: bosluk.sm,
                    paddingVertical: 2,
                    borderRadius: yaricap.tam,
                  }}
                >
                  <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[800]}>
                    {rozet}
                  </Metin>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
});

function Bilgi({
  ikon,
  metin,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  metin: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <MaterialCommunityIcons name={ikon} size={14} color={renk.metinIkincil} />
      <Metin boyut="xs" renkli={renk.metinIkincil}>
        {metin}
      </Metin>
    </View>
  );
}
