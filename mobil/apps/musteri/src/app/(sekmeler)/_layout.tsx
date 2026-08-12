import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform, type ColorValue } from "react-native";

import { renk, yaziAilesi } from "ortak";

import { useOturum } from "ortak/oturum";

/**
 * ROL BAZLI SEKMELER.
 *
 * Bu uygulama dört rolü birden barındırıyor (müşteri, şef, işletme, yönetici);
 * kurye ayrı bir uygulamada. Sekme takımı role göre değişiyor — herkese aynı
 * sekmeleri gösterip içeride "yetkin yok" demek, kullanıcıyı hiç
 * giremeyeceği yerlere tıklatmak olurdu.
 *
 * Sekmeler `Tabs.Protected` ile gizleniyor, sadece görsel olarak
 * saklanmıyor: `href: null` verilse ekran yine yığında kalır ve derin
 * bağlantıyla açılabilirdi.
 */
export default function SekmeYerlesimi() {
  const { durum } = useOturum();
  const rol = durum.asama === "girisli" ? durum.kullanici.rol : "musteri";

  const musteriMi = rol === "musteri";
  const mutfakMi = rol === "sef" || rol === "isletme";
  const yoneticiMi = rol === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: renk.kahve[900],
        tabBarInactiveTintColor: renk.kahve[300],
        tabBarLabelStyle: {
          fontFamily: yaziAilesi.govdeKalin,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: renk.beyaz,
          borderTopColor: renk.cizgi,
          /* Android'de varsayılan yükseklik etiketi kırpıyor. */
          height: Platform.OS === "android" ? 64 : undefined,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Protected guard={musteriMi}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Keşfet",
            tabBarIcon: ({ color }) => <Simge ad="restaurant-outline" renk={color} />,
          }}
        />
        <Tabs.Screen
          name="siparislerim"
          options={{
            title: "Siparişlerim",
            tabBarIcon: ({ color }) => <Simge ad="receipt-outline" renk={color} />,
          }}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={mutfakMi}>
        <Tabs.Screen
          name="mutfak"
          options={{
            title: "Siparişler",
            tabBarIcon: ({ color }) => <Simge ad="flame-outline" renk={color} />,
          }}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={yoneticiMi}>
        <Tabs.Screen
          name="yonetim"
          options={{
            title: "Yönetim",
            tabBarIcon: ({ color }) => <Simge ad="grid-outline" renk={color} />,
          }}
        />
      </Tabs.Protected>

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

/**
 * Sekme ikonu.
 *
 * İKİ PLATFORMDA DA AYNI SET (Ionicons). Önce iOS'ta SF Symbols, Android'de
 * başka bir set denendi; sonuç iki farklı görsel dil oldu ve Android tarafı
 * ikonsuz kaldı. Tek set, aynı çizgi kalınlığı ve aynı optik denge demek —
 * marka tutarlılığı platform yerelliğinden önce geliyor.
 */
function Simge({ ad, renk: c }: { ad: keyof typeof Ionicons.glyphMap; renk: ColorValue }) {
  return <Ionicons name={ad} color={c} size={24} />;
}
