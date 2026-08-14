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

import { HAZIRLANMA_DK } from "@/teslimat/kurallar";
import { useVardiya } from "@/vardiya/Baglam";

const EGRI = Easing.bezier(egri.yumusak[0], egri.yumusak[1], egri.yumusak[2], egri.yumusak[3]);

/**
 * TEKLİF KATI — kuryenin önüne çıkan iş.
 *
 * ALTTAN YARIM SAYFA. Önceden tüm ekranı kaplıyordu; kurye teklife bakarken
 * ne aktif teslimatını ne haritayı görebiliyordu ve sarı bir duvarın arkasında
 * uygulamanın kilitlendiği hissi vardı. Kat şimdi ekranın yarısını kaplıyor,
 * altındaki ekran kararmış olarak görünmeye devam ediyor — teklif hâlâ her
 * sekmenin önüne çıkıyor ama uygulamayı yutmuyor.
 *
 * KÜÇÜK BİR ŞERİT DE OLMUYOR: teklifin ömrü 45 saniye ve kurye o şeridi fark
 * etmeden süre dolardı. Yarım sayfa, ikisinin arası.
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
      /* Saydam: kat yalnızca alt yarıyı kaplıyor, üstte perde duruyor. */
      transparent
      /* Android geri tuşu teklifi SESSİZCE kapatmasın; ret bilinçli olmalı. */
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
            reddet={teklifReddet}
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
         * EN AZ YARIM, EN ÇOK %88 EKRAN. Sabit bir yükseklik verilseydi küçük
         * telefonlarda "Kabul et" düğmesi ekranın dışında kalırdı; içerik
         * kaydırılabilir, düğmeler her zaman altta sabit duruyor.
         */
        minHeight: yukseklik * 0.5,
        maxHeight: yukseklik * 0.88,
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

      {/*
        Kaydırılabilir gövde. Yarım sayfaya sığmayan içerik (uzun mutfak adı,
        kupon satırı, küçük ekran) burada kayıyor; alttaki düğmeler kaymıyor.
      */}
      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={{ paddingBottom: bosluk.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Kazanç */}
        <View style={{ alignItems: "center", paddingVertical: bosluk.lg }}>
          <Metin baslik boyut="4xl" renkli={renk.murekkep}>
            {teklif.ucret.toplam} ₺
          </Metin>
          {/*
            ORAN VE TABAN YAZILIYOR. Hakediş artık siparişin yüzdesi; yalnızca
            toplam gösterilseydi kurye bir işten 60, diğerinden 95 TL almasını
            keyfî bulurdu. Kupon kesintisi de ayrı satırda — gizlenseydi kuponlu
            siparişte kazancın neden düştüğü görünmez, hesap yanlış sanılırdı.
          */}
          <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
            {teklif.ucret.siparisTutari} ₺ siparişin %{teklif.ucret.yuzde}&apos;i
          </Metin>
          {teklif.ucret.kuponKesintisi > 0 ? (
            <Metin boyut="xs" renkli={renk.kahve[800]} style={{ marginTop: bosluk.xs }}>
              Kupon payı −{teklif.ucret.kuponKesintisi} ₺
            </Metin>
          ) : null}
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
            alt={teklif.teslimIlcesi}
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
