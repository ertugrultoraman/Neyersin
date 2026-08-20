import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  durumRengi,
  renk,
  siparis as siparisUclari,
  TESLIMAT_ADIMLARI,
  yaricap,
  yazi,
  yaziAilesi,
  type SiparisDetayDto,
  type SiparisDurumu,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = siparisUclari(api);

/**
 * Akış adımları, `SiparisDurumu` olarak genişletilmiş hâlde.
 *
 * `TESLIMAT_ADIMLARI` mobil tarafta `as const` — yani salt okunur bir demet ve
 * üyeleri dört durumla sınırlı. `includes`/`indexOf` çağrılarında TypeScript
 * argümanı o dört değere daraltıyor, oysa elimizdeki durum yedi değerden biri
 * olabiliyor ("bu durum akışta mı" sorusunun anlamı zaten bu).
 */
const AKIS: readonly SiparisDurumu[] = TESLIMAT_ADIMLARI;

const DURUM_ADI: Record<SiparisDurumu, string> = {
  "odeme-bekliyor": "Ödeme bekleniyor",
  odendi: "Sipariş alındı",
  hazir: "Hazır, kurye bekleniyor",
  yolda: "Kurye yolda",
  "teslim-edildi": "Teslim edildi",
  "odeme-basarisiz": "Ödeme alınamadı",
  iptal: "İptal edildi",
};

/**
 * SİPARİŞ TAKİBİ.
 *
 * Ödeme sonrası buraya geliniyor. Kart ödemesinde tarayıcıdan dönmek ödemenin
 * BAŞARILI olduğu anlamına gelmiyor — sonucu iyzico'nun callback'i sunucuda
 * belirliyor. Bu yüzden ekran durumu sunucudan okuyor ve kullanıcı aşağı
 * çekerek tazeleyebiliyor.
 *
 * Otomatik yoklama (polling) HENÜZ YOK: canlı takip işine gelindiğinde kurye
 * konumuyla birlikte tek bir yoklama döngüsü kurulacak. Şimdi eklemek, birkaç
 * gün sonra sökülecek ikinci bir zamanlayıcı demek olurdu.
 */
export default function SiparisTakibi() {
  const { no } = useLocalSearchParams<{ no: string }>();
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const [iptalEdiliyor, setIptalEdiliyor] = useState(false);

  const detay = useVeri(() => uclar.detay(no), no);

  async function iptalEt() {
    setIptalEdiliyor(true);
    try {
      await uclar.iptal(no);
      detay.tazele();
    } catch (e) {
      Alert.alert(
        "İptal edilemedi",
        e instanceof ApiHatasi ? e.message : "Bağlantını kontrol edip tekrar dene.",
      );
    } finally {
      setIptalEdiliyor(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz, paddingTop: kenar.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.md,
          paddingHorizontal: bosluk.lg,
          paddingVertical: bosluk.md,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri"
          onPress={() => (yonlendir.canGoBack() ? yonlendir.back() : yonlendir.replace("/"))}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={renk.kahve[900]} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Metin baslik boyut="xl">
            Siparişin
          </Metin>
          <Metin boyut="xs" renkli={renk.metinIkincil}>
            {no}
          </Metin>
        </View>
      </View>

      {detay.yukleniyor ? (
        <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk["2xl"] }} />
      ) : !detay.veri ? (
        <View style={{ padding: bosluk.xl, alignItems: "center", gap: bosluk.md }}>
          <MaterialCommunityIcons name="receipt" size={40} color={renk.kahve[300]} />
          <Metin baslik boyut="lg" ortala>
            Sipariş bulunamadı
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
            {detay.hata?.message ?? "Bu sipariş sana ait değil ya da kaldırılmış."}
          </Metin>
          <Dugme baslik="Tekrar dene" tur="ikincil" onPress={detay.tazele} />
        </View>
      ) : (
        <Icerik
          detay={detay.veri}
          altBosluk={kenar.bottom}
          iptalEdiliyor={iptalEdiliyor}
          iptalEt={iptalEt}
          tazele={detay.tazele}
          tazeleniyor={detay.tazeleniyor}
        />
      )}
    </View>
  );
}

