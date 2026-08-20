import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import {
  bosluk,
  golge,
  katalog,
  renk,
  sure,
  yaricap,
  type AdimDto,
  type AnasayfaDto,
  type AnketDto,
  type KampanyaDto,
  type RestoranOzetDto,
  type SoruCevapDto,
} from "ortak";
import { cihazKimligiAl } from "ortak/native";
import { Metin } from "ortak/ui";

import { api } from "@/altyapi/api";

const uclar = katalog(api);

/**
 * KEŞFET EKRANININ ANA SAYFA BÖLÜMLERİ — web ana sayfasının karşılığı.
 *
 * AYRI DOSYA: Keşfet ekranı zaten arama, kategori süzgeci ve listeyi
 * yönetiyor. Bu bölümler oraya da yazılsaydı tek dosya bin satırı geçer,
 * "listeyi ilgilendiren kod" ile "vitrin" iç içe girerdi.
 *
 * SÜZGEÇ AÇIKKEN GİZLENİYORLAR (bkz. Kesfet → suzgecVar): kişi bir şey
 * aradığında sonuçların arasında kampanya ve anket görmek istemiyor.
 */

/* Mutlak kaplama — kapalı rozeti ve anket şeridi bunu kullanıyor. */
const KAPLAMA = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;

/* --------------------------------------------------------------------------
 * Hero şeridi — üç sayı
 * ----------------------------------------------------------------------- */

/**
 * Web'deki hero'nun altındaki sayaçların aynısı: kaç mutfak, ortalama puan,
 * teslimat süresi. Uygulamada animasyonlu sayaç yok — açılışta ilk çizilen
 * şey burası ve her açılışta sayı akıtmak gösterişten ibaret olurdu.
 */
