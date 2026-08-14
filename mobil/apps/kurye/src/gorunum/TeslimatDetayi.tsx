import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";

import {
  ApiHatasi,
  DOKUNMA_HEDEFI,
  bosluk,
  durumRengi,
  kurye as kuryeUclari,
  renk,
  yaricap,
  type KuryeTeslimatiDto,
} from "ortak";
import { Dugme, Metin } from "ortak/ui";

import { api } from "@/altyapi/api";
import { ara, haritadaAc, type BaglantiSonucu } from "@/altyapi/baglantilar";
import {
  DURUM_ADI,
  HAZIRLANMA_DK,
  alimAdresi,
  siradakiAdim,
  tarihYaz,
  teslimAdresi,
  yonlendirme,
} from "@/teslimat/kurallar";

const uclar = kuryeUclari(api);

/**
 * BİR TESLİMATIN TAM GÖRÜNÜMÜ — hem "Aktif" sekmesi hem de listeden açılan
 * detay bunu kullanıyor.
 *
 * Ekran değil BİLEŞEN olmasının sebebi: iki yerde de birebir aynı bilgi ve
 * aynı düğme gerekiyor. Kopyalansaydı, "teslim ettim" akışına bir onay adımı
 * eklendiğinde biri güncellenip diğeri eskide kalırdı — ve eskide kalanı fark
 * etmek için uygulamayı o yoldan açmak gerekirdi.
 *
 * Adım isteği burada atılıyor; sonucu yukarı `tazele` ile bildiriliyor çünkü
 * listenin tamamı da tazelenmeli (aktif teslimat değişmiş olabilir).
 */
