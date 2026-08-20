import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  durumRengi,
  mutfak as mutfakUclari,
  renk,
  yaricap,
  type MutfakOzetiDto,
  type MutfakSiparisDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = mutfakUclari(api);

const DURUM_ADI: Record<string, string> = {
  "odeme-bekliyor": "Ödeme bekliyor",
  odendi: "Ödendi",
  hazir: "Hazır",
  yolda: "Yolda",
  "teslim-edildi": "Teslim edildi",
  iptal: "İptal",
  "odeme-basarisiz": "Ödeme başarısız",
};

/**
 * MUTFAK — şefin ve işletmenin sipariş tahtası.
 *
 * Web'deki /panel ekranının uygulamadaki karşılığı ve AYNI listeyi gösteriyor
 * (kendi mutfağının siparişleri + kişisel olarak kendisine atananlar).
 *
 * İŞLETME ÇALIŞANI da bu ekranı görüyor; fiyat ve çalışma saati yönetimi
 * sahibe ait (bkz. lib/oturum → isletmeSahibiMi).
 *
 * SIRALAMA: bekleyen işler üstte. Teslim edilmiş sipariş mutfak için bitmiş
 * bir iş; en yeni sipariş üstte olsun diye tarihe göre sıralamak, akşam
 * yoğunluğunda hazırlanacak yemeği listenin ortasında bırakırdı.
 */
export default function MutfakEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  const ozet = useVeri(() => uclar.ozet(), "mutfak-ozet");
  const siparisler = useVeri(() => uclar.siparisler(), "mutfak-siparisler");

  /* Hazır yapılan siparişler yerinde güncelleniyor; liste baştan inmiyor. */
  const [guncellenen, setGuncellenen] = useState<Record<string, MutfakSiparisDto>>({});
  const [isleniyor, setIsleniyor] = useState<string | null>(null);

  const liste = (siparisler.veri ?? [])
    .map((s) => guncellenen[s.siparisNo] ?? s)
    .sort((a, b) => {
      const bekleyen = (s: MutfakSiparisDto) => (s.hazirYapilabilir ? 0 : 1);
      return (
        bekleyen(a) - bekleyen(b) ||
        new Date(b.olusturmaTarihi).getTime() - new Date(a.olusturmaTarihi).getTime()
      );
    });

  async function hazirYap(siparisNo: string) {
    setIsleniyor(siparisNo);
    try {
      const guncel = await uclar.hazir(siparisNo);
      setGuncellenen((o) => ({ ...o, [siparisNo]: guncel }));
      /* Özet sayıları da değişti (bekleyen bir azaldı). */
      ozet.tazele();
    } catch (e) {
      Alert.alert(
        "Olmadı",
        e instanceof ApiHatasi ? e.message : "Sipariş güncellenemedi, tekrar dene.",
      );
    } finally {
      setIsleniyor(null);
    }
  }

  function tazele() {
    setGuncellenen({});
    siparisler.tazele();
    ozet.tazele();
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      contentContainerStyle={{
        paddingTop: kenar.top + bosluk.lg,
        paddingHorizontal: bosluk.xl,
        paddingBottom: kenar.bottom + bosluk["3xl"],
        gap: bosluk.lg,
      }}
      refreshControl={
        <RefreshControl
          refreshing={siparisler.tazeleniyor}
          onRefresh={tazele}
          tintColor={renk.sari[600]}
          colors={[renk.sari[600]]}
        />
      }
    >
      <View>
        <Metin baslik boyut="3xl">
          {ozet.veri?.restoranAdi ?? "Mutfağın"}
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil}>
          Gelen siparişler ve bugünün özeti
        </Metin>
      </View>

      {ozet.veri ? <Ozet ozet={ozet.veri} /> : null}

      {/* Menü yönetimi ayrı ekranda: sipariş tahtası mutfağın ANLIK işi,
          menü ise arada bir yapılan bir düzenleme. Aynı ekrana konsalardı
          akşam yoğunluğunda ürün formu siparişlerin üstünü örterdi. */}
      <View style={{ flexDirection: "row", gap: bosluk.sm }}>
        <View style={{ flex: 1 }}>
          <Dugme
            baslik="Menüyü düzenle"
            tur="ikincil"
            onPress={() => yonlendir.push("/menu-yonetimi")}
            tamGenislik
          />
        </View>
        <View style={{ flex: 1 }}>
          <Dugme
            baslik="Profilim"
            tur="ikincil"
            onPress={() => yonlendir.push("/mutfak-profili")}
            tamGenislik
          />
        </View>
      </View>

      {siparisler.yukleniyor ? (
        <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk.xl }} />
      ) : siparisler.hata ? (
        <Bos
          ikon="wifi-off"
          baslik="Bağlanamadık"
          metin={siparisler.hata.message}
          tazele={tazele}
        />
      ) : liste.length === 0 ? (
        <Bos
          ikon="silverware-clean"
          baslik="Sipariş yok"
          metin="Yeni sipariş geldiğinde burada görünecek."
          tazele={tazele}
        />
      ) : (
        liste.map((s) => (
          <SiparisKarti
            key={s.siparisNo}
            siparis={s}
            isleniyor={isleniyor === s.siparisNo}
            hazirYap={() => hazirYap(s.siparisNo)}
          />
        ))
      )}
    </ScrollView>
  );
}

