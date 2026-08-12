import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, kurye as kuryeUclari, renk, yaricap, type KuryeTeslimatiDto } from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = kuryeUclari(api);

/**
 * ÖZET — "bugün ne yaptım, elimde ne kadar para var".
 *
 * SEKMENİN ADI NEDEN "KAZANÇ" DEĞİL: sistemde kurye hakedişi diye bir kavram
 * henüz YOK — ne teslimat başı ücret, ne prim, ne bekleme telafisi sunucuda
 * tanımlı (arama: `lib/` altında hakediş/prim geçen bir alan yok). Ekrana
 * "kazancın" diye bir sayı yazmak, o sayıyı uydurmak olurdu; kurye ay sonunda
 * eline geçenle karşılaştırıp uygulamaya bir daha güvenmezdi.
 *
 * Burada yalnızca gerçekten ölçülen iki şey var: kaç teslimat yapıldı ve
 * kapıda ne kadar tahsilat toplandı. Tahsilat kuryenin PARASI DEĞİL, şirkete
 * teslim edeceği nakit — başlıkta da öyle yazıyor.
 */

/** Gün başı (yerel saat). */
function gunBasi(t: Date): Date {
  const g = new Date(t);
  g.setHours(0, 0, 0, 0);
  return g;
}

/** Haftanın başı — pazartesi, Türkiye'deki takvim alışkanlığı. */
function haftaBasi(t: Date): Date {
  const g = gunBasi(t);
  const gun = (g.getDay() + 6) % 7; // pazar=0 → 6
  g.setDate(g.getDate() - gun);
  return g;
}

/**
 * Teslim ANI: `guncellemeTarihi`.
 *
 * `olusturmaTarihi` siparişin verildiği an ve gece yarısını geçen bir sipariş
 * dünkü güne yazılırdı. Durum en son teslimde değiştiği için güncelleme
 * tarihi, teslim edilmiş bir siparişte teslim saatidir.
 */
function sayim(liste: readonly KuryeTeslimatiDto[], baslangic: Date) {
  const teslimler = liste.filter(
    (t) => t.durum === "teslim-edildi" && new Date(t.guncellemeTarihi) >= baslangic,
  );
  return {
    adet: teslimler.length,
    tahsilat: teslimler.reduce((toplam, t) => toplam + t.tahsilat, 0),
  };
}

export default function OzetEkrani() {
  const kenar = useSafeAreaInsets();
  const liste = useVeri(() => uclar.teslimatlar(), "teslimatlar");

  const { bugun, hafta, bekleyen } = useMemo(() => {
    const veri = liste.veri ?? [];
    const simdi = new Date();
    return {
      bugun: sayim(veri, gunBasi(simdi)),
      hafta: sayim(veri, haftaBasi(simdi)),
      bekleyen: veri.filter((t) => t.durum !== "teslim-edildi" && t.durum !== "iptal").length,
    };
  }, [liste.veri]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      contentContainerStyle={{
        paddingHorizontal: bosluk.lg,
        paddingTop: kenar.top + bosluk.lg,
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
      <View>
        <Metin baslik boyut="3xl">
          Özet
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil}>
          Son 100 teslimatın üzerinden
        </Metin>
      </View>

      {liste.yukleniyor ? (
        <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk["2xl"] }} />
      ) : liste.hata && !liste.veri ? (
        <View style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}>
          <Ionicons name="cloud-offline-outline" size={40} color={renk.kahve[300]} />
          <Metin baslik boyut="lg" ortala>
            Bağlanamadık
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
            {liste.hata.message}
          </Metin>
          <Dugme baslik="Tekrar dene" tur="ikincil" onPress={liste.tazele} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: bosluk.md }}>
            <Kutu baslik="Bugün" deger={`${bugun.adet}`} alt="teslimat" vurgulu />
            <Kutu baslik="Bu hafta" deger={`${hafta.adet}`} alt="teslimat" />
          </View>

          <View
            style={{
              padding: bosluk.lg,
              borderRadius: yaricap.xl,
              borderWidth: 1,
              borderColor: renk.cizgi,
              gap: bosluk.sm,
            }}
          >
            <Metin baslik boyut="md">
              Tahsil ettiğin nakit
            </Metin>
            <Satir etiket="Bugün" deger={`${bugun.tahsilat} ₺`} />
            <Satir etiket="Bu hafta" deger={`${hafta.tahsilat} ₺`} />
            <Metin boyut="xs" renkli={renk.metinIkincil}>
              Kapıda ödemeli teslimatlarda topladığın tutar. Bu para şirkete teslim edilecek,
              hakedişin değil.
            </Metin>
          </View>

          {bekleyen > 0 ? (
            <View
              style={{
                padding: bosluk.lg,
                borderRadius: yaricap.xl,
                backgroundColor: renk.krem,
                borderWidth: 1,
                borderColor: renk.cizgi,
              }}
            >
              <Metin boyut="sm" agirlik="orta" renkli={renk.kahve[800]}>
                {bekleyen} teslimatın hâlâ açık.
              </Metin>
            </View>
          ) : null}

          {/*
            Bu not ekranda KALICI değil — hakediş uçları geldiğinde yerine
            gerçek tutar gelecek. Bugün burada bir sayı olmaması, sistemde
            gerçekten olmadığı içindir.
          */}
          <View
            style={{
              padding: bosluk.lg,
              borderRadius: yaricap.xl,
              backgroundColor: renk.kahve[50],
              gap: bosluk.xs,
            }}
          >
            <Metin baslik boyut="md">
              Hakediş henüz burada değil
            </Metin>
            <Metin boyut="sm" renkli={renk.kahve[700]}>
              Teslimat ücreti ve prim hesabı sistemde tanımlanmadı. Tanımlandığında bu ekrana
              gerçek tutarlarla gelecek; o güne kadar uydurma bir rakam göstermiyoruz.
            </Metin>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Kutu({
  baslik,
  deger,
  alt,
  vurgulu = false,
}: {
  baslik: string;
  deger: string;
  alt: string;
  vurgulu?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: vurgulu ? renk.sari[500] : renk.cizgi,
        backgroundColor: vurgulu ? renk.krem : renk.beyaz,
        gap: 2,
      }}
    >
      <Metin boyut="xs" agirlik="kalin" renkli={renk.metinIkincil}>
        {baslik.toLocaleUpperCase("tr-TR")}
      </Metin>
      <Metin baslik boyut="3xl">
        {deger}
      </Metin>
      <Metin boyut="xs" renkli={renk.metinIkincil}>
        {alt}
      </Metin>
    </View>
  );
}

function Satir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Metin boyut="sm" renkli={renk.metinIkincil}>
        {etiket}
      </Metin>
      <Metin boyut="sm" agirlik="kalin">
        {deger}
      </Metin>
    </View>
  );
}