export function TeslimatDetayi({
  teslimat,
  tazele,
}: {
  teslimat: KuryeTeslimatiDto;
  tazele: () => void;
}) {
  const [bekliyor, setBekliyor] = useState(false);
  const adim = siradakiAdim(teslimat.durum);
  const kapidaOdeme = teslimat.tahsilat > 0;
  const yol = yonlendirme(teslimat);

  /** Düğmeye dokunuş: geri alınamayan adımda önce onay. */
  function dokun() {
    if (!adim) return;
    if (!adim.onayIster) {
      void adimAt();
      return;
    }
    Alert.alert(
      "Teslim ettin mi?",
      kapidaOdeme
        ? `${teslimat.tahsilat} ₺ tahsilatı aldığından emin ol. Bu adım geri alınamıyor.`
        : "Bu adım geri alınamıyor.",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Teslim ettim", onPress: () => void adimAt() },
      ],
    );
  }

  async function adimAt() {
    if (!adim) return;
    setBekliyor(true);
    try {
      await uclar.adim(teslimat.siparisNo, adim.hedef);
      tazele();
    } catch (e) {
      /*
       * 409 (`gecersiz_istek`) mesajı sunucudan geliyor ve kuryeye ne
       * yapması gerektiğini söylüyor ("Mutfak bu siparişi henüz hazır olarak
       * işaretlemedi."). Kendi genel metnimizle değiştirmek bilgi kaybı olurdu.
       */
      Alert.alert(
        "İşlem tamamlanmadı",
        e instanceof ApiHatasi ? e.message : "Bağlantını kontrol edip tekrar dene.",
      );
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <View style={{ gap: bosluk.lg }}>
      {/*
        YOL TARİFİ EN ÜSTTE VE TEK. Kurye bu ekranı açtığında yapacağı ilk şey
        yola çıkmak; hangi yola çıkacağını sipariş durumu zaten biliyor
        (bkz. teslimat/kurallar → yonlendirme). Eskiden hem mutfağın hem
        müşterinin yol tarifi düğmesi vardı ve sırayı kurye kendisi seçiyordu.
      */}
      {yol ? <YolTarifi baslik={yol.baslik} kime={yol.kime} adres={yol.adres} /> : null}

      <View
        style={{
          padding: bosluk.lg,
          borderRadius: yaricap.xl,
          backgroundColor: `${durumRengi[teslimat.durum]}1A`,
          gap: 2,
        }}
      >
        <Metin baslik boyut="lg" renkli={durumRengi[teslimat.durum]}>
          {DURUM_ADI[teslimat.durum]}
        </Metin>
        <Metin boyut="sm" renkli={renk.kahve[700]}>
          {teslimat.siparisNo} · {teslimat.kalemSayisi} ürün ·{" "}
          {tarihYaz(teslimat.olusturmaTarihi)}
        </Metin>
      </View>

      {/*
        TAHSİLAT EN ÜSTTE ve kartla ödenmişse de yazıyor. "Tahsilat yok"
        cümlesini görmeyen kurye, kapıda para istemesi gerekip gerekmediğini
        tahmin etmek zorunda kalırdı; sessizlik burada en riskli seçenek.
      */}
      <View
        style={{
          padding: bosluk.lg,
          borderRadius: yaricap.xl,
          borderWidth: 1,
          borderColor: kapidaOdeme ? renk.sari[500] : renk.cizgi,
          backgroundColor: kapidaOdeme ? renk.krem : renk.beyaz,
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.md,
        }}
      >
        <Ionicons
          name={kapidaOdeme ? "cash-outline" : "card-outline"}
          size={24}
          color={kapidaOdeme ? renk.kahve[700] : renk.kahve[300]}
        />
        <View style={{ flex: 1 }}>
          <Metin baslik boyut="md">
            {kapidaOdeme ? `Kapıda tahsil et: ${teslimat.tahsilat} ₺` : "Tahsilat yok"}
          </Metin>
          <Metin boyut="xs" renkli={renk.metinIkincil}>
            {kapidaOdeme ? "Nakit/kart, müşteriden alınacak." : "Sipariş kartla ödendi."}
          </Metin>
        </View>
      </View>

      <Kart
        baslik="Alım — mutfak"
        ad={teslimat.restoranAdi}
        adres={alimAdresi(teslimat)}
        telefon={teslimat.alim.telefon}
        telefonEtiketi="Mutfağı ara"
        simge="restaurant-outline"
      />

      <Kart
        baslik="Teslim — müşteri"
        ad={teslimat.teslim.adSoyad}
        adres={teslimAdresi(teslimat.teslim)}
        tarif={teslimat.teslim.tarif}
        telefon={teslimat.teslim.telefon}
        telefonEtiketi="Müşteriyi ara"
        simge="home-outline"
      />

      {teslimat.not ? (
        <View
          style={{
            padding: bosluk.lg,
            borderRadius: yaricap.xl,
            borderWidth: 1,
            borderColor: renk.cizgi,
            gap: bosluk.xs,
          }}
        >
          <Metin baslik boyut="md">
            Sipariş notu
          </Metin>
          <Metin boyut="sm">{teslimat.not}</Metin>
        </View>
      ) : null}

      {adim ? (
        <Dugme baslik={adim.baslik} bekliyor={bekliyor} tamGenislik onPress={dokun} />
      ) : teslimat.durum === "odendi" || teslimat.durum === "odeme-bekliyor" ? (
        <View
          style={{
            padding: bosluk.lg,
            borderRadius: yaricap.lg,
            backgroundColor: renk.kahve[50],
          }}
        >
          <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[900]} ortala>
            Hazırlanıyor · yaklaşık {HAZIRLANMA_DK} dk
          </Metin>
          <Metin boyut="sm" renkli={renk.kahve[700]} ortala style={{ marginTop: bosluk.xs }}>
            Mutfak siparişi hazır olarak işaretlediğinde “Teslim aldım” düğmesi açılacak.
          </Metin>
        </View>
      ) : null}
    </View>
  );
}

/**
 * ŞU ANKİ DURAK — ekranın en üstündeki tek eylem.
 *
 * KARTIN TAMAMI DOKUNULABİLİR, ayrı bir düğme yok: kurye motor üstünde ve
 * hedef sabit; küçük bir düğmeyi bulmak yerine kartın herhangi bir yerine
 * basması yetiyor.
 */
