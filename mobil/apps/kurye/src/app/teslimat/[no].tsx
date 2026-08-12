import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, kurye as kuryeUclari, renk } from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { TeslimatDetayi } from "@/gorunum/TeslimatDetayi";

const uclar = kuryeUclari(api);

/**
 * LİSTEDEN AÇILAN TESLİMAT DETAYI.
 *
 * TEK KAYIT UCU YOK, tüm liste çekilip aradaki kayıt seçiliyor. Sebebi:
 * `/kurye/teslimatlar` zaten kuryenin tüm atamalarını (en fazla 100) tek
 * istekte, tam adres ve telefonla dönüyor. Tek kayıt için ikinci bir uç
 * açmak, sahiplik denetimini ve DTO dönüşümünü sunucuda ikinci kez yazmak
 * demekti; kazancı ise birkaç kilobayt.
 *
 * Bu tercih, derin bağlantı (bildirime dokunup doğrudan buraya gelmek)
 * geldiğinde gözden geçirilecek: o akışta liste henüz elde olmayabilir —
 * ama istek yine tek ve aynı uç olduğu için ekran çalışmaya devam eder.
 */
export default function TeslimatDetayEkrani() {
  const { no } = useLocalSearchParams<{ no: string }>();
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  const liste = useVeri(() => uclar.teslimatlar(), "teslimatlar");
  const teslimat = (liste.veri ?? []).find((t) => t.siparisNo === no) ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz, paddingTop: kenar.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.md,
          paddingHorizontal: bosluk.lg,
          paddingVertical: bosluk.md,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri"
          onPress={() => (yonlendir.canGoBack() ? yonlendir.back() : yonlendir.replace("/"))}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={renk.kahve[900]} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Metin baslik boyut="xl">
            Teslimat
          </Metin>
          <Metin boyut="xs" renkli={renk.metinIkincil}>
            {no}
          </Metin>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: bosluk.lg,
          paddingBottom: kenar.bottom + bosluk["3xl"],
        }}
        refreshControl={
          <RefreshControl
            refreshing={liste.tazeleniyor}
            onRefresh={liste.tazele}
            tintColor={renk.sari[600]}
            colors={[renk.sari[600]]}
          />
        }
      >
        {liste.yukleniyor ? (
          <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk["2xl"] }} />
        ) : teslimat ? (
          <TeslimatDetayi teslimat={teslimat} tazele={liste.tazele} />
        ) : (
          <View style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}>
            <Ionicons
              name={liste.hata ? "cloud-offline-outline" : "help-circle-outline"}
              size={40}
              color={renk.kahve[300]}
            />
            <Metin baslik boyut="lg" ortala>
              {liste.hata ? "Bağlanamadık" : "Teslimat bulunamadı"}
            </Metin>
            <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
              {liste.hata?.message ?? "Bu teslimat artık sana atanmamış olabilir."}
            </Metin>
            <Dugme baslik="Tekrar dene" tur="ikincil" onPress={liste.tazele} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
