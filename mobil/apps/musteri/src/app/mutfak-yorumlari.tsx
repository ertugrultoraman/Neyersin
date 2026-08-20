import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  mutfak as mutfakUclari,
  renk,
  yaricap,
  yazi,
  yaziAilesi,
  type YorumDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = mutfakUclari(api);

/**
 * MUTFAĞIN DEĞERLENDİRMELERİ — ve şefin cevabı.
 *
 * TEK YÖNLÜ DEĞERLENDİRME ADİL DEĞİL: müşteri şikâyet edince şefin "kusura
 * bakmayın, o gün şu oldu" diyebileceği bir yer olmalı. Cevap mutfak
 * sayfasında yorumun altında görünüyor.
 *
 * PUANLAR DEĞİŞTİRİLEMİYOR, yorumlar silinemiyor: mutfağın kendi notunu
 * düzeltebildiği bir sistem, hiç puan olmamasından kötü olurdu. Şefin elinde
 * yalnızca cevap hakkı var.
 */
export default function MutfakYorumlari() {
  const kenar = useSafeAreaInsets();
  const yorumlar = useVeri(() => uclar.yorumlar(), "mutfak-yorumlar");

  const liste = yorumlar.veri ?? [];
  const ortalama =
    liste.length > 0
      ? liste.reduce((t, y) => t + (y.sicaklik + y.teslimatHizi + y.tad) / 3, 0) / liste.length
      : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Değerlendirmeler" }} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: kenar.top + bosluk.xl,
          paddingHorizontal: bosluk.xl,
          paddingBottom: kenar.bottom + bosluk["3xl"],
          gap: bosluk.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Metin baslik boyut="3xl">
            Değerlendirmeler
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            {liste.length > 0
              ? `${liste.length} değerlendirme · ortalama ${ortalama.toFixed(1)}`
              : "Müşterilerin yazdıkları burada görünecek."}
          </Metin>
        </View>

        {yorumlar.yukleniyor ? (
          <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk.xl }} />
        ) : liste.length === 0 ? (
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Henüz değerlendirme yok. İlk siparişler teslim edildikçe gelmeye başlar.
          </Metin>
        ) : (
          liste.map((y) => <YorumKarti key={y.id} yorum={y} tazele={yorumlar.tazele} />)
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function YorumKarti({
  yorum,
  tazele,
}: {
  yorum: YorumDto & { id: string };
  tazele: () => void;
}) {
  const [yanit, setYanit] = useState(yorum.yanit ?? "");
  const [acik, setAcik] = useState(false);
  const [bekliyor, setBekliyor] = useState(false);
  const [durum, setDurum] = useState<{ hata?: string; basari?: string }>({});

  const ortalama = (yorum.sicaklik + yorum.teslimatHizi + yorum.tad) / 3;

  async function gonder() {
    setBekliyor(true);
    setDurum({});
    try {
      const cevap = await uclar.yorumYanitla(yorum.id, yanit.trim());
      setDurum({ basari: cevap.basari });
      tazele();
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Cevap kaydedilemedi." });
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <View
      style={{
        borderRadius: yaricap["2xl"],
        borderWidth: 1,
        borderColor: renk.cizgi,
        padding: bosluk.lg,
        gap: bosluk.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <Metin boyut="md" agirlik="kalin" style={{ flex: 1 }}>
          {yorum.musteriAdi}
        </Metin>
        <View style={{ flexDirection: "row", gap: 1 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <MaterialCommunityIcons
              key={n}
              name={n <= Math.round(ortalama) ? "star" : "star-outline"}
              size={13}
              color={renk.sari[600]}
            />
          ))}
        </View>
      </View>

      {/* ÜÇ EKSEN AYRI: "yemek güzeldi ama soğuk geldi" tek sayıya
          sıkıştırılınca mutfak ne düzelteceğini bilemiyor. */}
      <Metin boyut="2xs" renkli={renk.metinIkincil}>
        Sıcaklık {yorum.sicaklik} · Teslimat {yorum.teslimatHizi} · Tad {yorum.tad}
      </Metin>

      {yorum.metin ? (
        <Metin boyut="sm" renkli={renk.kahve[800]}>
          {yorum.metin}
        </Metin>
      ) : (
        <Metin boyut="sm" renkli={renk.metinIkincil} style={{ fontStyle: "italic" }}>
          Yalnızca puan verilmiş, yazı yok.
        </Metin>
      )}

      {yorum.yanit && !acik ? (
        <View
          style={{
            backgroundColor: renk.krem,
            borderRadius: yaricap.lg,
            padding: bosluk.md,
            gap: 2,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
            CEVABIN
          </Metin>
          <Metin boyut="sm" renkli={renk.kahve[800]}>
            {yorum.yanit}
          </Metin>
        </View>
      ) : null}

      {acik ? (
        <View style={{ gap: bosluk.sm }}>
          <TextInput
            value={yanit}
            onChangeText={setYanit}
            placeholder="Cevabın… (boş bırakıp kaydedersen cevap kalkar)"
            placeholderTextColor={renk.kahve[300]}
            multiline
            maxLength={1000}
            style={{
              minHeight: 80,
              textAlignVertical: "top",
              borderWidth: 1,
              borderColor: renk.cizgi,
              borderRadius: yaricap.lg,
              padding: bosluk.md,
              color: renk.kahve[900],
              fontFamily: yaziAilesi.govde,
              ...yazi.sm,
            }}
          />
          <Dugme baslik="Cevabı kaydet" onPress={gonder} bekliyor={bekliyor} tamGenislik />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setAcik(true)}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}
        >
          <MaterialCommunityIcons name="reply-outline" size={15} color={renk.sari[600]} />
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.sari[700]}>
            {yorum.yanit ? "Cevabını düzenle" : "Cevap yaz"}
          </Metin>
        </Pressable>
      )}

      {durum.hata ? (
        <Metin boyut="2xs" renkli={renk.domatesKoyu}>
          {durum.hata}
        </Metin>
      ) : null}
      {durum.basari ? (
        <Metin boyut="2xs" renkli={renk.naneKoyu}>
          {durum.basari}
        </Metin>
      ) : null}
    </View>
  );
}
