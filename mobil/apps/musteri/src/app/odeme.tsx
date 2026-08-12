import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
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
  katalog,
  renk,
  siparis as siparisUclari,
  yaricap,
  type OdemeYontemi,
} from "ortak";
import { useOturum } from "ortak/oturum";
import { Alan, Bosluk, Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { adresOku, adresYaz, BOS_ADRES, type KayitliAdres } from "@/sepet/adres";
import { useSepet } from "@/sepet/Baglam";

const uclar = siparisUclari(api);
const katalogUclari = katalog(api);

/**
 * ÖDEME ADIMI — adres, ödeme yöntemi ve siparişin gönderilmesi.
 *
 * Bu ekran da tutar HESAPLAMIYOR; sepet özetinden geleni gösteriyor. Doğrulama
 * da burada tekrarlanmıyor: alan kuralları (`siparisDogrula`) sunucuda ve
 * hatalar `alanlar` sözlüğüyle geri geliyor. İstemciye kopyalansaydı iki kural
 * seti ayrışır, kullanıcı formu geçip sunucudan ret alırdı.
 *
 * Tek istisna "boş mu" kontrolü: düğmeyi boş formda pasif tutmak, kullanıcıyı
 * bariz bir hata için sunucuya gidip gelmeye zorlamamak demek.
 */
export default function OdemeEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const { durum } = useOturum();
  const { restoranSlug, restoranAdi, kalemler, ozet, kuponKodu, temizle } = useSepet();

  const [adres, setAdres] = useState<KayitliAdres>(BOS_ADRES);
  const [yontem, setYontem] = useState<OdemeYontemi>("havale");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [alanHatalari, setAlanHatalari] = useState<Record<string, string>>({});
  const [genelHata, setGenelHata] = useState<string | null>(null);

  /* Teslimat bölgeleri mutfaktan geliyor; ilçe seçimi ona göre kısıtlanıyor. */
  const mutfak = useVeri(
    () => katalogUclari.restoran(restoranSlug ?? ""),
    restoranSlug ?? "",
  );

  useEffect(() => {
    (async () => {
      const kayitli = await adresOku();
      setAdres({
        ...BOS_ADRES,
        ...kayitli,
        /*
         * Ad ve telefon hesaptan geliyor; kayıtlı adres varsa o kazanıyor.
         * Kişi teslimatı başkasının adına yaptırıyor olabilir.
         */
        adSoyad: kayitli?.adSoyad || (durum.asama === "girisli" ? durum.kullanici.ad : ""),
        telefon:
          kayitli?.telefon || (durum.asama === "girisli" ? (durum.kullanici.telefon ?? "") : ""),
      });
    })();
  }, [durum]);

  const bolgeler = mutfak.veri?.teslimatBolgeleri ?? [];

  /* Tek teslimat bölgesi varsa seçtirmeye gerek yok. */
  useEffect(() => {
    if (bolgeler.length === 1 && !adres.ilce) {
      setAdres((o) => ({ ...o, ilce: bolgeler[0] }));
    }
  }, [bolgeler, adres.ilce]);

  const doluMu =
    adres.adSoyad.trim().length > 0 &&
    adres.telefon.trim().length > 0 &&
    adres.ilce.length > 0 &&
    adres.mahalle.trim().length > 0 &&
    adres.acikAdres.trim().length > 0 &&
    adres.binaNo.trim().length > 0;

  async function gonder() {
    if (!restoranSlug || kalemler.length === 0) return;

    setGonderiliyor(true);
    setAlanHatalari({});
    setGenelHata(null);

    try {
      const sonuc = await uclar.olustur({
        restoranSlug,
        kalemler: kalemler.map((k) => ({
          urunId: k.urunId,
          adet: k.adet,
          ...(k.ekstraIdler ? { ekstraIdler: k.ekstraIdler } : {}),
        })),
        musteri: { adSoyad: adres.adSoyad.trim(), telefon: adres.telefon.trim() },
        adres: {
          ilce: adres.ilce,
          mahalle: adres.mahalle.trim(),
          acikAdres: adres.acikAdres.trim(),
          binaNo: adres.binaNo.trim(),
          daireNo: adres.daireNo.trim(),
          tarif: adres.tarif.trim(),
        },
        ...(kuponKodu ? { kuponKodu } : {}),
        odemeYontemi: yontem,
      });

      await adresYaz(adres);

      if (sonuc.odemeUrl) {
        /*
         * KART BİLGİSİ UYGULAMAYA HİÇ GİRMİYOR. iyzico'nun kendi sayfası
         * tarayıcı katmanında açılıyor; böylece PCI kapsamı sağlayıcıda
         * kalıyor ve kart alanları bizim koda hiç uğramıyor.
         *
         * `openBrowserAsync` kullanıcı sekmeyi kapattığında dönüyor — ödemenin
         * BAŞARILI olduğu anlamına GELMİYOR. Sonuç sunucuda, iyzico'nun
         * callback'iyle belirleniyor; uygulama siparişin durumunu takip
         * ekranından okuyor.
         */
        await WebBrowser.openBrowserAsync(sonuc.odemeUrl);
      }

      /*
       * Sepet ancak sipariş KAYDEDİLDİKTEN sonra boşalıyor. Gönderimden önce
       * boşaltılsaydı, ağ hatasında kullanıcı hem siparişsiz hem sepetsiz
       * kalırdı.
       */
      temizle();
      yonlendir.replace(`/siparis/${sonuc.siparisNo}`);
    } catch (e) {
      if (e instanceof ApiHatasi) {
        setAlanHatalari(e.alanlar ?? {});
        /*
         * `alanlar` doluysa hatalar zaten alanların altında; üstte ayrıca
         * genel bir metin göstermek aynı şeyi iki kez söylemek olurdu.
         * Yalnızca forma bağlanamayan hatalar (kapalı mutfak, kart
         * sağlayıcısı) üste yazılıyor.
         */
        const alanDisi = !e.alanlar || Object.keys(e.alanlar).length === 0;
        if (alanDisi || e.alanlar?.restoran || e.alanlar?.odeme || e.alanlar?.minSepet) {
          setGenelHata(e.message);
        }
      } else {
        setGenelHata("Sipariş gönderilemedi. Bağlantını kontrol edip tekrar dene.");
      }
    } finally {
      setGonderiliyor(false);
    }
  }

  if (!restoranSlug || kalemler.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: renk.beyaz, paddingTop: kenar.top }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Baslik yonlendir={yonlendir} />
        <View style={{ padding: bosluk.xl, alignItems: "center", gap: bosluk.md }}>
          <Metin baslik boyut="lg" ortala>
            Sepetin boş
          </Metin>
          <Dugme baslik="Mutfaklara bak" onPress={() => yonlendir.replace("/")} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz, paddingTop: kenar.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Baslik yonlendir={yonlendir} altBaslik={restoranAdi ?? undefined} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: bosluk.lg,
          paddingBottom: kenar.bottom + bosluk["3xl"],
          gap: bosluk.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {genelHata ? (
          <View
            accessibilityRole="alert"
            style={{
              backgroundColor: `${renk.domates}1A`,
              borderRadius: yaricap.lg,
              padding: bosluk.md,
            }}
          >
            <Metin boyut="sm" agirlik="orta" renkli={renk.domatesKoyu}>
              {genelHata}
            </Metin>
          </View>
        ) : null}

        <Metin baslik boyut="lg">
          Teslimat adresi
        </Metin>

        <Alan
          etiket="Ad soyad"
          value={adres.adSoyad}
          onChangeText={(d) => setAdres((o) => ({ ...o, adSoyad: d }))}
          hata={alanHatalari.adSoyad}
          autoComplete="name"
          editable={!gonderiliyor}
        />

        <Alan
          etiket="Telefon"
          value={adres.telefon}
          onChangeText={(d) => setAdres((o) => ({ ...o, telefon: d }))}
          hata={alanHatalari.telefon}
          placeholder="05XX XXX XX XX"
          keyboardType="phone-pad"
          autoComplete="tel"
          editable={!gonderiliyor}
        />

        <IlceSecimi
          bolgeler={bolgeler}
          secili={adres.ilce}
          sec={(d) => setAdres((o) => ({ ...o, ilce: d }))}
          hata={alanHatalari.ilce}
          yukleniyor={mutfak.yukleniyor}
        />

        <Alan
          etiket="Mahalle"
          value={adres.mahalle}
          onChangeText={(d) => setAdres((o) => ({ ...o, mahalle: d }))}
          hata={alanHatalari.mahalle}
          editable={!gonderiliyor}
        />

        <Alan
          etiket="Açık adres"
          value={adres.acikAdres}
          onChangeText={(d) => setAdres((o) => ({ ...o, acikAdres: d }))}
          hata={alanHatalari.acikAdres}
          placeholder="Cadde, sokak, site adı"
          multiline
          numberOfLines={2}
          editable={!gonderiliyor}
        />

        <View style={{ flexDirection: "row", gap: bosluk.md }}>
          <View style={{ flex: 1 }}>
            <Alan
              etiket="Bina no"
              value={adres.binaNo}
              onChangeText={(d) => setAdres((o) => ({ ...o, binaNo: d }))}
              hata={alanHatalari.binaNo}
              editable={!gonderiliyor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Alan
              etiket="Daire no"
              value={adres.daireNo}
              onChangeText={(d) => setAdres((o) => ({ ...o, daireNo: d }))}
              editable={!gonderiliyor}
            />
          </View>
        </View>

        <Alan
          etiket="Kurye için tarif"
          value={adres.tarif}
          onChangeText={(d) => setAdres((o) => ({ ...o, tarif: d }))}
          placeholder="Zili çalışmıyor, arayın"
          editable={!gonderiliyor}
        />

        <Bosluk y={bosluk.sm} />

        <Metin baslik boyut="lg">
          Ödeme yöntemi
        </Metin>

        <YontemSecimi secili={yontem} sec={setYontem} pasif={gonderiliyor} />

        {ozet ? (
          <View
            style={{
              padding: bosluk.lg,
              borderRadius: yaricap.xl,
              backgroundColor: renk.krem,
              gap: bosluk.xs,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Metin boyut="sm" renkli={renk.metinIkincil}>
                {ozet.kalemler.reduce((t, k) => t + k.adet, 0)} ürün
              </Metin>
              <Metin boyut="sm" renkli={renk.metinIkincil}>
                {ozet.tutarlar.araToplam} ₺
              </Metin>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Metin baslik boyut="lg">
                Ödenecek
              </Metin>
              <Metin baslik boyut="lg">
                {ozet.tutarlar.toplam} ₺
              </Metin>
            </View>
          </View>
        ) : null}

        <Dugme
          baslik={yontem === "iyzico" ? "Kartla öde" : "Siparişi ver"}
          onPress={() => {
            if (yontem === "havale") {
              Alert.alert(
                "Kapıda ödeme",
                `Sipariş tutarını (${ozet?.tutarlar.toplam ?? "-"} ₺) kuryeye teslimatta ödeyeceksin. Onaylıyor musun?`,
                [
                  { text: "Vazgeç", style: "cancel" },
                  { text: "Siparişi ver", onPress: gonder },
                ],
              );
            } else {
              void gonder();
            }
          }}
          bekliyor={gonderiliyor}
          pasif={!doluMu || !ozet?.tutarlar.minSepetKarsilandi}
          tamGenislik
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Baslik({
  yonlendir,
  altBaslik,
}: {
  yonlendir: ReturnType<typeof useRouter>;
  altBaslik?: string;
}) {
  return (
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
        onPress={() => yonlendir.back()}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color={renk.kahve[900]} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Metin baslik boyut="xl">
          Ödeme
        </Metin>
        {altBaslik ? (
          <Metin boyut="xs" renkli={renk.metinIkincil} numberOfLines={1}>
            {altBaslik}
          </Metin>
        ) : null}
      </View>
    </View>
  );
}

/**
 * İlçe seçimi.
 *
 * Serbest metin DEĞİL: mutfağın teslimat yaptığı ilçeler sunucudan geliyor ve
 * yalnızca onlar seçilebiliyor. Elle yazdırılsaydı kullanıcı teslimat
 * yapılmayan bir ilçeyi yazıp formu doldurduktan sonra ret alırdı.
 */
function IlceSecimi({
  bolgeler,
  secili,
  sec,
  hata,
  yukleniyor,
}: {
  bolgeler: string[];
  secili: string;
  sec: (ilce: string) => void;
  hata?: string;
  yukleniyor: boolean;
}) {
  return (
    <View style={{ gap: bosluk.xs }}>
      <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[700]} style={{ letterSpacing: 0.4 }}>
        İLÇE
      </Metin>

      {yukleniyor ? (
        <Metin boyut="sm" renkli={renk.metinIkincil}>
          Teslimat bölgeleri yükleniyor…
        </Metin>
      ) : bolgeler.length === 0 ? (
        <Metin boyut="sm" renkli={renk.domatesKoyu}>
          Bu mutfağın teslimat bölgesi okunamadı.
        </Metin>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.sm }}>
          {bolgeler.map((ilce) => {
            const aktif = secili === ilce;
            return (
              <Pressable
                key={ilce}
                accessibilityRole="button"
                accessibilityState={{ selected: aktif }}
                onPress={() => sec(ilce)}
                style={{
                  paddingHorizontal: bosluk.lg,
                  paddingVertical: bosluk.md,
                  borderRadius: yaricap.tam,
                  backgroundColor: aktif ? renk.sari[500] : renk.krem,
                  borderWidth: 1,
                  borderColor: aktif ? renk.sari[500] : renk.cizgi,
                }}
              >
                <Metin
                  boyut="sm"
                  agirlik="orta"
                  renkli={aktif ? renk.murekkep : renk.kahve[700]}
                >
                  {ilce}
                </Metin>
              </Pressable>
            );
          })}
        </View>
      )}

      {hata ? (
        <Metin boyut="xs" agirlik="orta" renkli={renk.domatesKoyu}>
          {hata}
        </Metin>
      ) : null}
    </View>
  );
}

function YontemSecimi({
  secili,
  sec,
  pasif,
}: {
  secili: OdemeYontemi;
  sec: (y: OdemeYontemi) => void;
  pasif: boolean;
}) {
  const secenekler: { deger: OdemeYontemi; baslik: string; aciklama: string; ikon: string }[] = [
    {
      deger: "havale",
      baslik: "Kapıda ödeme",
      aciklama: "Nakit ya da kart, teslimatta kuryeye",
      ikon: "cash",
    },
    {
      deger: "iyzico",
      baslik: "Kartla öde",
      aciklama: "Güvenli ödeme sayfasında",
      ikon: "credit-card-outline",
    },
  ];

  return (
    <View style={{ gap: bosluk.sm }}>
      {secenekler.map((s) => {
        const aktif = secili === s.deger;
        return (
          <Pressable
            key={s.deger}
            accessibilityRole="radio"
            accessibilityState={{ selected: aktif, disabled: pasif }}
            disabled={pasif}
            onPress={() => sec(s.deger)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.md,
              padding: bosluk.lg,
              borderRadius: yaricap.xl,
              borderWidth: aktif ? 2 : 1,
              borderColor: aktif ? renk.sari[500] : renk.cizgi,
              backgroundColor: aktif ? `${renk.sari[500]}14` : renk.beyaz,
            }}
          >
            <MaterialCommunityIcons
              name={s.ikon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={22}
              color={aktif ? renk.sari[700] : renk.kahve[400]}
            />
            <View style={{ flex: 1 }}>
              <Metin boyut="md" agirlik="orta">
                {s.baslik}
              </Metin>
              <Metin boyut="xs" renkli={renk.metinIkincil}>
                {s.aciklama}
              </Metin>
            </View>
            <MaterialCommunityIcons
              name={aktif ? "radiobox-marked" : "radiobox-blank"}
              size={20}
              color={aktif ? renk.sari[600] : renk.kahve[300]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
