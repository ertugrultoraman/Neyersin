import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiHatasi, bosluk, renk, yaricap } from "ortak";

import { useOturum } from "ortak/oturum";
import { Alan } from "ortak/ui";
import { Bosluk, Dugme } from "ortak/ui";
import { Metin } from "ortak/ui";

/**
 * GİRİŞ EKRANI.
 *
 * Web'deki formla aynı kapıyı kullanıyor; tek fark oturumun jetonla
 * taşınması. Kayıt olma ve parola sıfırlama akışları henüz sunucuda mobil
 * ucuna açılmadı — o düğmeler eklendiklerinde buraya gelecek.
 */
export default function GirisEkrani() {
  const { girisYap } = useOturum();
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  const [kimlik, setKimlik] = useState("");
  const [parola, setParola] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  const gonderilebilir = kimlik.trim().length > 0 && parola.length > 0 && !bekliyor;

  async function gonder() {
    if (!gonderilebilir) return;
    setHata(null);
    setBekliyor(true);
    try {
      await girisYap(kimlik.trim(), parola);
      /*
       * KAPANMASI ELLE YAPILIYOR. Bu ekran bir zamanlar misafirin kök
       * ekranıydı; oturum açılınca `Stack.Protected` onu yığından atıyordu.
       * Artık üstten açılan bir kat (bkz. kök yerleşimi) ve koruma koşulu
       * girişten sonra da doğru — kapatılmasaydı kullanıcı başarılı girişin
       * ardından aynı formda oturmaya devam ederdi.
       *
       * `canGoBack` kontrolü derin bağlantı içindir: uygulama doğrudan
       * /giris ile açıldıysa dönülecek ekran yok, sekmelere gidiliyor.
       */
      if (yonlendir.canGoBack()) yonlendir.back();
      else yonlendir.replace("/");
    } catch (e) {
      /*
       * Sunucu, hangi adımda takıldığını bilerek sızdırmıyor (bkz.
       * lib/oturum.ts) — mesaj olduğu gibi gösteriliyor. Beklenmeyen bir
       * istisnada da kullanıcıya anlaşılır bir şey söylenmeli, ham hata
       * metni değil.
       */
      setHata(
        e instanceof ApiHatasi
          ? e.message
          : "Giriş yapılamadı. Lütfen tekrar deneyin.",
      );
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: bosluk.xl,
          paddingTop: kenar.top + bosluk["2xl"],
          paddingBottom: kenar.bottom + bosluk["2xl"],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marka bloğu */}
        <View style={{ alignItems: "center", marginBottom: bosluk["3xl"] }}>
          <View
            style={{
              paddingHorizontal: bosluk.xl,
              paddingVertical: bosluk.md,
              borderRadius: yaricap["4xl"],
              backgroundColor: renk.sari[500],
            }}
          >
            <Metin baslik boyut="3xl" agirlik="kalin" renkli={renk.murekkep}>
              Ne Yersin?
            </Metin>
          </View>
          <Bosluk y={bosluk.md} />
          <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
            Sipariş ver, kuryeni canlı takip et.
          </Metin>
        </View>

        <View style={{ gap: bosluk.lg }}>
          <Alan
            etiket="E-posta veya kullanıcı adı"
            value={kimlik}
            onChangeText={setKimlik}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
            editable={!bekliyor}
          />

          <Alan
            etiket="Parola"
            value={parola}
            onChangeText={setParola}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={gonder}
            editable={!bekliyor}
          />

          {hata ? (
            <View
              accessibilityRole="alert"
              style={{
                backgroundColor: `${renk.domates}1A`,
                borderRadius: yaricap.lg,
                paddingHorizontal: bosluk.lg,
                paddingVertical: bosluk.md,
              }}
            >
              <Metin boyut="sm" agirlik="orta" renkli={renk.domatesKoyu}>
                {hata}
              </Metin>
            </View>
          ) : null}

          <Dugme
            baslik="Giriş yap"
            onPress={gonder}
            bekliyor={bekliyor}
            pasif={!gonderilebilir}
            tamGenislik
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => yonlendir.push("/sifremi-unuttum")}
            hitSlop={8}
          >
            <Metin boyut="sm" agirlik="orta" renkli={renk.kahve[600]} ortala>
              Parolamı unuttum
            </Metin>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => yonlendir.push("/kayit")}
            hitSlop={8}
          >
            <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
              Hesabın yok mu?{" "}
              <Metin agirlik="kalin" renkli={renk.kahve[700]}>
                Hesap aç
              </Metin>
            </Metin>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
