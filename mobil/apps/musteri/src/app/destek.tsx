import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
  destek as destekUclari,
  renk,
  yaricap,
  yazi,
  yaziAilesi,
  type DestekTalebiDto,
} from "ortak";
import { Alan, Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = destekUclari(api);

/**
 * DESTEK — yetkiliye ulaşma yolu.
 *
 * İKİ YOL YAN YANA: telefonla aramak ve yazılı talep açmak. Yalnızca form
 * konsaydı acil bir durumda (yemek gelmedi, adres yanlış) kişi cevabı
 * beklemek zorunda kalırdı; yalnızca telefon konsaydı, saat 23:00'te
 * yazabileceği bir yer olmazdı.
 *
 * TELEFON SUNUCUDAN GELİYOR, uygulamaya gömülü değil: numara değiştiğinde
 * mağaza güncellemesi beklemek, kişiyi çalmayan bir numarayla baş başa
 * bırakırdı.
 *
 * TALEPLER YÖNETİCİNİN ZATEN BAKTIĞI LİSTEYE düşüyor — ayrı bir müşteri
 * kutusu açılsaydı er ya da geç birine bakmayı unuturdu.
 */
export default function DestekEkrani() {
  const kenar = useSafeAreaInsets();
  const veri = useVeri(() => uclar.ozet(), "destek");

  const [konu, setKonu] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [siparisNo, setSiparisNo] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  async function gonder() {
    setBekliyor(true);
    setHata(null);
    try {
      await uclar.ac({
        konu: konu.trim() || "Yardım",
        mesaj: mesaj.trim(),
        ...(siparisNo.trim() ? { siparisNo: siparisNo.trim() } : {}),
      });
      setKonu("");
      setMesaj("");
      setSiparisNo("");
      veri.tazele();
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Talep gönderilemedi.");
    } finally {
      setBekliyor(false);
    }
  }

  const telefon = veri.veri?.telefon;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Destek" }} />

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
            Destek
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Bir sorun mu var? Ara ya da yaz — ikisi de bize ulaşıyor.
          </Metin>
        </View>

        {telefon ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL(`tel:${telefon.replace(/\s/g, "")}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.md,
              backgroundColor: renk.sari[500],
              borderRadius: yaricap["2xl"],
              padding: bosluk.lg,
            }}
          >
            <MaterialCommunityIcons name="phone" size={22} color={renk.murekkep} />
            <View style={{ flex: 1 }}>
              <Metin baslik boyut="md" renkli={renk.murekkep}>
                Yetkiliyi ara
              </Metin>
              <Metin boyut="2xs" renkli={renk.kahve[800]}>
                {telefon}
              </Metin>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={renk.murekkep} />
          </Pressable>
        ) : null}

        {/* YAZILI TALEP */}
        <View
          style={{
            borderRadius: yaricap["2xl"],
            borderWidth: 1,
            borderColor: renk.cizgi,
            padding: bosluk.lg,
            gap: bosluk.md,
          }}
        >
          <Metin baslik boyut="lg">
            Talep oluştur
          </Metin>

          <Alan
            etiket="Konu"
            value={konu}
            onChangeText={setKonu}
            placeholder="Örn. Siparişim gelmedi"
            maxLength={120}
          />

          <Alan
            etiket="Sipariş no (varsa)"
            value={siparisNo}
            onChangeText={setSiparisNo}
            placeholder="NY-260820-1234"
            autoCapitalize="characters"
            maxLength={40}
          />

          <TextInput
            value={mesaj}
            onChangeText={setMesaj}
            placeholder="Ne oldu? En az birkaç cümle yaz."
            placeholderTextColor={renk.kahve[300]}
            multiline
            maxLength={2000}
            style={{
              minHeight: 110,
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

          {hata ? (
            <Metin boyut="sm" renkli={renk.domatesKoyu}>
              {hata}
            </Metin>
          ) : null}

          <Dugme
            baslik="Gönder"
            onPress={gonder}
            bekliyor={bekliyor}
            pasif={mesaj.trim().length < 10}
            tamGenislik
          />
        </View>

        {/* GEÇMİŞ TALEPLER — yanıt geldiğinde burada görünüyor. */}
        <Metin baslik boyut="lg">
          Taleplerin
        </Metin>

        {veri.yukleniyor ? (
          <ActivityIndicator color={renk.sari[600]} />
        ) : (veri.veri?.talepler ?? []).length === 0 ? (
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Henüz talep açmadın.
          </Metin>
        ) : (
          (veri.veri?.talepler ?? []).map((t) => <TalepKarti key={t.no} talep={t} />)
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TalepKarti({ talep }: { talep: DestekTalebiDto }) {
  const acik = talep.durum === "acik";

  return (
    <View
      style={{
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        padding: bosluk.md,
        gap: bosluk.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <Metin boyut="md" agirlik="kalin" style={{ flex: 1 }}>
          {talep.konu}
        </Metin>
        <Metin boyut="2xs" agirlik="kalin" renkli={acik ? renk.kahve[600] : renk.naneKoyu}>
          {acik ? "AÇIK" : "ÇÖZÜLDÜ"}
        </Metin>
      </View>

      <Metin boyut="2xs" renkli={renk.metinIkincil}>
        {talep.no}
      </Metin>

      <Metin boyut="sm" renkli={renk.kahve[800]}>
        {talep.mesaj}
      </Metin>

      {/* YANIT — yönetici yazdıysa. Bildirim beklemeden burada görünüyor. */}
      {talep.yanit ? (
        <View
          style={{
            backgroundColor: renk.krem,
            borderRadius: yaricap.lg,
            padding: bosluk.md,
            gap: 2,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
            NE YERSİN YANITLADI
          </Metin>
          <Metin boyut="sm" renkli={renk.kahve[800]}>
            {talep.yanit}
          </Metin>
        </View>
      ) : null}
    </View>
  );
}