function Icerik({
  detay,
  altBosluk,
  iptalEdiliyor,
  iptalEt,
  tazele,
  tazeleniyor,
}: {
  detay: SiparisDetayDto;
  altBosluk: number;
  iptalEdiliyor: boolean;
  iptalEt: () => void;
  tazele: () => void;
  tazeleniyor: boolean;
}) {
  /*
   * İptal düğmesi yalnızca "ödeme bekliyor" durumunda görünüyor — bu, sunucudaki
   * `musteriIptalEdebilirMi` ile aynı kural. Sunucu son sözü söylüyor; buradaki
   * gizleme yalnızca dokunup ret almayı önlemek için.
   */
  const iptalEdilebilir = detay.durum === "odeme-bekliyor";
  const akista = AKIS.includes(detay.durum);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: bosluk.lg,
        paddingBottom: altBosluk + bosluk["3xl"],
        gap: bosluk.lg,
      }}
    >
      <View
        style={{
          padding: bosluk.lg,
          borderRadius: yaricap.xl,
          backgroundColor: `${durumRengi[detay.durum]}1A`,
          gap: bosluk.xs,
        }}
      >
        <Metin baslik boyut="lg" renkli={durumRengi[detay.durum]}>
          {DURUM_ADI[detay.durum]}
        </Metin>
        <Metin boyut="sm" renkli={renk.kahve[700]}>
          {detay.restoranAdi}
        </Metin>
      </View>

      {akista ? <Adimlar durum={detay.durum} /> : null}

      <Bolum baslik="Sipariş">
        {detay.kalemler.map((k) => (
          <View
            key={k.satirId}
            style={{ flexDirection: "row", justifyContent: "space-between", gap: bosluk.md }}
          >
            <Metin boyut="sm" style={{ flex: 1 }}>
              {k.adet} × {k.ad}
            </Metin>
            <Metin boyut="sm" agirlik="orta">
              {(k.fiyat + (k.ekstralar?.reduce((t, e) => t + e.fiyat, 0) ?? 0)) * k.adet} ₺
            </Metin>
          </View>
        ))}

        <View style={{ height: 1, backgroundColor: renk.cizgi, marginVertical: bosluk.xs }} />

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Teslimat
          </Metin>
          <Metin boyut="sm">
            {detay.tutarlar.teslimatUcreti === 0
              ? "Ücretsiz"
              : `${detay.tutarlar.teslimatUcreti} ₺`}
          </Metin>
        </View>
        {detay.tutarlar.indirim > 0 ? (
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Metin boyut="sm" renkli={renk.metinIkincil}>
              İndirim {detay.tutarlar.kuponKodu ? `(${detay.tutarlar.kuponKodu})` : ""}
            </Metin>
            <Metin boyut="sm" renkli={renk.naneKoyu}>
              -{detay.tutarlar.indirim} ₺
            </Metin>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Metin baslik boyut="md">
            Toplam
          </Metin>
          <Metin baslik boyut="md">
            {detay.tutarlar.toplam} ₺
          </Metin>
        </View>
        <Metin boyut="xs" renkli={renk.metinIkincil}>
          {detay.odemeYontemi === "iyzico" ? "Kartla ödendi" : "Kapıda ödeme"}
        </Metin>
      </Bolum>

      <Bolum baslik="Teslimat adresi">
        <Metin boyut="sm">
          {detay.adres.mahalle}, {detay.adres.acikAdres}
        </Metin>
        <Metin boyut="sm">
          No: {detay.adres.binaNo}
          {detay.adres.daireNo ? ` / ${detay.adres.daireNo}` : ""} · {detay.adres.ilce}
        </Metin>
        {detay.adres.tarif ? (
          <Metin boyut="xs" renkli={renk.metinIkincil}>
            {detay.adres.tarif}
          </Metin>
        ) : null}
      </Bolum>

      {detay.not ? (
        <Bolum baslik="Notun">
          <Metin boyut="sm">{detay.not}</Metin>
        </Bolum>
      ) : null}

      {/*
        DEĞERLENDİRME — yalnızca teslim edilmiş ve henüz yorumlanmamış
        siparişte (sunucu `yorumlanabilir` diyor). Web'de bu form hesabım
        sayfasındaki sipariş listesinde duruyor; uygulamada siparişin kendi
        ekranında, çünkü kişi buraya zaten "ne oldu" diye bakmaya geliyor.
      */}
      {detay.yorumlanabilir ? (
        <YorumFormu siparisNo={detay.siparisNo} tazele={tazele} />
      ) : null}

      <Dugme
        baslik="Durumu yenile"
        tur="ikincil"
        onPress={tazele}
        bekliyor={tazeleniyor}
        tamGenislik
      />

      {iptalEdilebilir ? (
        <Dugme
          baslik="Siparişi iptal et"
          tur="sade"
          bekliyor={iptalEdiliyor}
          tamGenislik
          onPress={() =>
            Alert.alert("Siparişi iptal et", "Bu siparişi iptal etmek istediğine emin misin?", [
              { text: "Vazgeç", style: "cancel" },
              { text: "İptal et", style: "destructive", onPress: iptalEt },
            ])
          }
        />
      ) : null}
    </ScrollView>
  );
}