/* --------------------------------------------------------------------------
 * Özet şeridi
 * ----------------------------------------------------------------------- */

function Ozet({ ozet }: { ozet: MutfakOzetiDto }) {
  return (
    <View style={{ gap: bosluk.sm }}>
      <View style={{ flexDirection: "row", gap: bosluk.sm }}>
        <Kutu deger={`${ozet.bugunSiparis}`} etiket="bugün sipariş" />
        <Kutu deger={`${ozet.bugunCiro} ₺`} etiket="bugün ciro" />
        <Kutu deger={`${ozet.bekleyen}`} etiket="bekleyen" vurgulu={ozet.bekleyen > 0} />
      </View>

      {/*
        KAPALIYSA SÖYLENİYOR: mutfağı kapalı olan şef sipariş gelmemesini
        bir arıza sanabiliyor. Çalışma saatleri şimdilik siteden ayarlanıyor.
      */}
      {!ozet.acik ? (
        <Satir
          ikon="clock-alert-outline"
          renkli={renk.kahve[700]}
          metin="Mutfağın şu an kapalı görünüyor. Çalışma saatlerini siteden açabilirsin."
        />
      ) : null}

      {/* Fiyatı girilmemiş ürün: menüde duruyor ama sepete eklenemiyor. */}
      {ozet.taslakUrun > 0 ? (
        <Satir
          ikon="tag-off-outline"
          renkli={renk.domatesKoyu}
          metin={`${ozet.taslakUrun} ürünün fiyatı girilmemiş — müşteri onları sipariş edemiyor.`}
        />
      ) : null}
    </View>
  );
}

function Kutu({
  deger,
  etiket,
  vurgulu = false,
}: {
  deger: string;
  etiket: string;
  vurgulu?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: vurgulu ? renk.sari[500] : renk.krem,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: vurgulu ? renk.sari[500] : renk.cizgi,
        paddingVertical: bosluk.md,
        alignItems: "center",
        gap: 2,
      }}
    >
      <Metin baslik boyut="lg" renkli={vurgulu ? renk.murekkep : renk.baslik}>
        {deger}
      </Metin>
      <Metin boyut="2xs" renkli={vurgulu ? renk.kahve[800] : renk.metinIkincil}>
        {etiket}
      </Metin>
    </View>
  );
}

function Satir({
  ikon,
  metin,
  renkli,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  metin: string;
  renkli: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.sm,
        backgroundColor: renk.kremKoyu,
        borderRadius: yaricap.lg,
        padding: bosluk.md,
      }}
    >
      <MaterialCommunityIcons name={ikon} size={17} color={renkli} />
      <Metin boyut="2xs" renkli={renkli} style={{ flex: 1 }}>
        {metin}
      </Metin>
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Sipariş kartı
 * ----------------------------------------------------------------------- */

