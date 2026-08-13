import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
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
      /* Başarılıysa oturum durumu değişiyor ve yönlendirme kendiliğinden oluyor. */
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
            Kazancın kapına gelsin.
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
