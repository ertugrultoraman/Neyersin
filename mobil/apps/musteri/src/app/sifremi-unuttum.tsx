import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiHatasi, bosluk, hesap as hesapUclari, renk, yaricap } from "ortak";
import { Alan, Dugme, Metin } from "ortak/ui";

import { api } from "@/altyapi/api";

const uclar = hesapUclari(api);

/**
 * PAROLA SIFIRLAMA — iki adım tek ekranda (kayıtla aynı gerekçe).
 *
 * Sıfırlama sonunda OTURUM AÇILMIYOR; kişi yeni parolasıyla giriş ekranına
 * dönüyor. Bu akış çoğu zaman "hesabım çalınmış olabilir" şüphesiyle
 * başlatılıyor ve o anda otomatik oturum açmak, akışı başlatanın gerçekten
 * hesap sahibi olduğu varsayımına dayanırdı.
 */
export default function SifremiUnuttum() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  const [adim, setAdim] = useState<"eposta" | "kod">("eposta");
  const [eposta, setEposta] = useState("");
  const [kod, setKod] = useState("");
  const [yeniParola, setYeniParola] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [postaGitmedi, setPostaGitmedi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  async function kodIste() {
    setHata(null);
    setBekliyor(true);
    try {
      const sonuc = await uclar.kodIste({ eposta: eposta.trim(), amac: "sifre" });
      setPostaGitmedi(sonuc.postaGitmedi);
      setAdim("kod");
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Kod gönderilemedi.");
    } finally {
      setBekliyor(false);
    }
  }

  async function sifirla() {
    setHata(null);
    setBekliyor(true);
    try {
      await uclar.parolaSifirla({
        eposta: eposta.trim(),
        kod: kod.trim(),
        yeniParola,
        yeniParolaTekrar: tekrar,
      });
      setBasari("Parolan güncellendi. Yeni parolanla giriş yapabilirsin.");
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Parola değiştirilemedi.");
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: bosluk.xl,
          paddingTop: kenar.top + bosluk["2xl"],
          paddingBottom: kenar.bottom + bosluk["2xl"],
          gap: bosluk.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Metin baslik boyut="3xl">
            Parolamı unuttum
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil} style={{ marginTop: bosluk.xs }}>
            {adim === "eposta"
              ? "Hesabının e-posta adresini yaz, kod gönderelim."
              : `${eposta} adresine gönderdiğimiz kodu ve yeni parolanı gir.`}
          </Metin>
        </View>

        {hata ? <Kutu metin={hata} tur="hata" /> : null}
        {basari ? <Kutu metin={basari} tur="basari" /> : null}
        {postaGitmedi && !basari ? (
          <Kutu metin="E-posta gönderilemedi. Kod ulaşmadıysa tekrar dene." tur="uyari" />
        ) : null}

        {basari ? (
          <Dugme baslik="Giriş yap" tamGenislik onPress={() => yonlendir.replace("/giris")} />
        ) : adim === "eposta" ? (
          <>
            <Alan
              etiket="E-posta"
              value={eposta}
              onChangeText={setEposta}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              editable={!bekliyor}
            />
            <Dugme
              baslik="Kod gönder"
              tamGenislik
              bekliyor={bekliyor}
              pasif={eposta.trim().length < 4 || bekliyor}
              onPress={kodIste}
            />
          </>
        ) : (
          <>
            <Alan
              etiket="Doğrulama kodu"
              value={kod}
              onChangeText={setKod}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="sms-otp"
              editable={!bekliyor}
            />
            <Alan
              etiket="Yeni parola"
              value={yeniParola}
              onChangeText={setYeniParola}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!bekliyor}
            />
            <Alan
              etiket="Yeni parola (tekrar)"
              value={tekrar}
              onChangeText={setTekrar}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!bekliyor}
            />
            <Dugme
              baslik="Parolayı değiştir"
              tamGenislik
              bekliyor={bekliyor}
              pasif={kod.trim().length !== 6 || yeniParola.length === 0 || bekliyor}
              onPress={sifirla}
            />
            <Pressable accessibilityRole="button" onPress={kodIste} hitSlop={8}>
              <Metin boyut="sm" agirlik="orta" renkli={renk.kahve[600]} ortala>
                Kod gelmedi, tekrar gönder
              </Metin>
            </Pressable>
          </>
        )}

        {!basari ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => (yonlendir.canGoBack() ? yonlendir.back() : yonlendir.replace("/giris"))}
            hitSlop={8}
          >
            <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
              Vazgeç
            </Metin>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Kutu({ metin, tur }: { metin: string; tur: "hata" | "uyari" | "basari" }) {
  const renkli =
    tur === "hata" ? renk.domates : tur === "uyari" ? renk.sari[600] : renk.nane;
  const yaziRengi =
    tur === "hata" ? renk.domatesKoyu : tur === "uyari" ? renk.kahve[800] : renk.naneKoyu;

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: `${renkli}1A`,
        borderRadius: yaricap.lg,
        paddingHorizontal: bosluk.lg,
        paddingVertical: bosluk.md,
      }}
    >
      <Metin boyut="sm" agirlik="orta" renkli={yaziRengi}>
        {metin}
      </Metin>
    </View>
  );
}
