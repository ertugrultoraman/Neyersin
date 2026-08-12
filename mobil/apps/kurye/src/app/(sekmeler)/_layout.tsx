import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform, type ColorValue } from "react-native";

import { renk, yaziAilesi } from "ortak";

/**
 * KURYE SEKMELERI.
 *
 * Rol kontrolu YOK: bu uygulamaya zaten yalnizca kurye girebiliyor
 * (bkz. app/_layout.tsx -> rolKabul). Musteri uygulamasindaki rol bazli
 * sekme mantigi burada gereksiz karmasiklik olurdu.
 */
export default function SekmeYerlesimi() {
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
          height: Platform.OS === "android" ? 64 : undefined,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Teklifler",
          tabBarIcon: ({ color }) => <Simge ad="notifications-outline" renk={color} />,
        }}
      />
      <Tabs.Screen
        name="teslimat"
        options={{
          title: "Teslimat",
          tabBarIcon: ({ color }) => <Simge ad="navigate-outline" renk={color} />,
        }}
      />
      <Tabs.Screen
        name="kazanc"
        options={{
          title: "Kazanç",
          tabBarIcon: ({ color }) => <Simge ad="wallet-outline" renk={color} />,
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
