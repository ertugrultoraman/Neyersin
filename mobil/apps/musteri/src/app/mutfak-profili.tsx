import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  mutfak as mutfakUclari,
  renk,
  yaricap,
  type SefProfiliDto,
} from "ortak";
import { Alan, Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = mutfakUclari(api);

/** Web'deki panel ile aynı sınır (bkz. lib/mutfak-kare → AZAMI_KARE). */
const AZAMI_KARE = 6;

/**
 * MUTFAK PROFİLİ — "bunu kim pişiriyor" sorusunun cevabı.
 *
 * Web'deki panel profil formunun karşılığı, üstüne MUTFAKTAN KARELER.
 *
 * KARELERİN ASIL YERİ BURASI: fotoğraf zaten telefonda çekiliyor. Web'de aynı
 * işi yapmak için kişinin fotoğrafı önce bilgisayara aktarması gerekiyordu ve
 * ev hanımlarının çoğu bunu hiç yapmadı — dört profilin hiçbirinde tek bir
 * kare yoktu.
 *
 * EKSİK LİSTESİ FORMUN ÜSTÜNDE: altta olsaydı formu doldurup gönderen kişi
 * onu hiç görmezdi; asıl işi "daha doldurmadığın şeyler var" demek.
 */
export default function MutfakProfili() {
  const kenar = useSafeAreaInsets();
  const profil = useVeri(() => uclar.profil(), "mutfak-profil");

  if (profil.yukleniyor) {
    return (
      <View style={{ flex: 1, backgroundColor: renk.beyaz, justifyContent: "center" }}>
        <Stack.Screen options={{ title: "Mutfak profili" }} />
        <ActivityIndicator color={renk.sari[600]} />
      </View>
    );
  }

  if (!profil.veri) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: renk.beyaz,
          alignItems: "center",
          justifyContent: "center",
          gap: bosluk.md,
          padding: bosluk.xl,
        }}
      >
        <Stack.Screen options={{ title: "Mutfak profili" }} />
        <Metin baslik boyut="lg" ortala>
          Profil açılamadı
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
          {profil.hata?.message ?? "Bu hesaba bağlı bir mutfak bulunamadı."}
        </Metin>
        <Dugme baslik="Tekrar dene" tur="ikincil" onPress={profil.tazele} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Mutfak profili" }} />
      <Icerik veri={profil.veri} tazele={profil.tazele} altBosluk={kenar.bottom} ustBosluk={kenar.top} />
    </KeyboardAvoidingView>
  );
}

