import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  bosluk,
  durumRengi,
  renk,
  siparis as siparisUclari,
  yaricap,
  type SiparisDurumu,
  type SiparisOzetDto,
} from "ortak";
import { useOturum } from "ortak/oturum";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = siparisUclari(api);

const DURUM_ADI: Record<SiparisDurumu, string> = {
  "odeme-bekliyor": "Ödeme bekleniyor",
  odendi: "Hazırlanıyor",
  hazir: "Kurye bekleniyor",
  yolda: "Yolda",
  "teslim-edildi": "Teslim edildi",
  "odeme-basarisiz": "Ödeme alınamadı",
  iptal: "İptal edildi",
};

/** "12 Ağu, 17:30" — yıl yazılmıyor, liste zaten yakın tarihli. */
function tarihYaz(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Siparislerim() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const { durum } = useOturum();
  const girisli = durum.asama === "girisli";

  /*
   * Misafirken istek HİÇ ATILMIYOR: uç 401 döner, istemci yenileme jetonuyla
   * tazelemeyi dener, o da yoktur ve oturum "düştü" sayılır. Girişsiz birinin
   * sekmeye dokunması, olmayan bir oturumu düşürmemeli.
   */
  const liste = useVeri(
    () => (girisli ? uclar.listele() : Promise.resolve([])),
    girisli ? "girisli" : "misafir",
  );

  const ciz = useCallback(
    ({ item }: ListRenderItemInfo<SiparisOzetDto>) => (
      <Kart siparis={item} onPress={() => yonlendir.push(`/siparis/${item.siparisNo}`)} />
    ),
    [yonlendir],
  );

  if (!girisli) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: renk.beyaz,
          paddingTop: kenar.top,
          alignItems: "center",
          justifyContent: "center",
          gap: bosluk.md,
          padding: bosluk.xl,
        }}
      >
        <MaterialCommunityIcons name="receipt" size={40} color={renk.kahve[300]} />
        <Metin baslik boyut="lg" ortala>
          Siparişlerini görmek için giriş yap
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
          Geçmiş siparişlerin ve teslimat takibi hesabına bağlı.
        </Metin>
        <Dugme baslik="Giriş yap" onPress={() => yonlendir.push("/giris")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz, paddingTop: kenar.top }}>
      <FlashList
        data={liste.veri ?? []}
        renderItem={ciz}
        keyExtractor={(s) => s.siparisNo}
        contentContainerStyle={{
          paddingHorizontal: bosluk.lg,
          paddingBottom: kenar.bottom + bosluk["3xl"],
        }}
        ItemSeparatorComponent={() => <View style={{ height: bosluk.md }} />}
        ListHeaderComponent={
          <View style={{ paddingVertical: bosluk.lg }}>
            <Metin baslik boyut="3xl">
              Siparişlerim
            </Metin>
          </View>
        }
        ListEmptyComponent={
          liste.yukleniyor ? null : (
            <View style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}>
              <MaterialCommunityIcons
                name={liste.hata ? "wifi-off" : "basket-outline"}
                size={40}
                color={renk.kahve[300]}
              />
              <Metin baslik boyut="lg" ortala>
                {liste.hata ? "Bağlanamadık" : "Henüz sipariş vermedin"}
              </Metin>
              <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
                {liste.hata?.message ?? "İlk siparişin burada görünecek."}
              </Metin>
              <Dugme
                baslik={liste.hata ? "Tekrar dene" : "Mutfaklara bak"}
                tur="ikincil"
                onPress={() => (liste.hata ? liste.tazele() : yonlendir.push("/"))}
              />
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={liste.tazeleniyor}
            onRefresh={liste.tazele}
            tintColor={renk.sari[600]}
            colors={[renk.sari[600]]}
          />
        }
      />
    </View>
  );
}

function Kart({ siparis, onPress }: { siparis: SiparisOzetDto; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${siparis.restoranAdi}, ${DURUM_ADI[siparis.durum]}`}
      onPress={onPress}
      style={{
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        gap: bosluk.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <Metin baslik boyut="md" style={{ flex: 1 }} numberOfLines={1}>
          {siparis.restoranAdi}
        </Metin>
        <View
          style={{
            paddingHorizontal: bosluk.sm,
            paddingVertical: 2,
            borderRadius: yaricap.tam,
            backgroundColor: `${durumRengi[siparis.durum]}22`,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={durumRengi[siparis.durum]}>
            {DURUM_ADI[siparis.durum]}
          </Metin>
        </View>
      </View>

      <Metin boyut="xs" renkli={renk.metinIkincil}>
        {tarihYaz(siparis.olusturmaTarihi)} · {siparis.kalemSayisi} ürün
      </Metin>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Metin boyut="sm" agirlik="kalin">
          {siparis.tutarlar.toplam} ₺
        </Metin>
        <MaterialCommunityIcons name="chevron-right" size={20} color={renk.kahve[300]} />
      </View>
    </Pressable>
  );
}
