import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  bosluk,
  katalog,
  renk,
  yaricap,
  yazi,
  yaziAilesi,
  type AnasayfaDto,
  type KategoriDto,
  type RestoranOzetDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri, type VeriDurumu } from "ortak/veri";

import { api } from "@/altyapi/api";
import {
  AnketKarti,
  EvHanimiCagrisi,
  IstatistikSeridi,
  KampanyaRayi,
  MutfakRayi,
  NasilCalisirBolumu,
  SiralamaCagrisi,
  SssBolumu,
} from "@/gorunum/AnasayfaBolumleri";
import { KategoriIkonu } from "@/gorunum/KategoriIkonu";
import { RestoranKarti } from "@/gorunum/RestoranKarti";

const uclar = katalog(api);

/**
 * KEŞFET — uygulamanın açılış ekranı.
 *
 * Giriş İSTEMİYOR: kataloğa bakmak için hesap gerekmiyor (bkz. sunucu tarafı
 * `acik()`). Uygulamayı yeni indiren kişi önce yemekleri görüyor, kayıt ancak
 * sipariş anında isteniyor.
 *
 * SÜZGEÇLER SUNUCUDA. Liste indirilip cihazda filtrelenseydi bugün (20 mutfak)
 * çalışırdı ama katalog büyüdükçe her açılışta tüm veriyi indirmek gerekirdi.
 * Kategori ve arama sorgu dizesine giriyor, `useVeri` anahtarı değişince istek
 * yenileniyor.
 */
export default function Kesfet() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  const [kategori, setKategori] = useState<string | null>(null);
  const [arama, setArama] = useState("");

  /*
   * Her harfte istek atmamak için `useDeferredValue`. Elle yazılmış bir
   * debounce zamanlayıcısı yerine bu seçildi: React, yazma sırasında düşük
   * öncelikli güncellemeyi zaten erteliyor ve klavye takılmıyor. Zamanlayıcı
   * kurulsaydı ayrıca temizlemesi ve ekran kapanınca iptali gerekirdi.
   */
  const ertelenmisArama = useDeferredValue(arama);

  const suzgec = useMemo(
    () => ({ kategori: kategori ?? undefined, ara: ertelenmisArama }),
    [kategori, ertelenmisArama],
  );

  /* Anahtar DİZGE: nesne verilseydi her render'da "değişti" sayılırdı. */
  const anahtar = `${kategori ?? ""}|${ertelenmisArama.trim()}`;

  const kategoriler = useVeri(() => uclar.kategoriler(), "kategoriler");
  const restoranlar = useVeri(() => uclar.restoranlar(suzgec), anahtar);

  /*
   * ANA SAYFA BÖLÜMLERİ (kampanyalar, öne çıkanlar, anket, adımlar, SSS) tek
   * uçtan geliyor ve SÜZGEÇTEN BAĞIMSIZ: sabit anahtarla istendiği için
   * kullanıcı arama kutusuna yazdıkça yeniden inmiyor.
   */
  const anasayfa = useVeri(() => uclar.anasayfa(), "anasayfa");

  /* Arama ya da kategori açıkken vitrin kapanıyor, ekranda yalnızca sonuç kalıyor. */
  const suzgecVar = anahtar.trim().length > 0;

  const ac = useCallback(
    (slug: string) => yonlendir.push(`/restoran/${slug}`),
    [yonlendir],
  );

  const ciz = useCallback(
    ({ item }: ListRenderItemInfo<RestoranOzetDto>) => (
      <RestoranKarti restoran={item} onPress={ac} />
    ),
    [ac],
  );

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz, paddingTop: kenar.top }}>
      <FlashList
        data={restoranlar.veri ?? []}
        renderItem={ciz}
        keyExtractor={(r) => r.slug}
        /*
         * `estimatedItemSize` YOK: FlashList 2 onu kaldırdı, satır yüksekliğini
         * kendisi ölçüyor. v1'den kalma bir alışkanlıkla verilirse derleme
         * hatası oluyor.
         */
        contentContainerStyle={{
          paddingHorizontal: bosluk.xl,
          paddingBottom: kenar.bottom + bosluk["3xl"],
        }}
        ItemSeparatorComponent={() => <View style={{ height: bosluk.lg }} />}
        ListHeaderComponent={
          <Baslik
            arama={arama}
            setArama={setArama}
            kategori={kategori}
            setKategori={setKategori}
            kategoriler={kategoriler}
            anasayfa={anasayfa.veri}
            suzgecVar={suzgecVar}
            /* İlk yüklemede iskelet yerine boşluk: liste zaten altta yükleniyor. */
            yukleniyor={restoranlar.yukleniyor}
          />
        }
        ListFooterComponent={
          <Alt anasayfa={anasayfa.veri} suzgecVar={suzgecVar} />
        }
        ListEmptyComponent={
          <Bos
            yukleniyor={restoranlar.yukleniyor}
            hata={restoranlar.hata?.message ?? null}
            aramaVar={anahtar.trim().length > 0}
            tazele={restoranlar.tazele}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={restoranlar.tazeleniyor}
            onRefresh={restoranlar.tazele}
            tintColor={renk.sari[600]}
            colors={[renk.sari[600]]}
          />
        }
        /* Klavye açıkken listeye dokunmak önce klavyeyi kapatsın. */
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Başlık: selamlama + arama + kategori rayı
 * ----------------------------------------------------------------------- */

