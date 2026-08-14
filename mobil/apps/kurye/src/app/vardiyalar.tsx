import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  kurye as kuryeUclari,
  renk,
  yaricap,
  type VardiyaDilimiDto,
  type VardiyaPlaniDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import {
  baslangicaKalan,
  gunEtiketi,
  gunlereBol,
  kalanYer,
  saatAraligi,
  sureYaz,
} from "@/vardiya/takvim";

const uclar = kuryeUclari(api);

/**
 * VARDİYA PLANI — kuryenin önceden yer ayırdığı çalışma dilimleri.
 *
 * SEKME DEĞİL, AYRI EKRAN. Vardiya planına günde bir kez bakılıyor; teslimat
 * ve özet ise vardiya boyunca açık duruyor. Beşinci bir sekme, her gün
 * kullanılan üç sekmeyi daraltırdı. Giriş ana ekrandaki "sıradaki vardiya"
 * satırından.
 *
 * REZERVASYON ÇALIŞMANIN ŞARTI DEĞİL: kurye yer ayırmadan da çevrimiçi olup
 * teklif alabiliyor (bkz. lib/kurye-vardiya). Ekran bunu açıkça yazıyor,
 * yoksa kurye rezervasyonu olmadığı için çalışamayacağını sanardı.
 */
export default function VardiyalarEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();

  const liste = useVeri(() => uclar.vardiyalar(), "vardiyalar");
  const [islemdeId, setIslemdeId] = useState<string | null>(null);

  /*
   * Rezervasyon ve iptal PLANIN TAMAMINI dönüyor; dönen plan doğrudan ekrana
   * yazılıyor. `useVeri`den ikinci bir istek istenseydi, kurye dokunduktan
   * sonra ekran bir tur eski doluluk sayısıyla kalırdı.
   */
  const [sonPlan, setSonPlan] = useState<VardiyaPlaniDto | null>(null);
  useEffect(() => setSonPlan(null), [liste.veri]);
  const plan = sonPlan ?? liste.veri;

  async function calistir(dilimId: string, is: () => Promise<VardiyaPlaniDto>, baslik: string) {
    setIslemdeId(dilimId);
    try {
      setSonPlan(await is());
    } catch (e) {
      Alert.alert(
        baslik,
        e instanceof ApiHatasi ? e.message : "Bağlantını kontrol edip tekrar dene.",
      );
      /* 409 çoğu zaman "bu arada doldu" demek; güncel doluluk için tazele. */
      liste.tazele();
    } finally {
      setIslemdeId(null);
    }
  }

  const yerAyir = (dilim: VardiyaDilimiDto) =>
    void calistir(dilim.id, () => uclar.vardiyaRezerve(dilim.id), "Yer ayrılamadı");

  function birak(dilim: VardiyaDilimiDto) {
    /*
     * İPTAL ONAY İSTİYOR. Yanlışlıkla dokunulan "Bırak", kuryenin haftalar
     * öncesinden ayırdığı yeri geri alınamaz şekilde başkasına açardı.
     */
    Alert.alert(
      "Vardiyayı bırak",
      `${gunEtiketi(dilim.baslangic)} ${saatAraligi(dilim)} vardiyasındaki yerin serbest kalacak.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Bırak",
          style: "destructive",
          onPress: () =>
            void calistir(dilim.id, () => uclar.vardiyaIptal(dilim.id), "İptal edilemedi"),
        },
      ],
    );
  }

  const digerRezervasyonlar = (plan?.rezervasyonlarim ?? []).slice(1);
  const gruplar = gunlereBol(plan?.acikDilimler ?? []);
  const bosMu = !plan?.siradaki && digerRezervasyonlar.length === 0 && gruplar.length === 0;

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
          <Ionicons name="chevron-back" size={26} color={renk.kahve[900]} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Metin baslik boyut="xl">
            Vardiyalarım
          </Metin>
          <Metin boyut="xs" renkli={renk.metinIkincil}>
            Önceden yer ayır, planını sen kur
          </Metin>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: bosluk.lg,
          paddingBottom: kenar.bottom + bosluk["3xl"],
          gap: bosluk.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={liste.tazeleniyor}
            onRefresh={liste.tazele}
            tintColor={renk.sari[600]}
            colors={[renk.sari[600]]}
          />
        }
      >
        {liste.yukleniyor ? (
          <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk["2xl"] }} />
        ) : liste.hata && !plan ? (
          <BosEkran
            simge="cloud-offline-outline"
            baslik="Bağlanamadık"
            aciklama={liste.hata.message}
            dugme={<Dugme baslik="Tekrar dene" tur="ikincil" onPress={liste.tazele} />}
          />
        ) : bosMu ? (
          <BosEkran
            simge="calendar-outline"
            baslik="Henüz vardiya planlanmamış"
            aciklama="Yeni vardiya dilimleri açıldığında burada görünecek. O zamana kadar çalışmaya başlayıp sipariş almayı sürdürebilirsin."
          />
        ) : (
          <>
            {plan?.siradaki ? (
              <SiradakiKart
                dilim={plan.siradaki}
                islemde={islemdeId === plan.siradaki.id}
                onBirak={() => birak(plan.siradaki as VardiyaDilimiDto)}
              />
            ) : null}

            {digerRezervasyonlar.length > 0 ? (
              <Bolum baslik="Diğer rezervasyonların">
                {digerRezervasyonlar.map((d) => (
                  <DilimKarti
                    key={d.id}
                    dilim={d}
                    islemde={islemdeId === d.id}
                    onYerAyir={() => yerAyir(d)}
                    onBirak={() => birak(d)}
                  />
                ))}
              </Bolum>
            ) : null}

            {gruplar.map((grup) => (
              <Bolum key={grup.anahtar} baslik={grup.etiket}>
                {grup.dilimler.map((d) => (
                  <DilimKarti
                    key={d.id}
                    dilim={d}
                    islemde={islemdeId === d.id}
                    onYerAyir={() => yerAyir(d)}
                    onBirak={() => birak(d)}
                  />
                ))}
              </Bolum>
            ))}

            <Metin boyut="xs" renkli={renk.metinIkincil} style={{ paddingTop: bosluk.sm }}>
              Vardiya rezervasyonu zorunlu değil — yer ayırmadan da çalışmaya başlayıp sipariş
              alabilirsin. Yer ayırdığında o saatte seni bekliyor oluruz.
            </Metin>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Sıradaki vardiya — sarı zeminli tek kart.
 *
 * Diğer dilimlerden AYRI görünüyor çünkü ekrandaki tek eylem çağrısı bu:
 * kurye buraya "ne zaman çıkıyorum" sorusuyla geliyor ve cevabı listeyi
 * taramadan görmeli.
 */
function SiradakiKart({
  dilim,
  islemde,
  onBirak,
}: {
  dilim: VardiyaDilimiDto;
  islemde: boolean;
  onBirak: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: renk.sari[500],
        borderRadius: yaricap["2xl"],
        padding: bosluk.lg,
        gap: bosluk.xs,
      }}
    >
      <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[800]}>
        SIRADAKİ VARDİYAN
      </Metin>
      <Metin baslik boyut="2xl" renkli={renk.murekkep}>
        {gunEtiketi(dilim.baslangic)} · {saatAraligi(dilim)}
      </Metin>
      <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
        {baslangicaKalan(dilim)}
        {dilim.bolge ? ` · ${dilim.bolge}` : ""}
      </Metin>
      {dilim.not ? (
        <Metin boyut="xs" renkli={renk.kahve[800]}>
          {dilim.not}
        </Metin>
      ) : null}

      {dilim.iptalEdilebilir ? (
        <View style={{ marginTop: bosluk.sm }}>
          <Dugme baslik="Vardiyayı bırak" tur="sade" bekliyor={islemde} onPress={onBirak} />
        </View>
      ) : (
        <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[800]} style={{ marginTop: bosluk.xs }}>
          Bu vardiya sona ermiş.
        </Metin>
      )}
    </View>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <View style={{ gap: bosluk.sm }}>
      <Metin boyut="xs" agirlik="kalin" renkli={renk.metinIkincil}>
        {baslik.toLocaleUpperCase("tr-TR")}
      </Metin>
      {children}
    </View>
  );
}

function DilimKarti({
  dilim,
  islemde,
  onYerAyir,
  onBirak,
}: {
  dilim: VardiyaDilimiDto;
  islemde: boolean;
  onYerAyir: () => void;
  onBirak: () => void;
}) {
  const kalan = kalanYer(dilim);
  const dolu = kalan === 0;
  /*
   * SÜREN VARDİYA AÇIKÇA YAZILIYOR. Yer ayırma başlamış dilimde de serbest
   * (bkz. lib/kurye-vardiya → gorunume) ama kurye "19:00 – 23:00" yazan bir
   * kartın saat 20:00'de hâlâ girilebilir olduğunu tahmin edemez; yazmadan
   * düğmeyi göstermek şaşırtıcı olurdu.
   */
  const suruyor = new Date(dilim.baslangic).getTime() <= Date.now();

  return (
    <View
      style={{
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: dilim.benim ? renk.nane : renk.cizgi,
        backgroundColor: dilim.benim ? `${renk.nane}0D` : renk.beyaz,
        padding: bosluk.lg,
        gap: bosluk.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <View style={{ flex: 1 }}>
          <Metin baslik boyut="lg">
            {saatAraligi(dilim)}
          </Metin>
          <Metin boyut="xs" renkli={suruyor ? renk.naneKoyu : renk.metinIkincil}>
            {suruyor ? "Şu an sürüyor · " : ""}
            {sureYaz(dilim)}
            {dilim.bolge ? ` · ${dilim.bolge}` : ""}
          </Metin>
        </View>

        {/*
          DOLULUK SAYIYLA yazılıyor, "yer var/yok" diye değil: son iki yer
          kaldığında kuryenin acele etmesi gerektiğini bilmesi lazım.
        */}
        <View
          style={{
            paddingHorizontal: bosluk.md,
            paddingVertical: bosluk.xs,
            borderRadius: yaricap.tam,
            backgroundColor: dilim.benim
              ? `${renk.nane}1A`
              : dolu
                ? renk.kahve[50]
                : `${renk.sari[500]}26`,
          }}
        >
          <Metin
            boyut="2xs"
            agirlik="kalin"
            renkli={dilim.benim ? renk.naneKoyu : dolu ? renk.kahve[500] : renk.kahve[800]}
          >
            {dilim.benim ? "Yerin ayrıldı" : dolu ? "Doldu" : `${kalan} yer kaldı`}
          </Metin>
        </View>
      </View>

      {dilim.not ? (
        <Metin boyut="xs" renkli={renk.kahve[700]}>
          {dilim.not}
        </Metin>
      ) : null}

      {dilim.iptalEdilebilir ? (
        <Dugme baslik="Bırak" tur="sade" bekliyor={islemde} onPress={onBirak} />
      ) : dilim.rezerveEdilebilir ? (
        <Dugme
          baslik={suruyor ? "Şimdi katıl" : "Yer ayır"}
          tamGenislik
          bekliyor={islemde}
          onPress={onYerAyir}
        />
      ) : (
        /*
          Buraya YALNIZCA kontenjan dolduğunda düşülüyor. Önceden "başlamış
          dilime girilemez" kuralı da buraya düşüyordu ve ekranda yarısı boş
          bir vardiyaya "Bu vardiya doldu" yazıyordu — kurye de haklı olarak
          uygulamanın bozuk olduğunu düşünüyordu.
        */
        <Metin boyut="xs" renkli={renk.metinIkincil}>
          Bu vardiya doldu.
        </Metin>
      )}
    </View>
  );
}

function BosEkran({
  simge,
  baslik,
  aciklama,
  dugme,
}: {
  simge: keyof typeof Ionicons.glyphMap;
  baslik: string;
  aciklama: string;
  dugme?: ReactNode;
}) {
  return (
    <View style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}>
      <Ionicons name={simge} size={40} color={renk.kahve[300]} />
      <Metin baslik boyut="lg" ortala>
        {baslik}
      </Metin>
      <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
        {aciklama}
      </Metin>
      {dugme}
    </View>
  );
}
