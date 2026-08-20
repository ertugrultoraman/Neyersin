import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { Modal, Pressable, ScrollView, View } from "react-native";
import Animated, { SlideInLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, renk, yaricap, yazi, yaziAilesi, type KategoriDto } from "ortak";
import { Metin } from "ortak/ui";

import { KategoriIkonu } from "@/gorunum/KategoriIkonu";

/**
 * MENÜ KATI — soldan açılan çekmece.
 *
 * KATEGORİLER BURAYA TAŞINDI. Keşfet ekranının tepesinde on iki kategori
 * düğmesi duruyordu; ekranın ilk yarısını kaplıyor ve asıl iş olan mutfak
 * listesini aşağı itiyorlardı. Menüde durunca kategori seçmek bir dokunuş
 * daha uzakta ama liste hemen görünüyor — ve kategori zaten her açılışta
 * seçilen bir şey değil.
 *
 * SOLDAN AÇILIYOR: düğmesi de solda. Sağdan açılan bir çekmece, dokunulan
 * yerden ters yöne kayar ve nereden geldiği anlaşılmazdı.
 *
 * MENÜDE YALNIZCA GEZİNME VAR: hesap ve mutfak ekranları sekmelerde duruyor.
 * Aynı yere iki yoldan gitmek, hangisinin "asıl" olduğunu bulanıklaştırıyor.
 */
export function MenuKati({
  acik,
  kapat,
  kategoriler,
  kategori,
  setKategori,
  tur,
  setTur,
}: {
  acik: boolean;
  kapat: () => void;
  kategoriler: KategoriDto[];
  kategori: string | null;
  setKategori: (deger: string | null) => void;
  tur: "sef" | "isletme" | null;
  setTur: (deger: "sef" | "isletme" | null) => void;
}) {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  /** Süzgeç seçimi menüyü KAPATIYOR: sonuç listede, kişi orayı görmeli. */
  function kategoriSec(slug: string | null) {
    setKategori(slug);
    kapat();
  }

  function tarafSec(deger: "sef" | "isletme" | null) {
    setTur(deger);
    kapat();
  }

  function git(yol: "/siralama" | "/hakkinda" | "/destek" | "/basvuru") {
    kapat();
    yonlendir.push(yol);
  }

  return (
    <Modal visible={acik} transparent animationType="fade" onRequestClose={kapat}>
      {/* Karartma — dışına dokununca kapanıyor. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menüyü kapat"
        onPress={kapat}
        style={{ flex: 1, backgroundColor: "rgba(36, 22, 8, 0.55)" }}
      >
        <Animated.View
          entering={SlideInLeft.duration(220)}
          style={{
            width: "84%",
            maxWidth: 340,
            height: "100%",
            backgroundColor: renk.beyaz,
          }}
        >
          {/*
            Çekmecenin içine dokunmak onu kapatmasın: dıştaki Pressable'ın
            dokunuşu buraya kadar gelmemeli.
          */}
          <Pressable style={{ flex: 1 }} onPress={() => {}}>
            {/* SARI BAŞLIK — web'deki üst bandın aynısı. */}
            <View
              style={{
                backgroundColor: renk.sari[500],
                paddingTop: kenar.top + bosluk.lg,
                paddingBottom: bosluk.lg,
                paddingHorizontal: bosluk.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: bosluk.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Metin
                  baslik
                  agirlik="kalin"
                  renkli={renk.murekkep}
                  style={{ ...yazi["2xl"], fontFamily: yaziAilesi.baslik, letterSpacing: -0.5 }}
                >
                  Ne Yersin?
                </Metin>
                <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[800]}>
                  Ne arıyorsun?
                </Metin>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kapat"
                onPress={kapat}
                hitSlop={10}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: yaricap.lg,
                  backgroundColor: "rgba(20, 18, 16, 0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="close" size={20} color={renk.murekkep} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: bosluk.lg,
                paddingTop: bosluk.lg,
                paddingBottom: kenar.bottom + bosluk["2xl"],
                gap: bosluk.lg,
              }}
            >
              {/* İKİ ALIŞVERİŞ TARAFI — web'deki iki ayrı sayfanın karşılığı. */}
              <View style={{ gap: bosluk.xs }}>
                <BolumBasligi metin="NEREDEN" />
                <Satir
                  ikon="silverware-fork-knife"
                  etiket="Hepsi"
                  secili={tur === null}
                  onPress={() => tarafSec(null)}
                />
                <Satir
                  ikon="home-heart"
                  etiket="Şeflerin elinden"
                  alt="Evinde pişirenler"
                  secili={tur === "sef"}
                  onPress={() => tarafSec("sef")}
                />
                <Satir
                  ikon="storefront-outline"
                  etiket="İşletmeler"
                  alt="Restoran, pastane, kasap"
                  secili={tur === "isletme"}
                  onPress={() => tarafSec("isletme")}
                />
              </View>

              {/* KATEGORİLER */}
              <View style={{ gap: bosluk.xs }}>
                <BolumBasligi metin="KATEGORİLER" />
                <Satir
                  ikon="view-grid-outline"
                  etiket="Tüm kategoriler"
                  secili={kategori === null}
                  onPress={() => kategoriSec(null)}
                />
                {kategoriler.map((k) => (
                  <Satir
                    key={k.slug}
                    kategoriIkonu={k.ikon}
                    etiket={k.ad}
                    /* Boş kategori gizlenmiyor, soluk duruyor — web'de de öyle. */
                    soluk={k.adet === 0}
                    alt={k.adet > 0 ? `${k.adet} mutfak` : "yakında"}
                    secili={kategori === k.slug}
                    onPress={() => kategoriSec(kategori === k.slug ? null : k.slug)}
                  />
                ))}
              </View>

              {/* SAYFALAR */}
              <View style={{ gap: bosluk.xs }}>
                <BolumBasligi metin="NE YERSİN" />
                <Satir ikon="trophy-outline" etiket="Şef sıralaması" onPress={() => git("/siralama")} />
                <Satir ikon="chef-hat" etiket="Kendi mutfağını aç" onPress={() => git("/basvuru")} />
                <Satir ikon="lifebuoy" etiket="Destek" onPress={() => git("/destek")} />
                <Satir ikon="information-outline" etiket="Hakkında" onPress={() => git("/hakkinda")} />
              </View>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function BolumBasligi({ metin }: { metin: string }) {
  return (
    <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[500]} style={{ letterSpacing: 0.8 }}>
      {metin}
    </Metin>
  );
}