function Baslik({
  arama,
  setArama,
  kategori,
  setKategori,
  kategoriler,
  anasayfa,
  suzgecVar,
  yukleniyor,
}: {
  arama: string;
  setArama: (deger: string) => void;
  kategori: string | null;
  setKategori: (deger: string | null) => void;
  kategoriler: VeriDurumu<KategoriDto[]>;
  anasayfa: AnasayfaDto | null;
  suzgecVar: boolean;
  yukleniyor: boolean;
}) {
  return (
    <View style={{ paddingTop: bosluk.lg, paddingBottom: bosluk.lg, gap: bosluk.lg }}>
      <View>
        <Metin baslik boyut="3xl">
          Ne yersin?
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil} style={{ marginTop: bosluk.xs }}>
          Komşunun mutfağından, kapına kadar
        </Metin>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.sm,
          backgroundColor: renk.krem,
          borderRadius: yaricap.tam,
          borderWidth: 1,
          borderColor: renk.cizgi,
          paddingHorizontal: bosluk.lg,
          height: 48,
        }}
      >
        <MaterialCommunityIcons name="magnify" size={20} color={renk.metinIkincil} />
        <TextInput
          value={arama}
          onChangeText={setArama}
          placeholder="Mutfak, yemek ya da semt ara"
          placeholderTextColor={renk.metinIkincil}
          returnKeyType="search"
          /* Türkçe mutfak adları büyük harfle başlamıyor; otomatik düzeltme kapalı. */
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            ...yazi.sm,
            fontFamily: yaziAilesi.govde,
            color: renk.metin,
            /* Android'de TextInput kendi dikey boşluğunu ekliyor. */
            paddingVertical: 0,
          }}
        />
        {arama.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aramayı temizle"
            onPress={() => setArama("")}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={renk.metinIkincil} />
          </Pressable>
        ) : null}
      </View>

      {kategoriler.veri && kategoriler.veri.length > 0 ? (
        <View style={{ gap: bosluk.sm }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.sm }}>
            <KategoriDugmesi
              secili={kategori === null}
              onPress={() => setKategori(null)}
              etiket="Tümü"
            />
            {kategoriler.veri.map((k) => (
              <KategoriDugmesi
                key={k.slug}
                secili={kategori === k.slug}
                /* Seçili kategoriye tekrar dokunmak süzgeci kaldırıyor. */
                onPress={() => setKategori(kategori === k.slug ? null : k.slug)}
                etiket={k.ad}
                ikon={k.ikon}
                /* Boş kategori gizlenmiyor, soluk gösteriliyor — web'de de öyle. */
                bos={k.adet === 0}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/*
        VİTRİN — web ana sayfasının sırası: sayılar, kampanyalar, anket,
        öne çıkan mutfaklar. Süzgeç açıkken hepsi kapanıyor; arama yapan
        kişi sonucu görmek istiyor, kampanyayı değil.
      */}
      {anasayfa && !suzgecVar ? (
        <View style={{ gap: bosluk.xl }}>
          <IstatistikSeridi istatistik={anasayfa.istatistik} />
          <KampanyaRayi kampanyalar={anasayfa.kampanyalar} />
          {anasayfa.anket ? <AnketKarti anket={anasayfa.anket} /> : null}
          <MutfakRayi
            baslik="Öne çıkanlar"
            aciklama="En yüksek puanlı mutfaklar"
            mutfaklar={anasayfa.oneCikanlar}
          />
        </View>
      ) : null}

      {yukleniyor ? (
        <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk.lg }} />
      ) : null}
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Listenin altı: ayın hanımları, nasıl çalışır, sık sorulanlar, çağrı
 * ----------------------------------------------------------------------- */

/**
 * Web ana sayfasının alt yarısı.
 *
 * Neden ALTTA: bunlar "ne yiyeceğim" sorusuna cevap vermiyor, platformu
 * anlatıyor. Üste konsalardı sipariş vermek için her açılışta anlatının
 * içinden geçmek gerekirdi.
 */
function Alt({ anasayfa, suzgecVar }: { anasayfa: AnasayfaDto | null; suzgecVar: boolean }) {
  if (!anasayfa || suzgecVar) return null;

  return (
    <View style={{ gap: bosluk["2xl"], paddingTop: bosluk["2xl"] }}>
      <MutfakRayi
        baslik="Ayın hanımları"
        aciklama="Evinde pişiren şefler"
        mutfaklar={anasayfa.ayinHanimlari}
      />
      <SiralamaCagrisi />
      <NasilCalisirBolumu adimlar={anasayfa.nasilCalisir} />
      <SssBolumu sorular={anasayfa.sss} />
      <EvHanimiCagrisi />
    </View>
  );
}

function KategoriDugmesi({
  etiket,
  ikon,
  secili,
  bos = false,
  onPress,
}: {
  etiket: string;
  ikon?: Parameters<typeof KategoriIkonu>[0]["ikon"];
  secili: boolean;
  bos?: boolean;
  onPress: () => void;
}) {
  const yaziRengi = secili ? renk.murekkep : renk.kahve[700];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: secili }}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.xs,
        paddingHorizontal: bosluk.lg,
        paddingVertical: bosluk.sm,
        borderRadius: yaricap.tam,
        backgroundColor: secili ? renk.sari[500] : renk.krem,
        borderWidth: 1,
        borderColor: secili ? renk.sari[500] : renk.cizgi,
        opacity: bos && !secili ? 0.5 : 1,
      }}
    >
      {ikon ? <KategoriIkonu ikon={ikon} boyut={16} renkli={yaziRengi} /> : null}
      <Metin boyut="sm" agirlik="orta" renkli={yaziRengi}>
        {etiket}
      </Metin>
    </Pressable>
  );
}

