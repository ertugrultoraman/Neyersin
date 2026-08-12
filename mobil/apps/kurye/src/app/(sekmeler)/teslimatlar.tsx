import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, kurye as kuryeUclari, renk, type KuryeTeslimatiDto } from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { TeslimatKarti } from "@/gorunum/TeslimatKarti";
import { aktifMi } from "@/teslimat/kurallar";
import { useVardiya } from "@/vardiya/Baglam";

const uclar = kuryeUclari(api);

/**
 * TESLİMATLARIM — üstlenilmiş işlerin tamamı.
 *
 * Teklif ekranı DEĞİL: teklifler ana ekranın üstüne çıkan katta karşılanıyor
 * (bkz. gorunum/TeklifKati). Buradaki liste kabul edilmiş işleri gösteriyor —
 * aktif olanı, bugün tamamlananları ve yöneticinin elle atadıklarını.
 *
 * Tamamlananlar da listede (sunucu son 100 kaydı dönüyor): kurye günün
 * sonunda ne yaptığını buradan görüyor ve teslim ettiği sipariş ekrandan bir
 * anda kaybolmuyor.
 */
type Satir =
  | { tur: "baslik"; anahtar: string; metin: string }
  | { tur: "kart"; anahtar: string; teslimat: KuryeTeslimatiDto };

export default function TeslimatlarEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  /* Teklif kabul edilince vardiya sayacı artıyor ve liste kendini tazeliyor. */
  const { degisim } = useVardiya();
  const liste = useVeri(() => uclar.teslimatlar(), `teslimatlar-${degisim}`);

  const satirlar = useMemo<Satir[]>(() => {
    const veri = liste.veri ?? [];
    const aktif = veri.filter((t) => aktifMi(t.durum));
    const gecmis = veri.filter((t) => !aktifMi(t.durum));

    const bolum = (metin: string, grup: KuryeTeslimatiDto[]): Satir[] =>
      grup.length === 0
        ? []
        : [
            { tur: "baslik", anahtar: `baslik-${metin}`, metin },
            ...grup.map(
              (t): Satir => ({ tur: "kart", anahtar: t.siparisNo, teslimat: t }),
            ),
          ];

    return [...bolum("Aktif", aktif), ...bolum("Tamamlanan", gecmis)];
  }, [liste.veri]);

  const ciz = useCallback(
    ({ item }: ListRenderItemInfo<Satir>) =>
      item.tur === "baslik" ? (
        <Metin boyut="xs" agirlik="kalin" renkli={renk.metinIkincil}>
          {item.metin.toLocaleUpperCase("tr-TR")}
        </Metin>
      ) : (
        <TeslimatKarti
          teslimat={item.teslimat}
          onPress={() => yonlendir.push(`/teslimat/${item.teslimat.siparisNo}`)}
        />
      ),
    [yonlendir],
  );

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz, paddingTop: kenar.top }}>
      <FlashList
        data={satirlar}
        renderItem={ciz}
        keyExtractor={(s) => s.anahtar}
        /* Başlık ve kart farklı yükseklikte; FlashList geri dönüşümü ayırsın. */
        getItemType={(s) => s.tur}
        contentContainerStyle={{
          paddingHorizontal: bosluk.lg,
          paddingBottom: kenar.bottom + bosluk["3xl"],
        }}
        ItemSeparatorComponent={() => <View style={{ height: bosluk.md }} />}
        ListHeaderComponent={
          <View style={{ paddingVertical: bosluk.lg }}>
            <Metin baslik boyut="3xl">
              Teslimatlarım
            </Metin>
            <Metin boyut="sm" renkli={renk.metinIkincil}>
              Sana atanan işler
            </Metin>
          </View>
        }
        ListEmptyComponent={
          liste.yukleniyor ? null : (
            <View
              style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}
            >
              <Ionicons
                name={liste.hata ? "cloud-offline-outline" : "bicycle-outline"}
                size={40}
                color={renk.kahve[300]}
              />
              <Metin baslik boyut="lg" ortala>
                {liste.hata ? "Bağlanamadık" : "Henüz iş yok"}
              </Metin>
              <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
                {liste.hata?.message ?? "Sana bir teslimat atandığında burada görünecek."}
              </Metin>
              {/*
                Düğme YALNIZCA hatada. Boş listede "tekrar dene" demek, iş
                olmamasını bir arıza gibi gösterirdi; orada aşağı çekme zaten var.
              */}
              {liste.hata ? (
                <Dugme baslik="Tekrar dene" tur="ikincil" onPress={liste.tazele} />
              ) : null}
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
