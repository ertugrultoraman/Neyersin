import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Modal, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ApiHatasi, bosluk, egri, renk, sure, yaricap, type TeklifDto } from "ortak";
import { Dugme, Metin } from "ortak/ui";

import { HAZIRLANMA_DK, kmYaz } from "@/teslimat/kurallar";
import { useVardiya } from "@/vardiya/Baglam";

const EGRI = Easing.bezier(egri.yumusak[0], egri.yumusak[1], egri.yumusak[2], egri.yumusak[3]);

/**
 * TEKLİF KATI — kuryenin önüne çıkan iş.
 *
 * ALTTAN BÜYÜK KAT. Bir ara tüm ekranı kaplıyordu (sarı bir duvarın arkasında
 * uygulama kilitlenmiş gibi duruyordu), sonra tam yarıya indi ve bu sefer
 * rakamlar küçük kaldı. Şimdi ekranın yaklaşık dörtte üçü: bilgiler rahat
 * okunacak kadar geniş, altındaki ekran hâlâ kararmış olarak görünüyor —
 * teklif her sekmenin önüne çıkıyor ama uygulamayı yutmuyor.
 *
 * TEK EYLEM: "Kabul et". Ret düğmesi KALDIRILDI — kurye motorda, göz ucuyla
 * bakıyor ve yan yana iki düğmede yanlışlıkla reddetmek, kaçırılan işten
 * daha kötü (ret geri alınamıyor, iş anında başkasına gidiyor). İstemediği
 * teklif için hiçbir şey yapmıyor: 45 saniye dolunca kat kendiliğinden
 * kapanıyor ve iş havuza dönüyor. Kabul oranı açısından da sonuç aynı —
 * zaman aşımı da ret de aynı paydada sayılıyor (bkz. lib/kurye-dagitim).
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
  const { teklif, kalanSaniye, bekleyenSayisi, islemde, teklifKabul } = useVardiya();

  return (
    <Modal
      visible={teklif !== null}
      animationType="slide"
      /* Saydam: kat ekranın altını kaplıyor, üstte perde duruyor. */
      transparent
      /* Android geri tuşu teklifi kapatmasın; süre kendi doluyor. */
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000073" }}>
        {teklif ? (
          <Icerik
            teklif={teklif}
            kalanSaniye={kalanSaniye}
            bekleyenSayisi={bekleyenSayisi}
            islemde={islemde}
            kabul={teklifKabul}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function Icerik({
  teklif,
  kalanSaniye,
  bekleyenSayisi,
  islemde,
  kabul,
}: {
  teklif: TeklifDto;
  kalanSaniye: number;
  bekleyenSayisi: number;
  islemde: boolean;
  kabul: () => Promise<unknown>;
}) {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const { height: yukseklik } = useWindowDimensions();

  /*
   * Süre çubuğu UI THREAD'DE animasyonlanıyor. Saniyede bir `setState` ile
   * genişlik değiştirmek, ağ cevabı işlerken takılan bir çubuk demekti;
   * teklifin en kritik bilgisi olan "ne kadar kaldı" duraklamamalı.
   */
  /*
   * Toplam süre teklifin KENDİSİNDEN çıkarılıyor, sabit yazılmıyor: sunucudaki
   * teklif ömrü (TEKLIF_SURESI_MS) değiştiğinde buradaki sabit eskir ve çubuk
   * ya hep dolu ya hep boş görünürdü — üstelik uygulama güncellenmeden fark
   * edilmezdi.
   */
  const toplamSaniye = Math.max(
    1,
    Math.round(
      (new Date(teklif.sonGecerlilik).getTime() - new Date(teklif.olusturmaTarihi).getTime()) /
        1000,
    ),
  );

  const oran = useSharedValue(1);
  useEffect(() => {
    oran.value = withTiming(Math.min(1, Math.max(0, kalanSaniye) / toplamSaniye), {
      duration: sure.normal,
      easing: EGRI,
    });
  }, [kalanSaniye, toplamSaniye, oran]);

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

  return (
    <View
      style={{
        backgroundColor: renk.sari[500],
        borderTopLeftRadius: yaricap["2xl"],
        borderTopRightRadius: yaricap["2xl"],
        paddingTop: bosluk.md,
        paddingBottom: kenar.bottom + bosluk.lg,
        paddingHorizontal: bosluk.xl,
        /*
         * EN AZ %75, EN ÇOK %94 EKRAN. Sabit bir yükseklik verilseydi küçük
         * telefonlarda "Kabul et" düğmesi ekranın dışında kalırdı; içerik
         * kaydırılabilir, düğme her zaman altta sabit duruyor.
         *
         * Üstte kalan şerit bilerek bırakılıyor: arkadaki ekranın görünmesi,
         * uygulamanın kilitlenmediğini gösteren tek işaret.
         */
        minHeight: yukseklik * 0.75,
        maxHeight: yukseklik * 0.94,
      }}
    >
      {/* Tutamak — katın çekilebilir bir yüzey olduğunu göstermiyor, yalnızca
          nerede başladığını belli ediyor; kat kaydırmayla kapanmıyor. */}
      <View
        aria-hidden
        style={{
          alignSelf: "center",
          width: 40,
          height: 4,
          borderRadius: yaricap.tam,
          backgroundColor: `${renk.murekkep}33`,
          marginBottom: bosluk.md,
        }}
      />

      {/* Geri sayım */}
      <View style={{ gap: bosluk.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
          <Ionicons name="flash" size={24} color={renk.murekkep} />
          <Metin baslik boyut="2xl" renkli={renk.murekkep} style={{ flex: 1 }}>
            Yeni Sipariş!
          </Metin>
          <Metin baslik boyut="2xl" renkli={renk.murekkep}>
            {kalanSaniye}s
          </Metin>
        </View>

        <View
          style={{
            height: 8,
            borderRadius: yaricap.tam,
            backgroundColor: `${renk.murekkep}22`,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[{ height: 8, borderRadius: yaricap.tam, backgroundColor: renk.murekkep }, cubuk]}
          />
        </View>

        {bekleyenSayisi > 0 ? (
          <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
            Sırada {bekleyenSayisi} iş daha bekliyor
          </Metin>
        ) : null}
      </View>

      {/*
        Kaydırılabilir gövde. Kata sığmayan içerik (uzun mutfak adı, kupon
        satırı, küçük ekran) burada kayıyor; alttaki düğme kaymıyor.
      */}
      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={{ paddingBottom: bosluk.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Kazanç */}
        <View style={{ alignItems: "center", paddingVertical: bosluk.xl }}>
          <Metin baslik boyut="4xl" renkli={renk.murekkep}>
            {teklif.ucret.toplam} ₺
          </Metin>
          {/*
            ORAN VE TABAN YAZILIYOR. Hakediş artık siparişin yüzdesi; yalnızca
            toplam gösterilseydi kurye bir işten 60, diğerinden 95 TL almasını
            keyfî bulurdu. Kupon kesintisi de ayrı satırda — gizlenseydi kuponlu
            siparişte kazancın neden düştüğü görünmez, hesap yanlış sanılırdı.
          */}
          <Metin boyut="md" agirlik="kalin" renkli={renk.kahve[800]}>
            {teklif.ucret.siparisTutari} ₺ siparişin %{teklif.ucret.yuzde}&apos;i
          </Metin>
          {teklif.ucret.kuponKesintisi > 0 ? (
            <Metin boyut="sm" renkli={renk.kahve[800]} style={{ marginTop: bosluk.xs }}>
              Kupon payı −{teklif.ucret.kuponKesintisi} ₺
            </Metin>
          ) : null}
        </View>

        {/* Duraklar */}
        <View
          style={{
            backgroundColor: renk.beyaz,
            borderRadius: yaricap["2xl"],
            padding: bosluk.xl,
            gap: bosluk.xl,
          }}
        >
          <Durak
            simge="storefront"
            etiket="Alım"
            baslik={teklif.restoranAdi}
            /*
              HAZIRLANMA SÜRESİ BURADA: kurye kabul ettikten sonra mutfağa
              gidiyor ve sipariş "hazır" olmadan teslim alamıyor. Süre
              yazılmasaydı bu bekleme, uygulamanın takıldığı izlenimini verirdi.
            */
            alt={[teklif.alimSemti, `~${HAZIRLANMA_DK} dk hazırlanma`]
              .filter(Boolean)
              .join(" · ")}
          />
          <View style={{ height: 1, backgroundColor: renk.cizgi }} />
          <Durak
            simge="person"
            etiket="Teslim"
            baslik={teklif.teslimMahallesi}
            /*
              MESAFE BURADA, teslim durağının altında: "~3,2 km" tek başına
              dursaydı neyin arası olduğu belirsiz kalırdı — kuryenin kendi
              konumundan mı, mutfaktan mı? Cümle olarak yazılınca soru kalmıyor.

              "~" ÖNEMLİ: mesafe mahalle merkezinden hesaplanıyor, kapı
              koordinatı yok (bkz. lib/mesafe). Kesin sayı gibi gösterilseydi
              kurye sokak farkını hata sanardı.
            */
            alt={[
              teklif.teslimIlcesi,
              teklif.mesafeKm !== null ? `mutfaktan ~${kmYaz(teklif.mesafeKm)}` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: bosluk.lg,
            paddingTop: bosluk.lg,
          }}
        >
          <Rozet simge="cube-outline" metin={`${teklif.kalemSayisi} ürün`} />
          <Rozet
            simge={teklif.tahsilat > 0 ? "cash-outline" : "card-outline"}
            metin={teklif.tahsilat > 0 ? `${teklif.tahsilat} ₺ tahsilat` : "Ödendi"}
          />
        </View>
      </ScrollView>

      {/*
        AÇIK ADRES VE TELEFON BURADA YOK — kabul edildikten sonra geliyor
        (bkz. TeklifDto). Teklif ekranında göstermek, kabul etmeden adres
        toplamanın en kolay yolu olurdu.

        TEK DÜĞME, ekranın tam genişliğinde ve büyük: kurye eldivenli, motor
        üstünde ve 45 saniyesi var. İkinci bir düğme (ret) yanlış basmayı
        davet ediyordu ve o hata geri alınamıyor.
      */}
      <Dugme
        baslik="Kabul et"
        tur="murekkep"
        tamGenislik
        buyuk
        bekliyor={islemde}
        onPress={() => void kabulEt()}
      />
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
          width: 44,
          height: 44,
          borderRadius: yaricap.tam,
          backgroundColor: renk.kahve[50],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={simge} size={22} color={renk.kahve[900]} />
      </View>
      <View style={{ flex: 1 }}>
        <Metin boyut="xs" agirlik="kalin" renkli={renk.metinIkincil}>
          {etiket.toLocaleUpperCase("tr-TR")}
        </Metin>
        <Metin baslik boyut="lg" numberOfLines={1}>
          {baslik}
        </Metin>
        {alt ? (
          <Metin boyut="sm" renkli={renk.metinIkincil} numberOfLines={1}>
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
        gap: bosluk.sm,
        paddingHorizontal: bosluk.lg,
        paddingVertical: bosluk.md,
        borderRadius: yaricap.tam,
        backgroundColor: `${renk.murekkep}14`,
      }}
    >
      <Ionicons name={simge} size={18} color={renk.kahve[900]} />
      <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[900]}>
        {metin}
      </Metin>
    </View>
  );
}
