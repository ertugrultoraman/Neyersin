import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  bosluk,
  golge,
  katalog,
  renk,
  sure,
  yaricap,
  type RestoranDetayDto,
  type UrunDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { useSepet, type Mutfak } from "@/sepet/Baglam";

const uclar = katalog(api);

/**
 * MUTFAK DETAYI — kapak, bilgiler ve menü.
 *
 * Menü TEK LİSTE olarak çiziliyor: bölüm başlıkları da satır. İç içe liste
 * (bölüm başına ayrı FlashList) kurulsaydı dıştaki liste iç listelerin
 * yüksekliğini bilemez, geri dönüşüm bozulur ve uzun menülerde kaydırma
 * takılırdı.
 */
type Satir =
  | { tur: "bolum"; id: string; baslik: string }
  | { tur: "urun"; id: string; urun: UrunDto };

export default function RestoranDetayi() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  const detay = useVeri(() => uclar.restoran(slug), slug);

  /* Bölüm başlıkları ve ürünler tek düz diziye açılıyor. */
  const satirlar = useMemo<Satir[]>(() => {
    if (!detay.veri) return [];
    return detay.veri.menu.flatMap((bolum): Satir[] => [
      { tur: "bolum", id: `bolum:${bolum.id}`, baslik: bolum.baslik },
      ...bolum.urunler.map((urun): Satir => ({ tur: "urun", id: urun.id, urun })),
    ]);
  }, [detay.veri]);

  if (detay.yukleniyor) {
    return (
      <View style={{ flex: 1, backgroundColor: renk.beyaz, justifyContent: "center" }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={renk.sari[600]} />
      </View>
    );
  }

  if (!detay.veri) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: renk.beyaz,
          alignItems: "center",
          justifyContent: "center",
          padding: bosluk.xl,
          gap: bosluk.md,
        }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <MaterialCommunityIcons name="store-off" size={40} color={renk.kahve[300]} />
        <Metin baslik boyut="lg" ortala>
          Mutfağa ulaşılamadı
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
          {detay.hata?.message ?? "Bu mutfak kaldırılmış olabilir."}
        </Metin>
        <Dugme baslik="Geri dön" tur="ikincil" onPress={() => yonlendir.back()} />
      </View>
    );
  }

  const m = detay.veri;

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz }}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlashList
        data={satirlar}
        keyExtractor={(s) => s.id}
        renderItem={({ item }: ListRenderItemInfo<Satir>) =>
          item.tur === "bolum" ? (
            <Metin baslik boyut="xl" style={{ marginTop: bosluk.xl, marginBottom: bosluk.sm }}>
              {item.baslik}
            </Metin>
          ) : (
            <UrunSatiri urun={item.urun} mutfak={{ slug: m.slug, ad: m.ad }} acik={m.acik} />
          )
        }
        /* Alt sepet çubuğu son satırı örtmesin. */
        contentContainerStyle={{ paddingBottom: kenar.bottom + bosluk["4xl"] + 40 }}
        ListHeaderComponent={<Kapak detay={m} kenarUst={kenar.top} />}
        ListEmptyComponent={
          <View style={{ padding: bosluk.xl }}>
            <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
              Bu mutfak henüz menüsünü yayınlamadı.
            </Metin>
          </View>
        }
      />

      {/* Geri düğmesi kapağın ÜSTÜNDE yüzüyor: kapak ekranın en üstünden
          başlıyor ve normal bir başlık çubuğu görseli ikiye bölerdi. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Geri"
        onPress={() => yonlendir.back()}
        style={{
          position: "absolute",
          top: kenar.top + bosluk.sm,
          left: bosluk.lg,
          width: 40,
          height: 40,
          borderRadius: yaricap.tam,
          backgroundColor: "rgba(255,255,255,0.92)",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: golge.yumusak,
        }}
      >
        <MaterialCommunityIcons name="chevron-left" size={26} color={renk.kahve[900]} />
      </Pressable>

      <SepetCubugu />
    </View>
  );
}

/**
 * Ekranın altında duran sepet çubuğu.
 *
 * Yalnızca sepette ürün varken görünüyor ve BAŞKA MUTFAĞIN sepetinde de
 * görünüyor — kişi bir mutfağa bakarken diğerinde bıraktığı sepeti unutmasın.
 * Hangi mutfağa ait olduğu üstünde yazıyor ki dokununca şaşırmasın.
 */
function SepetCubugu() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const { adetToplam, restoranAdi, ozet, hesaplaniyor } = useSepet();

  if (adetToplam === 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => yonlendir.push("/sepet")}
      style={{
        position: "absolute",
        left: bosluk.lg,
        right: bosluk.lg,
        bottom: kenar.bottom + bosluk.md,
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
        backgroundColor: renk.sari[500],
        borderRadius: yaricap.tam,
        paddingHorizontal: bosluk.lg,
        paddingVertical: bosluk.md,
        boxShadow: golge.sari,
      }}
    >
      <View
        style={{
          minWidth: 26,
          height: 26,
          borderRadius: yaricap.tam,
          backgroundColor: renk.murekkep,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 6,
        }}
      >
        <Metin boyut="xs" agirlik="kalin" renkli={renk.sari[500]}>
          {adetToplam}
        </Metin>
      </View>

      <View style={{ flex: 1 }}>
        <Metin baslik boyut="md" renkli={renk.murekkep} numberOfLines={1}>
          Sepeti gör
        </Metin>
        {restoranAdi ? (
          <Metin boyut="2xs" renkli={renk.kahve[700]} numberOfLines={1}>
            {restoranAdi}
          </Metin>
        ) : null}
      </View>

      {hesaplaniyor ? (
        <ActivityIndicator color={renk.murekkep} />
      ) : ozet ? (
        <Metin baslik boyut="md" renkli={renk.murekkep}>
          {ozet.tutarlar.araToplam} ₺
        </Metin>
      ) : null}
    </Pressable>
  );
}

