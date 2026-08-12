import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, renk, yaricap, type EkstraDto, type UrunDto } from "ortak";
import { Dugme, Metin } from "ortak/ui";

/**
 * EKSTRA SEÇİMİ.
 *
 * Ürünün ekstrası varsa "Ekle" doğrudan sepete atmıyor, önce bu kat açılıyor.
 * Ekstralar atlanabiliyor — hiçbiri seçilmeden de eklenebiliyor; zorunlu seçim
 * gibi davranmak, sade sipariş verecek kişiyi gereksiz bir adıma sokardı.
 *
 * İçecekler AYRI BAŞLIK altında (web'deki "İçecek eklemek ister misin?"
 * bölümüyle aynı ayrım): ek malzeme ile içecek farklı kararlar, tek listede
 * karışınca göz ikisini de kaçırıyor.
 *
 * `Modal` kullanılıyor, gerçek bir alt sayfa (bottom sheet) değil: sürükleme
 * jesti, arka plan ölçeklemesi ve klavye etkileşimi için bir kütüphane daha
 * eklemek, üç düğmelik bir seçim için ağır kaçardı.
 */
export function EkstraSecimi({
  urun,
  acik,
  kapat,
  ekle,
}: {
  urun: UrunDto | null;
  acik: boolean;
  kapat: () => void;
  ekle: (ekstraIdler: string[]) => void;
}) {
  const kenar = useSafeAreaInsets();
  const [secililer, setSecililer] = useState<string[]>([]);

  const { malzemeler, icecekler } = useMemo(() => {
    const hepsi = urun?.ekstralar ?? [];
    return {
      malzemeler: hepsi.filter((e) => e.tur !== "icecek"),
      icecekler: hepsi.filter((e) => e.tur === "icecek"),
    };
  }, [urun]);

  if (!urun) return null;

  const ekstraToplam = (urun.ekstralar ?? [])
    .filter((e) => secililer.includes(e.id))
    .reduce((t, e) => t + e.fiyat, 0);

  function degistir(id: string) {
    setSecililer((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  function kapatVeSifirla() {
    setSecililer([]);
    kapat();
  }

  return (
    <Modal
      visible={acik}
      transparent
      animationType="slide"
      onRequestClose={kapatVeSifirla}
      /* Android geri tuşu da kapatabilsin diye onRequestClose zorunlu. */
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kapat"
        onPress={kapatVeSifirla}
        style={{ flex: 1, backgroundColor: "rgba(20,18,16,0.45)" }}
      />

      <View
        style={{
          backgroundColor: renk.beyaz,
          borderTopLeftRadius: yaricap["4xl"],
          borderTopRightRadius: yaricap["4xl"],
          paddingTop: bosluk.lg,
          paddingHorizontal: bosluk.lg,
          paddingBottom: kenar.bottom + bosluk.lg,
          maxHeight: "80%",
          gap: bosluk.md,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: yaricap.tam,
              backgroundColor: renk.kahve[200],
            }}
          />
        </View>

        <Metin baslik boyut="xl">
          {urun.ad}
        </Metin>

        <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: bosluk.lg }}>
          {malzemeler.length > 0 ? (
            <Grup
              baslik="Yanına ne eklensin?"
              ekstralar={malzemeler}
              secililer={secililer}
              degistir={degistir}
            />
          ) : null}

          {icecekler.length > 0 ? (
            <Grup
              baslik="İçecek eklemek ister misin?"
              ekstralar={icecekler}
              secililer={secililer}
              degistir={degistir}
            />
          ) : null}
        </ScrollView>

        <Dugme
          baslik={`Sepete ekle · ${urun.fiyat + ekstraToplam} ₺`}
          tamGenislik
          onPress={() => {
            ekle(secililer);
            setSecililer([]);
            kapat();
          }}
        />
      </View>
    </Modal>
  );
}

function Grup({
  baslik,
  ekstralar,
  secililer,
  degistir,
}: {
  baslik: string;
  ekstralar: EkstraDto[];
  secililer: string[];
  degistir: (id: string) => void;
}) {
  return (
    <View style={{ gap: bosluk.sm }}>
      <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[700]} style={{ letterSpacing: 0.4 }}>
        {baslik.toLocaleUpperCase("tr-TR")}
      </Metin>

      {ekstralar.map((e) => {
        const secili = secililer.includes(e.id);
        return (
          <Pressable
            key={e.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: secili }}
            onPress={() => degistir(e.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.md,
              paddingVertical: bosluk.md,
              paddingHorizontal: bosluk.md,
              borderRadius: yaricap.lg,
              borderWidth: 1,
              borderColor: secili ? renk.sari[500] : renk.cizgi,
              backgroundColor: secili ? `${renk.sari[500]}14` : renk.beyaz,
            }}
          >
            <MaterialCommunityIcons
              name={secili ? "checkbox-marked" : "checkbox-blank-outline"}
              size={20}
              color={secili ? renk.sari[600] : renk.kahve[300]}
            />
            <Metin boyut="sm" style={{ flex: 1 }}>
              {e.ad}
            </Metin>
            <Metin boyut="sm" agirlik="orta" renkli={renk.metinIkincil}>
              +{e.fiyat} ₺
            </Metin>
          </Pressable>
        );
      })}
    </View>
  );
}
