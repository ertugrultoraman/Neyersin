import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiHatasi, bosluk, hesap as hesapUclari, renk, yaricap } from "ortak";
import { useOturum } from "ortak/oturum";
import { Alan, Bosluk, Dugme, Metin } from "ortak/ui";

import { api } from "@/altyapi/api";

const uclar = hesapUclari(api);

/**
 * KAYIT — iki adım tek ekranda.
 *
 *   1. Form: ad, e-posta, telefon, parola → hesap açılır, e-postaya kod gider.
 *   2. Kod: 6 hane → e-posta doğrulanır VE oturum açılır.
 *
 * İkisi ayrı ekran olsaydı geri tuşu araya girerdi: kod ekranından geri dönen
 * kişi formu yeniden gönderir, "bu e-posta zaten kayıtlı" hatası alırdı —
 * oysa hesabı bir önceki adımda kendisi açtırmıştı.
 *
 * Oturum, doğrulama cevabındaki jetonlarla açılıyor (`oturumaGec`); ayrıca
 * giriş ekranına uğramıyor, parolayı bir dakika önce kendisi belirledi.
 */
export default function KayitEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const { oturumaGec } = useOturum();

  const [adim, setAdim] = useState<"form" | "kod">("form");
  const [ad, setAd] = useState("");
  const [eposta, setEposta] = useState("");
  const [telefon, setTelefon] = useState("");
  const [parola, setParola] = useState("");
  const [kod, setKod] = useState("");

  const [parolaUyarisi, setParolaUyarisi] = useState<string | null>(null);
  const [postaGitmedi, setPostaGitmedi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  async function kayitOl(parolayiKabulEt = false) {
    setHata(null);
    setBekliyor(true);
    try {
      const sonuc = await uclar.kayit({
        ad: ad.trim(),
        eposta: eposta.trim(),
        parola,
        telefon: telefon.trim() || undefined,
        ...(parolayiKabulEt ? { parolayiKabulEt: true } : {}),
      });

      if (sonuc.asama === "parola-uyarisi") {
        setParolaUyarisi(sonuc.uyari);
        return;
      }

      setParolaUyarisi(null);
      setEposta(sonuc.eposta);
      setPostaGitmedi(sonuc.postaGitmedi);
      setAdim("kod");
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Kayıt tamamlanamadı.");
    } finally {
      setBekliyor(false);
    }
  }

  async function dogrula() {
    setHata(null);
    setBekliyor(true);
    try {
      const cevap = await uclar.dogrula({ eposta, kod: kod.trim(), cihaz: api.cihaz });
      await oturumaGec(cevap);
      /* Kayıt biten kişi doğrudan keşfete düşüyor; yığında kayıt ekranı kalmıyor. */
      yonlendir.replace("/");
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Kod doğrulanamadı.");
    } finally {
      setBekliyor(false);
    }
  }

  async function koduTekrarGonder() {
    setHata(null);
    try {
      const sonuc = await uclar.kodIste({ eposta, amac: "kayit" });
      setPostaGitmedi(sonuc.postaGitmedi);
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Kod gönderilemedi.");
    }
  }

  const formGecerli =
    ad.trim().length >= 3 && eposta.trim().length > 3 && parola.length > 0 && !bekliyor;

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
            {adim === "form" ? "Hesap aç" : "Kodu gir"}
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil} style={{ marginTop: bosluk.xs }}>
            {adim === "form"
              ? "Sipariş vermek için tek seferlik bir hesap yeter."
              : `${eposta} adresine 6 haneli bir kod gönderdik.`}
          </Metin>
        </View>

        {hata ? <Uyari metin={hata} tur="hata" /> : null}

        {adim === "form" ? (
          <>
            <Alan
              etiket="Ad soyad"
              value={ad}
              onChangeText={setAd}
              autoComplete="name"
              editable={!bekliyor}
            />
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
            <Alan
              etiket="Telefon (isteğe bağlı)"
              value={telefon}
              onChangeText={setTelefon}
              placeholder="05XX XXX XX XX"
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!bekliyor}
            />
            <Alan
              etiket="Parola"
              value={parola}
              onChangeText={(d) => {
                setParola(d);
                /* Parola değişince eski uyarı geçersiz. */
                setParolaUyarisi(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!bekliyor}
            />

            {parolaUyarisi ? (
              <>
                <Uyari metin={parolaUyarisi} tur="uyari" />
                {/*
                  UYARI ENGEL DEĞİL. Kullanıcı ısrar ederse hesap açılıyor:
                  ihlal listesi dış bir servisin verisi ve yanlış eşleşme
                  olabilir; sıkı engelleme kayıttan vazgeçiriyor.
                */}
                <Dugme
                  baslik="Yine de bu parolayla devam et"
                  tur="ikincil"
                  tamGenislik
                  bekliyor={bekliyor}
                  onPress={() => kayitOl(true)}
                />
              </>
            ) : null}

            <Dugme
              baslik="Hesabı aç"
              tamGenislik
              bekliyor={bekliyor}
              pasif={!formGecerli}
              onPress={() => kayitOl(false)}
            />
          </>
        ) : (
          <>
            {postaGitmedi ? (
              <Uyari
                metin="E-posta gönderilemedi. Kodu yöneticiden isteyebilir ya da tekrar deneyebilirsin."
                tur="uyari"
              />
            ) : null}

            <Alan
              etiket="Doğrulama kodu"
              value={kod}
              onChangeText={setKod}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="sms-otp"
              editable={!bekliyor}
            />

            <Dugme
              baslik="Doğrula ve gir"
              tamGenislik
              bekliyor={bekliyor}
              pasif={kod.trim().length !== 6 || bekliyor}
              onPress={dogrula}
            />

            <Pressable accessibilityRole="button" onPress={koduTekrarGonder} hitSlop={8}>
              <Metin boyut="sm" agirlik="orta" renkli={renk.kahve[600]} ortala>
                Kod gelmedi, tekrar gönder
              </Metin>
            </Pressable>
          </>
        )}

        <Bosluk y={bosluk.sm} />

        <Pressable
          accessibilityRole="button"
          onPress={() => (yonlendir.canGoBack() ? yonlendir.back() : yonlendir.replace("/giris"))}
          hitSlop={8}
        >
          <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
            Zaten hesabın var mı? <Metin agirlik="kalin" renkli={renk.kahve[700]}>Giriş yap</Metin>
          </Metin>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Uyari({ metin, tur }: { metin: string; tur: "hata" | "uyari" }) {
  const renkli = tur === "hata" ? renk.domates : renk.sari[600];
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
      <Metin boyut="sm" agirlik="orta" renkli={tur === "hata" ? renk.domatesKoyu : renk.kahve[800]}>
        {metin}
      </Metin>
    </View>
  );
}
