import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  mutfak as mutfakUclari,
  renk,
  yaricap,
  yazi,
  yaziAilesi,
  type GunProgramiDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = mutfakUclari(api);

/** Pazartesiden pazara — sunucudaki dizinin sırasıyla aynı. */
const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

/** Elden kapatmanın seçilebilir süreleri (saat) — KAPATMA_SURELERI ile aynı. */
const KAPATMA_SURELERI = [1, 2, 4];

/**
 * ÇALIŞMA SAATLERİ — mutfağın ne zaman sipariş aldığı.
 *
 * İKİ AYRI KAPALILIK, iki ayrı yerde:
 *  - PROGRAM: haftanın normal düzeni. Pazartesi kapalıysa her pazartesi kapalı.
 *  - ELDEN KAPATMA: "bugün yetişemiyorum". Geçici, bitiş saati var ve programı
 *    ezmiyor; süresi dolunca program yeniden geçerli oluyor.
 *
 * Bu ayrım olmasaydı bir akşam yetişemeyen şef pazartesiyi kapatır, açmayı
 * unutur ve haftalarca kapalı kalırdı.
 *
 * "AÇIK MI" SONUCU SUNUCUDAN okunuyor; uygulama kendi saatine bakıp karar
 * vermiyor. Telefonun saati yanlışsa mutfağın kapalı görünmesi, gerçekten
 * kapalı olmasından bağımsız bir hata olurdu.
 */
