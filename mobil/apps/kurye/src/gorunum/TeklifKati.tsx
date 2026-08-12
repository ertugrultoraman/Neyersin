import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Modal, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ApiHatasi, bosluk, egri, renk, sure, yaricap, type TeklifDto } from "ortak";
import { Dugme, Metin } from "ortak/ui";

import { useVardiya } from "@/vardiya/Baglam";

const EGRI = Easing.bezier(egri.yumusak[0], egri.yumusak[1], egri.yumusak[2], egri.yumusak[3]);

/**
 * TEKLİF KATI — kuryenin önüne çıkan iş.
 *
 * TAM EKRAN VE ÜSTTE. Küçük bir bildirim şeridi olarak yapılabilirdi ama
 * teklifin ömrü 45 saniye: kurye o şeridi fark etmeden süre dolardı. Kat,
 * hangi sekmede olursa olsun önüne çıkıyor.
 *
 * YENİ TEKLİF ESKİSİNİN ÖNÜNE GEÇİYOR. İki iş aynı anda açıkken en yeni
 * olan gösteriliyor (bkz. vardiya/Baglam → öne çıkan teklif); alttakiler
 * kaybolmuyor, sıradaki olarak bekliyor ve öndeki kapandığında geliyorlar.
 * Kaç tane beklediği başlıkta yazıyor — kurye acele etmesi gerektiğini
 * bilsin.
 *
 * SARI ZEMİN markanın en yüksek sesle konuştuğu yer: kurye motorda,
 * gündüz ışığında, göz ucuyla bakıyor. Beyaz bir kart burada kaybolurdu.
 */
export function TeklifKati() {
  const { teklif, kalanSaniye, bekleyenSayisi, islemde, teklifKabul, teklifReddet } =
    useVardiya();

  return (
    <Modal
      visible={teklif !== null}
      animationType="slide"
      transparent={false}
      /* Android geri tuşu teklifi SESSİZCE kapatmasın; ret bilinçli olmalı. */
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      {teklif ? (
        <Icerik
          teklif={teklif}
          kalanSaniye={kalanSaniye}
          bekleyenSayisi={bekleyenSayisi}
          islemde={islemde}
          kabul={teklifKabul}
          reddet={teklifReddet}
        />
      ) : null}
    </Modal>
  );
}

