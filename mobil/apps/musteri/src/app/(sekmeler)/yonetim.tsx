import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiHatasi,
  bosluk,
  renk,
  yaricap,
  yazi,
  yaziAilesi,
  yonetim as yonetimUclari,
  type YonetimBasvurusuDto,
  type YonetimDestekDto,
  type YonetimFiyatTalebiDto,
  type YonetimOzetiDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";
import { useVeri } from "ortak/veri";

import { api } from "@/altyapi/api";

const uclar = yonetimUclari(api);

type Sekme = "basvuru" | "fiyat" | "destek";

/**
 * YÖNETİM — yöneticinin telefondaki ekranı.
 *
 * Web'deki /admin çok geniş; buraya yalnızca SAHADA GEREKEN alındı: onay
 * bekleyen başvurular, fiyat talepleri ve destek. Üçünün ortak yanı, hepsinin
 * karşı tarafta bekleyen bir insanı olması — hesabı açılmayan başvuru sahibi,
 * fiyatını değiştiremeyen şef, cevap bekleyen kurye.
 *
 * HESAP SİLME, ROL DEĞİŞTİRME, VEKALETEN GİRİŞ burada YOK ve bilerek yok:
 * geri dönüşü zor işler, telefonda yanlışlıkla dokunulacak yerde durmamalı.
 */
export default function YonetimEkrani() {
  const kenar = useSafeAreaInsets();
  const [sekme, setSekme] = useState<Sekme>("basvuru");

  const ozet = useVeri(() => uclar.ozet(), "yonetim-ozet");
  const basvurular = useVeri(() => uclar.basvurular(), "yonetim-basvuru");
  const fiyatlar = useVeri(() => uclar.fiyatlar(), "yonetim-fiyat");
  const destek = useVeri(() => uclar.destek(), "yonetim-destek");

  const aktif = sekme === "basvuru" ? basvurular : sekme === "fiyat" ? fiyatlar : destek;

  function hepsiniTazele() {
    ozet.tazele();
    aktif.tazele();
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
          refreshing={aktif.tazeleniyor}
          onRefresh={hepsiniTazele}
          tintColor={renk.sari[600]}
          colors={[renk.sari[600]]}
        />
      }
    >
      <View>
        <Metin baslik boyut="3xl">
          Yönetim
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil}>
          Seni bekleyen işler
        </Metin>
      </View>

      {ozet.veri ? <Ozet ozet={ozet.veri} /> : null}

      {/* SEKME ÇUBUĞU — sayılar rozet olarak; hangi kuyruğun dolu olduğu
          içine girmeden görünsün. */}
      <View style={{ flexDirection: "row", gap: bosluk.xs }}>
        <SekmeDugmesi
          etiket="Başvuru"
          adet={ozet.veri?.bekleyenBasvuru ?? 0}
          aktif={sekme === "basvuru"}
          onPress={() => setSekme("basvuru")}
        />
        <SekmeDugmesi
          etiket="Fiyat"
          adet={ozet.veri?.bekleyenFiyat ?? 0}
          aktif={sekme === "fiyat"}
          onPress={() => setSekme("fiyat")}
        />
        <SekmeDugmesi
          etiket="Destek"
          adet={ozet.veri?.acikDestek ?? 0}
          aktif={sekme === "destek"}
          onPress={() => setSekme("destek")}
        />
      </View>

      {aktif.yukleniyor ? (
        <ActivityIndicator color={renk.sari[600]} style={{ marginTop: bosluk.xl }} />
      ) : aktif.hata ? (
        <Metin boyut="sm" renkli={renk.domatesKoyu}>
          {aktif.hata.message}
        </Metin>
      ) : sekme === "basvuru" ? (
        <BasvuruListesi
          liste={basvurular.veri ?? []}
          tazele={() => {
            basvurular.tazele();
            ozet.tazele();
          }}
        />
      ) : sekme === "fiyat" ? (
        <FiyatListesi
          liste={fiyatlar.veri ?? []}
          tazele={() => {
            fiyatlar.tazele();
            ozet.tazele();
          }}
        />
      ) : (
        <DestekListesi
          liste={destek.veri ?? []}
          tazele={() => {
            destek.tazele();
            ozet.tazele();
          }}
        />
      )}
    </ScrollView>
  );
}

/* --------------------------------------------------------------------------
 * Özet
 * ----------------------------------------------------------------------- */

