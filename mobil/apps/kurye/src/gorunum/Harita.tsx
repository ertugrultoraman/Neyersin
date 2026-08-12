import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { Platform, View, type ViewStyle } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { bosluk, renk, yaricap } from "ortak";
import { Metin } from "ortak/ui";

/**
 * HARİTA — anahtar yoksa markalı yer tutucu.
 *
 * `react-native-maps` Android'de Google Maps anahtarı olmadan BOŞ GRİ bir
 * dikdörtgen çiziyor: hata vermiyor, log basmıyor, sadece hiçbir şey
 * göstermiyor. Kurye bunu "uygulama bozulmuş" diye okur. Bu yüzden anahtarın
 * varlığı yapılandırmadan okunuyor (bkz. ortak/eklentiler/ortak-yapilandirma)
 * ve yokken haritanın YERİNE ne olduğunu söyleyen sarı bir kat çiziliyor.
 *
 * Anahtar geldiğinde tek yapılacak `GOOGLE_MAPS_ANAHTARI` ortam değişkenini
 * tanımlamak; bu dosya ve onu kullanan ekranlar değişmiyor.
 */

export const haritaVar = Boolean(Constants.expoConfig?.extra?.haritaVar);

export type HaritaNoktasi = {
  anahtar: string;
  enlem: number;
  boylam: number;
  baslik: string;
  tur: "kurye" | "mutfak" | "musteri";
};

const NOKTA_RENGI: Record<HaritaNoktasi["tur"], string> = {
  kurye: renk.sari[600],
  mutfak: renk.kahve[900],
  musteri: renk.nane,
};

const NOKTA_SIMGESI: Record<HaritaNoktasi["tur"], keyof typeof Ionicons.glyphMap> = {
  kurye: "navigate",
  mutfak: "storefront",
  musteri: "person",
};

export function Harita({
  merkez,
  noktalar = [],
  style,
}: {
  merkez: { enlem: number; boylam: number } | null;
  noktalar?: HaritaNoktasi[];
  style?: ViewStyle;
}) {
  if (!haritaVar) return <YerTutucu style={style} noktalar={noktalar} />;

  return (
    <MapView
      style={[{ flex: 1 }, style]}
      /*
       * Android'de Google sağlayıcısı AÇIKÇA seçiliyor. Varsayılan bırakılırsa
       * cihazın kendi sağlayıcısına düşüyor ve Huawei gibi Google Play
       * servisleri olmayan telefonlarda harita hiç açılmıyor.
       */
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      showsUserLocation
      showsMyLocationButton={false}
      /* Kuryenin dikkatini dağıtacak her şey kapalı: sahada tek iş adres bulmak. */
      showsTraffic={false}
      showsIndoors={false}
      toolbarEnabled={false}
      initialRegion={
        merkez
          ? {
              latitude: merkez.enlem,
              longitude: merkez.boylam,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }
          : undefined
      }
    >
      {noktalar.map((n) => (
        <Marker
          key={n.anahtar}
          coordinate={{ latitude: n.enlem, longitude: n.boylam }}
          title={n.baslik}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: yaricap.tam,
              backgroundColor: NOKTA_RENGI[n.tur],
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: renk.beyaz,
            }}
          >
            <Ionicons
              name={NOKTA_SIMGESI[n.tur]}
              size={17}
              color={n.tur === "kurye" ? renk.murekkep : renk.beyaz}
            />
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

/**
 * Anahtar yokken görünen kat.
 *
 * Sahte bir harita çizmiyor — çizseydi kurye gerçek sanıp konumuna göre
 * hareket etmeye çalışırdı. Bunun yerine markanın sarısı, ne olduğu ve
 * hangi noktaların beklendiği yazıyor.
 */
function YerTutucu({ style, noktalar }: { style?: ViewStyle; noktalar: HaritaNoktasi[] }) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: renk.sari[500],
          alignItems: "center",
          justifyContent: "center",
          padding: bosluk.xl,
          gap: bosluk.sm,
        },
        style,
      ]}
    >
      <Ionicons name="map-outline" size={36} color={renk.murekkep} />
      <Metin baslik boyut="lg" renkli={renk.murekkep} ortala>
        Harita yakında
      </Metin>
      <Metin boyut="sm" renkli={renk.kahve[800]} ortala>
        Google Maps anahtarı tanımlandığında harita burada açılacak. Adresler ve yol tarifi şimdi
        de çalışıyor.
      </Metin>

      {noktalar.length > 0 ? (
        <View style={{ gap: bosluk.xs, marginTop: bosluk.sm, alignItems: "center" }}>
          {noktalar.map((n) => (
            <Metin key={n.anahtar} boyut="xs" agirlik="kalin" renkli={renk.kahve[800]}>
              {n.baslik}
            </Metin>
          ))}
        </View>
      ) : null}
    </View>
  );
}