/** Teslimat akışının görünür adımları. */
function Adimlar({ durum }: { durum: SiparisDurumu }) {
  const suAn = AKIS.indexOf(durum);

  return (
    <View style={{ gap: bosluk.md }}>
      {AKIS.map((adim, sira) => {
        const gecildi = sira <= suAn;
        return (
          <View key={adim} style={{ flexDirection: "row", alignItems: "center", gap: bosluk.md }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: yaricap.tam,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: gecildi ? renk.sari[500] : renk.kahve[100],
              }}
            >
              <MaterialCommunityIcons
                name={gecildi ? "check" : "circle-small"}
                size={gecildi ? 16 : 20}
                color={gecildi ? renk.murekkep : renk.kahve[300]}
              />
            </View>
            <Metin
              boyut="sm"
              agirlik={sira === suAn ? "kalin" : "normal"}
              renkli={gecildi ? renk.metin : renk.metinIkincil}
            >
              {DURUM_ADI[adim]}
            </Metin>
          </View>
        );
      })}
    </View>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        gap: bosluk.xs,
      }}
    >
      <Metin baslik boyut="md" style={{ marginBottom: bosluk.xs }}>
        {baslik}
      </Metin>
      {children}
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Değerlendirme formu
 * ----------------------------------------------------------------------- */

/**
 * SİPARİŞ DEĞERLENDİRMESİ — üç eksen ve isteğe bağlı bir cümle.
 *
 * ÜÇ AYRI PUAN, tek yıldız değil: "yemek güzeldi ama soğuk geldi" tek sayıya
 * sıkıştırılınca ne mutfak ne kurye ne yanlış yaptığını öğreniyor. Web'deki
 * form da aynı üç başlığı soruyor (sıcaklık, teslimat hızı, tad).
 *
 * METİN İSTEĞE BAĞLI: zorunlu olsaydı çoğu kişi hiç puan vermezdi. Yalnızca
 * yıldız verilmiş yorumlar da mutfağın ortalamasına giriyor; profilde
 * alıntılanacak söz ise metni olanlardan seçiliyor.
 */
function YorumFormu({ siparisNo, tazele }: { siparisNo: string; tazele: () => void }) {
  const [sicaklik, setSicaklik] = useState(0);
  const [teslimatHizi, setTeslimatHizi] = useState(0);
  const [tad, setTad] = useState(0);
  const [metin, setMetin] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  const eksik = !sicaklik || !teslimatHizi || !tad;

  async function gonder() {
    setBekliyor(true);
    setHata(null);
    try {
      const cevap = await uclar.yorumYaz(siparisNo, {
        sicaklik,
        teslimatHizi,
        tad,
        ...(metin.trim() ? { metin: metin.trim() } : {}),
      });
      setBasari(cevap.basari);
      /* Sunucu artık `yorumlanabilir: false` diyecek; form kendiliğinden kapanıyor. */
      tazele();
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Değerlendirme gönderilemedi.");
    } finally {
      setBekliyor(false);
    }
  }

  if (basari) {
    return (
      <View
        style={{
          padding: bosluk.lg,
          borderRadius: yaricap.xl,
          backgroundColor: `${renk.nane}1A`,
        }}
      >
        <Metin boyut="sm" agirlik="kalin" renkli={renk.naneKoyu}>
          {basari}
        </Metin>
      </View>
    );
  }

  return (
    <View
      style={{
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        gap: bosluk.md,
      }}
    >
      <View style={{ gap: 2 }}>
        <Metin baslik boyut="lg">
          Nasıldı?
        </Metin>
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          Puanın mutfağın sayfasında görünüyor. Bir cümle yazarsan başkalarının kararına da
          yardım etmiş olursun.
        </Metin>
      </View>

      <PuanSatiri etiket="Sıcaklık" deger={sicaklik} setDeger={setSicaklik} />
      <PuanSatiri etiket="Teslimat hızı" deger={teslimatHizi} setDeger={setTeslimatHizi} />
      <PuanSatiri etiket="Tad" deger={tad} setDeger={setTad} />

      <TextInput
        value={metin}
        onChangeText={setMetin}
        placeholder="İstersen birkaç kelime yaz (isteğe bağlı)"
        placeholderTextColor={renk.kahve[300]}
        multiline
        maxLength={1000}
        style={{
          minHeight: 90,
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
        baslik={eksik ? "Üç başlığı da puanla" : "Değerlendirmeyi gönder"}
        onPress={gonder}
        bekliyor={bekliyor}
        pasif={eksik}
        tamGenislik
      />
    </View>
  );
}

/** Tek eksenin beş yıldızı. Dokunulan yıldıza kadar hepsi doluyor. */
function PuanSatiri({
  etiket,
  deger,
  setDeger,
}: {
  etiket: string;
  deger: number;
  setDeger: (p: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Metin boyut="sm" agirlik="orta">
        {etiket}
      </Metin>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${etiket} ${n} yıldız`}
            onPress={() => setDeger(n)}
            hitSlop={4}
          >
            <MaterialCommunityIcons
              name={n <= deger ? "star" : "star-outline"}
              size={26}
              color={n <= deger ? renk.sari[600] : renk.kahve[300]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