function Ozet({ ozet }: { ozet: YonetimOzetiDto }) {
  return (
    <View style={{ flexDirection: "row", gap: bosluk.sm }}>
      <Kutu deger={`${ozet.acikSiparis}`} etiket="açık sipariş" />
      <Kutu deger={`${ozet.bugunSiparis}`} etiket="bugün sipariş" />
      <Kutu deger={`${ozet.bugunCiro} TL`} etiket="bugün ciro" />
    </View>
  );
}

function Kutu({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <View
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
        {deger}
      </Metin>
      <Metin boyut="2xs" renkli={renk.metinIkincil}>
        {etiket}
      </Metin>
    </View>
  );
}

function SekmeDugmesi({
  etiket,
  adet,
  aktif,
  onPress,
}: {
  etiket: string;
  adet: number;
  aktif: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktif }}
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        borderRadius: yaricap.tam,
        borderWidth: 1,
        borderColor: aktif ? renk.sari[500] : renk.cizgi,
        backgroundColor: aktif ? renk.sari[500] : renk.beyaz,
        paddingVertical: bosluk.sm,
      }}
    >
      <Metin boyut="sm" agirlik="kalin" renkli={aktif ? renk.murekkep : renk.kahve[700]}>
        {etiket}
      </Metin>
      {adet > 0 ? (
        <View
          style={{
            minWidth: 18,
            paddingHorizontal: 5,
            borderRadius: yaricap.tam,
            backgroundColor: aktif ? renk.murekkep : renk.domates,
            alignItems: "center",
          }}
        >
          <Metin boyut="2xs" agirlik="kalin" renkli={aktif ? renk.sari[500] : renk.beyaz}>
            {adet}
          </Metin>
        </View>
      ) : null}
    </Pressable>
  );
}

/* --------------------------------------------------------------------------
 * Başvurular
 * ----------------------------------------------------------------------- */

const ROLLER: { deger: string; etiket: string }[] = [
  { deger: "ev-hanimi", etiket: "Ev Hanımı" },
  { deger: "sef", etiket: "Şef" },
  { deger: "isletme", etiket: "İşletme" },
  { deger: "kurye", etiket: "Kurye" },
];

function BasvuruListesi({
  liste,
  tazele,
}: {
  liste: YonetimBasvurusuDto[];
  tazele: () => void;
}) {
  if (liste.length === 0) return <Bos metin="Onay bekleyen başvuru yok." />;
  return (
    <>
      {liste.map((b) => (
        <BasvuruKarti key={b.id} basvuru={b} tazele={tazele} />
      ))}
    </>
  );
}

