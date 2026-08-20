import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  hesap as hesapUclari,
  renk,
  yaricap,
  type BasvuruTuruDegeri,
} from "ortak";
import { Alan, Bosluk, Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = hesapUclari(api);

/** Tanıtım metninin sunucudaki alt sınırı — kural orada, sayı burada da görünüyor. */
const MESAJ_ASGARI = 30;

/**
 * BAŞVURU — şef, ev hanımı, kurye ya da işletme olmak isteyenler için.
 *
 * Web'deki /hesap/basvuru formunun aynısı. KİMSE DOĞRUDAN ŞEF HESABI AÇAMIYOR:
 * önce başvuruyor, yönetici onaylıyor, hesap o anda açılıyor.
 *
 * PAROLA BURADA BELİRLENİYOR: onaydan sonra ikinci bir kayıt formu istemek,
 * kabul edilmiş bir başvurunun yarısını havada bırakırdı. Onay geldiği anda
 * kişi buradaki parolasıyla giriş yapıyor.
 *
 * TÜRLER SUNUCUDAN GELİYOR (bkz. hesap.basvuruTurleri): listeyi uygulamaya
 * kopyalamak, web'e yeni bir tür eklendiğinde sessizce eskimek demekti.
 *
 * BELGE YÜKLEME YOK — web formunda evrak eklenebiliyor. Eksik evrakı yönetici
 * başvuruyu incelerken istiyor; dosya yüklemeyi beklemek, başvurunun hiç
 * gönderilememesi olurdu.
 */
export default function BasvuruEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  const turler = useVeri(() => uclar.basvuruTurleri(), "basvuru-turleri");

  const [tur, setTur] = useState<BasvuruTuruDegeri | null>(null);
  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
  const [eposta, setEposta] = useState("");
  const [parola, setParola] = useState("");
  const [mesaj, setMesaj] = useState("");

  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  async function gonder() {
    if (!tur) {
      setHata("Önce ne olarak başvurduğunu seç.");
      return;
    }
    setHata(null);
    setBekliyor(true);
    try {
      const cevap = await uclar.basvuru({
        ad: ad.trim(),
        telefon: telefon.trim(),
        eposta: eposta.trim(),
        parola,
        tur,
        mesaj: mesaj.trim(),
      });
      setBasari(cevap.basari);
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Başvuru gönderilemedi.");
    } finally {
      setBekliyor(false);
    }
  }

  /*
   * GÖNDERİLDİKTEN SONRA FORM KAPANIYOR. Ekranda kalsaydı kişi "gitti mi"
   * diye ikinci kez gönderir, aynı e-postayla ikinci başvuru "zaten bekleyen
   * başvurun var" hatası alır ve başarılı bir işlem hata gibi görünürdü.
   */
  if (basari) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: renk.beyaz,
          paddingTop: kenar.top + bosluk["2xl"],
          paddingHorizontal: bosluk.xl,
          gap: bosluk.lg,
          alignItems: "center",
        }}
      >
        <Stack.Screen options={{ title: "Başvuru" }} />
        <MaterialCommunityIcons name="check-decagram" size={54} color={renk.nane} />
        <Metin baslik boyut="2xl" ortala>
          Başvurun alındı
        </Metin>
        <Metin boyut="sm" renkli={renk.kahve[700]} ortala>
          {basari}
        </Metin>
        <Dugme baslik="Keşfete dön" onPress={() => yonlendir.replace("/")} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Başvuru" }} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: kenar.top + bosluk.xl,
          paddingHorizontal: bosluk.xl,
          paddingBottom: kenar.bottom + bosluk["3xl"],
          gap: bosluk.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: bosluk.xs }}>
          <Metin baslik boyut="3xl">
            Aramıza katıl
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Başvurunu gönder, yönetici onayladığı anda hesabın açılsın. Onaydan sonra burada
            belirlediğin parolayla giriş yaparsın.
          </Metin>
        </View>

        {/* TÜR SEÇİMİ — açıklamasıyla birlikte; "Şef" ile "Ev Hanımı" farkı
            yalnızca etiketten anlaşılmıyor. */}
        <View style={{ gap: bosluk.sm }}>
          <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[700]}>
            NE OLARAK BAŞVURUYORSUN?
          </Metin>

          {(turler.veri ?? []).map((t) => {
            const secili = tur === t.deger;
            return (
              <Pressable
                key={t.deger}
                accessibilityRole="button"
                accessibilityState={{ selected: secili }}
                onPress={() => setTur(t.deger)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: bosluk.md,
                  borderRadius: yaricap.xl,
                  borderWidth: secili ? 2 : 1,
                  borderColor: secili ? renk.sari[500] : renk.cizgi,
                  backgroundColor: secili ? renk.krem : renk.beyaz,
                  padding: bosluk.md,
                }}
              >
                <MaterialCommunityIcons
                  name={secili ? "radiobox-marked" : "radiobox-blank"}
                  size={20}
                  color={secili ? renk.sari[600] : renk.kahve[300]}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Metin boyut="sm" agirlik="kalin">
                    {t.etiket}
                  </Metin>
                  <Metin boyut="2xs" renkli={renk.metinIkincil}>
                    {t.aciklama}
                  </Metin>
                </View>
              </Pressable>
            );
          })}

          {turler.yukleniyor ? (
            <Metin boyut="2xs" renkli={renk.metinIkincil}>
              Türler yükleniyor…
            </Metin>
          ) : null}
        </View>

        <Alan
          etiket="Ad soyad"
          value={ad}
          onChangeText={setAd}
          placeholder="Adın ve soyadın"
          autoCapitalize="words"
        />

        <Alan
          etiket="Telefon"
          value={telefon}
          onChangeText={setTelefon}
          placeholder="05xx xxx xx xx"
          keyboardType="phone-pad"
        />

        <Alan
          etiket="E-posta"
          value={eposta}
          onChangeText={setEposta}
          placeholder="ornek@eposta.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Alan
          etiket="Parola"
          value={parola}
          onChangeText={setParola}
          placeholder="En az 8 karakter"
          secureTextEntry
          autoCapitalize="none"
        />

        <View style={{ gap: bosluk.xs }}>
          <Alan
            etiket="Kendini tanıt"
            value={mesaj}
            onChangeText={setMesaj}
            placeholder="Ne pişiriyorsun, nerede pişiriyorsun, ne kadar zamandır?"
            multiline
            numberOfLines={5}
            style={{ minHeight: 120, textAlignVertical: "top" }}
          />
          <Metin
            boyut="2xs"
            renkli={mesaj.trim().length >= MESAJ_ASGARI ? renk.metinIkincil : renk.domates}
          >
            {mesaj.trim().length}/{MESAJ_ASGARI} karakter — yönetici kararını buna bakarak
            veriyor.
          </Metin>
        </View>

        {hata ? (
          <View
            style={{
              backgroundColor: "rgba(228,69,44,0.08)",
              borderRadius: yaricap.lg,
              padding: bosluk.md,
            }}
          >
            <Metin boyut="sm" renkli={renk.domatesKoyu}>
              {hata}
            </Metin>
          </View>
        ) : null}

        <Dugme baslik="Başvuruyu gönder" onPress={gonder} bekliyor={bekliyor} />
        <Bosluk y={bosluk.md} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
