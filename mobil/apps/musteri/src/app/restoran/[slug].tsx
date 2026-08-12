import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
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
            <UrunSatiri urun={item.urun} />
          )
        }
        contentContainerStyle={{ paddingBottom: kenar.bottom + bosluk["3xl"] }}
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
    </View>
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

function UrunSatiri({ urun }: { urun: UrunDto }) {
  /*
   * Fiyatı 0 olan ürün TASLAK: mutfak fiyatını henüz girmemiş. Menüde
   * görünüyor ama sepete eklenemiyor (bkz. UrunDto sözleşmesi). Listeden
   * çıkarılsaydı mutfak kendi ürününün neden görünmediğini anlayamazdı.
   */
  const taslak = urun.fiyat <= 0;

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

      {urun.gorselUrl ? (
        <Image
          source={{ uri: urun.gorselUrl }}
          style={{ width: 84, height: 84, borderRadius: yaricap.lg }}
          contentFit="cover"
          transition={sure.normal}
        />
      ) : null}
    </View>
  );
}