function BasvuruKarti({
  basvuru,
  tazele,
}: {
  basvuru: YonetimBasvurusuDto;
  tazele: () => void;
}) {
  /*
   * ROL BAŞVURUDA SEÇİLENLE BAŞLIYOR ama değiştirilebiliyor: kişinin
   * yazdığı bir TALEP, karar yöneticinin. "Şef" diye başvuran birini
   * ev hanımı olarak açmak da mümkün.
   */
  const [rol, setRol] = useState<string>(basvuru.tur);
  const [semt, setSemt] = useState("");
  const [not, setNot] = useState("");
  const [bekliyor, setBekliyor] = useState(false);

  async function karar(secim: "onayla" | "reddet") {
    setBekliyor(true);
    try {
      const cevap = await uclar.basvuruKarar(basvuru.id, {
        karar: secim,
        ...(secim === "onayla" ? { rol, semt: semt.trim() } : {}),
        not: not.trim(),
      });
      Alert.alert("Tamam", cevap.basari);
      tazele();
    } catch (e) {
      Alert.alert("Olmadı", e instanceof ApiHatasi ? e.message : "İşlem tamamlanamadı.");
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <View
      style={{
        borderRadius: yaricap["2xl"],
        borderWidth: 1,
        borderColor: renk.cizgi,
        padding: bosluk.lg,
        gap: bosluk.sm,
      }}
    >
      <View style={{ gap: 2 }}>
        <Metin baslik boyut="lg">
          {basvuru.ad}
        </Metin>
        <Metin boyut="2xs" renkli={renk.metinIkincil}>
          {basvuru.turAdi} · {basvuru.telefon} · {basvuru.eposta}
        </Metin>
      </View>

      {/* TANITIM METNİ kısaltılmıyor: yönetici kararını buna bakarak veriyor. */}
      {basvuru.mesaj ? (
        <View style={{ backgroundColor: renk.krem, borderRadius: yaricap.lg, padding: bosluk.md }}>
          <Metin boyut="sm" renkli={renk.kahve[800]}>
            {basvuru.mesaj}
          </Metin>
        </View>
      ) : null}

      <Metin boyut="2xs" agirlik="kalin" renkli={renk.kahve[700]}>
        HANGİ ROLLE AÇILSIN?
      </Metin>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bosluk.xs }}>
        {ROLLER.map((r) => {
          const secili = rol === r.deger;
          return (
            <Pressable
              key={r.deger}
              accessibilityRole="button"
              accessibilityState={{ selected: secili }}
              onPress={() => setRol(r.deger)}
              style={{
                borderRadius: yaricap.tam,
                borderWidth: 1,
                borderColor: secili ? renk.sari[500] : renk.cizgi,
                backgroundColor: secili ? renk.sari[500] : renk.beyaz,
                paddingHorizontal: bosluk.md,
                paddingVertical: 5,
              }}
            >
              <Metin boyut="2xs" agirlik="kalin" renkli={secili ? renk.murekkep : renk.kahve[700]}>
                {r.etiket}
              </Metin>
            </Pressable>
          );
        })}
      </View>

      {/* Kurye dışındaki rollerde kişinin adıyla bir mutfak açılıyor; semt o
          mutfağın semti oluyor. */}
      {rol !== "kurye" ? (
        <Kutucuk deger={semt} setDeger={setSemt} yerTutucu="Mutfağın semti (örn. Beylikdüzü)" />
      ) : null}

      <Kutucuk deger={not} setDeger={setNot} yerTutucu="Not (ret gerekçesi ya da iç not)" />

      <View style={{ flexDirection: "row", gap: bosluk.sm }}>
        <View style={{ flex: 1 }}>
          <Dugme baslik="Onayla" onPress={() => karar("onayla")} bekliyor={bekliyor} tamGenislik />
        </View>
        <View style={{ flex: 1 }}>
          <Dugme
            baslik="Reddet"
            tur="sade"
            tamGenislik
            onPress={() =>
              Alert.alert("Başvuruyu reddet", `${basvuru.ad} için başvuru reddedilsin mi?`, [
                { text: "Vazgeç", style: "cancel" },
                { text: "Reddet", style: "destructive", onPress: () => karar("reddet") },
              ])
            }
          />
        </View>
      </View>
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Fiyat talepleri
 * ----------------------------------------------------------------------- */

function FiyatListesi({ liste, tazele }: { liste: YonetimFiyatTalebiDto[]; tazele: () => void }) {
  const [bekleyen, setBekleyen] = useState<string | null>(null);

  async function karar(urunId: string, secim: "onayla" | "reddet") {
    setBekleyen(urunId);
    try {
      const cevap = await uclar.fiyatKarar(urunId, secim);
      Alert.alert("Tamam", cevap.basari);
      tazele();
    } catch (e) {
      Alert.alert("Olmadı", e instanceof ApiHatasi ? e.message : "İşlem tamamlanamadı.");
    } finally {
      setBekleyen(null);
    }
  }

  if (liste.length === 0) return <Bos metin="Onay bekleyen fiyat talebi yok." />;

  return (
    <>
      {liste.map((f) => (
        <View
          key={f.urunId}
          style={{
            borderRadius: yaricap["2xl"],
            borderWidth: 1,
            borderColor: renk.cizgi,
            padding: bosluk.lg,
            gap: bosluk.sm,
          }}
        >
          <View style={{ gap: 2 }}>
            <Metin baslik boyut="lg">
              {f.urunAdi}
            </Metin>
            <Metin boyut="2xs" renkli={renk.metinIkincil}>
              {f.restoranAdi}
            </Metin>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
            <Metin boyut="lg" renkli={renk.metinIkincil} style={{ textDecorationLine: "line-through" }}>
              {f.mevcutFiyat} TL
            </Metin>
            <MaterialCommunityIcons name="arrow-right" size={16} color={renk.kahve[500]} />
            <Metin baslik boyut="xl">
              {f.istenenFiyat} TL
            </Metin>
          </View>

          <View style={{ flexDirection: "row", gap: bosluk.sm }}>
            <View style={{ flex: 1 }}>
              <Dugme
                baslik="Onayla"
                onPress={() => karar(f.urunId, "onayla")}
                bekliyor={bekleyen === f.urunId}
                tamGenislik
              />
            </View>
            <View style={{ flex: 1 }}>
              <Dugme
                baslik="Reddet"
                tur="sade"
                onPress={() => karar(f.urunId, "reddet")}
                tamGenislik
              />
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

/* --------------------------------------------------------------------------
 * Destek
 * ----------------------------------------------------------------------- */

function DestekListesi({ liste, tazele }: { liste: YonetimDestekDto[]; tazele: () => void }) {
  if (liste.length === 0) return <Bos metin="Destek talebi yok." />;
  return (
    <>
      {liste.map((t) => (
        <DestekKarti key={t.id} talep={t} tazele={tazele} />
      ))}
    </>
  );
}

function DestekKarti({ talep, tazele }: { talep: YonetimDestekDto; tazele: () => void }) {
  const [yanit, setYanit] = useState(talep.yanit ?? "");
  const [bekliyor, setBekliyor] = useState(false);
  const acik = talep.durum === "acik";

  async function gonder(durum?: "acik" | "cozuldu") {
    setBekliyor(true);
    try {
      await uclar.destekGuncelle(talep.id, {
        ...(yanit.trim() ? { yanit: yanit.trim() } : {}),
        ...(durum ? { durum } : {}),
      });
      tazele();
    } catch (e) {
      Alert.alert("Olmadı", e instanceof ApiHatasi ? e.message : "Talep güncellenemedi.");
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <View
      style={{
        borderRadius: yaricap["2xl"],
        borderWidth: 1,
        borderColor: acik ? `${renk.sari[500]}66` : renk.cizgi,
        padding: bosluk.lg,
        gap: bosluk.sm,
        opacity: acik ? 1 : 0.7,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Metin baslik boyut="md">
            {talep.konu}
          </Metin>
          <Metin boyut="2xs" renkli={renk.metinIkincil}>
            {talep.no} · {talep.ad}
            {talep.telefon ? ` · ${talep.telefon}` : ""}
            {talep.siparisNo ? ` · ${talep.siparisNo}` : ""}
          </Metin>
        </View>
        <Metin boyut="2xs" agirlik="kalin" renkli={acik ? renk.domatesKoyu : renk.naneKoyu}>
          {acik ? "AÇIK" : "ÇÖZÜLDÜ"}
        </Metin>
      </View>

      <Metin boyut="sm" renkli={renk.kahve[800]}>
        {talep.mesaj}
      </Metin>

      <TextInput
        value={yanit}
        onChangeText={setYanit}
        placeholder="Yanıtın…"
        placeholderTextColor={renk.kahve[300]}
        multiline
        maxLength={2000}
        style={{
          minHeight: 70,
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

      <View style={{ flexDirection: "row", gap: bosluk.sm }}>
        <View style={{ flex: 1 }}>
          <Dugme
            baslik="Yanıtı gönder"
            onPress={() => gonder()}
            bekliyor={bekliyor}
            pasif={!yanit.trim()}
            tamGenislik
          />
        </View>
        <View style={{ flex: 1 }}>
          {/* Yanıt yazmak "çözüldü" demek değil: durum ayrı düğmede. */}
          <Dugme
            baslik={acik ? "Çözüldü" : "Yeniden aç"}
            tur="ikincil"
            onPress={() => gonder(acik ? "cozuldu" : "acik")}
            tamGenislik
          />
        </View>
      </View>
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Ortak küçük parçalar
 * ----------------------------------------------------------------------- */

function Kutucuk({
  deger,
  setDeger,
  yerTutucu,
}: {
  deger: string;
  setDeger: (d: string) => void;
  yerTutucu: string;
}) {
  return (
    <TextInput
      value={deger}
      onChangeText={setDeger}
      placeholder={yerTutucu}
      placeholderTextColor={renk.kahve[300]}
      style={{
        borderWidth: 1,
        borderColor: renk.cizgi,
        borderRadius: yaricap.lg,
        paddingHorizontal: bosluk.md,
        paddingVertical: bosluk.sm,
        color: renk.kahve[900],
        fontFamily: yaziAilesi.govde,
        ...yazi.sm,
      }}
    />
  );
}

function Bos({ metin }: { metin: string }) {
  return (
    <View style={{ alignItems: "center", gap: bosluk.sm, paddingVertical: bosluk["3xl"] }}>
      <MaterialCommunityIcons name="check-all" size={36} color={renk.nane} />
      <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
        {metin}
      </Metin>
    </View>
  );
}
