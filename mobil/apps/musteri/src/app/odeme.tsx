import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, renk } from "ortak";
import { Metin, Yakinda } from "ortak/ui";

/**
 * ÖDEME ADIMI — henüz yazılmadı.
 *
 * Sepet ekranındaki düğme buraya getiriyor. Düğmeyi pasif bırakmak ya da
 * hiç koymamak da bir seçenekti; bu yol seçildi çünkü akışın nerede
 * kesildiğini söylemek, sessizce hiçbir şey olmamasından iyi.
 *
 * Buraya gelecek olan: adres seçimi, teslimat notu, ödeme yöntemi ve
 * iyzico akışı (web'deki `/api/odeme/iyzico` karşılığı). Tutarlar sepette
 * olduğu gibi sunucudan gelmeye devam edecek — bu ekran da para hesaplamayacak.
 */
export default function OdemeEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: renk.beyaz,
        paddingTop: kenar.top,
        paddingHorizontal: bosluk.lg,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.md, paddingVertical: bosluk.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri"
          onPress={() => yonlendir.back()}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={renk.kahve[900]} />
        </Pressable>
        <Metin baslik boyut="xl">
          Ödeme
        </Metin>
      </View>

      <Yakinda ne="Adres seçimi, teslimat notu ve kartla ödeme adımı yazılıyor. Sepetin duruyor — kaybolmadı." />
    </View>
  );
}
