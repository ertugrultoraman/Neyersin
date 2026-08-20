import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  mutfak as mutfakUclari,
  renk,
  yaricap,
  type MutfakBolumuDto,
  type MutfakUrunDto,
} from "ortak";
import { Alan, Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = mutfakUclari(api);

/**
 * MENÜ YÖNETİMİ — şefin kendi ürünlerini eklediği ekran.
 *
 * Web'deki panel "Ürün yönetimi" bölümünün karşılığı. Aynı kurallar geçerli
 * ve hepsi sunucuda: ad en az iki karakter, fiyat tavanı, ürünün gerçekten bu
 * mutfağa ait olması.
 *
 * FİYAT BOŞ BIRAKILABİLİR: 0 → menüde "fiyat yakında" görünüyor ama sepete
 * eklenemiyor. Uydurma bir fiyat yazmak yerine ürünün fiyatsız durması
 * tercih edildi — ev hanımı fiyatı sonra düşünebilsin.
 *
 * FOTOĞRAF BU EKRANDA YOK: dosya yükleme ayrı bir akış ve şimdilik siteden
 * yapılıyor. Ürünün geri kalanını telefondan girebilmek, fotoğrafı da
 * bekletmekten daha değerli.
 */
export default function MenuYonetimi() {
  const kenar = useSafeAreaInsets();
  const menu = useVeri(() => uclar.menu(), "mutfak-menu");

  const [duzenlenen, setDuzenlenen] = useState<MutfakUrunDto | null>(null);
  const [formAcik, setFormAcik] = useState(false);

  function formuAc(urun: MutfakUrunDto | null) {
    setDuzenlenen(urun);
    setFormAcik(true);
  }

  async function sil(urun: MutfakUrunDto) {
    try {
      await uclar.urunSil(urun.id);
      menu.tazele();
    } catch (e) {
      Alert.alert("Olmadı", e instanceof ApiHatasi ? e.message : "Ürün silinemedi.");
    }
  }

  const urunler = menu.veri?.urunler ?? [];
  const fiyatsiz = urunler.filter((u) => u.fiyat <= 0).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Menü" }} />

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
            Menün
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Kendi eklediğin ürünler. Müşteri bunları mutfak sayfanda görüyor.
          </Metin>
        </View>

        {/* Fiyatsız ürün uyarısı — web panelindeki uyarının aynısı. */}
        {fiyatsiz > 0 ? (
          <View
            style={{
              backgroundColor: `${renk.domates}14`,
              borderRadius: yaricap.lg,
              padding: bosluk.md,
            }}
          >
            <Metin boyut="2xs" renkli={renk.domatesKoyu}>
              {fiyatsiz} ürünün fiyatı girilmemiş. Menüde görünüyorlar ama sipariş
              edilemiyorlar.
            </Metin>
          </View>
        ) : null}

        {formAcik && menu.veri ? (
          <UrunFormu
            urun={duzenlenen}
            bolumler={menu.veri.bolumler}
            kapat={() => setFormAcik(false)}
            kaydedildi={() => {
              setFormAcik(false);
              menu.tazele();
            }}
          />
        ) : (
          <Dugme baslik="Yeni ürün ekle" onPress={() => formuAc(null)} tamGenislik />
        )}

        {menu.yukleniyor ? (
          <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk.xl }} />
        ) : urunler.length === 0 ? (
          <Metin boyut="sm" renkli={renk.metinIkincil} ortala style={{ marginTop: bosluk.xl }}>
            Henüz ürün eklemedin. İlk yemeğini ekleyince mutfak sayfanda görünecek.
          </Metin>
        ) : (
          urunler.map((u) => (
            <UrunSatiri
              key={u.id}
              urun={u}
              duzenle={() => formuAc(u)}
              sil={() =>
                Alert.alert("Ürünü sil", `"${u.ad}" menüden kaldırılsın mı?`, [
                  { text: "Vazgeç", style: "cancel" },
                  { text: "Sil", style: "destructive", onPress: () => sil(u) },
                ])
              }
            />
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* --------------------------------------------------------------------------
 * Ürün satırı
 * ----------------------------------------------------------------------- */

function UrunSatiri({
  urun,
  duzenle,
  sil,
}: {
  urun: MutfakUrunDto;
  duzenle: () => void;
  sil: () => void;
}) {
  return (
    <View
      style={{
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        padding: bosluk.md,
        gap: bosluk.xs,
        opacity: urun.yayinda ? 1 : 0.6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Metin boyut="md" agirlik="kalin">
            {urun.ad}
          </Metin>
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            {urun.bolumAdi}
            {urun.birim ? ` · ${urun.birim}` : ""}
            {urun.yayinda ? "" : " · yayında değil"}
          </Metin>
        </View>

        <Metin boyut="md" agirlik="kalin" renkli={urun.fiyat > 0 ? renk.baslik : renk.domates}>
          {urun.fiyat > 0 ? `${urun.fiyat} ₺` : "fiyat yok"}
        </Metin>
      </View>

      {urun.aciklama ? (
        <Metin boyut="2xs" renkli={renk.kahve[700]}>
          {urun.aciklama}
        </Metin>
      ) : null}

      {/* Onay bekleyen fiyat: müşteri hâlâ eski fiyatı görüyor. */}
      {urun.bekleyenFiyat ? (
        <Metin boyut="2xs" renkli={renk.kahve[600]}>
          {urun.bekleyenFiyat} ₺ onay bekliyor — onaylanana kadar eski fiyat geçerli.
        </Metin>
      ) : null}

      <View style={{ flexDirection: "row", gap: bosluk.sm, marginTop: bosluk.xs }}>
        <KucukDugme ikon="pencil-outline" etiket="Düzenle" onPress={duzenle} />
        <KucukDugme ikon="trash-can-outline" etiket="Sil" onPress={sil} tehlike />
      </View>
    </View>
  );
}

function KucukDugme({
  ikon,
  etiket,
  onPress,
  tehlike = false,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  etiket: string;
  onPress: () => void;
  tehlike?: boolean;
}) {
  const ton = tehlike ? renk.domatesKoyu : renk.kahve[700];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: yaricap.tam,
        borderWidth: 1,
        borderColor: tehlike ? `${renk.domates}4D` : renk.cizgi,
        paddingHorizontal: bosluk.md,
        paddingVertical: 6,
      }}
    >
      <MaterialCommunityIcons name={ikon} size={14} color={ton} />
      <Metin boyut="2xs" agirlik="kalin" renkli={ton}>
        {etiket}
      </Metin>
    </Pressable>
  );
}

/* --------------------------------------------------------------------------
 * Ürün formu
 * ----------------------------------------------------------------------- */

function UrunFormu({
  urun,
  bolumler,
  kapat,
  kaydedildi,
}: {
  urun: MutfakUrunDto | null;
  bolumler: MutfakBolumuDto[];
  kapat: () => void;
  kaydedildi: () => void;
}) {
  const [ad, setAd] = useState(urun?.ad ?? "");
  const [aciklama, setAciklama] = useState(urun?.aciklama ?? "");
  const [fiyat, setFiyat] = useState(urun && urun.fiyat > 0 ? String(urun.fiyat) : "");
  const [birim, setBirim] = useState(urun?.birim ?? "");
  const [bolum, setBolum] = useState(urun?.bolum ?? bolumler[0]?.id ?? "");
  const [yayinda, setYayinda] = useState(urun?.yayinda ?? true);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  const secili = bolumler.find((b) => b.id === bolum);

  async function kaydet() {
    setBekliyor(true);
    setHata(null);
    try {
      await uclar.urunKaydet({
        ...(urun ? { id: urun.id } : {}),
        ad: ad.trim(),
        aciklama: aciklama.trim(),
        bolum,
        fiyat: Number(fiyat.replace(",", ".")) || 0,
        ...(birim.trim() ? { birim: birim.trim() } : {}),
        yayinda,
      });
      kaydedildi();
    } catch (e) {
      setHata(e instanceof ApiHatasi ? e.message : "Ürün kaydedilemedi.");
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <View
      style={{
        borderRadius: yaricap["2xl"],
        borderWidth: 2,
        borderColor: renk.sari[500],
        padding: bosluk.lg,
        gap: bosluk.md,
      }}
    >
      <Metin baslik boyut="lg">
        {urun ? "Ürünü düzenle" : "Yeni ürün"}
      </Metin>

      {/* BÖLÜM SEÇİMİ — müşteri menüsünde hangi başlığın altına gireceği. */}
      <View style={{ gap: bosluk.xs }}>
        <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[700]}>
          BÖLÜM
        </Metin>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.xs }}>
          {bolumler.map((b) => {
            const aktif = b.id === bolum;
            return (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                accessibilityState={{ selected: aktif }}
                onPress={() => setBolum(b.id)}
                style={{
                  borderRadius: yaricap.tam,
                  borderWidth: 1,
                  borderColor: aktif ? renk.sari[500] : renk.cizgi,
                  backgroundColor: aktif ? renk.sari[500] : renk.beyaz,
                  paddingHorizontal: bosluk.md,
                  paddingVertical: 6,
                }}
              >
                <Metin
                  boyut="2xs"
                  agirlik="kalin"
                  renkli={aktif ? renk.murekkep : renk.kahve[700]}
                >
                  {b.ad}
                </Metin>
              </Pressable>
            );
          })}
        </View>
        {secili ? (
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            {secili.aciklama}
          </Metin>
        ) : null}
      </View>

      <Alan
        etiket="Ürün adı"
        value={ad}
        onChangeText={setAd}
        placeholder={secili?.ornek ?? "Örn. Kuru fasulye (pilavlı)"}
      />

      <Alan
        etiket="Açıklama"
        value={aciklama}
        onChangeText={setAciklama}
        placeholder="İçinde ne var, kaç kişilik?"
        multiline
        style={{ minHeight: 80, textAlignVertical: "top" }}
      />

      <Alan
        etiket="Fiyat (₺)"
        value={fiyat}
        onChangeText={setFiyat}
        placeholder="Boş bırakırsan 'fiyat yakında' görünür"
        keyboardType="numeric"
      />

      {/* Birim yalnızca ambalajlı bölümlerde vurgulanıyor — web'de de öyle. */}
      <Alan
        etiket={secili?.birimliMi ? "Birim (önemli)" : "Birim"}
        value={birim}
        onChangeText={setBirim}
        placeholder={secili?.birimliMi ? "Örn. 500 g kavanoz" : "Örn. 1 porsiyon"}
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.md }}>
        <Switch
          value={yayinda}
          onValueChange={setYayinda}
          trackColor={{ true: renk.sari[500], false: renk.kahve[200] }}
          thumbColor={renk.beyaz}
        />
        <View style={{ flex: 1 }}>
          <Metin boyut="sm" agirlik="kalin">
            Yayında
          </Metin>
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            Kapatırsan ürün menünde görünmez; silmeden gizlemiş olursun.
          </Metin>
        </View>
      </View>

      {hata ? (
        <Metin boyut="sm" renkli={renk.domatesKoyu}>
          {hata}
        </Metin>
      ) : null}

      <Dugme baslik="Kaydet" onPress={kaydet} bekliyor={bekliyor} tamGenislik />
      <Dugme baslik="Vazgeç" tur="ikincil" onPress={kapat} tamGenislik />
    </View>
  );
}