function YolTarifi({ baslik, kime, adres }: { baslik: string; kime: string; adres: string }) {
  async function ac() {
    const sonuc = await haritadaAc(adres);
    if (!sonuc.tamam) Alert.alert("Açılamadı", sonuc.sebep);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${baslik}: ${adres}`}
      onPress={() => void ac()}
      style={({ pressed }) => ({
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        backgroundColor: pressed ? renk.sari[600] : renk.sari[500],
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
        minHeight: DOKUNMA_HEDEFI * 1.2,
      })}
    >
      <Ionicons name="navigate" size={26} color={renk.murekkep} />
      <View style={{ flex: 1 }}>
        <Metin baslik boyut="lg" renkli={renk.murekkep}>
          {baslik}
        </Metin>
        <Metin boyut="sm" renkli={renk.kahve[800]} numberOfLines={2}>
          {kime} · {adres}
        </Metin>
      </View>
      <Ionicons name="chevron-forward" size={20} color={renk.kahve[800]} />
    </Pressable>
  );
}

/** Alım ya da teslim noktası: adres + tek dokunuşla arama. */
function Kart({
  baslik,
  ad,
  adres,
  tarif,
  telefon,
  telefonEtiketi,
  simge,
}: {
  baslik: string;
  ad: string;
  adres: string;
  tarif?: string;
  telefon?: string;
  telefonEtiketi: string;
  simge: keyof typeof Ionicons.glyphMap;
}) {
  async function calistir(is: Promise<BaglantiSonucu>) {
    const sonuc = await is;
    if (!sonuc.tamam) Alert.alert("Açılamadı", sonuc.sebep);
  }

  return (
    <View
      style={{
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        borderWidth: 1,
        borderColor: renk.cizgi,
        gap: bosluk.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.sm }}>
        <Ionicons name={simge} size={18} color={renk.kahve[400]} />
        <Metin boyut="xs" agirlik="kalin" renkli={renk.metinIkincil}>
          {baslik.toLocaleUpperCase("tr-TR")}
        </Metin>
      </View>

      <Metin baslik boyut="md">
        {ad}
      </Metin>
      <Metin boyut="sm">{adres}</Metin>
      {tarif ? (
        <Metin boyut="xs" renkli={renk.metinIkincil}>
          {tarif}
        </Metin>
      ) : null}

      {/*
        YOL TARİFİ BURADA YOK — ekranın en üstünde, yalnızca sıradaki durak
        için bir tane var (bkz. YolTarifi). Her iki kartta da düğme olması,
        kuryeye her açılışta "şimdi hangisi" sorusunu sorduruyordu.

        Telefon yoksa düğme HİÇ çizilmiyor (pasif de değil): ev hanımlarının
        bir kısmı profiline alım telefonu girmemiş oluyor ve gri bir düğme,
        dokunulunca bir şey olacakmış izlenimi verirdi.
      */}
      {telefon ? (
        <View style={{ flexDirection: "row", marginTop: bosluk.xs }}>
          <Eylem
            etiket={telefonEtiketi}
            simge="call-outline"
            onPress={() => void calistir(ara(telefon))}
          />
        </View>
      ) : null}
    </View>
  );
}

function Eylem({
  etiket,
  simge,
  onPress,
}: {
  etiket: string;
  simge: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiket}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: DOKUNMA_HEDEFI,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: bosluk.sm,
        paddingHorizontal: bosluk.md,
        borderRadius: yaricap.tam,
        borderWidth: 1,
        borderColor: renk.cizgi,
        backgroundColor: pressed ? renk.kahve[50] : renk.beyaz,
      })}
    >
      <Ionicons name={simge} size={18} color={renk.kahve[900]} />
      <Metin boyut="sm" agirlik="kalin">
        {etiket}
      </Metin>
    </Pressable>
  );
}
