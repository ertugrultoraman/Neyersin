import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, kurye as kuryeUclari, renk, yaricap, type KuryeDonemDto } from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { useVardiya } from "@/vardiya/Baglam";

const uclar = kuryeUclari(api);

/**
 * ÖZET — kazanç, teslimat sayısı, tahsilat ve kabul oranı.
 *
 * HESAP SUNUCUDA (bkz. api/mobil/v1/kurye/ozet). Uygulama teslimat listesinden
 * kendisi de sayabilirdi ama hakediş tarifeye bağlı; tarife buraya
 * kopyalansaydı, tarife değiştiğinde eski sürümü olan kurye yanlış tutar
 * görürdü ve yanlış olduğunu anlamasının hiçbir yolu olmazdı. Kabul oranı da
 * cihazın hiç görmediği kayıtlara dayanıyor.
 *
 * TAHSİLAT KAZANÇTAN AYRI YAZIYOR: biri kuryenin hakedişi, öteki şirkete
 * teslim edeceği nakit. Tek bir "bugün topladığın" rakamında birleştirmek,
 * ay sonunda beklenti farkı yaratırdı.
 */
export default function OzetEkrani() {
  const kenar = useSafeAreaInsets();
  const { degisim } = useVardiya();
  const ozet = useVeri(() => uclar.ozet(), `ozet-${degisim}`);

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
          refreshing={ozet.tazeleniyor}
          onRefresh={ozet.tazele}
          tintColor={renk.sari[600]}
          colors={[renk.sari[600]]}
        />
      }
    >
      <Metin baslik boyut="3xl">
        Özet
      </Metin>

      {ozet.yukleniyor ? (
        <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk["2xl"] }} />
      ) : !ozet.veri ? (
        <View style={{ alignItems: "center", gap: bosluk.md, paddingVertical: bosluk["3xl"] }}>
          <Ionicons name="cloud-offline-outline" size={40} color={renk.kahve[300]} />
          <Metin baslik boyut="lg" ortala>
            Bağlanamadık
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
            {ozet.hata?.message ?? "Özet okunamadı."}
          </Metin>
          <Dugme baslik="Tekrar dene" tur="ikincil" onPress={ozet.tazele} />
        </View>
      ) : (
        <>
          {/* Bugünün kazancı — ekranın tek kahramanı, marka sarısında. */}
          <View
            style={{
              backgroundColor: renk.sari[500],
              borderRadius: yaricap["2xl"],
              padding: bosluk.xl,
              gap: 2,
            }}
          >
            <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[800]}>
              BUGÜNKÜ HAKEDİŞİN
            </Metin>
            <Metin baslik boyut="4xl" renkli={renk.murekkep}>
              {ozet.veri.bugun.kazanc} ₺
            </Metin>
            <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
              {ozet.veri.bugun.teslimat} teslimat
            </Metin>
          </View>

          <Donem baslik="Bu hafta" donem={ozet.veri.hafta} />

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
            <Satir etiket="Bugün" deger={`${ozet.veri.bugun.tahsilat} ₺`} />
            <Satir etiket="Bu hafta" deger={`${ozet.veri.hafta.tahsilat} ₺`} />
            <Metin boyut="xs" renkli={renk.metinIkincil}>
              Kapıda ödemeli teslimatlarda topladığın tutar. Bu para şirkete teslim edilecek,
              hakedişine dahil değil.
            </Metin>
          </View>

          <KabulOrani oran={ozet.veri.kabulOrani} />

          {ozet.veri.acikTeslimat > 0 ? (
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
                {ozet.veri.acikTeslimat} teslimatın hâlâ açık.
              </Metin>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function Donem({ baslik, donem }: { baslik: string; donem: KuryeDonemDto }) {
  return (
    <View style={{ flexDirection: "row", gap: bosluk.md }}>
      <Kutu baslik={baslik} deger={`${donem.kazanc} ₺`} alt="hakediş" />
      <Kutu baslik="Teslimat" deger={`${donem.teslimat}`} alt="bu hafta" />
    </View>
  );
}

/**
 * Kabul oranı.
 *
 * HİÇ TEKLİF ALMAMIŞ kuryeye %0 değil "henüz yok" yazıyor: sıfır, kötü
 * çalıştığı anlamına gelirdi; oysa ölçülecek bir şey olmamış.
 */
function KabulOrani({
  oran,
}: {
  oran: { yuzde: number | null; kabul: number; toplam: number };
}) {
  const iyi = (oran.yuzde ?? 0) >= 80;

  return (
    <View
      style={{
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.lg,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: yaricap.tam,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            oran.yuzde === null ? renk.kahve[50] : iyi ? `${renk.nane}1F` : `${renk.sari[500]}33`,
        }}
      >
        <Metin baslik boyut="md" renkli={oran.yuzde === null ? renk.kahve[300] : renk.kahve[900]}>
          {oran.yuzde === null ? "–" : `%${oran.yuzde}`}
        </Metin>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Metin baslik boyut="md">
          Kabul oranı
        </Metin>
        <Metin boyut="xs" renkli={renk.metinIkincil}>
          {oran.yuzde === null
            ? "Son 30 günde sana teklif düşmemiş."
            : `Son 30 günde ${oran.toplam} teklifin ${oran.kabul} tanesini aldın.`}
        </Metin>
      </View>
    </View>
  );
}

function Kutu({ baslik, deger, alt }: { baslik: string; deger: string; alt: string }) {
  return (
    <View
      style={{
        flex: 1,
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        gap: 2,
      }}
    >
      <Metin boyut="xs" agirlik="kalin" renkli={renk.metinIkincil}>
        {baslik.toLocaleUpperCase("tr-TR")}
      </Metin>
      <Metin baslik boyut="2xl">
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
