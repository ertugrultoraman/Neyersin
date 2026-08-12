import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { bosluk, durumRengi, renk, yaricap, type KuryeTeslimatiDto } from "ortak";
import { Metin } from "ortak/ui";

import { DURUM_ADI, tarihYaz, teslimAdresi } from "@/teslimat/kurallar";

/**
 * Listede bir teslimat.
 *
 * Kartta MÜŞTERİ ADI YOK, adres var. Kurye listeye baktığında "nereye
 * gideceğim" sorusunu soruyor; isim ancak kapıda anlam kazanıyor ve detay
 * ekranında zaten yazıyor. Dar bir kartta ikisini birden sığdırmak, ikisini
 * de okunmaz yapardı.
 */
export function TeslimatKarti({
  teslimat,
  onPress,
}: {
  teslimat: KuryeTeslimatiDto;
  onPress: () => void;
}) {
  const kapidaOdeme = teslimat.tahsilat > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${teslimat.restoranAdi}, ${DURUM_ADI[teslimat.durum]}`}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        backgroundColor: pressed ? renk.kahve[50] : renk.beyaz,
        gap: bosluk.xs,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <Metin baslik boyut="md" style={{ flex: 1 }} numberOfLines={1}>
          {teslimat.restoranAdi}
        </Metin>
        <View
          style={{
            paddingHorizontal: bosluk.sm,
            paddingVertical: 2,
            borderRadius: yaricap.tam,
            backgroundColor: `${durumRengi[teslimat.durum]}22`,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={durumRengi[teslimat.durum]}>
            {DURUM_ADI[teslimat.durum]}
          </Metin>
        </View>
      </View>

      <Metin boyut="sm" renkli={renk.kahve[700]} numberOfLines={2}>
        {teslimAdresi(teslimat.teslim)}
      </Metin>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: bosluk.sm,
        }}
      >
        <Metin boyut="xs" renkli={renk.metinIkincil} style={{ flex: 1 }} numberOfLines={1}>
          {tarihYaz(teslimat.olusturmaTarihi)} · {teslimat.kalemSayisi} ürün
          {kapidaOdeme ? ` · ${teslimat.tahsilat} ₺ tahsilat` : ""}
        </Metin>
        <Ionicons name="chevron-forward" size={18} color={renk.kahve[300]} />
      </View>
    </Pressable>
  );
}
