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
import { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { renk, type Rol } from "ortak";
import { OturumSaglayici, useOturum } from "ortak/oturum";

import { api, apiHazirla } from "@/altyapi/api";
import { TeklifKati } from "@/gorunum/TeklifKati";
import { VardiyaSaglayici } from "@/vardiya/Baglam";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function KokYerlesim() {
  const [yaziTipleriHazir, yaziTipiHatasi] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });

  /**
   * BU UYGULAMAYA YALNIZCA KURYE GİREBİLİR.
   *
   * Yönetici de dışarıda bırakılıyor. "Admin her yere girer" kestirmesi
   * burada anlamsız: ekranlar kuryenin kendi atamalarını, kendi konumunu ve
   * kendi kazancını gösteriyor; yöneticinin kurye kimliği olmadığı için
   * hepsi boş görünürdü. Yönetici bu verilere kendi panelinden bakıyor.
   */
  const rolKabul = useCallback((rol: Rol) => rol === "kurye", []);

  if (!yaziTipleriHazir && !yaziTipiHatasi) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OturumSaglayici
          api={api}
          hazirla={apiHazirla}
          rolKabul={rolKabul}
          rolRedMesaji="Bu uygulama yalnızca kuryeler içindir. Sipariş vermek için Ne Yersin uygulamasını kullan."
        >
          {/*
            VARDİYA GEZİNMENİN ÜSTÜNDE. Sağlayıcı bir ekranın içinde dursaydı,
            kurye sekme değiştirdiğinde konum akışı ve teklif yoklaması
            sıfırlanırdı — vardiya ekrandan bağımsız bir şey.

            Teklif katı da burada: hangi sekmede olursa olsun işin önüne
            çıkması gerekiyor (ömrü 45 saniye).
          */}
          <VardiyaSaglayici>
            <StatusBar style="dark" />
            <Yonlendirme />
            <TeklifKati />
          </VardiyaSaglayici>
        </OturumSaglayici>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Yonlendirme() {
  const { durum } = useOturum();

  useEffect(() => {
    if (durum.asama !== "yukleniyor") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [durum.asama]);

  if (durum.asama === "yukleniyor") return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: renk.beyaz },
      }}
    >
      <Stack.Protected guard={durum.asama === "girisli"}>
        <Stack.Screen name="(sekmeler)" />
        <Stack.Screen name="teslimat/[no]" />
        <Stack.Screen name="vardiyalar" />
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
