import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiHatasi, bosluk, hesap as hesapUclari, renk, yaricap } from "ortak";
import { useOturum } from "ortak/oturum";
import { Alan, Dugme, Metin } from "ortak/ui";

import { api } from "@/altyapi/api";

const uclar = hesapUclari(api);

/**
 * HESAP AYARLARI — web'deki /hesabim/eposta ve /hesabim/parola sayfalarının
 * uygulamadaki karşılığı, üstüne e-posta doğrulama kutusu.
 *
 * TEK EKRAN, ÜÇ KUTU: web'de bunlar ayrı sayfalar çünkü orada adres çubuğu ve
 * geri tuşu var. Telefonda üç ayrı ekran, üç ayrı geri hareketi demek — ve
 * kişinin buraya girme sebebi çoğu zaman tek bir şeyi düzeltmek.
 *
 * E-POSTA DEĞİŞİMİ İKİ ADIM: önce parola + yeni adres (kod gider), sonra kod.
 * Adres ilk adımda değişmiyor; kişinin o adrese gerçekten eriştiğini
 * kanıtlaması gerekiyor.
 */
export default function HesapAyarlari() {
  const kenar = useSafeAreaInsets();
  const { durum } = useOturum();

  const girisli = durum.asama === "girisli";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Hesap ayarları" }} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: kenar.top + bosluk.xl,
          paddingHorizontal: bosluk.xl,
          paddingBottom: kenar.bottom + bosluk["3xl"],
          gap: bosluk["2xl"],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Metin baslik boyut="3xl">
          Hesap ayarları
        </Metin>

        {!girisli ? (
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Bu ekran için giriş yapman gerekiyor.
          </Metin>
        ) : (
          <>
            <FotografKutusu
              ad={durum.kullanici.ad}
              fotografUrl={durum.kullanici.fotografUrl}
            />
            {!durum.kullanici.epostaDogrulandi ? (
              <EpostaDogrula eposta={durum.kullanici.eposta} />
            ) : null}
            <ParolaKutusu />
            <EpostaKutusu mevcut={durum.kullanici.eposta} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* --------------------------------------------------------------------------
 * E-posta doğrulama
 * ----------------------------------------------------------------------- */

/**
 * DOĞRULANMAMIŞ ADRES kişiyi kapıda bırakmıyor (web'de de öyle), ama parola
 * sıfırlama gibi e-postaya güvenen akışlar doğrulama istiyor. Kutu yalnızca
 * doğrulanmamışsa çiziliyor.
 *
 * Kod doğrulandığında sunucu YENİ JETON çifti dönüyor (kayıt akışının aynı
 * ucu); oturum onunla tazeleniyor ve "doğrulandı" bilgisi anında yerine
 * oturuyor — kişi çıkıp girmek zorunda kalmıyor.
 */
function EpostaDogrula({ eposta }: { eposta: string }) {
  const { oturumaGec } = useOturum();
  const [kod, setKod] = useState("");
  const [gonderildi, setGonderildi] = useState(false);
  const [durum, setDurum] = useState<{ hata?: string; basari?: string }>({});
  const [bekliyor, setBekliyor] = useState(false);

  async function kodIste() {
    setBekliyor(true);
    setDurum({});
    try {
      const cevap = await uclar.kodIste({ eposta, amac: "kayit" });
      setGonderildi(true);
      setDurum({
        basari: cevap.postaGitmedi
          ? "Kod üretildi ama posta gönderilemedi. Yönetici ile iletişime geç."
          : `${eposta} adresine bir kod gönderdik.`,
      });
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Kod gönderilemedi." });
    } finally {
      setBekliyor(false);
    }
  }

  async function dogrula() {
    setBekliyor(true);
    setDurum({});
    try {
      const cevap = await uclar.dogrula({ eposta, kod: kod.trim(), cihaz: api.cihaz });
      await oturumaGec(cevap);
      setDurum({ basari: "E-posta adresin doğrulandı." });
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Kod doğrulanamadı." });
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <Kutu
      ikon="email-alert-outline"
      baslik="E-postanı doğrula"
      aciklama={`${eposta} adresi henüz doğrulanmadı. Doğrulanmış adres, parolanı unuttuğunda hesabını geri almanın tek yolu.`}
      durum={durum}
    >
      {gonderildi ? (
        <>
          <Alan
            etiket="Gelen kod"
            value={kod}
            onChangeText={setKod}
            placeholder="6 haneli kod"
            keyboardType="number-pad"
            maxLength={6}
          />
          <Dugme baslik="Doğrula" onPress={dogrula} bekliyor={bekliyor} />
        </>
      ) : (
        <Dugme baslik="Kod gönder" onPress={kodIste} bekliyor={bekliyor} />
      )}
    </Kutu>
  );
}

/* --------------------------------------------------------------------------
 * Parola
 * ----------------------------------------------------------------------- */

function ParolaKutusu() {
  const [mevcut, setMevcut] = useState("");
  const [yeni, setYeni] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [durum, setDurum] = useState<{ hata?: string; basari?: string }>({});
  const [bekliyor, setBekliyor] = useState(false);

  async function kaydet() {
    setBekliyor(true);
    setDurum({});
    try {
      const cevap = await uclar.parolaDegistir({
        /* Boşsa hiç gönderilmiyor: parolasız (Google) hesapta alan sorulmuyor. */
        ...(mevcut ? { mevcutParola: mevcut } : {}),
        yeniParola: yeni,
        yeniParolaTekrar: tekrar,
      });
      setDurum({ basari: cevap.basari });
      setMevcut("");
      setYeni("");
      setTekrar("");
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Parola değiştirilemedi." });
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <Kutu
      ikon="lock-outline"
      baslik="Parolanı değiştir"
      aciklama="Google ile giriş yaptıysan mevcut parola alanını boş bırak — burada ilk parolanı belirlemiş olursun."
      durum={durum}
    >
      <Alan
        etiket="Mevcut parola"
        value={mevcut}
        onChangeText={setMevcut}
        placeholder="Google ile girdiysen boş bırak"
        secureTextEntry
        autoCapitalize="none"
      />
      <Alan
        etiket="Yeni parola"
        value={yeni}
        onChangeText={setYeni}
        placeholder="En az 8 karakter"
        secureTextEntry
        autoCapitalize="none"
      />
      <Alan
        etiket="Yeni parola (tekrar)"
        value={tekrar}
        onChangeText={setTekrar}
        placeholder="Bir kez daha"
        secureTextEntry
        autoCapitalize="none"
      />
      <Dugme baslik="Parolayı kaydet" onPress={kaydet} bekliyor={bekliyor} />
    </Kutu>
  );
}

/* --------------------------------------------------------------------------
 * E-posta değişimi
 * ----------------------------------------------------------------------- */

function EpostaKutusu({ mevcut }: { mevcut: string }) {
  const { oturumaGec } = useOturum();

  const [adim, setAdim] = useState<"form" | "kod">("form");
  const [parola, setParola] = useState("");
  const [yeniEposta, setYeniEposta] = useState("");
  const [kod, setKod] = useState("");
  const [durum, setDurum] = useState<{ hata?: string; basari?: string }>({});
  const [bekliyor, setBekliyor] = useState(false);

  async function kodIste() {
    setBekliyor(true);
    setDurum({});
    try {
      const cevap = await uclar.epostaDegistir({ parola, yeniEposta: yeniEposta.trim() });
      setYeniEposta(cevap.eposta);
      setAdim("kod");
      setDurum({
        basari: cevap.postaGitmedi
          ? "Kod üretildi ama posta gönderilemedi."
          : `${cevap.eposta} adresine bir kod gönderdik. Kodu yazınca adresin değişecek.`,
      });
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Kod gönderilemedi." });
    } finally {
      setBekliyor(false);
    }
  }

  async function onayla() {
    setBekliyor(true);
    setDurum({});
    try {
      const cevap = await uclar.epostaOnayla({ eposta: yeniEposta, kod: kod.trim() });
      /* Yeni jeton çifti geldi: eski adrese yazılmış jeton artık geçersiz. */
      await oturumaGec(cevap);
      setAdim("form");
      setParola("");
      setKod("");
      setDurum({
        basari:
          `Adresin ${cevap.kullanici.eposta} olarak değişti.` +
          (cevap.tasinanSiparis > 0
            ? ` ${cevap.tasinanSiparis} siparişin de yeni adresine taşındı.`
            : ""),
      });
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Adres değiştirilemedi." });
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <Kutu
      ikon="email-edit-outline"
      baslik="E-posta adresini değiştir"
      aciklama={`Şu anki adresin ${mevcut}. Yeni adrese bir kod göndereceğiz; kodu yazana kadar adresin değişmiyor.`}
      durum={durum}
    >
      {adim === "form" ? (
        <>
          <Alan
            etiket="Parolan"
            value={parola}
            onChangeText={setParola}
            placeholder="Mevcut parolan"
            secureTextEntry
            autoCapitalize="none"
          />
          <Alan
            etiket="Yeni e-posta"
            value={yeniEposta}
            onChangeText={setYeniEposta}
            placeholder="yeni@eposta.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Dugme baslik="Kod gönder" onPress={kodIste} bekliyor={bekliyor} />
        </>
      ) : (
        <>
          <Alan
            etiket="Gelen kod"
            value={kod}
            onChangeText={setKod}
            placeholder="6 haneli kod"
            keyboardType="number-pad"
            maxLength={6}
          />
          <Dugme baslik="Adresi değiştir" onPress={onayla} bekliyor={bekliyor} />
          <Dugme baslik="Vazgeç" tur="ikincil" onPress={() => setAdim("form")} />
        </>
      )}
    </Kutu>
  );
}

/* --------------------------------------------------------------------------
 * Ortak kutu
 * ----------------------------------------------------------------------- */

/** Üç ayarın da aynı kabuğu: başlık, açıklama, alanlar, sonuç satırı. */
function Kutu({
  ikon,
  baslik,
  aciklama,
  durum,
  children,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  aciklama: string;
  durum: { hata?: string; basari?: string };
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        borderRadius: yaricap["2xl"],
        borderWidth: 1,
        borderColor: renk.cizgi,
        padding: bosluk.lg,
        gap: bosluk.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <MaterialCommunityIcons name={ikon} size={20} color={renk.sari[600]} />
        <Metin baslik boyut="lg">
          {baslik}
        </Metin>
      </View>

      <Metin boyut="2xs" renkli={renk.metinIkincil}>
        {aciklama}
      </Metin>

      {children}

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
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Profil fotoğrafı
 * ----------------------------------------------------------------------- */

/**
 * PROFİL FOTOĞRAFI — hesabın yüzü.
 *
 * TELEFONDAN YÜKLEMEK ASIL YOL: fotoğraf zaten telefonda. Web'de aynı işi
 * yapmak için dosyayı bilgisayara aktarmak gerekiyordu ve profillerin çoğu
 * bu yüzden fotoğrafsız kalmıştı.
 *
 * ZORUNLU DEĞİL: fotoğrafı olmayan hesap baş harfleriyle görünüyor ve hiçbir
 * ekran bozulmuyor. Yüzünü koymak istemeyen ev hanımı mutfağından kare
 * ekleyerek de kendini gösterebiliyor (bkz. mutfak-profili).
 */
function FotografKutusu({ ad, fotografUrl }: { ad: string; fotografUrl?: string }) {
  const { tazele } = useOturum();
  const [durum, setDurum] = useState<{ hata?: string; basari?: string }>({});
  const [bekliyor, setBekliyor] = useState(false);

  const harfler = ad
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toLocaleUpperCase("tr-TR");

  async function sec() {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      setDurum({ hata: "Galeri izni verilmedi. İzni ayarlardan açabilirsin." });
      return;
    }

    const secim = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      /* Avatar daire içinde kırpılıyor; seçim de kare olsun. */
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (secim.canceled || !secim.assets[0]) return;

    const dosya = secim.assets[0];
    setBekliyor(true);
    setDurum({});
    try {
      await uclar.fotografYukle({
        uri: dosya.uri,
        ad: dosya.fileName ?? `profil-${Date.now()}.jpg`,
        tur: dosya.mimeType ?? "image/jpeg",
      });
      /* Oturumdaki kullanıcı bilgisi tazeleniyor: avatar her ekranda değişsin. */
      await tazele();
      setDurum({ basari: "Fotoğrafın güncellendi." });
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Fotoğraf yüklenemedi." });
    } finally {
      setBekliyor(false);
    }
  }

  async function kaldir() {
    setBekliyor(true);
    setDurum({});
    try {
      await uclar.fotografSil();
      await tazele();
      setDurum({ basari: "Fotoğrafın kaldırıldı." });
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Fotoğraf kaldırılamadı." });
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <Kutu
      ikon="account-circle-outline"
      baslik="Profil fotoğrafın"
      aciklama="Zorunlu değil; fotoğrafın yoksa adının baş harfleri görünüyor."
      durum={durum}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.lg }}>
        {fotografUrl ? (
          <Image
            source={{ uri: fotografUrl }}
            style={{ width: 64, height: 64, borderRadius: yaricap.tam }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: yaricap.tam,
              backgroundColor: renk.sari[500],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Metin baslik boyut="xl" renkli={renk.murekkep}>
              {harfler || "?"}
            </Metin>
          </View>
        )}

        <View style={{ flex: 1, gap: bosluk.xs }}>
          <Dugme
            baslik={fotografUrl ? "Değiştir" : "Fotoğraf seç"}
            onPress={sec}
            bekliyor={bekliyor}
            tamGenislik
          />
          {fotografUrl ? (
            <Dugme baslik="Kaldır" tur="sade" onPress={kaldir} tamGenislik />
          ) : null}
        </View>
      </View>
    </Kutu>
  );
}