function SiparisKarti({
  siparis,
  isleniyor,
  hazirYap,
}: {
  siparis: MutfakSiparisDto;
  isleniyor: boolean;
  hazirYap: () => void;
}) {
  const [acik, setAcik] = useState(false);
  const ton = durumRengi[siparis.durum] ?? renk.kahve[600];

  return (
    <View
      style={{
        borderRadius: yaricap["2xl"],
        borderWidth: 1,
        borderColor: siparis.hazirYapilabilir ? renk.sari[500] : renk.cizgi,
        padding: bosluk.lg,
        gap: bosluk.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Metin baslik boyut="lg">
            {siparis.musteriAdi || "Müşteri"}
          </Metin>
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            {siparis.siparisNo} · {saatYaz(siparis.olusturmaTarihi)} · {siparis.semt}
          </Metin>
        </View>

        <View
          style={{
            backgroundColor: `${ton}1A`,
            borderRadius: yaricap.tam,
            paddingHorizontal: bosluk.md,
            paddingVertical: 4,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={ton}>
            {DURUM_ADI[siparis.durum] ?? siparis.durum}
          </Metin>
        </View>
      </View>

      {/* KALEMLER — mutfağın asıl okuduğu yer; kapalı değil, açık geliyor. */}
      <View style={{ gap: 3 }}>
        {siparis.kalemler.map((k, i) => (
          <View key={`${k.ad}-${i}`} style={{ gap: 1 }}>
            <Metin boyut="sm" agirlik="kalin">
              {k.adet} × {k.ad}
            </Metin>
            {k.ekstralar && k.ekstralar.length > 0 ? (
              <Metin boyut="2xs" renkli={renk.metinIkincil}>
                + {k.ekstralar.join(", ")}
              </Metin>
            ) : null}
          </View>
        ))}
      </View>

      {/* MÜŞTERİ NOTU gizlenmiyor: "soğan olmasın" mutfağın bilmesi gereken şey. */}
      {siparis.not ? (
        <View
          style={{
            backgroundColor: renk.krem,
            borderRadius: yaricap.lg,
            padding: bosluk.md,
            gap: 2,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
            MÜŞTERİ NOTU
          </Metin>
          <Metin boyut="sm" renkli={renk.kahve[800]}>
            {siparis.not}
          </Metin>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setAcik((o) => !o)}
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      >
        <Metin boyut="2xs" agirlik="kalin" renkli={renk.metinIkincil}>
          {acik ? "Tutarı gizle" : "Tutarı göster"}
        </Metin>
        <MaterialCommunityIcons
          name={acik ? "chevron-up" : "chevron-down"}
          size={14}
          color={renk.metinIkincil}
        />
      </Pressable>

      {acik ? (
        <Metin boyut="sm" agirlik="kalin">
          Toplam {siparis.toplam} ₺
        </Metin>
      ) : null}

      {siparis.hazirYapilabilir ? (
        <Dugme baslik="Hazır — kurye alabilir" onPress={hazirYap} bekliyor={isleniyor} tamGenislik />
      ) : null}
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Boş / hata
 * ----------------------------------------------------------------------- */

function Bos({
  ikon,
  baslik,
  metin,
  tazele,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  metin: string;
  tazele: () => void;
}) {
  return (
    <View style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}>
      <MaterialCommunityIcons name={ikon} size={40} color={renk.kahve[300]} />
      <Metin baslik boyut="lg" ortala>
        {baslik}
      </Metin>
      <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
        {metin}
      </Metin>
      <Dugme baslik="Yenile" tur="ikincil" onPress={tazele} />
    </View>
  );
}

/** "19:40" — mutfağın baktığı tek zaman bilgisi siparişin geldiği saat. */
function saatYaz(iso: string): string {
  const t = new Date(iso);
  return Number.isNaN(t.getTime())
    ? ""
    : t.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
