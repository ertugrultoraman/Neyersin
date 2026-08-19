import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { renk, yaziAilesi } from "ortak";

/**
 * KURYE SEKMELERI.
 *
 * Rol kontrolu YOK: bu uygulamaya zaten yalnizca kurye girebiliyor
 * (bkz. app/_layout.tsx -> rolKabul). Musteri uygulamasindaki rol bazli
 * sekme mantigi burada gereksiz karmasiklik olurdu.
 */
export default function SekmeYerlesimi() {
  const kenar = useSafeAreaInsets();

  /*
   * SEKME CUBUGU SISTEM TUSLARININ USTUNDE DURUYOR.
   *
   * Yukseklik Android'de 64 olarak SABITLENMISTI ve alt guvenli alan hic
   * hesaba katilmiyordu: jest cubugu ya da geri/ana ekran tuslari olan
   * telefonlarda sekme yazilari o serit tarafindan orluyordu — kurye
   * "Ozet"e basmaya calisirken geri tusuna basiyordu.
   *
   * Cozum cihazin bildirdigi alt bosluk kadar yukari almak; serit olmayan
   * telefonda `kenar.bottom` sifir donuyor ve gorunum degismiyor.
   */
  const TABAN = 64;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: renk.kahve[900],
        tabBarInactiveTintColor: renk.kahve[300],
        tabBarLabelStyle: { fontFamily: yaziAilesi.govdeKalin, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: renk.beyaz,
          borderTopColor: renk.cizgi,
          height: TABAN + kenar.bottom,
          paddingTop: 6,
          paddingBottom: kenar.bottom + 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Vardiya",
          tabBarIcon: ({ color }) => <Simge ad="navigate-outline" renk={color} />,
        }}
      />
      <Tabs.Screen
        name="teslimatlar"
        options={{
          title: "Teslimatlar",
          tabBarIcon: ({ color }) => <Simge ad="list-outline" renk={color} />,
        }}
      />
      <Tabs.Screen
        name="ozet"
        options={{
          title: "Özet",
          tabBarIcon: ({ color }) => <Simge ad="stats-chart-outline" renk={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <Simge ad="person-outline" renk={color} />,
        }}
      />
    </Tabs>
  );
}

function Simge({ ad, renk: c }: { ad: keyof typeof Ionicons.glyphMap; renk: ColorValue }) {
  return <Ionicons name={ad} color={c} size={24} />;
}