/**
 * Menü satırı.
 *
 * Seçili satır SARI ZEMİNLİ: kategori süzgeci açıkken menüyü tekrar açan
 * kişi hangi süzgecin açık olduğunu aramak zorunda kalmasın.
 */
function Satir({
  ikon,
  kategoriIkonu,
  etiket,
  alt,
  secili = false,
  soluk = false,
  onPress,
}: {
  ikon?: keyof typeof MaterialCommunityIcons.glyphMap;
  kategoriIkonu?: Parameters<typeof KategoriIkonu>[0]["ikon"];
  etiket: string;
  alt?: string;
  secili?: boolean;
  soluk?: boolean;
  onPress: () => void;
}) {
  const ton = secili ? renk.murekkep : renk.kahve[800];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: secili }}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
        borderRadius: yaricap.xl,
        backgroundColor: secili ? renk.sari[500] : "transparent",
        paddingHorizontal: bosluk.md,
        paddingVertical: bosluk.sm,
        opacity: soluk && !secili ? 0.5 : 1,
      }}
    >
      {kategoriIkonu ? (
        <KategoriIkonu ikon={kategoriIkonu} boyut={20} renkli={ton} />
      ) : ikon ? (
        <MaterialCommunityIcons name={ikon} size={20} color={secili ? renk.murekkep : renk.sari[600]} />
      ) : null}

      <View style={{ flex: 1 }}>
        <Metin boyut="sm" agirlik="kalin" renkli={ton}>
          {etiket}
        </Metin>
        {alt ? (
          <Metin boyut="2xs" renkli={secili ? renk.kahve[800] : renk.metinIkincil}>
            {alt}
          </Metin>
        ) : null}
      </View>

      {secili ? <MaterialCommunityIcons name="check" size={18} color={renk.murekkep} /> : null}
    </Pressable>
  );
}
