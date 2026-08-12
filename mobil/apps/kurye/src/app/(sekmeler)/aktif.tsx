import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, kurye as kuryeUclari, renk } from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { TeslimatDetayi } from "@/gorunum/TeslimatDetayi";
import { aktifTeslimat } from "@/teslimat/kurallar";

const uclar = kuryeUclari(api);

/**
 * AKTİF TESLİMAT — kuryenin şu an ilgilendiği tek iş.
 *
 * Listeden ayrı bir sekme olmasının sebebi saha kullanımı: motorun üstünde,
 * eldivenle, tek elle açılan ekran bu. Liste içinde doğru satırı bulup
 * dokunmak bir adım fazla ve hareket hâlinde en pahalı adım.
 *
 * Hangi işin "aktif" olduğunu sunucu söylemiyor; kural uygulamada
 * (bkz. teslimat/kurallar → aktifTeslimat) çünkü bu bir GÖRÜNÜM tercihi.
 * Sunucuya taşınsaydı, sıralamayı değiştirmek uç sürümü çıkarmayı gerektirirdi.
 *
 * HARİTA YOK: yol tarifi cihazın kendi navigasyon uygulamasına devrediliyor
 * (bkz. altyapi/baglantilar). Gömülü harita için Google Maps anahtarı gerekiyor
 * ve kurye zaten sesli yönlendirme için o uygulamaya geçerdi.
 */
export default function AktifEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const liste = useVeri(() => uclar.teslimatlar(), "teslimatlar");

  const teslimat = aktifTeslimat(liste.veri ?? []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      contentContainerStyle={{
        paddingHorizontal: bosluk.lg,
        paddingTop: kenar.top + bosluk.lg,
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
      <View style={{ marginBottom: bosluk.lg }}>
        <Metin baslik boyut="3xl">
          Aktif teslimat
        </Metin>
      </View>

      {liste.yukleniyor ? (
        <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk["2xl"] }} />
      ) : teslimat ? (
        <TeslimatDetayi teslimat={teslimat} tazele={liste.tazele} />
      ) : (
        <View style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}>
          <Ionicons
            name={liste.hata ? "cloud-offline-outline" : "checkmark-done-outline"}
            size={40}
            color={renk.kahve[300]}
          />
          <Metin baslik boyut="lg" ortala>
            {liste.hata ? "Bağlanamadık" : "Bekleyen teslimatın yok"}
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
            {liste.hata?.message ?? "Sana yeni bir iş atandığında burada görünecek."}
          </Metin>
          <Dugme
            baslik={liste.hata ? "Tekrar dene" : "Teslimatlarıma bak"}
            tur="ikincil"
            onPress={() => (liste.hata ? liste.tazele() : yonlendir.push("/"))}
          />
        </View>
      )}
    </ScrollView>
  );
}