/* --------------------------------------------------------------------------
 * Kapak + künye
 * ----------------------------------------------------------------------- */

function Kapak({
  detay,
  kenarUst,
}: {
  detay: RestoranDetayDto;
  kenarUst: number;
}) {
  return (
    <View>
      <View style={{ height: 220 + kenarUst, backgroundColor: renk.kahve[100] }}>
        {detay.gorselUrl ? (
          <Image
            source={{ uri: detay.gorselUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={sure.normal}
          />
        ) : null}
      </View>

      <View style={{ paddingHorizontal: bosluk.xl, paddingTop: bosluk.lg, gap: bosluk.sm }}>
        <Metin baslik boyut="2xl">
          {detay.ad}
        </Metin>

        {detay.slogan ? (
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            {detay.slogan}
          </Metin>
        ) : null}

        <Metin boyut="sm" renkli={renk.metinIkincil}>
          {detay.mutfak} · {detay.semt}
        </Metin>

        {!detay.acik ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.sm,
              backgroundColor: renk.kremKoyu,
              borderRadius: yaricap.lg,
              padding: bosluk.md,
              marginTop: bosluk.xs,
            }}
          >
            <MaterialCommunityIcons name="clock-alert-outline" size={18} color={renk.kahve[600]} />
            <Metin boyut="sm" renkli={renk.kahve[800]} style={{ flex: 1 }}>
              Şu an kapalı. Menüye bakabilirsin ama sipariş veremezsin.
            </Metin>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: bosluk.xl, marginTop: bosluk.sm }}>
          <Kunye
            ikon="star"
            ustBilgi={detay.puan > 0 ? detay.puan.toFixed(1) : "Yeni"}
            altBilgi={detay.puan > 0 ? `${detay.yorumSayisi} değerlendirme` : "değerlendirilmedi"}
          />
          <Kunye ikon="clock-outline" ustBilgi={detay.teslimatSuresi} altBilgi="teslimat" />
          <Kunye
            ikon="basket-outline"
            ustBilgi={`${detay.minSepet} ₺`}
            altBilgi="min. sepet"
          />
        </View>

        {detay.hikaye ? (
          <View style={{ marginTop: bosluk.lg, gap: bosluk.xs }}>
            <Metin baslik boyut="lg">
              Mutfağın hikâyesi
            </Metin>
            <Metin boyut="sm" renkli={renk.kahve[700]}>
              {detay.hikaye}
            </Metin>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Kunye({
  ikon,
  ustBilgi,
  altBilgi,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  ustBilgi: string;
  altBilgi: string;
}) {
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.xs }}>
        <MaterialCommunityIcons name={ikon} size={16} color={renk.sari[600]} />
        <Metin boyut="sm" agirlik="kalin">
          {ustBilgi}
        </Metin>
      </View>
      <Metin boyut="2xs" renkli={renk.metinIkincil}>
        {altBilgi}
      </Metin>
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Menü satırı
 * ----------------------------------------------------------------------- */

function UrunSatiri({
  urun,
  mutfak,
  acik,
}: {
  urun: UrunDto;
  mutfak: Mutfak;
  acik: boolean;
}) {
  /*
   * Fiyatı 0 olan ürün TASLAK: mutfak fiyatını henüz girmemiş. Menüde
   * görünüyor ama sepete eklenemiyor (bkz. UrunDto sözleşmesi). Listeden
   * çıkarılsaydı mutfak kendi ürününün neden görünmediğini anlayamazdı.
   */
  const taslak = urun.fiyat <= 0;
  const { ekle, sifirlaVeEkle, adetAyarla, urunAdedi } = useSepet();
  const adet = urunAdedi(urun.id);

  /*
   * EKSTRALAR HENÜZ YOK. UrunDto ekstra listesini taşımıyor; web'de içecek ve
   * ek malzeme seçilebiliyor, uygulamada seçilemiyor. Sepet ve sipariş
   * sözleşmesi ekstraları zaten taşıdığı için eklendiğinde bu satırın dışında
   * bir şey değişmeyecek — burada uydurma bir seçim sunmaktansa hiç
   * sunmamak tercih edildi.
   */
  function sepeteEkle() {
    const kalem = { urunId: urun.id, ad: urun.ad, adet: 1 };
    const sonuc = ekle(mutfak, kalem);
    if (sonuc.durum === "eklendi") return;

    Alert.alert(
      "Sepetinde başka mutfak var",
      `Sepetinde ${sonuc.mevcutMutfak} mutfağından ürünler duruyor. Tek siparişte tek mutfaktan alabiliyorsun.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sepeti boşalt",
          style: "destructive",
          onPress: () => sifirlaVeEkle(mutfak, kalem),
        },
      ],
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        gap: bosluk.lg,
        paddingHorizontal: bosluk.xl,
        paddingVertical: bosluk.md,
        opacity: taslak ? 0.55 : 1,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Metin boyut="md" agirlik="orta">
          {urun.ad}
        </Metin>
        {urun.aciklama ? (
          <Metin boyut="sm" renkli={renk.metinIkincil} numberOfLines={2}>
            {urun.aciklama}
          </Metin>
        ) : null}
        <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[900]} style={{ marginTop: bosluk.xs }}>
          {taslak ? "Fiyat yakında" : `${urun.fiyat} ₺`}
          {urun.birim && !taslak ? (
            <Metin boyut="xs" renkli={renk.metinIkincil}>
              {"  "}
              {urun.birim}
            </Metin>
          ) : null}
        </Metin>
      </View>

      <View style={{ alignItems: "center", gap: bosluk.sm }}>
        {urun.gorselUrl ? (
          <Image
            source={{ uri: urun.gorselUrl }}
            style={{ width: 84, height: 84, borderRadius: yaricap.lg }}
            contentFit="cover"
            transition={sure.normal}
          />
        ) : null}

        {/*
          Kapalı mutfakta ekleme düğmesi hiç çizilmiyor. Çizilip pasif
          bırakılsaydı kullanıcı dokunup dokunup neden olmadığını arardı;
          kapağın üstündeki "şu an kapalı" şeridi sebebi zaten söylüyor.
        */}
        {taslak || !acik ? null : adet === 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${urun.ad} ekle`}
            onPress={sepeteEkle}
            hitSlop={6}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: bosluk.md,
              paddingVertical: 6,
              borderRadius: yaricap.tam,
              backgroundColor: renk.sari[500],
            }}
          >
            <MaterialCommunityIcons name="plus" size={16} color={renk.murekkep} />
            <Metin boyut="xs" agirlik="kalin" renkli={renk.murekkep}>
              Ekle
            </Metin>
          </Pressable>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.md,
              paddingHorizontal: bosluk.sm,
              paddingVertical: 4,
              borderRadius: yaricap.tam,
              backgroundColor: renk.sari[500],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${urun.ad} azalt`}
              onPress={() => adetAyarla(urun.id, adet - 1)}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={adet === 1 ? "trash-can-outline" : "minus"}
                size={16}
                color={renk.murekkep}
              />
            </Pressable>
            <Metin boyut="sm" agirlik="kalin" renkli={renk.murekkep}>
              {adet}
            </Metin>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${urun.ad} artır`}
              onPress={() => adetAyarla(urun.id, adet + 1)}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="plus" size={16} color={renk.murekkep} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