function Icerik({
  teklif,
  kalanSaniye,
  bekleyenSayisi,
  islemde,
  kabul,
  reddet,
}: {
  teklif: TeklifDto;
  kalanSaniye: number;
  bekleyenSayisi: number;
  islemde: boolean;
  kabul: () => Promise<unknown>;
  reddet: () => Promise<void>;
}) {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  /*
   * Süre çubuğu UI THREAD'DE animasyonlanıyor. Saniyede bir `setState` ile
   * genişlik değiştirmek, ağ cevabı işlerken takılan bir çubuk demekti;
   * teklifin en kritik bilgisi olan "ne kadar kaldı" duraklamamalı.
   */
  const oran = useSharedValue(1);
  useEffect(() => {
    oran.value = withTiming(Math.max(0, kalanSaniye) / 45, {
      duration: sure.normal,
      easing: EGRI,
    });
  }, [kalanSaniye, oran]);

  const cubuk = useAnimatedStyle(() => ({ width: `${oran.value * 100}%` }));

  async function kabulEt() {
    try {
      const teslimat = await kabul();
      if (teslimat) yonlendir.push(`/teslimat/${teklif.siparisNo}`);
    } catch (e) {
      Alert.alert(
        "İş alınamadı",
        e instanceof ApiHatasi ? e.message : "Bağlantını kontrol edip tekrar dene.",
      );
    }
  }

  const ek = teklif.ucret.kapidaOdeme + teklif.ucret.gece;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: renk.sari[500],
        paddingTop: kenar.top + bosluk.lg,
        paddingBottom: kenar.bottom + bosluk.lg,
        paddingHorizontal: bosluk.xl,
      }}
    >
      {/* Geri sayım */}
      <View style={{ gap: bosluk.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
          <Ionicons name="flash" size={20} color={renk.murekkep} />
          <Metin baslik boyut="lg" renkli={renk.murekkep} style={{ flex: 1 }}>
            Yeni iş
          </Metin>
          <Metin baslik boyut="lg" renkli={renk.murekkep}>
            {kalanSaniye}s
          </Metin>
        </View>

        <View
          style={{
            height: 6,
            borderRadius: yaricap.tam,
            backgroundColor: `${renk.murekkep}22`,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[{ height: 6, borderRadius: yaricap.tam, backgroundColor: renk.murekkep }, cubuk]}
          />
        </View>

        {bekleyenSayisi > 0 ? (
          <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[800]}>
            Sırada {bekleyenSayisi} iş daha bekliyor
          </Metin>
        ) : null}
      </View>

      {/* Kazanç */}
      <View style={{ alignItems: "center", paddingVertical: bosluk.xl }}>
        <Metin baslik boyut="4xl" renkli={renk.murekkep}>
          {teklif.ucret.toplam} ₺
        </Metin>
        {ek > 0 ? (
          <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
            {ek} ₺ ek dahil
            {teklif.ucret.gece > 0 ? " · gece" : ""}
            {teklif.ucret.kapidaOdeme > 0 ? " · kapıda ödeme" : ""}
          </Metin>
        ) : (
          <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
            Teslimat ücreti
          </Metin>
        )}
      </View>

      {/* Duraklar */}
      <View
        style={{
          backgroundColor: renk.beyaz,
          borderRadius: yaricap["2xl"],
          padding: bosluk.lg,
          gap: bosluk.lg,
        }}
      >
        <Durak
          simge="storefront"
          etiket="Alım"
          baslik={teklif.restoranAdi}
          alt={teklif.alimSemti}
        />
        <View style={{ height: 1, backgroundColor: renk.cizgi }} />
        <Durak
          simge="person"
          etiket="Teslim"
          baslik={teklif.teslimMahallesi}
          alt={teklif.teslimIlcesi}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: bosluk.lg,
          paddingVertical: bosluk.lg,
        }}
      >
        <Rozet simge="cube-outline" metin={`${teklif.kalemSayisi} ürün`} />
        <Rozet
          simge={teklif.tahsilat > 0 ? "cash-outline" : "card-outline"}
          metin={teklif.tahsilat > 0 ? `${teklif.tahsilat} ₺ tahsilat` : "Ödendi"}
        />
      </View>

      <View style={{ flex: 1 }} />

      {/*
        AÇIK ADRES VE TELEFON BURADA YOK — kabul edildikten sonra geliyor
        (bkz. TeklifDto). Teklif ekranında göstermek, kabul etmeden adres
        toplamanın en kolay yolu olurdu.
      */}
      <View style={{ gap: bosluk.sm }}>
        <Dugme
          baslik="Kabul et"
          tur="murekkep"
          tamGenislik
          bekliyor={islemde}
          onPress={() => void kabulEt()}
        />
        <Dugme
          baslik="Reddet"
          tur="sade"
          tamGenislik
          pasif={islemde}
          onPress={() => void reddet()}
        />
      </View>
    </View>
  );
}

function Durak({
  simge,
  etiket,
  baslik,
  alt,
}: {
  simge: keyof typeof Ionicons.glyphMap;
  etiket: string;
  baslik: string;
  alt: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.md }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: yaricap.tam,
          backgroundColor: renk.kahve[50],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={simge} size={18} color={renk.kahve[900]} />
      </View>
      <View style={{ flex: 1 }}>
        <Metin boyut="2xs" agirlik="kalin" renkli={renk.metinIkincil}>
          {etiket.toLocaleUpperCase("tr-TR")}
        </Metin>
        <Metin baslik boyut="md" numberOfLines={1}>
          {baslik}
        </Metin>
        {alt ? (
          <Metin boyut="xs" renkli={renk.metinIkincil} numberOfLines={1}>
            {alt}
          </Metin>
        ) : null}
      </View>
    </View>
  );
}

function Rozet({ simge, metin }: { simge: keyof typeof Ionicons.glyphMap; metin: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.xs,
        paddingHorizontal: bosluk.md,
        paddingVertical: bosluk.sm,
        borderRadius: yaricap.tam,
        backgroundColor: `${renk.murekkep}14`,
      }}
    >
      <Ionicons name={simge} size={15} color={renk.kahve[900]} />
      <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[900]}>
        {metin}
      </Metin>
    </View>
  );
}
