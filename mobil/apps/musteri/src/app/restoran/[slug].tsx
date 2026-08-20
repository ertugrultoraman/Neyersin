import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
  type YorumDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { EkstraSecimi } from "@/gorunum/EkstraSecimi";
import { satirIdUret, useSepet, type Mutfak } from "@/sepet/Baglam";

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
        /* Teslimat bölgeleri ve değerlendirmeler menünün ALTINDA — web'de de
           öyle. Menü sayfanın asıl içeriği; okuma sırası aynı kalsın. */
        ListFooterComponent={<Alt detay={m} />}
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

        {/*
          KİŞİSEL SATIR — adın hemen altında, web'deki mutfak sayfasının
          aynısı. "32 yıldır pişiriyor · Erzurum mutfağı" tek satırda iki
          soruyu birden cevaplıyor: ne kadar tecrübeli ve nereli.
        */}
        {detay.deneyimYili || detay.memleket ? (
          <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
            {[
              detay.deneyimYili ? `${detay.deneyimYili} yıldır pişiriyor` : "",
              detay.memleket,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Metin>
        ) : null}

        {/* İmza yemeği — mutfağın tek cümlelik kimliği. */}
        {detay.imzaYemegi ? (
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.xs,
              backgroundColor: renk.murekkep,
              borderRadius: yaricap.tam,
              paddingHorizontal: bosluk.md,
              paddingVertical: 6,
            }}
          >
            <Metin boyut="2xs" agirlik="kalin" renkli={renk.sari[500]}>
              İmza yemeği
            </Metin>
            <Metin boyut="2xs" agirlik="kalin" renkli={renk.sari[300]}>
              {detay.imzaYemegi}
            </Metin>
          </View>
        ) : null}

        {/*
          ROZETLER (Altın Şef, şef şapkası basamakları) — web'de adın yanında
          duruyorlar. Uygulamada da müşteri görsün: bu unvanları yönetici
          veriyor ve mutfağın özgeçmişinin denetlendiği anlamına geliyorlar.
        */}
        {detay.rozetler.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.xs }}>
            {detay.rozetler.map((rozet) => (
              <View
                key={rozet}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: renk.sari[500],
                  borderRadius: yaricap.tam,
                  paddingHorizontal: bosluk.md,
                  paddingVertical: 5,
                }}
              >
                <MaterialCommunityIcons name="chef-hat" size={13} color={renk.murekkep} />
                <Metin boyut="2xs" agirlik="kalin" renkli={renk.murekkep}>
                  {rozet}
                </Metin>
              </View>
            ))}
          </View>
        ) : null}

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

        {/*
          ŞEF PROFİLİ — web'deki "Şef profili" kutusunun aynısı: hikâye,
          uzmanlık, sertifikalar, mutfaktan kareler ve bir müşteri sözü.
          Hiçbiri doluysa kutu hiç çizilmiyor.
        */}
        {detay.hikaye || detay.uzmanlik || detay.sertifikalar || (detay.galeri ?? []).length > 0 ? (
          <View
            style={{
              marginTop: bosluk.lg,
              gap: bosluk.sm,
              backgroundColor: renk.krem,
              borderRadius: yaricap["2xl"],
              borderWidth: 1,
              borderColor: renk.cizgi,
              padding: bosluk.lg,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.xs }}>
              <MaterialCommunityIcons name="chef-hat" size={17} color={renk.sari[600]} />
              <Metin baslik boyut="lg">
                Şef profili
              </Metin>
            </View>

            {detay.hikaye ? (
              <Metin boyut="sm" renkli={renk.kahve[700]}>
                {detay.hikaye}
              </Metin>
            ) : (
              <Metin boyut="sm" renkli={renk.metinIkincil}>
                {detay.ad} kendi hikâyesini henüz yazmadı.
              </Metin>
            )}

            {detay.uzmanlik ? (
              <Metin boyut="sm" renkli={renk.kahve[700]}>
                <Metin boyut="sm" agirlik="kalin">
                  Uzmanlık:{" "}
                </Metin>
                {detay.uzmanlik}
              </Metin>
            ) : null}

            {detay.sertifikalar ? (
              <View style={{ gap: 2, marginTop: bosluk.xs }}>
                <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
                  SERTİFİKALAR
                </Metin>
                <Metin boyut="sm" renkli={renk.kahve[700]}>
                  {detay.sertifikalar}
                </Metin>
              </View>
            ) : null}

            {/*
              MUTFAKTAN KARELER — şefin kendi çektiği fotoğraflar. Kapak
              mutfağın vitrini; bunlar tencerenin başı. Yüzünü koymak
              istemeyen ev hanımı için de bir yol.
            */}
            {(detay.galeri ?? []).length > 0 ? (
              <View style={{ gap: bosluk.xs, marginTop: bosluk.xs }}>
                <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
                  MUTFAĞINDAN
                </Metin>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.xs }}>
                  {(detay.galeri ?? []).map((kare) => (
                    <Image
                      key={kare}
                      source={{ uri: kare }}
                      style={{
                        width: "31.5%",
                        aspectRatio: 1,
                        borderRadius: yaricap.lg,
                        backgroundColor: renk.kremKoyu,
                      }}
                      contentFit="cover"
                      transition={sure.normal}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/*
              MÜŞTERİ SÖZÜ — şef kendini anlatıyor, sonra bir müşteri onu
              doğruluyor. Uydurma değil: en yüksek puanlı, metni olan gerçek
              yorum (web sayfasında da aynı seçim yapılıyor).
            */}
            {sozAl(detay.yorumlar) ? (
              <View
                style={{
                  marginTop: bosluk.xs,
                  borderTopWidth: 1,
                  borderTopColor: renk.cizgi,
                  paddingTop: bosluk.md,
                  gap: 4,
                }}
              >
                <Metin boyut="sm" renkli={renk.kahve[800]} style={{ fontStyle: "italic" }}>
                  “{sozAl(detay.yorumlar)?.metin}”
                </Metin>
                <Metin boyut="2xs" agirlik="kalin" renkli={renk.metinIkincil}>
                  {sozAl(detay.yorumlar)?.musteriAdi}
                </Metin>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Profilde alıntılanacak müşteri sözü: en yüksek puanlı ve METNİ OLAN yorum.
 *
 * Yalnızca yıldız verilmiş bir yorumun alıntılanacak sözü yok. Seçim bir
 * vitrin kararı ama gösterilen cümle gerçek bir müşterinin yazdığı cümle —
 * web'deki mutfak sayfası da aynısını yapıyor.
 */
function sozAl(yorumlar: YorumDto[]): YorumDto | null {
  return (
    [...yorumlar]
      .filter((y) => y.metin)
      .sort(
        (a, b) => b.sicaklik + b.teslimatHizi + b.tad - (a.sicaklik + a.teslimatHizi + a.tad),
      )[0] ?? null
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
  const [ekstraAcik, setEkstraAcik] = useState(false);

  const ekstrasiVar = (urun.ekstralar?.length ?? 0) > 0;

  function sepeteEkle(ekstraIdler: string[] = []) {
    const kalem = {
      satirId: satirIdUret(urun.id, ekstraIdler),
      urunId: urun.id,
      ad: urun.ad,
      adet: 1,
      ...(ekstraIdler.length > 0 ? { ekstraIdler } : {}),
    };
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
            /* Ekstrası olan ürün önce seçim katını açıyor. */
            onPress={() => (ekstrasiVar ? setEkstraAcik(true) : sepeteEkle())}
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
              /*
               * Ekstralı ürünün "+" düğmesi seçim katını YENİDEN açıyor: kişi
               * ikinci kanadı farklı sosla isteyebilir. Sessizce ilk seçimi
               * tekrarlamak, o tercihi hiç sormamak olurdu.
               */
              onPress={() => (ekstrasiVar ? setEkstraAcik(true) : adetAyarla(urun.id, adet + 1))}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="plus" size={16} color={renk.murekkep} />
            </Pressable>
          </View>
        )}
      </View>

      <EkstraSecimi
        urun={ekstraAcik ? urun : null}
        acik={ekstraAcik}
        kapat={() => setEkstraAcik(false)}
        ekle={(ekstraIdler) => sepeteEkle(ekstraIdler)}
      />
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Menü altı: teslimat bölgeleri + değerlendirmeler
 * ----------------------------------------------------------------------- */

/**
 * MENÜNÜN ALTI — web'deki mutfak sayfasının alt yarısı.
 *
 * Değerlendirmeler burada, kapakta değil: müşteri önce ne yiyeceğine bakıyor,
 * sonra kimden aldığına. Kapağa konsaydı menüye inmek için puanların
 * arasından geçmek gerekirdi.
 */
function Alt({ detay }: { detay: RestoranDetayDto }) {
  const ozet = detay.yorumOzeti;

  return (
    <View style={{ paddingHorizontal: bosluk.xl, marginTop: bosluk["2xl"], gap: bosluk.lg }}>
      {/* Teslimat bölgeleri — kişinin ilk sorusu "bana getiriyor mu". */}
      {detay.teslimatBolgeleri.length > 0 ? (
        <View style={{ gap: bosluk.sm }}>
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.metinIkincil}>
            TESLİMAT BÖLGELERİ
          </Metin>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.xs }}>
            {detay.teslimatBolgeleri.map((bolge) => (
              <View
                key={bolge}
                style={{
                  backgroundColor: renk.kremKoyu,
                  borderRadius: yaricap.tam,
                  paddingHorizontal: bosluk.md,
                  paddingVertical: 5,
                }}
              >
                <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
                  {bolge}
                </Metin>
              </View>
            ))}
          </View>
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            Kurye ücreti {detay.teslimatUcreti === 0 ? "yok" : `${detay.teslimatUcreti} ₺`} ·
            Kapıda nakit veya kart
          </Metin>
        </View>
      ) : null}

      {/* Değerlendirmeler */}
      <View style={{ gap: bosluk.md }}>
        <Metin baslik boyut="xl">
          Değerlendirmeler
        </Metin>

        {ozet.adet === 0 ? (
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Bu mutfak henüz değerlendirilmedi. İlk yorumu sen yazabilirsin.
          </Metin>
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.lg }}>
              <View style={{ alignItems: "center" }}>
                <Metin baslik boyut="3xl">
                  {ozet.ortalama.toFixed(1)}
                </Metin>
                <Yildizlar puan={ozet.ortalama} />
                <Metin boyut="2xs" renkli={renk.metinIkincil}>
                  {ozet.adet} değerlendirme
                </Metin>
              </View>

              {/* Üç eksen: web'de de sıcaklık, teslimat hızı ve tad ayrı ayrı. */}
              <View style={{ flex: 1, gap: 6 }}>
                <Eksen etiket="Sıcaklık" puan={ozet.sicaklik} />
                <Eksen etiket="Teslimat hızı" puan={ozet.teslimatHizi} />
                <Eksen etiket="Tad" puan={ozet.tad} />
              </View>
            </View>

            {detay.yorumlar.map((yorum) => (
              <YorumKarti key={yorum.id} yorum={yorum} mutfakAdi={detay.ad} />
            ))}
          </>
        )}
      </View>
    </View>
  );
}

/** Beş yıldız; yarım puanlar dolu yıldıza yuvarlanmıyor, boş kalıyor. */
function Yildizlar({ puan }: { puan: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1, marginVertical: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <MaterialCommunityIcons
          key={n}
          name={n <= Math.round(puan) ? "star" : "star-outline"}
          size={13}
          color={renk.sari[600]}
        />
      ))}
    </View>
  );
}

