import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  bosluk,
  durumRengi,
  golge,
  kurye as kuryeUclari,
  renk,
  yaricap,
  type KuryeTeslimatiDto,
  type VardiyaDilimiDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";
import { CalismayaBasla } from "@/gorunum/CalismayaBasla";
import { Harita, type HaritaNoktasi } from "@/gorunum/Harita";
import { DURUM_ADI, aktifTeslimat, siradakiAdim, teslimAdresi } from "@/teslimat/kurallar";
import { useVardiya } from "@/vardiya/Baglam";
import { baslangicaKalan, gunEtiketi, saatAraligi } from "@/vardiya/takvim";

const uclar = kuryeUclari(api);

/**
 * ANA EKRAN — harita üstte, vardiya kartı altta.
 *
 * Kuryenin telefonu vardiya boyunca bu ekranda duruyor. Bu yüzden ekranda
 * yalnızca üç soru cevaplanıyor: çevrimiçi miyim, elimde iş var mı, sıradaki
 * adım ne. Liste, kazanç ve geçmiş ayrı sekmelerde — hepsini buraya
 * yığmak, motorun üstünde okunamayan bir ekran demekti.
 *
 * ALT KART SABİT, sürüklenebilir değil. Sürüklenen bir kat (bottom sheet)
 * ayrı bir kütüphane ve eldivenli parmakla yakalanması zor bir hedef;
 * kazandıracağı tek şey haritanın birkaç santimi.
 */
export default function AnaEkran() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const { hazir, cevrimici, konum, konumHatasi, islemde, degisim, cevrimdisiOl, tazele } =
    useVardiya();

  const [baslatmaAcik, setBaslatmaAcik] = useState(false);

  const liste = useVeri(() => uclar.teslimatlar(), `teslimatlar-${degisim}`);
  const teslimat = aktifTeslimat(liste.veri ?? []);

  /*
   * Vardiya planı AYRI İSTEK: teslimat listesiyle birleştirilseydi, teklif
   * kabul edilen her seferde (degisim arttığında) vardiya da gereksiz yere
   * yeniden çekilirdi. Plan gün içinde nadiren değişiyor.
   */
  const plan = useVeri(() => uclar.vardiyalar(), "vardiyalar");

  const noktalar: HaritaNoktasi[] = konum
    ? [{ anahtar: "ben", enlem: konum.enlem, boylam: konum.boylam, baslik: "Sen", tur: "kurye" }]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: renk.beyaz }}>
      <Harita merkez={konum} noktalar={noktalar} />

      {/* Yüzen üst şerit */}
      <View
        style={{
          position: "absolute",
          top: kenar.top + bosluk.sm,
          left: bosluk.lg,
          right: bosluk.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.sm,
        }}
      >
        <DurumPili cevrimici={cevrimici} hazir={hazir} />
        <View style={{ flex: 1 }} />
        <YuzenDugme
          simge="refresh"
          etiket="Yenile"
          onPress={() => {
            tazele();
            liste.tazele();
          }}
        />
      </View>

      {/* Vardiya kartı */}
      <View
        style={{
          backgroundColor: renk.beyaz,
          borderTopLeftRadius: yaricap["5xl"],
          borderTopRightRadius: yaricap["5xl"],
          paddingTop: bosluk.md,
          paddingBottom: kenar.bottom + bosluk.md,
          boxShadow: golge.kalkik,
          maxHeight: "62%",
        }}
      >
        <View
          style={{
            alignSelf: "center",
            width: 44,
            height: 4,
            borderRadius: yaricap.tam,
            backgroundColor: renk.kahve[100],
            marginBottom: bosluk.md,
          }}
        />

        <ScrollView contentContainerStyle={{ paddingHorizontal: bosluk.xl, gap: bosluk.md }}>
          {konumHatasi ? (
            <View
              style={{
                padding: bosluk.md,
                borderRadius: yaricap.lg,
                backgroundColor: `${renk.domates}1A`,
              }}
            >
              <Metin boyut="xs" agirlik="orta" renkli={renk.domatesKoyu}>
                {konumHatasi}
              </Metin>
            </View>
          ) : null}

          {!hazir || liste.yukleniyor ? (
            <ActivityIndicator color={renk.sari[600]} style={{ paddingVertical: bosluk.xl }} />
          ) : teslimat ? (
            <AktifIs
              teslimat={teslimat}
              onPress={() => yonlendir.push(`/teslimat/${teslimat.siparisNo}`)}
            />
          ) : (
            <BosDurum cevrimici={cevrimici} />
          )}

          {/*
            SIRADAKİ VARDİYA burada, ayrı bir sekmede değil: kurye bu ekrana
            "şimdi ne yapıyorum" diye bakıyor ve "bir sonraki ne zaman"
            sorusunun cevabı da aynı bakışta olmalı. Tam plan bir dokunuş
            uzakta (bkz. app/vardiyalar.tsx).
          */}
          {plan.veri ? (
            <VardiyaSatiri
              dilim={plan.veri.siradaki}
              onPress={() => yonlendir.push("/vardiyalar")}
            />
          ) : null}

          {cevrimici ? (
            <Dugme
              baslik="Vardiyayı bitir"
              tur="ikincil"
              tamGenislik
              bekliyor={islemde}
              onPress={() => void cevrimdisiOl()}
            />
          ) : (
            <Dugme
              baslik="Çalışmaya başla"
              tamGenislik
              pasif={!hazir}
              onPress={() => setBaslatmaAcik(true)}
            />
          )}
        </ScrollView>
      </View>

      <CalismayaBasla acik={baslatmaAcik} kapat={() => setBaslatmaAcik(false)} />
    </View>
  );
}

