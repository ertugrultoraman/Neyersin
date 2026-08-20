import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  bosluk,
  katalog,
  renk,
  yaricap,
  type SiralamaOlcutu,
  type SiralamaSatiriDto,
} from "ortak";
import { Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = katalog(api);

/**
 * ŞEF SIRALAMASI — web'deki /sef-siralamasi sayfasının karşılığı.
 *
 * ÜÇ ÖLÇÜT, TEK LİSTE DEĞİL: emek (sipariş), damak zevki (beğeni) ve
 * meslektaş gözü (kaşık) ayrı ayrı duruyor. Tek bir "en iyi şef" listesi
 * yapılsaydı üç farklı şeyi tek sayıya sıkıştırmak gerekirdi; çok satan ama
 * düşük puanlı bir mutfak da, az satan ama meslektaşlarınca beğenilen bir şef
 * de kendi sütununda görünüyor.
 */
const SEKMELER: { deger: SiralamaOlcutu; etiket: string; aciklama: string }[] = [
  { deger: "siparis", etiket: "En çok sipariş", aciklama: "Teslim edilen sipariş sayısı" },
  { deger: "begeni", etiket: "En beğenilen", aciklama: "Müşteri puanı" },
  { deger: "kasik", etiket: "Şef Kaşığı", aciklama: "Başka şeflerin takdiri" },
];

export default function SiralamaEkrani() {
  const kenar = useSafeAreaInsets();
  const [olcut, setOlcut] = useState<SiralamaOlcutu>("siparis");
  const siralama = useVeri(() => uclar.siralama(olcut), olcut);

  const sekme = SEKMELER.find((s) => s.deger === olcut);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      contentContainerStyle={{
        paddingTop: kenar.top + bosluk.xl,
        paddingHorizontal: bosluk.xl,
        paddingBottom: kenar.bottom + bosluk["3xl"],
        gap: bosluk.lg,
      }}
    >
      <Stack.Screen options={{ title: "Şef sıralaması" }} />

      <View>
        <Metin baslik boyut="3xl">
          Şef sıralaması
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil}>
          Sıralama uydurma değil: hepsi sipariş, yorum ve kaşık kayıtlarından geliyor.
        </Metin>
      </View>

      <View style={{ flexDirection: "row", gap: bosluk.xs }}>
        {SEKMELER.map((s) => {
          const aktif = s.deger === olcut;
          const adet = siralama.veri?.sayilar[s.deger] ?? 0;
          return (
            <Pressable
              key={s.deger}
              accessibilityRole="button"
              accessibilityState={{ selected: aktif }}
              onPress={() => setOlcut(s.deger)}
              style={{
                flex: 1,
                borderRadius: yaricap.tam,
                borderWidth: 1,
                borderColor: aktif ? renk.sari[500] : renk.cizgi,
                backgroundColor: aktif ? renk.sari[500] : renk.beyaz,
                paddingVertical: bosluk.sm,
                alignItems: "center",
              }}
            >
              <Metin boyut="2xs" agirlik="kalin" renkli={aktif ? renk.murekkep : renk.kahve[700]}>
                {s.etiket}
              </Metin>
              <Metin boyut="2xs" renkli={aktif ? renk.kahve[800] : renk.metinIkincil}>
                {adet}
              </Metin>
            </Pressable>
          );
        })}
      </View>

      {sekme ? (
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          {sekme.aciklama}
        </Metin>
      ) : null}

      {siralama.yukleniyor ? (
        <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk.xl }} />
      ) : (siralama.veri?.satirlar ?? []).length === 0 ? (
        <Metin boyut="sm" renkli={renk.metinIkincil} ortala style={{ marginTop: bosluk.xl }}>
          Bu ölçütte henüz sıralanacak şef yok.
        </Metin>
      ) : (
        (siralama.veri?.satirlar ?? []).map((satir) => (
          <Satir key={satir.slug} satir={satir} olcut={olcut} />
        ))
      )}
    </ScrollView>
  );
}

/** Podyum renkleri — ilk üç sıra web'deki rozetlerle aynı tonlarda. */
const BASAMAK_RENGI: Record<number, string> = {
  1: renk.sari[500],
  2: renk.kahve[200],
  3: "#d9a066",
};

function Satir({ satir, olcut }: { satir: SiralamaSatiriDto; olcut: SiralamaOlcutu }) {
  const yonlendir = useRouter();
  const zemin = satir.basamak ? BASAMAK_RENGI[satir.basamak] : undefined;

  const deger =
    olcut === "begeni"
      ? satir.puan.toFixed(1)
      : olcut === "kasik"
        ? `${satir.kasik}`
        : `${satir.siparis}`;

  const birim = olcut === "begeni" ? "puan" : olcut === "kasik" ? "kaşık" : "sipariş";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => yonlendir.push(`/restoran/${satir.slug}`)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: zemin ?? renk.cizgi,
        padding: bosluk.md,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: yaricap.tam,
          backgroundColor: zemin ?? renk.krem,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Metin baslik boyut="md" renkli={zemin ? renk.murekkep : renk.kahve[700]}>
          {satir.sira}
        </Metin>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Metin baslik boyut="md" numberOfLines={1}>
          {satir.ad}
        </Metin>
        {/* Üç sayı da gösteriliyor: seçili ölçüt tek başına eksik bir resim. */}
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          {satir.semt} · {satir.siparis} sipariş
          {satir.yorum > 0 ? ` · ${satir.puan.toFixed(1)} puan` : ""}
          {satir.kasik > 0 ? ` · ${satir.kasik} kaşık` : ""}
        </Metin>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Metin baslik boyut="lg">
          {deger}
        </Metin>
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          {birim}
        </Metin>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={18} color={renk.kahve[300]} />
    </Pressable>
  );
}
