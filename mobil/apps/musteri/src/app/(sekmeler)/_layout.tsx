import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform, type ColorValue } from "react-native";

import { renk, yaziAilesi } from "ortak";

import { useOturum } from "ortak/oturum";

/**
 * SEKMELER.
 *
 * BURASI HERKES İÇİN ÖNCE BİR SİPARİŞ UYGULAMASI. Keşfet ve Siparişlerim
 * sekmeleri role bakılmaksızın herkeste duruyor: şef de akşam yemeğini
 * komşusundan söylüyor, yönetici de. Bir süre bu sekmeler yalnızca "musteri"
 * rolüne açıktı ve yönetici hesabıyla girildiğinde ekranda yalnızca yönetim
 * paneli kalıyordu — uygulamanın asıl işi görünmez oluyordu.
 *
 * ROL YALNIZCA SEKME EKLİYOR, çıkarmıyor: şef/işletme "Mutfak", yönetici
 * "Yönetim" sekmesini ayrıca görüyor. Görmediği bir sekme zaten yetkisi
 * olmayan bir ekran; `Tabs.Protected` onu yığından da çıkarıyor (sadece
 * gizlemek, derin bağlantıyla açılmasına izin verirdi).
 */
export default function SekmeYerlesimi() {
  const { durum } = useOturum();
  const rol = durum.asama === "girisli" ? durum.kullanici.rol : "musteri";

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
      {/* Herkeste: alışveriş tarafı. */}
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