/**
 * Durum pili.
 *
 * Çevrimiçiyken MARKA SARISI, çevrimdışıyken beyaz. Renk tek başına bilgi
 * taşımıyor — yazı da değişiyor (bkz. WCAG: renk tek ayırt edici olmamalı) —
 * ama göz ucuyla bakan kurye rengi okuyor.
 */
function DurumPili({ cevrimici, hazir }: { cevrimici: boolean; hazir: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.sm,
        paddingHorizontal: bosluk.lg,
        paddingVertical: bosluk.sm,
        borderRadius: yaricap.tam,
        backgroundColor: cevrimici ? renk.sari[500] : renk.beyaz,
        boxShadow: golge.yumusak,
      }}
    >
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: yaricap.tam,
          backgroundColor: cevrimici ? renk.murekkep : renk.kahve[300],
        }}
      />
      <Metin boyut="sm" agirlik="kalin" renkli={cevrimici ? renk.murekkep : renk.kahve[700]}>
        {!hazir ? "Bağlanıyor" : cevrimici ? "Çevrimiçi" : "Çevrimdışı"}
      </Metin>
    </View>
  );
}

function YuzenDugme({
  simge,
  etiket,
  onPress,
}: {
  simge: keyof typeof Ionicons.glyphMap;
  etiket: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiket}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: yaricap.tam,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? renk.kahve[50] : renk.beyaz,
        boxShadow: golge.yumusak,
      })}
    >
      <Ionicons name={simge} size={20} color={renk.kahve[900]} />
    </Pressable>
  );
}

function AktifIs({
  teslimat,
  onPress,
}: {
  teslimat: KuryeTeslimatiDto;
  onPress: () => void;
}) {
  const adim = siradakiAdim(teslimat.durum);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${teslimat.restoranAdi} teslimatını aç`}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: bosluk.lg,
        borderRadius: yaricap["2xl"],
        borderWidth: 1,
        borderColor: renk.cizgi,
        backgroundColor: pressed ? renk.kahve[50] : renk.beyaz,
        gap: bosluk.xs,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <View
          style={{
            paddingHorizontal: bosluk.sm,
            paddingVertical: 2,
            borderRadius: yaricap.tam,
            backgroundColor: `${durumRengi[teslimat.durum]}22`,
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={durumRengi[teslimat.durum]}>
            {DURUM_ADI[teslimat.durum]}
          </Metin>
        </View>
        <View style={{ flex: 1 }} />
        <Metin boyut="xs" agirlik="kalin" renkli={renk.metinIkincil}>
          {teslimat.siparisNo}
        </Metin>
      </View>

      <Metin baslik boyut="lg" numberOfLines={1}>
        {teslimat.restoranAdi}
      </Metin>
      <Metin boyut="sm" renkli={renk.kahve[700]} numberOfLines={2}>
        {teslimAdresi(teslimat.teslim)}
      </Metin>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: bosluk.xs,
        }}
      >
        <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[900]}>
          {adim ? adim.baslik : "Detayı aç"}
        </Metin>
        <Ionicons name="chevron-forward" size={18} color={renk.kahve[300]} />
      </View>
    </Pressable>
  );
}

/**
 * Sıradaki vardiya satırı.
 *
 * REZERVASYON YOKKEN DE GÖRÜNÜYOR ama "yok" demiyor, "plana bak" diyor:
 * rezervasyon çalışmanın şartı değil (bkz. lib/kurye-vardiya) ve boş bir
 * uyarı, kuryeye eksik bir şey yaptığını düşündürürdü.
 */
function VardiyaSatiri({
  dilim,
  onPress,
}: {
  dilim: VardiyaDilimiDto | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Vardiya planını aç"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
        paddingHorizontal: bosluk.lg,
        paddingVertical: bosluk.md,
        borderRadius: yaricap.xl,
        backgroundColor: pressed ? renk.kahve[50] : renk.krem,
      })}
    >
      <Ionicons name="calendar-outline" size={20} color={renk.kahve[700]} />
      <View style={{ flex: 1 }}>
        <Metin boyut="2xs" agirlik="kalin" renkli={renk.metinIkincil}>
          SIRADAKİ VARDİYA
        </Metin>
        <Metin boyut="sm" agirlik="kalin" numberOfLines={1}>
          {dilim
            ? `${gunEtiketi(dilim.baslangic)} · ${saatAraligi(dilim)}`
            : "Vardiya planına göz at"}
        </Metin>
      </View>
      {dilim ? (
        <Metin boyut="xs" renkli={renk.metinIkincil}>
          {baslangicaKalan(dilim)}
        </Metin>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={renk.kahve[300]} />
    </Pressable>
  );
}

function BosDurum({ cevrimici }: { cevrimici: boolean }) {
  return (
    <View style={{ alignItems: "center", gap: bosluk.sm, paddingVertical: bosluk.lg }}>
      <Ionicons
        name={cevrimici ? "hourglass-outline" : "moon-outline"}
        size={32}
        color={renk.kahve[300]}
      />
      <Metin baslik boyut="lg" ortala>
        {cevrimici ? "İş bekleniyor" : "Vardiya kapalı"}
      </Metin>
      <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
        {cevrimici
          ? "Yakınında bir sipariş hazırlandığında teklif ekranına düşecek."
          : "Çalışmaya başladığında sana iş teklifleri gelmeye başlar."}
      </Metin>
    </View>
  );
}
