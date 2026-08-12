import { Baloo2_600SemiBold, Baloo2_700Bold } from "@expo-google-fonts/baloo-2";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { renk } from "ortak";
import { OturumSaglayici, useOturum } from "ortak/oturum";

import { api, apiHazirla } from "@/altyapi/api";

/*
 * Açılış ekranı, yazı tipleri YÜKLENENE ve oturum çözülene kadar açık kalıyor.
 * Erken kapatılsaydı kullanıcı önce sistem fontuyla çizilmiş bir kare, sonra
 * marka fontuyla yeniden çizilmiş halini görürdü.
 */
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Açılış ekranı zaten kapandıysa önemli değil. */
});

export default function KokYerlesim() {
  const [yaziTipleriHazir, yaziTipiHatasi] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });

  /*
   * Yazı tipi yüklenemezse uygulama AÇILMAYA DEVAM EDİYOR (sistem fontuna
   * düşerek). Şebeke ya da disk hatası yüzünden kullanıcıyı sonsuz açılış
   * ekranında bırakmak, yanlış fontla göstermekten çok daha kötü.
   */
  if (!yaziTipleriHazir && !yaziTipiHatasi) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OturumSaglayici api={api} hazirla={apiHazirla}>
          {/*
            `backgroundColor` verilmiyor: Android artık edge-to-edge zorunlu
            olduğu için SDK 57'de bu prop kaldırıldı. Durum çubuğunun altı
            sayfanın kendi zemini oluyor; ekranlar güvenli alan boşluğunu
            zaten `Sayfa` bileşeninden alıyor.
          */}
          <StatusBar style="dark" />
          <Yonlendirme />
        </OturumSaglayici>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Oturum aşamasına göre hangi ekran grubunun canlı olacağını belirler.
 *
 * `Stack.Protected` kullanılıyor: koşul yanlışken o ekran yığından tamamen
 * ÇIKARILIYOR. Elle `router.replace` yazan bir çözümde, çıkış yapan
 * kullanıcının geri tuşuyla korumalı ekrana dönebildiği bir aralık kalıyor;
 * burada dönecek bir ekran kalmıyor.
 */
function Yonlendirme() {
  const { durum } = useOturum();

  useEffect(() => {
    if (durum.asama !== "yukleniyor") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [durum.asama]);

  /* Oturum çözülene kadar açılış ekranı duruyor. */
  if (durum.asama === "yukleniyor") return null;

  const girisli = durum.asama === "girisli";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: renk.beyaz },
      }}
    >
      <Stack.Protected guard={girisli}>
        <Stack.Screen name="(sekmeler)" />
      </Stack.Protected>

      <Stack.Protected guard={durum.asama === "misafir"}>
        <Stack.Screen name="giris" />
      </Stack.Protected>

      <Stack.Protected guard={durum.asama === "baglantiYok"}>
        <Stack.Screen name="baglanti-yok" />
      </Stack.Protected>
    </Stack>
  );
}
