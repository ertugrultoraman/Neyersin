import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  kurye as kuryeUclari,
  renk,
  yaricap,
  type DestekDto,
  type DestekTalebiDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { ara } from "@/altyapi/baglantilar";
import { tarihYaz } from "@/teslimat/kurallar";

const uclar = kuryeUclari(api);

/**
 * DESTEK — kuryenin yetkiliye ulaşma ekranı.
 *
 * İKİ YOL, BİLEREK AYRI:
 *  - TELEFON en üstte ve en büyük. Sahada acil olan her şey (kaza, yanlış
 *    adres, müşteriyle sorun, kaybolan sipariş) beklemeyi kaldırmıyor;
 *    kuryenin o anda yapması gereken tek şey aramak.
 *  - YAZIŞMA altta. Acil olmayan ama kayda geçmesi gereken işler için:
 *    eksik hakediş, uygulamada takılan ekran, ödeme sorusu. Yazılı olduğu
 *    için yöneticinin listesinde duruyor ve unutulmuyor.
 *
 * SEKME DEĞİL AYRI EKRAN: destek her gün açılan bir yer değil. Beşinci bir
 * sekme, vardiya boyunca kullanılan üç sekmeyi daraltırdı. Giriş ana
 * ekranın sağ üstündeki simgeden.
 */
