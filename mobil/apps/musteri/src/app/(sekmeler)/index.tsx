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
import { MarkaSerit } from "@/gorunum/MarkaSerit";
import { MenuKati } from "@/gorunum/MenuKati";
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
   * İKİ ALIŞVERİŞ TARAFI — web'de ayrı sayfalar: "Şeflerin Elinden" (evinde
   * pişiren kişiler) ve "İşletmeler" (restoran, pastane, kasap). Uygulamada
   * ayrı ekran yerine tek listenin üstünde süzgeç: telefonda iki ayrı sekme
   * arasında gidip gelmek, aynı yemeği ararken listeyi ikiye bölmek olurdu.
   *
   * `null` = ikisi birden.
   */
  const [tur, setTur] = useState<"sef" | "isletme" | null>(null);

  /* Kategoriler ve alışveriş tarafı artık soldan açılan menüde (bkz. MenuKati). */
  const [menuAcik, setMenuAcik] = useState(false);

  /*
   * Her harfte istek atmamak için `useDeferredValue`. Elle yazılmış bir
   * debounce zamanlayıcısı yerine bu seçildi: React, yazma sırasında düşük
   * öncelikli güncellemeyi zaten erteliyor ve klavye takılmıyor. Zamanlayıcı
   * kurulsaydı ayrıca temizlemesi ve ekran kapanınca iptali gerekirdi.
   */
  const ertelenmisArama = useDeferredValue(arama);

  const suzgec = useMemo(
    () => ({
      kategori: kategori ?? undefined,
      ara: ertelenmisArama,
      ...(tur ? { tur } : {}),
    }),
    [kategori, ertelenmisArama, tur],
  );

  /* Anahtar DİZGE: nesne verilseydi her render'da "değişti" sayılırdı. */
  const anahtar = `${kategori ?? ""}|${ertelenmisArama.trim()}|${tur ?? ""}`;

  const kategoriler = useVeri(() => uclar.kategoriler(), "kategoriler");
  const restoranlar = useVeri(() => uclar.restoranlar(suzgec), anahtar);

  /*
   * ANA SAYFA BÖLÜMLERİ (kampanyalar, öne çıkanlar, anket, adımlar, SSS) tek
   * uçtan geliyor ve SÜZGEÇTEN BAĞIMSIZ: sabit anahtarla istendiği için
   * kullanıcı arama kutusuna yazdıkça yeniden inmiyor.
   */
  const anasayfa = useVeri(() => uclar.anasayfa(), "anasayfa");

  /*
   * Arama, kategori ya da taraf seçiliyken vitrin kapanıyor; ekranda yalnızca
   * sonuç kalıyor.
   *
   * ANAHTARA BAKILMIYOR: o dizge süzgeçler boşken bile ayraçlardan ("||")
   * oluşuyor ve uzunluğu sıfır olmuyor — anahtarın uzunluğuna bakan ilk hâl,
   * kampanyaları ve anketi hiçbir zaman göstermiyordu.
   */
  const suzgecVar = Boolean(kategori) || ertelenmisArama.trim().length > 0 || Boolean(tur);

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

  /* Menüdeki seçili süzgeç sayısı — şerit rozetinde görünüyor. */
  const secilenSuzgec = (kategori ? 1 : 0) + (tur ? 1 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz }}>
      {/*
        MARKA ŞERİDİ listenin İÇİNDE değil ÜSTÜNDE: kaydırınca kaybolmuyor.
        Menü düğmesi her an elinin altında olmalı — kategoriyi değiştirmek
        için listenin başına dönmek gerekseydi süzgeç kullanılmaz olurdu.
      */}
      <MarkaSerit
        ustBosluk={kenar.top}
        menuAc={() => setMenuAcik(true)}
        suzgecSayisi={secilenSuzgec}
      />

      <MenuKati
        acik={menuAcik}
        kapat={() => setMenuAcik(false)}
        kategoriler={kategoriler.veri ?? []}
        kategori={kategori}
        setKategori={setKategori}
        tur={tur}
        setTur={setTur}
      />

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
            tur={tur}
            setTur={setTur}
            menuAc={() => setMenuAcik(true)}
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
  tur,
  setTur,
  menuAc,
  anasayfa,
  suzgecVar,
  yukleniyor,
}: {
  arama: string;
  setArama: (deger: string) => void;
  kategori: string | null;
  setKategori: (deger: string | null) => void;
  kategoriler: VeriDurumu<KategoriDto[]>;
  tur: "sef" | "isletme" | null;
  setTur: (deger: "sef" | "isletme" | null) => void;
  menuAc: () => void;
  anasayfa: AnasayfaDto | null;
  suzgecVar: boolean;
  yukleniyor: boolean;
}) {
  return (
    <View style={{ paddingTop: bosluk.lg, paddingBottom: bosluk.lg, gap: bosluk.lg }}>
      {/* Selamlama şeride taşındı (bkz. gorunum/MarkaSerit); burada arama
          kutusu ekranın en üstündeki iş: kişi çoğu zaman aklındaki yemeği
          yazmak için giriyor. */}
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

      {/*
        AÇIK SÜZGEÇLER — kategoriler ve alışveriş tarafı menüye taşındı
        (bkz. gorunum/MenuKati). Burada yalnızca SEÇİLİ olanlar duruyor:
        menü kapalıyken de hangi süzgecin açık olduğu görünsün ve tek
        dokunuşla kalksın. Kutunun tamamı menüyü açıyor.
      */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kategori menüsünü aç"
          onPress={menuAc}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: bosluk.xs,
            borderRadius: yaricap.tam,
            borderWidth: 1,
            borderColor: renk.cizgi,
            backgroundColor: renk.krem,
            paddingHorizontal: bosluk.lg,
            paddingVertical: bosluk.sm,
          }}
        >
          <MaterialCommunityIcons name="tune-variant" size={16} color={renk.kahve[700]} />
          <Metin boyut="sm" agirlik="orta" renkli={renk.kahve[700]}>
            Kategoriler
          </Metin>
        </Pressable>

        {tur ? (
          <SuzgecEtiketi
            etiket={tur === "sef" ? "Şeflerin elinden" : "İşletmeler"}
            kaldir={() => setTur(null)}
          />
        ) : null}

        {kategori ? (
          <SuzgecEtiketi
            etiket={
              kategoriler.veri?.find((k) => k.slug === kategori)?.ad ?? kategori
            }
            kaldir={() => setKategori(null)}
          />
        ) : null}
      </View>

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

/**
 * AÇIK SÜZGEÇ ETİKETİ — "İşletmeler ×" gibi.
 *
 * Kategori ve taraf düğmelerinin yerini aldı: seçim artık menüde yapılıyor
 * (bkz. gorunum/MenuKati), listenin üstünde yalnızca AÇIK olan süzgeç
 * duruyor. On iki kategori düğmesi ekranın ilk yarısını kaplıyor ve asıl iş
 * olan mutfak listesini aşağı itiyordu.
 *
 * Etikete dokunmak süzgeci KALDIRIYOR — açık bir süzgeci kapatmak için menüyü
 * açıp aynı satırı bulmak gerekmesin.
 */
function SuzgecEtiketi({ etiket, kaldir }: { etiket: string; kaldir: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${etiket} süzgecini kaldır`}
      onPress={kaldir}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.xs,
        borderRadius: yaricap.tam,
        backgroundColor: renk.sari[500],
        paddingLeft: bosluk.lg,
        paddingRight: bosluk.md,
        paddingVertical: bosluk.sm,
      }}
    >
      <Metin boyut="sm" agirlik="kalin" renkli={renk.murekkep}>
        {etiket}
      </Metin>
      <MaterialCommunityIcons name="close-circle" size={16} color={renk.murekkep} />
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