/* --------------------------------------------------------------------------
 * Boş / hata durumu
 * ----------------------------------------------------------------------- */

/**
 * Üç ayrı sebep, üç ayrı metin.
 *
 * Hepsine tek bir "sonuç yok" yazılsaydı, ağ kesikken kullanıcı aradığı şeyin
 * platformda olmadığını sanırdı ve tekrar denemeyi düşünmezdi.
 */
function Bos({
  yukleniyor,
  hata,
  aramaVar,
  tazele,
}: {
  yukleniyor: boolean;
  hata: string | null;
  aramaVar: boolean;
  tazele: () => void;
}) {
  if (yukleniyor) return null;

  return (
    <View style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}>
      <MaterialCommunityIcons
        name={hata ? "wifi-off" : "silverware-clean"}
        size={40}
        color={renk.kahve[300]}
      />
      <Metin baslik boyut="lg" ortala>
        {hata ? "Bağlanamadık" : aramaVar ? "Bulamadık" : "Henüz mutfak yok"}
      </Metin>
      <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
        {hata ??
          (aramaVar
            ? "Başka bir kelime dene ya da kategoriyi kaldır."
            : "Bu bölgede sipariş alan mutfak bulunmuyor.")}
      </Metin>
      {hata ? (
        <Dugme baslik="Tekrar dene" tur="ikincil" onPress={tazele} style={{ marginTop: bosluk.sm }} />
      ) : null}
    </View>
  );
}
