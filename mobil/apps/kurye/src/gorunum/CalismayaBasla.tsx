import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiHatasi, DOKUNMA_HEDEFI, bosluk, renk, yaricap, type AracTuru } from "ortak";
import { Dugme, Metin } from "ortak/ui";

import { useVardiya } from "@/vardiya/Baglam";

/**
 * ÇALIŞMAYA BAŞLA — vardiya açılış katı.
 *
 * ARAÇ HER VARDİYADA SORULUYOR, profile yazılmıyor: aynı kişi bir gün
 * motosikletle, ertesi gün bisikletle çıkabiliyor ve araç yöneticinin sahada
 * kimin neyle olduğunu gördüğü tek bilgi. Profile yazılsaydı, araç değiştiren
 * kuryenin ayarlara girip güncellemeyi hatırlaması gerekirdi — kimse
 * hatırlamaz.
 *
 * KONUM ONAYI AYRI BİR ADIM. İşletim sisteminin izin penceresi "izin ver mi"
 * diye soruyor ama NEDEN sorulduğunu söylemiyor; kurye konumunun müşteriye
 * gösterildiğini buradan öğreniyor. Onay kutusu işaretlenmeden vardiya
 * başlamıyor.
 */

const ARAC_ADI: Record<AracTuru, string> = {
  motosiklet: "Motosiklet",
  moped: "Moped",
  otomobil: "Otomobil",
  scooter: "Scooter",
  bisiklet: "Bisiklet",
};

const ARAC_SIMGESI: Record<AracTuru, keyof typeof Ionicons.glyphMap> = {
  motosiklet: "bicycle",
  moped: "bicycle",
  otomobil: "car-outline",
  scooter: "bicycle-outline",
  bisiklet: "bicycle-outline",
};

const ARACLAR = Object.keys(ARAC_ADI) as AracTuru[];

export function CalismayaBasla({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const kenar = useSafeAreaInsets();
  const { arac: kayitliArac, islemde, cevrimiciOl } = useVardiya();

  /* Son kullanılan araç önceden seçili geliyor — çoğu kurye aynı araçla çıkıyor. */
  const [arac, setArac] = useState<AracTuru | null>(kayitliArac);
  const [onay, setOnay] = useState(false);

  async function basla() {
    if (!arac) return;
    try {
      await cevrimiciOl(arac);
      kapat();
    } catch (e) {
      Alert.alert(
        "Vardiya başlatılamadı",
        e instanceof ApiHatasi ? e.message : "Bağlantını kontrol edip tekrar dene.",
      );
    }
  }

  return (
    <Modal visible={acik} animationType="slide" transparent onRequestClose={kapat}>
      <View style={{ flex: 1, backgroundColor: `${renk.murekkep}66`, justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: renk.beyaz,
            borderTopLeftRadius: yaricap["5xl"],
            borderTopRightRadius: yaricap["5xl"],
            paddingBottom: kenar.bottom + bosluk.lg,
            maxHeight: "88%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: bosluk.xl,
              paddingTop: bosluk.xl,
              paddingBottom: bosluk.lg,
              borderBottomWidth: 1,
              borderBottomColor: renk.cizgi,
            }}
          >
            <Metin baslik boyut="xl" style={{ flex: 1 }}>
              Çalışmaya başla
            </Metin>
            <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={kapat} hitSlop={10}>
              <Ionicons name="close" size={26} color={renk.kahve[900]} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: bosluk.xl, gap: bosluk.lg }}>
            <View style={{ gap: bosluk.sm }}>
              <Metin boyut="sm" agirlik="kalin" renkli={renk.metinIkincil}>
                ARACIN
              </Metin>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.sm }}>
                {ARACLAR.map((a) => (
                  <AracSecimi
                    key={a}
                    arac={a}
                    secili={arac === a}
                    onPress={() => setArac(a)}
                  />
                ))}
              </View>
            </View>

            <Onay
              secili={onay}
              onToggle={() => setOnay((o) => !o)}
              metin="Vardiya boyunca konumumun paylaşılmasını kabul ediyorum. Teslimat sırasında müşteri siparişinin nerede olduğunu görüyor; vardiya bitince paylaşım duruyor."
            />

            <Dugme
              baslik="Vardiyayı başlat"
              tamGenislik
              bekliyor={islemde}
              pasif={!arac || !onay}
              onPress={() => void basla()}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AracSecimi({
  arac,
  secili,
  onPress,
}: {
  arac: AracTuru;
  secili: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: secili }}
      accessibilityLabel={ARAC_ADI[arac]}
      onPress={onPress}
      style={{
        minHeight: DOKUNMA_HEDEFI,
        paddingHorizontal: bosluk.lg,
        paddingVertical: bosluk.md,
        borderRadius: yaricap.lg,
        borderWidth: secili ? 2 : 1,
        borderColor: secili ? renk.sari[600] : renk.cizgi,
        backgroundColor: secili ? renk.krem : renk.beyaz,
        alignItems: "center",
        justifyContent: "center",
        gap: bosluk.xs,
        minWidth: 96,
      }}
    >
      <Ionicons
        name={ARAC_SIMGESI[arac]}
        size={22}
        color={secili ? renk.kahve[900] : renk.kahve[400]}
      />
      <Metin boyut="xs" agirlik="kalin" renkli={secili ? renk.kahve[900] : renk.metinIkincil}>
        {ARAC_ADI[arac]}
      </Metin>
    </Pressable>
  );
}

function Onay({
  secili,
  onToggle,
  metin,
}: {
  secili: boolean;
  onToggle: () => void;
  metin: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: secili }}
      onPress={onToggle}
      style={{ flexDirection: "row", gap: bosluk.md, alignItems: "flex-start" }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: yaricap.sm,
          borderWidth: secili ? 0 : 1.5,
          borderColor: renk.kahve[300],
          backgroundColor: secili ? renk.sari[500] : renk.beyaz,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {secili ? <Ionicons name="checkmark" size={17} color={renk.murekkep} /> : null}
      </View>
      <Metin boyut="xs" renkli={renk.kahve[700]} style={{ flex: 1 }}>
        {metin}
      </Metin>
    </Pressable>
  );
}
