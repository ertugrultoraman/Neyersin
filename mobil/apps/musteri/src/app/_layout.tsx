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
import { SepetSaglayici } from "@/sepet/Baglam";

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
            Sepet oturumun İÇİNDE: çıkış yapmak sepeti boşaltmıyor ama sepet
            ekranı "sipariş ver" derken oturuma bakıyor. Dışarıda olsaydı
            sağlayıcı sırası ekrandan ekrana değişebilirdi.
          */}
          <SepetSaglayici>
          {/*
            `backgroundColor` verilmiyor: Android artık edge-to-edge zorunlu
            olduğu için SDK 57'de bu prop kaldırıldı. Durum çubuğunun altı
            sayfanın kendi zemini oluyor; ekranlar güvenli alan boşluğunu
            zaten `Sayfa` bileşeninden alıyor.
          */}
            <StatusBar style="dark" />
            <Yonlendirme />
          </SepetSaglayici>
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

  /*
   * MİSAFİR DE İÇERİ GİRİYOR.
   *
   * Önce giriş ekranı açılıyordu; katalog uçları hesap istemediği hâlde
   * uygulamayı indiren herkes önce parola sorulan bir ekrana çarpıyordu.
   * İki sebeple değişti:
   *
   *  - Apple inceleme kuralı 5.1.1(v): hesap gerektirmeyen özellikler için
   *    kayıt ZORUNLU tutulamıyor. Menüye bakmak tam olarak öyle bir özellik;
   *    eski akış ret sebebiydi.
   *  - Kimse tatmadığı bir platforma hesap açmıyor. Giriş, sipariş vermek
   *    gibi gerçekten kimlik gerektiren adımda isteniyor.
   *
   * `giris` ekranı yığında HER İKİ durumda da duruyor: misafir profil
   * sekmesinden açıyor, girişli kullanıcı için de çıkış sonrası dönülecek
   * yer olarak hazır bekliyor.
   */
  const icerideMi = durum.asama === "girisli" || durum.asama === "misafir";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: renk.beyaz },
      }}
    >
      <Stack.Protected guard={icerideMi}>
        <Stack.Screen name="(sekmeler)" />
        <Stack.Screen name="restoran/[slug]" />
        <Stack.Screen name="sepet" />
        <Stack.Screen name="odeme" />
        <Stack.Screen name="siparis/[no]" />
        {/* Üstten gelen bir kat: geri dönünce kullanıcı baktığı mutfakta kalıyor. */}
        <Stack.Screen name="giris" options={{ presentation: "modal" }} />
        <Stack.Screen name="kayit" options={{ presentation: "modal" }} />
        <Stack.Screen name="sifremi-unuttum" options={{ presentation: "modal" }} />
      </Stack.Protected>

      <Stack.Protected guard={durum.asama === "baglantiYok"}>
        <Stack.Screen name="baglanti-yok" />
      </Stack.Protected>
    </Stack>
  );
}