export default function DestekEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const veri = useVeri(() => uclar.destek(), "destek");

  const [konu, setKonu] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  /* Gönderim sonrası liste: `useVeri`den ikinci istek istenmesin diye. */
  const [sonVeri, setSonVeri] = useState<DestekDto | null>(null);

  const gosterilen = sonVeri ?? veri.veri;

  async function telefonuAc(numara: string) {
    const sonuc = await ara(numara);
    if (!sonuc.tamam) Alert.alert("Arama açılamadı", sonuc.sebep);
  }

  async function gonder() {
    if (mesaj.trim().length < 10) {
      Alert.alert("Biraz daha yaz", "Sorunu anlatan en az 10 karakter gerekiyor.");
      return;
    }
    setGonderiliyor(true);
    try {
      const yeni = await uclar.destekAc({ konu: konu.trim(), mesaj: mesaj.trim() });
      setSonVeri(yeni);
      setKonu("");
      setMesaj("");
      Alert.alert("Talebin açıldı", "Yetkili baktığında yanıtı bu ekranda göreceksin.");
    } catch (e) {
      Alert.alert(
        "Gönderilemedi",
        e instanceof ApiHatasi ? e.message : "Bağlantını kontrol edip tekrar dene.",
      );
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz, paddingTop: kenar.top }}>
      {/*
        KENDİ BAŞLIĞI. Yığın başlığı uygulama genelinde kapalı
        (bkz. app/_layout.tsx → headerShown: false); yalnızca `title` verilseydi
        ekranda hiçbir başlık ÇİZİLMEZ ve geri dönmenin yolu kalmazdı.
      */}
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.md,
          paddingHorizontal: bosluk.lg,
          paddingVertical: bosluk.md,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri"
          onPress={() => (yonlendir.canGoBack() ? yonlendir.back() : yonlendir.replace("/"))}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={renk.kahve[900]} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Metin baslik boyut="xl">
            Destek
          </Metin>
          <Metin boyut="xs" renkli={renk.metinIkincil}>
            Acil olan her şey için ara
          </Metin>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: bosluk.lg,
            paddingBottom: kenar.bottom + bosluk["3xl"],
            gap: bosluk.lg,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={veri.tazeleniyor}
              onRefresh={() => {
                setSonVeri(null);
                veri.tazele();
              }}
              tintColor={renk.sari[600]}
              colors={[renk.sari[600]]}
            />
          }
        >
          {/*
            ARAMA KARTI EN ÜSTTE ve tamamı dokunulabilir. Numara yüklenmeden
            de kart çiziliyor ama düğme pasif — sahada telefonu açan kurye
            boş bir ekran yerine ne olduğunu görüyor.
          */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Yetkiliyi ara"
            disabled={!gosterilen?.telefon}
            onPress={() => gosterilen && void telefonuAc(gosterilen.telefon)}
            style={({ pressed }) => ({
              padding: bosluk.xl,
              borderRadius: yaricap["2xl"],
              backgroundColor: pressed ? renk.sari[600] : renk.sari[500],
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.lg,
              opacity: gosterilen?.telefon ? 1 : 0.6,
            })}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: yaricap.tam,
                backgroundColor: renk.murekkep,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="call" size={26} color={renk.sari[300]} />
            </View>
            <View style={{ flex: 1 }}>
              <Metin baslik boyut="xl" renkli={renk.murekkep}>
                Yetkiliyi ara
              </Metin>
              <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
                {gosterilen?.telefon ?? "Numara yükleniyor…"}
              </Metin>
            </View>
          </Pressable>

          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Acil bir durum varsa (kaza, adres bulunamadı, müşteriyle sorun) yaz değil ara.
            Aşağıdaki form acele olmayan işler için: eksik hakediş, uygulama sorunu, soru.
          </Metin>

          {/* Yeni talep */}
          <View
            style={{
              padding: bosluk.lg,
              borderRadius: yaricap["2xl"],
              borderWidth: 1,
              borderColor: renk.cizgi,
              gap: bosluk.md,
            }}
          >
            <Metin baslik boyut="lg">
              Yazılı destek talebi
            </Metin>

            <TextInput
              value={konu}
              onChangeText={setKonu}
              placeholder="Konu (isteğe bağlı)"
              placeholderTextColor={renk.kahve[300]}
              maxLength={120}
              style={girdiStili}
            />
            <TextInput
              value={mesaj}
              onChangeText={setMesaj}
              placeholder="Ne oldu? Sipariş numarası varsa yazmayı unutma."
              placeholderTextColor={renk.kahve[300]}
              maxLength={2000}
              multiline
              style={[girdiStili, { minHeight: 110, textAlignVertical: "top" }]}
            />

            <Dugme
              baslik="Gönder"
              tamGenislik
              bekliyor={gonderiliyor}
              onPress={() => void gonder()}
            />
          </View>

          {/* Geçmiş talepler */}
          <View style={{ gap: bosluk.md }}>
            <Metin boyut="xs" agirlik="kalin" renkli={renk.metinIkincil}>
              {"GEÇMİŞ TALEPLERİN"}
            </Metin>

            {veri.yukleniyor ? (
              <ActivityIndicator color={renk.sari[600]} />
            ) : (gosterilen?.talepler.length ?? 0) === 0 ? (
              <Metin boyut="sm" renkli={renk.metinIkincil}>
                Henüz talep açmadın.
              </Metin>
            ) : (
              gosterilen?.talepler.map((t) => <TalepKarti key={t.no} talep={t} />)
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const girdiStili = {
  borderWidth: 1,
  borderColor: renk.cizgi,
  borderRadius: yaricap.lg,
  paddingHorizontal: bosluk.md,
  paddingVertical: bosluk.md,
  fontSize: 15,
  color: renk.murekkep,
  backgroundColor: renk.beyaz,
} as const;

/**
 * Tek talep.
 *
 * YANIT VARSA EN ALTTA VE VURGULU: kuryenin bu ekrana dönme sebebi kendi
 * yazdığını okumak değil, cevabı görmek.
 */
function TalepKarti({ talep }: { talep: DestekTalebiDto }) {
  const cozuldu = talep.durum === "cozuldu";

  return (
    <View
      style={{
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        gap: bosluk.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <View
          style={{
            paddingHorizontal: bosluk.sm,
            paddingVertical: 2,
            borderRadius: yaricap.tam,
            backgroundColor: cozuldu ? `${renk.nane}22` : `${renk.sari[500]}33`,
          }}
        >
          <Metin
            boyut="2xs"
            agirlik="kalin"
            renkli={cozuldu ? renk.naneKoyu : renk.kahve[800]}
          >
            {cozuldu ? "ÇÖZÜLDÜ" : "AÇIK"}
          </Metin>
        </View>
        <View style={{ flex: 1 }} />
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          {talep.no}
        </Metin>
      </View>

      <Metin baslik boyut="md">
        {talep.konu}
      </Metin>
      <Metin boyut="sm" renkli={renk.kahve[700]}>
        {talep.mesaj}
      </Metin>
      <Metin boyut="2xs" renkli={renk.metinIkincil}>
        {tarihYaz(talep.olusturmaTarihi)}
      </Metin>

      {talep.yanit ? (
        <View
          style={{
            marginTop: bosluk.sm,
            padding: bosluk.md,
            borderRadius: yaricap.lg,
            backgroundColor: renk.krem,
            gap: 2,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
            {"YETKİLİNİN YANITI"}
          </Metin>
          <Metin boyut="sm">{talep.yanit}</Metin>
        </View>
      ) : null}
    </View>
  );
}