export function IstatistikSeridi({ istatistik }: { istatistik: AnasayfaDto["istatistik"] }) {
  const kutular = [
    { deger: `${istatistik.mutfakSayisi}`, etiket: "mutfak" },
    {
      deger: istatistik.ortalamaPuan > 0 ? istatistik.ortalamaPuan.toFixed(1) : "—",
      etiket: "ortalama puan",
    },
    { deger: istatistik.teslimatSuresi, etiket: "teslimat" },
  ];

  return (
    <View style={{ flexDirection: "row", gap: bosluk.sm }}>
      {kutular.map((k) => (
        <View
          key={k.etiket}
          style={{
            flex: 1,
            backgroundColor: renk.krem,
            borderRadius: yaricap.xl,
            borderWidth: 1,
            borderColor: renk.cizgi,
            paddingVertical: bosluk.md,
            alignItems: "center",
            gap: 2,
          }}
        >
          <Metin baslik boyut="lg">
            {k.deger}
          </Metin>
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            {k.etiket}
          </Metin>
        </View>
      ))}
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Kampanyalar
 * ----------------------------------------------------------------------- */

/** Kampanya kartının zemini — web'deki dört tonun karşılığı. */
const TONLAR: Record<KampanyaDto["ton"], { zemin: string; yazi: string; vurgu: string }> = {
  sari: { zemin: renk.sari[500], yazi: renk.murekkep, vurgu: renk.kahve[800] },
  kahve: { zemin: renk.kahve[800], yazi: renk.sari[100], vurgu: renk.sari[400] },
  domates: { zemin: renk.domates, yazi: renk.beyaz, vurgu: renk.beyaz },
  nane: { zemin: renk.nane, yazi: renk.beyaz, vurgu: renk.beyaz },
};

/**
 * KAMPANYA RAYI.
 *
 * BUGÜN GEÇERLİ OLMAYAN kupon gizlenmiyor, soluk gösteriliyor ve gün bilgisi
 * yazıyor — web'de de öyle. Gizlenseydi "hafta sonu indirimi" diye duyulan
 * kampanyayı salı günü arayan kişi hiç bulamazdı.
 */
export function KampanyaRayi({ kampanyalar }: { kampanyalar: KampanyaDto[] }) {
  if (kampanyalar.length === 0) return null;

  return (
    <View style={{ gap: bosluk.sm }}>
      <BolumBasligi baslik="Kampanyalar" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: bosluk.sm, paddingRight: bosluk.xl }}
      >
        {kampanyalar.map((k) => {
          const ton = TONLAR[k.ton];
          return (
            <View
              key={k.slug}
              style={{
                width: 250,
                backgroundColor: ton.zemin,
                borderRadius: yaricap["2xl"],
                padding: bosluk.lg,
                gap: bosluk.xs,
                opacity: k.bugunGecerli ? 1 : 0.55,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.xs }}>
                <MaterialCommunityIcons name="tag-outline" size={15} color={ton.vurgu} />
                <Metin boyut="2xs" agirlik="kalin" renkli={ton.vurgu}>
                  {k.vurgu}
                </Metin>
              </View>

              <Metin baslik boyut="lg" renkli={ton.yazi}>
                {k.baslik}
              </Metin>
              <Metin boyut="2xs" renkli={ton.yazi} style={{ opacity: 0.85 }}>
                {k.aciklama}
              </Metin>

              {k.kod ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    marginTop: bosluk.xs,
                    borderRadius: yaricap.tam,
                    borderWidth: 1,
                    borderColor: ton.yazi,
                    borderStyle: "dashed",
                    paddingHorizontal: bosluk.md,
                    paddingVertical: 4,
                  }}
                >
                  <Metin boyut="2xs" agirlik="kalin" renkli={ton.yazi}>
                    {k.kod}
                  </Metin>
                </View>
              ) : null}

              {k.gunler ? (
                <Metin boyut="2xs" renkli={ton.yazi} style={{ opacity: 0.8 }}>
                  {k.bugunGecerli ? "Bugün geçerli" : `Yalnızca ${k.gunler}`}
                </Metin>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Öne çıkanlar / Ayın hanımları
 * ----------------------------------------------------------------------- */

/**
 * Yatay mutfak rayı — hem "öne çıkanlar" hem "ayın hanımları" bunu kullanıyor.
 *
 * Liste kartı (RestoranKarti) burada kullanılmıyor: o kart tam genişlik için
 * tasarlandı, yan yana dizilince yazıları sıkışıyor.
 */
export function MutfakRayi({
  baslik,
  aciklama,
  mutfaklar,
}: {
  baslik: string;
  aciklama?: string;
  mutfaklar: RestoranOzetDto[];
}) {
  const yonlendir = useRouter();
  if (mutfaklar.length === 0) return null;

  return (
    <View style={{ gap: bosluk.sm }}>
      <BolumBasligi baslik={baslik} aciklama={aciklama} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: bosluk.sm, paddingRight: bosluk.xl }}
      >
        {mutfaklar.map((m) => (
          <Pressable
            key={m.slug}
            accessibilityRole="button"
            onPress={() => yonlendir.push(`/restoran/${m.slug}`)}
            style={{
              width: 190,
              borderRadius: yaricap["2xl"],
              overflow: "hidden",
              backgroundColor: renk.beyaz,
              borderWidth: 1,
              borderColor: renk.cizgi,
              boxShadow: golge.yumusak,
            }}
          >
            <View style={{ height: 110, backgroundColor: renk.kahve[100] }}>
              {m.gorselUrl ? (
                <Image
                  source={{ uri: m.gorselUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  transition={sure.normal}
                />
              ) : null}

              {/* Kapalı mutfak rayda kalıyor ama karanlıkta duruyor. */}
              {!m.acik ? (
                <View
                  style={{
                    ...KAPLAMA,
                    backgroundColor: "rgba(20, 18, 16, 0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Metin boyut="2xs" agirlik="kalin" renkli={renk.beyaz}>
                    Şu an kapalı
                  </Metin>
                </View>
              ) : null}
            </View>

            <View style={{ padding: bosluk.md, gap: 2 }}>
              <Metin baslik boyut="md" numberOfLines={1}>
                {m.ad}
              </Metin>
              <Metin boyut="2xs" renkli={renk.metinIkincil} numberOfLines={1}>
                {m.mutfak}
              </Metin>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialCommunityIcons name="star" size={12} color={renk.sari[600]} />
                <Metin boyut="2xs" agirlik="kalin">
                  {m.puan > 0 ? m.puan.toFixed(1) : "Yeni"}
                </Metin>
                <Metin boyut="2xs" renkli={renk.metinIkincil}>
                  · {m.teslimatSuresi}
                </Metin>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Anket
 * ----------------------------------------------------------------------- */

/**
 * ANA SAYFA ANKETİ — web'deki anket raylarının uygulamadaki karşılığı.
 *
 * OY VERİLMEDEN SAYILAR GÖSTERİLMİYOR: önden görülen bir çoğunluk kişinin
 * kendi cevabını etkiliyor. Dokunulduğu anda hem oy gidiyor hem sonuç
 * geliyor (tek istek — bkz. katalog.anketOyVer).
 */
export function AnketKarti({ anket }: { anket: AnketDto }) {
  const [sonuc, setSonuc] = useState<AnketDto | null>(null);
  const [secilen, setSecilen] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const gosterilen = sonuc ?? anket;
  const toplam = sonuc?.toplamOy ?? 0;

  async function oyVer(secenekId: string) {
    if (gonderiliyor || sonuc) return;
    setGonderiliyor(true);
    setSecilen(secenekId);
    setHata(null);
    try {
      const cihaz = await cihazKimligiAl();
      setSonuc(await uclar.anketOyVer({ anketId: anket.id, secenekId, cihaz }));
    } catch (e) {
      setSecilen(null);
      setHata(e instanceof Error ? e.message : "Oyun gönderilemedi.");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <View
      style={{
        backgroundColor: renk.kahve[900],
        borderRadius: yaricap["2xl"],
        padding: bosluk.lg,
        gap: bosluk.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.xs }}>
        <MaterialCommunityIcons name="poll" size={16} color={renk.sari[500]} />
        <Metin boyut="2xs" agirlik="kalin" renkli={renk.sari[500]}>
          ANKET
        </Metin>
      </View>

      <Metin baslik boyut="lg" renkli={renk.sari[100]}>
        {gosterilen.soru}
      </Metin>

      <View style={{ gap: 6, marginTop: bosluk.xs }}>
        {gosterilen.secenekler.map((s) => {
          const yuzde = toplam > 0 ? Math.round((s.oy / toplam) * 100) : 0;
          const benimki = secilen === s.id;

          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              disabled={Boolean(sonuc) || gonderiliyor}
              onPress={() => oyVer(s.id)}
              style={{
                borderRadius: yaricap.lg,
                borderWidth: 1,
                borderColor: benimki ? renk.sari[500] : "rgba(255,255,255,0.18)",
                overflow: "hidden",
              }}
            >
              {/* Sonuç şeridi seçeneğin ARKASINDA: ayrı bir çubuk çizmek aynı
                  bilgiyi iki kez göstermek olurdu. */}
              {sonuc ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: `${yuzde}%`,
                    backgroundColor: benimki ? "rgba(253,200,6,0.28)" : "rgba(255,255,255,0.10)",
                  }}
                />
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: bosluk.md,
                  paddingVertical: bosluk.sm,
                }}
              >
                <Metin boyut="sm" renkli={renk.sari[100]} style={{ flex: 1 }}>
                  {s.etiket}
                </Metin>
                {sonuc ? (
                  <Metin boyut="sm" agirlik="kalin" renkli={renk.sari[500]}>
                    %{yuzde}
                  </Metin>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {hata ? (
        <Metin boyut="2xs" renkli={renk.domates}>
          {hata}
        </Metin>
      ) : sonuc ? (
        <Metin boyut="2xs" renkli="rgba(255,255,255,0.6)">
          {toplam} oy · oyun alındı
        </Metin>
      ) : (
        <Metin boyut="2xs" renkli="rgba(255,255,255,0.6)">
          Bir seçeneğe dokun, sonuçları gör.
        </Metin>
      )}
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Nasıl çalışır / SSS / çağrı
 * ----------------------------------------------------------------------- */

export function NasilCalisirBolumu({ adimlar }: { adimlar: AdimDto[] }) {
  if (adimlar.length === 0) return null;

  return (
    <View style={{ gap: bosluk.sm }}>
      <BolumBasligi baslik="Nasıl çalışır" />
      {adimlar.map((adim, i) => (
        <View key={adim.baslik} style={{ flexDirection: "row", gap: bosluk.md }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: yaricap.tam,
              backgroundColor: renk.sari[500],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Metin boyut="2xs" agirlik="kalin" renkli={renk.murekkep}>
              {i + 1}
            </Metin>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Metin boyut="sm" agirlik="kalin">
              {adim.baslik}
            </Metin>
            <Metin boyut="2xs" renkli={renk.metinIkincil}>
              {adim.metin}
            </Metin>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Sıkça sorulanlar — dokununca açılan akordiyon (web'deki gibi). */
export function SssBolumu({ sorular }: { sorular: SoruCevapDto[] }) {
  const [acik, setAcik] = useState<string | null>(null);
  if (sorular.length === 0) return null;

  return (
    <View style={{ gap: bosluk.xs }}>
      <BolumBasligi baslik="Merak edilenler" />
      {sorular.map((s) => {
        const acikMi = acik === s.soru;
        return (
          <Pressable
            key={s.soru}
            accessibilityRole="button"
            accessibilityState={{ expanded: acikMi }}
            onPress={() => setAcik(acikMi ? null : s.soru)}
            style={{
              borderRadius: yaricap.xl,
              borderWidth: 1,
              borderColor: renk.cizgi,
              padding: bosluk.md,
              gap: bosluk.xs,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
              <Metin boyut="sm" agirlik="kalin" style={{ flex: 1 }}>
                {s.soru}
              </Metin>
              <MaterialCommunityIcons
                name={acikMi ? "chevron-up" : "chevron-down"}
                size={18}
                color={renk.metinIkincil}
              />
            </View>
            {acikMi ? (
              <Metin boyut="2xs" renkli={renk.kahve[700]}>
                {s.cevap}
              </Metin>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * EV HANIMI ÇAĞRISI — web'deki "kendi mutfağını aç" bandının karşılığı.
 *
 * Başvuru ekranına götürüyor: uygulamayı indiren herkes aynı zamanda olası
 * bir şef ve bunu duyacağı yer, sipariş verdiği ekran.
 */
export function EvHanimiCagrisi() {
  const yonlendir = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => yonlendir.push("/basvuru")}
      style={{
        backgroundColor: renk.sari[500],
        borderRadius: yaricap["2xl"],
        padding: bosluk.lg,
        gap: 4,
      }}
    >
      <Metin baslik boyut="lg" renkli={renk.murekkep}>
        Kendi mutfağını aç
      </Metin>
      <Metin boyut="2xs" renkli={renk.kahve[800]}>
        Evinde pişirdiğin yemekleri sat. Başvurunu gönder, onaylandığı anda kendi mutfak
        sayfan açılsın.
      </Metin>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: bosluk.xs }}>
        <Metin boyut="2xs" agirlik="kalin" renkli={renk.murekkep}>
          Başvur
        </Metin>
        <MaterialCommunityIcons name="arrow-right" size={14} color={renk.murekkep} />
      </View>
    </Pressable>
  );
}

/* Bölüm başlığı — hepsinde aynı ölçü, aynı boşluk. */
function BolumBasligi({ baslik, aciklama }: { baslik: string; aciklama?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Metin baslik boyut="xl">
        {baslik}
      </Metin>
      {aciklama ? (
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          {aciklama}
        </Metin>
      ) : null}
    </View>
  );
}

/**
 * ŞEF SIRALAMASI ÇAĞRISI — listenin altında tek satır.
 *
 * Sıralamanın kendisi ayrı bir ekranda: üç ölçütlü bir tablo, açılış
 * ekranında yer kaplardı ve sipariş vermeye gelen kişinin işine yaramazdı.
 * Ama merak eden birinin oraya nasıl gideceğini bilmesi gerekiyor.
 */
export function SiralamaCagrisi() {
  const yonlendir = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => yonlendir.push("/siralama")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
        borderRadius: yaricap["2xl"],
        borderWidth: 1,
        borderColor: renk.cizgi,
        padding: bosluk.lg,
      }}
    >
      <MaterialCommunityIcons name="trophy-outline" size={22} color={renk.sari[600]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Metin baslik boyut="md">
          Şef sıralaması
        </Metin>
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          En çok sipariş alan, en beğenilen ve meslektaşlarınca takdir edilen şefler
        </Metin>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={renk.kahve[300]} />
    </Pressable>
  );
}
