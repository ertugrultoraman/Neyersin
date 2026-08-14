import { ActivityIndicator, Pressable, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { DOKUNMA_HEDEFI, bosluk, egri, golge, renk, sure, yaricap } from "../src/tasarim";

import { Metin } from "./Metin";

/**
 * Marka düğmesi.
 *
 * BASMA ANİMASYONU UI THREAD'DE. `Animated.View` + `useAnimatedStyle` ile
 * yazılan bu küçülme, worklet olarak derlenip doğrudan UI thread'de
 * çalışıyor — JS thread meşgulken bile kare atlamıyor. Aynı etki
 * `setState` ile yazılsaydı, dokunma anında liste render eden ya da ağdan
 * cevap işleyen bir JS thread yüzünden animasyon takılırdı. 120 Hz'de kare
 * bütçesi 8.3 ms; JS thread'e uğrayan hiçbir animasyon bunu tutturamaz.
 *
 * Ölçek 0.96'da duruyor (web'deki `.tiklanabilir` yardımcısıyla aynı his);
 * daha derin bir küçülme oyuncak gibi görünüyor.
 */

const EGRI = Easing.bezier(egri.yumusak[0], egri.yumusak[1], egri.yumusak[2], egri.yumusak[3]);

export type DugmeProps = {
  baslik: string;
  onPress?: () => void;
  /**
   * `sari` dolu marka rengi; `ikincil` beyaz zemin + kahve çerçeve;
   * `murekkep` koyu dolgu — SARI ZEMİN ÜZERİNDE kullanılıyor, çünkü sarı
   * düğme sarı zeminde kayboluyor ve beyaz düğme markanın sıcaklığını
   * soğutuyor.
   */
  tur?: "sari" | "ikincil" | "sade" | "murekkep";
  bekliyor?: boolean;
  pasif?: boolean;
  tamGenislik?: boolean;
  /**
   * Daha yüksek gövde ve daha büyük yazı.
   *
   * Ekranın TEK eylemi olan düğmeler için: kurye motor üstünde, eldivenli ve
   * teklifin ömrü 45 saniye — standart dokunma hedefi burada dar kalıyor.
   * Her düğmeyi büyütmek yerine opsiyonel: her yerde büyük olsaydı "önemli
   * olan bu" işareti kaybolurdu.
   */
  buyuk?: boolean;
  style?: ViewStyle;
};

export function Dugme({
  baslik,
  onPress,
  tur = "sari",
  bekliyor = false,
  pasif = false,
  tamGenislik = false,
  buyuk = false,
  style,
}: DugmeProps) {
  const olcek = useSharedValue(1);
  const animasyon = useAnimatedStyle(() => ({ transform: [{ scale: olcek.value }] }));

  const kapali = pasif || bekliyor;

  const zemin =
    tur === "sari"
      ? renk.sari[500]
      : tur === "murekkep"
        ? renk.murekkep
        : tur === "ikincil"
          ? renk.beyaz
          : "transparent";
  const yaziRengi =
    tur === "sari" ? renk.murekkep : tur === "murekkep" ? renk.beyaz : renk.kahve[900];

  const kap: ViewStyle = {
    minHeight: buyuk ? DOKUNMA_HEDEFI * 1.4 : DOKUNMA_HEDEFI,
    paddingHorizontal: bosluk.xl,
    paddingVertical: buyuk ? bosluk.lg : bosluk.md,
    borderRadius: yaricap.tam,
    backgroundColor: zemin,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: bosluk.sm,
    ...(tur === "ikincil" ? { borderWidth: 1, borderColor: renk.cizgi } : null),
    ...(tur === "sari" && !kapali ? { boxShadow: golge.sari } : null),
    ...(tamGenislik ? { width: "100%" } : null),
    opacity: kapali ? 0.45 : 1,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: kapali, busy: bekliyor }}
      disabled={kapali}
      onPress={onPress}
      onPressIn={() => {
        olcek.value = withTiming(0.96, { duration: sure.ani, easing: EGRI });
      }}
      onPressOut={() => {
        olcek.value = withTiming(1, { duration: sure.hizli, easing: EGRI });
      }}
    >
      <Animated.View style={[kap, animasyon, style]}>
        {bekliyor ? (
          <ActivityIndicator color={yaziRengi} />
        ) : (
          <Metin baslik boyut={buyuk ? "xl" : "md"} agirlik="kalin" renkli={yaziRengi}>
            {baslik}
          </Metin>
        )}
      </Animated.View>
    </Pressable>
  );
}

/** Ekranlar arası dikey boşluk — tekrar eden `<View style={{height}}/>` yerine. */
export function Bosluk({ y = bosluk.lg }: { y?: number }) {
  return <View style={{ height: y }} />;
}