function Icerik({
  veri,
  tazele,
  ustBosluk,
  altBosluk,
}: {
  veri: SefProfiliDto;
  tazele: () => void;
  ustBosluk: number;
  altBosluk: number;
}) {
  const [slogan, setSlogan] = useState(veri.slogan ?? "");
  const [uzmanlik, setUzmanlik] = useState(veri.uzmanlik ?? "");
  const [biyografi, setBiyografi] = useState(veri.biyografi ?? "");
  const [sertifikalar, setSertifikalar] = useState(veri.sertifikalar ?? "");
  const [deneyimYili, setDeneyimYili] = useState(
    veri.deneyimYili ? String(veri.deneyimYili) : "",
  );
  const [memleket, setMemleket] = useState(veri.memleket ?? "");
  const [imzaYemegi, setImzaYemegi] = useState(veri.imzaYemegi ?? "");
  const [alimAdresi, setAlimAdresi] = useState(veri.alimAdresi ?? "");
  const [alimTelefonu, setAlimTelefonu] = useState(veri.alimTelefonu ?? "");

  const [galeri, setGaleri] = useState<string[]>(veri.galeri);
  const [durum, setDurum] = useState<{ hata?: string; basari?: string }>({});
  const [bekliyor, setBekliyor] = useState(false);
  const [kareIsleniyor, setKareIsleniyor] = useState(false);

  /* Sunucudan yeni veri geldiğinde (tazele) galeri yerinde güncelleniyor. */
  useEffect(() => setGaleri(veri.galeri), [veri.galeri]);

  const eksikler = [
    !veri.fotografVar && "Profil fotoğrafın",
    !deneyimYili && "Kaç yıldır pişirdiğin",
    !memleket.trim() && "Mutfağının nereli olduğu",
    !imzaYemegi.trim() && "İmza yemeğin",
    !biyografi.trim() && "Kendi hikâyen",
    galeri.length === 0 && "Mutfağından kareler",
  ].filter((e): e is string => Boolean(e));

  async function kaydet() {
    setBekliyor(true);
    setDurum({});
    try {
      const cevap = await uclar.profilKaydet({
        slogan: slogan.trim(),
        uzmanlik: uzmanlik.trim(),
        biyografi: biyografi.trim(),
        sertifikalar: sertifikalar.trim(),
        ...(Number(deneyimYili) ? { deneyimYili: Number(deneyimYili) } : {}),
        memleket: memleket.trim(),
        imzaYemegi: imzaYemegi.trim(),
        alimAdresi: alimAdresi.trim(),
        alimTelefonu: alimTelefonu.trim(),
      });
      setDurum({ basari: cevap.basari });
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Profil kaydedilemedi." });
    } finally {
      setBekliyor(false);
    }
  }

  async function kareEkle() {
    /*
     * İZİN ÖNCE SORULUYOR ve reddedilirse açıkça söyleniyor. Sessizce
     * kapanan bir seçici, kişiye uygulamanın bozuk olduğunu düşündürüyor.
     */
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert(
        "Galeri izni gerekiyor",
        "Mutfağından kare eklemek için galerine erişmemiz gerekiyor. İzni ayarlardan verebilirsin.",
      );
      return;
    }

    const secim = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      /* Kareler ızgarada kare olarak duruyor; kırpma ekranı da öyle olsun. */
      allowsEditing: true,
      aspect: [1, 1],
      /*
       * 0.7 KALİTE: telefon kamerası 8-12 MB dosya üretiyor ve sunucu sınırı
       * 4 MB. Kişiye "fotoğrafın çok büyük" demek yerine gönderirken küçültmek
       * daha doğru — ızgarada 160 pikselde görünen bir kare için fark yok.
       */
      quality: 0.7,
    });
    if (secim.canceled || !secim.assets[0]) return;

    const dosya = secim.assets[0];
    setKareIsleniyor(true);
    setDurum({});
    try {
      const cevap = await uclar.kareYukle({
        uri: dosya.uri,
        ad: dosya.fileName ?? `kare-${Date.now()}.jpg`,
        tur: dosya.mimeType ?? "image/jpeg",
      });
      setGaleri(cevap.galeri);
      setDurum({ basari: "Kare eklendi." });
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Fotoğraf yüklenemedi." });
    } finally {
      setKareIsleniyor(false);
    }
  }

  async function kareKaldir(url: string) {
    setKareIsleniyor(true);
    try {
      const cevap = await uclar.kareSil(url);
      setGaleri(cevap.galeri);
    } catch (e) {
      setDurum({ hata: e instanceof ApiHatasi ? e.message : "Kare kaldırılamadı." });
    } finally {
      setKareIsleniyor(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: ustBosluk + bosluk.xl,
        paddingHorizontal: bosluk.xl,
        paddingBottom: altBosluk + bosluk["3xl"],
        gap: bosluk.lg,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Metin baslik boyut="3xl">
          {veri.restoranAdi}
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil}>
          Müşteri sipariş vermeden önce en çok buraya bakıyor.
        </Metin>
      </View>

      {/* EKSİK LİSTESİ — eksiği ADIYLA söylüyor, yüzdeyle değil. */}
      {eksikler.length > 0 ? (
        <View
          style={{
            borderRadius: yaricap["2xl"],
            borderWidth: 1,
            borderColor: `${renk.sari[500]}66`,
            backgroundColor: `${renk.sari[500]}14`,
            padding: bosluk.lg,
            gap: bosluk.xs,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Metin baslik boyut="md">
              Profilini tamamla
            </Metin>
            <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[600]}>
              {6 - eksikler.length}/6
            </Metin>
          </View>
          {eksikler.map((e) => (
            <Metin key={e} boyut="2xs" renkli={renk.kahve[800]}>
              • {e}
            </Metin>
          ))}
          {!veri.fotografVar ? (
            <Metin boyut="2xs" renkli={renk.metinIkincil}>
              Profil fotoğrafını hesap ekranından ekleyebilirsin.
            </Metin>
          ) : null}
        </View>
      ) : (
        <View
          style={{
            borderRadius: yaricap["2xl"],
            backgroundColor: `${renk.nane}14`,
            padding: bosluk.lg,
          }}
        >
          <Metin boyut="sm" agirlik="kalin" renkli={renk.naneKoyu}>
            Profilin tamam. Müşteri seni tanıyarak sipariş veriyor.
          </Metin>
        </View>
      )}

      {/* MUTFAKTAN KARELER — formun üstünde, çünkü asıl eksik olan bu. */}
      <View style={{ gap: bosluk.sm }}>
        <View>
          <Metin baslik boyut="lg">
            Mutfağından
          </Metin>
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            Tencerenin başı, taze hamur, tezgâh… Yüzünü koymak istemiyorsan da bir yol: müşteri
            yemeğin nerede piştiğini görüyor. En fazla {AZAMI_KARE} kare.
          </Metin>
        </View>

        {galeri.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.xs }}>
            {galeri.map((kare) => (
              <View key={kare} style={{ width: "31.5%", gap: 4 }}>
                <Image
                  source={{ uri: kare }}
                  style={{
                    width: "100%",
                    aspectRatio: 1,
                    borderRadius: yaricap.lg,
                    backgroundColor: renk.kremKoyu,
                  }}
                  contentFit="cover"
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={kareIsleniyor}
                  onPress={() =>
                    Alert.alert("Kareyi kaldır", "Bu fotoğraf profilinden kaldırılsın mı?", [
                      { text: "Vazgeç", style: "cancel" },
                      {
                        text: "Kaldır",
                        style: "destructive",
                        onPress: () => kareKaldir(kare),
                      },
                    ])
                  }
                  style={{
                    borderRadius: yaricap.tam,
                    borderWidth: 1,
                    borderColor: `${renk.domates}4D`,
                    paddingVertical: 3,
                    alignItems: "center",
                  }}
                >
                  <Metin boyut="2xs" agirlik="kalin" renkli={renk.domatesKoyu}>
                    Kaldır
                  </Metin>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Kutu DOLUYSA yükleme düğmesi hiç çizilmiyor: gri bir düğme
            bırakmak, dokununca bir şey olacakmış izlenimi verirdi. */}
        {galeri.length >= AZAMI_KARE ? (
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.metinIkincil}>
            {AZAMI_KARE} karenin hepsi dolu. Yenisi için önce birini kaldır.
          </Metin>
        ) : (
          <Dugme
            baslik="Mutfağından bir kare ekle"
            tur="ikincil"
            onPress={kareEkle}
            bekliyor={kareIsleniyor}
            tamGenislik
          />
        )}
      </View>

      {/* KİŞİSEL ÜÇLÜ: kaç yıldır, nereli, imza yemeği. Üçü de tek satır —
          doldurması on saniye sürsün diye. */}
      <Alan
        etiket="Kaç yıldır pişiriyorsun?"
        value={deneyimYili}
        onChangeText={setDeneyimYili}
        placeholder="32"
        keyboardType="number-pad"
        maxLength={2}
      />

      <Alan
        etiket="Mutfağın nereli?"
        value={memleket}
        onChangeText={setMemleket}
        placeholder="Örn. Erzurum mutfağı"
        maxLength={80}
      />

      <Alan
        etiket="İmza yemeğin"
        value={imzaYemegi}
        onChangeText={setImzaYemegi}
        placeholder="Örn. Fırın mantı"
        maxLength={80}
      />

      <Alan
        etiket="Slogan"
        value={slogan}
        onChangeText={setSlogan}
        placeholder="Profilinin en üstünde tek satır"
        maxLength={120}
      />

      <Alan
        etiket="Uzmanlık"
        value={uzmanlik}
        onChangeText={setUzmanlik}
        placeholder="Neyi en iyi yapıyorsun?"
        maxLength={160}
      />

      <Alan
        etiket="Kendi hikâyen"
        value={biyografi}
        onChangeText={setBiyografi}
        placeholder="Nasıl başladın, kimden öğrendin?"
        multiline
        style={{ minHeight: 120, textAlignVertical: "top" }}
      />

      <Alan
        etiket="Sertifikalar"
        value={sertifikalar}
        onChangeText={setSertifikalar}
        placeholder="Varsa kurs, ustalık belgesi, hijyen eğitimi…"
        multiline
        style={{ minHeight: 80, textAlignVertical: "top" }}
      />

      {/*
        ALIM ADRESİ MÜŞTERİYE GÖSTERİLMİYOR. Ev hanımları kendi evinden
        pişiriyor; adresin herkese açık olması güvenlik sorunu olurdu.
        Yalnızca siparişi alan kurye görüyor.
      */}
      <View
        style={{
          borderRadius: yaricap["2xl"],
          borderWidth: 1,
          borderColor: renk.cizgi,
          padding: bosluk.lg,
          gap: bosluk.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.xs }}>
          <MaterialCommunityIcons name="lock-outline" size={16} color={renk.kahve[600]} />
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
            YALNIZCA KURYE GÖRÜR
          </Metin>
        </View>

        <Alan
          etiket="Alım adresi"
          value={alimAdresi}
          onChangeText={setAlimAdresi}
          placeholder="Mahalle, sokak, bina ve daire"
          multiline
          style={{ minHeight: 70, textAlignVertical: "top" }}
        />

        <Alan
          etiket="Alım telefonu"
          value={alimTelefonu}
          onChangeText={setAlimTelefonu}
          placeholder="05xx xxx xx xx"
          keyboardType="phone-pad"
          maxLength={20}
        />
      </View>

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

      <Dugme baslik="Profili kaydet" onPress={kaydet} bekliyor={bekliyor} tamGenislik />
      <Dugme baslik="Yenile" tur="ikincil" onPress={tazele} tamGenislik />
    </ScrollView>
  );
}