/** Tek eksenin çubuğu — 5 üzerinden doluluk. */
function Eksen({ etiket, puan }: { etiket: string; puan: number }) {
  return (
    <View style={{ gap: 3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          {etiket}
        </Metin>
        <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
          {puan.toFixed(1)}
        </Metin>
      </View>
      <View
        style={{
          height: 5,
          borderRadius: yaricap.tam,
          backgroundColor: renk.kremKoyu,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${Math.max(0, Math.min(100, (puan / 5) * 100))}%`,
            height: "100%",
            backgroundColor: renk.sari[500],
          }}
        />
      </View>
    </View>
  );
}

/**
 * Tek yorum.
 *
 * MUTFAĞIN YANITI da gösteriliyor: tek yönlü bir değerlendirme adil değil,
 * şefin "o gün şu oldu" diyebileceği yer web'de var, uygulamada da olmalı.
 */
function YorumKarti({ yorum, mutfakAdi }: { yorum: YorumDto; mutfakAdi: string }) {
  const ortalama = (yorum.sicaklik + yorum.teslimatHizi + yorum.tad) / 3;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: renk.cizgi,
        borderRadius: yaricap.xl,
        padding: bosluk.lg,
        gap: bosluk.xs,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Metin boyut="sm" agirlik="kalin">
          {yorum.musteriAdi}
        </Metin>
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          {tarihYaz(yorum.tarih)}
        </Metin>
      </View>

      <Yildizlar puan={ortalama} />

      {yorum.metin ? (
        <Metin boyut="sm" renkli={renk.kahve[700]}>
          {yorum.metin}
        </Metin>
      ) : null}

      {yorum.yanit ? (
        <View
          style={{
            marginTop: bosluk.xs,
            backgroundColor: renk.krem,
            borderRadius: yaricap.lg,
            padding: bosluk.md,
            gap: 2,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
            {mutfakAdi} yanıtladı
          </Metin>
          <Metin boyut="sm" renkli={renk.kahve[700]}>
            {yorum.yanit}
          </Metin>
        </View>
      ) : null}
    </View>
  );
}

/** "12 Ağustos 2026". Saat gösterilmiyor: yorumun günü yeter. */
function tarihYaz(iso: string): string {
  const t = new Date(iso);
  return Number.isNaN(t.getTime())
    ? ""
    : t.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