export default function CalismaSaatleri() {
  const kenar = useSafeAreaInsets();
  const saatler = useVeri(() => uclar.saatler(), "mutfak-saatler");

  const [program, setProgram] = useState<GunProgramiDto[]>([]);
  const [durum, setDurum] = useState<{ hata?: string; basari?: string }>({});
  const [bekliyor, setBekliyor] = useState(false);

  useEffect(() => {
    if (saatler.veri) setProgram(saatler.veri.program);
  }, [saatler.veri]);

  function gunuDegistir(sira: number, parca: Partial<GunProgramiDto>) {
    setProgram((o) => o.map((g, i) => (i === sira ? { ...g, ...parca } : g)));
  }

  async function kaydet(kapatmaSaati?: number) {
    setBekliyor(true);
    setDurum({});
    try {
      const cevap = await uclar.saatleriKaydet({
        program,
        ...(kapatmaSaati ? { kapatmaSaati } : {}),
      });
      setProgram(cevap.program);
      setDurum({
        basari: cevap.acik
          ? "Kaydedildi. Mutfağın şu an açık."
          : cevap.sebep === "elle"
            ? "Mutfağın geçici olarak kapatıldı."
            : "Kaydedildi. Mutfağın program gereği şu an kapalı.",
      });
      saatler.tazele();
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Saatler kaydedilemedi." });
    } finally {
      setBekliyor(false);
    }
  }

  if (saatler.yukleniyor) {
    return (
      <View style={{ flex: 1, backgroundColor: renk.beyaz, justifyContent: "center" }}>
        <Stack.Screen options={{ title: "Çalışma saatleri" }} />
        <ActivityIndicator color={renk.sari[600]} />
      </View>
    );
  }

  const acik = saatler.veri?.acik ?? false;
  const elleKapali = saatler.veri?.sebep === "elle";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      contentContainerStyle={{
        paddingTop: kenar.top + bosluk.xl,
        paddingHorizontal: bosluk.xl,
        paddingBottom: kenar.bottom + bosluk["3xl"],
        gap: bosluk.lg,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: "Çalışma saatleri" }} />

      <View>
        <Metin baslik boyut="3xl">
          Çalışma saatleri
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil}>
          Mutfağın kapalıyken müşteri menüyü görüyor ama sipariş veremiyor.
        </Metin>
      </View>

      {/* ŞU ANKİ DURUM — sunucunun hesabı. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.sm,
          borderRadius: yaricap.xl,
          backgroundColor: acik ? `${renk.nane}14` : renk.kremKoyu,
          padding: bosluk.md,
        }}
      >
        <MaterialCommunityIcons
          name={acik ? "check-circle-outline" : "clock-alert-outline"}
          size={18}
          color={acik ? renk.naneKoyu : renk.kahve[700]}
        />
        <Metin boyut="sm" agirlik="kalin" renkli={acik ? renk.naneKoyu : renk.kahve[800]}>
          {acik
            ? "Şu an açıksın, sipariş alabilirsin."
            : elleKapali
              ? "Geçici olarak kapalısın."
              : "Program gereği şu an kapalısın."}
        </Metin>
      </View>

      {program.map((gun, i) => (
        <View
          key={GUNLER[i]}
          style={{
            borderRadius: yaricap.xl,
            borderWidth: 1,
            borderColor: renk.cizgi,
            padding: bosluk.md,
            gap: bosluk.sm,
            opacity: gun.kapali ? 0.6 : 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.md }}>
            <Metin boyut="md" agirlik="kalin" style={{ flex: 1 }}>
              {GUNLER[i]}
            </Metin>
            <Metin boyut="2xs" renkli={renk.metinIkincil}>
              {gun.kapali ? "kapalı" : "açık"}
            </Metin>
            <Switch
              value={!gun.kapali}
              onValueChange={(deger) => gunuDegistir(i, { kapali: !deger })}
              trackColor={{ true: renk.sari[500], false: renk.kahve[200] }}
              thumbColor={renk.beyaz}
            />
          </View>

          {!gun.kapali ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
              <Saat deger={gun.acilis} setDeger={(d) => gunuDegistir(i, { acilis: d })} />
              <Metin boyut="sm" renkli={renk.metinIkincil}>
                —
              </Metin>
              <Saat deger={gun.kapanis} setDeger={(d) => gunuDegistir(i, { kapanis: d })} />
            </View>
          ) : null}
        </View>
      ))}

      {durum.hata ? (
        <Metin boyut="sm" renkli={renk.domatesKoyu}>
          {durum.hata}
        </Metin>
      ) : null}
      {durum.basari ? (
        <Metin boyut="sm" renkli={renk.naneKoyu}>
          {durum.basari}
        </Metin>
      ) : null}

      <Dugme baslik="Programı kaydet" onPress={() => kaydet()} bekliyor={bekliyor} tamGenislik />

      {/* ELDEN KAPATMA — programa dokunmadan, bugüne mahsus. */}
      <View
        style={{
          borderRadius: yaricap["2xl"],
          borderWidth: 1,
          borderColor: renk.cizgi,
          padding: bosluk.lg,
          gap: bosluk.sm,
        }}
      >
        <Metin baslik boyut="lg">
          Bugün yetişemiyorum
        </Metin>
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          Mutfağını belirli bir süre kapatır. Süre dolunca programın kendiliğinden geri geliyor —
          açmayı unutma diye bir şey yok.
        </Metin>

        <View style={{ flexDirection: "row", gap: bosluk.sm }}>
          {KAPATMA_SURELERI.map((saat) => (
            <View key={saat} style={{ flex: 1 }}>
              <Dugme
                baslik={`${saat} saat`}
                tur="ikincil"
                onPress={() => kaydet(saat)}
                bekliyor={bekliyor}
                tamGenislik
              />
            </View>
          ))}
        </View>

        {elleKapali ? (
          <Dugme baslik="Hemen aç" onPress={() => kaydet()} bekliyor={bekliyor} tamGenislik />
        ) : null}
      </View>
    </ScrollView>
  );
}

/** "10:00" biçiminde tek saat kutusu. */
function Saat({ deger, setDeger }: { deger: string; setDeger: (d: string) => void }) {
  return (
    <TextInput
      value={deger}
      onChangeText={setDeger}
      placeholder="10:00"
      placeholderTextColor={renk.kahve[300]}
      keyboardType="numbers-and-punctuation"
      maxLength={5}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: renk.cizgi,
        borderRadius: yaricap.lg,
        paddingHorizontal: bosluk.md,
        paddingVertical: bosluk.sm,
        textAlign: "center",
        color: renk.kahve[900],
        fontFamily: yaziAilesi.govdeKalin,
        ...yazi.md,
      }}
    />
  );
}
