import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, golge, renk, yaricap, yazi, yaziAilesi, type SiparisKalemDto } from "ortak";
import { useOturum } from "ortak/oturum";
import { Dugme, Metin } from "ortak/ui";

import { useSepet } from "@/sepet/Baglam";

/**
 * SEPET EKRANI.
 *
 * Gösterilen her rakam SUNUCUDAN geliyor (bkz. sepet/Baglam.tsx). Ekran
 * hiçbir çarpma toplama yapmıyor; yaptığı tek şey gelen özeti çizmek. Böylece
 * burada görünen tutar ile ödeme adımında çekilecek tutarın ayrışması
 * yapısal olarak mümkün değil.
 */
export default function SepetEkrani() {
  const kenar = useSafeAreaInsets();
  const yonlendir = useRouter();
  const { durum } = useOturum();
  const { kalemler, restoranAdi, ozet, hesaplaniyor, adetAyarla, temizle, kuponKodu, kuponAyarla } =
    useSepet();

  const [kuponMetni, setKuponMetni] = useState(kuponKodu ?? "");

  const bos = kalemler.length === 0;

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
          onPress={() => yonlendir.back()}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={renk.kahve[900]} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Metin baslik boyut="xl">
            Sepetim
          </Metin>
          {restoranAdi ? (
            <Metin boyut="xs" renkli={renk.metinIkincil} numberOfLines={1}>
              {restoranAdi}
            </Metin>
          ) : null}
        </View>
        {!bos ? (
          <Pressable accessibilityRole="button" onPress={temizle} hitSlop={8}>
            <Metin boyut="sm" agirlik="orta" renkli={renk.domates}>
              Boşalt
            </Metin>
          </Pressable>
        ) : null}
      </View>

      {bos ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: bosluk.md,
            padding: bosluk.xl,
          }}
        >
          <MaterialCommunityIcons name="basket-outline" size={44} color={renk.kahve[300]} />
          <Metin baslik boyut="lg" ortala>
            Sepetin boş
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
            Komşunun mutfağına göz at, beğendiğini sepete ekle.
          </Metin>
          <Dugme baslik="Mutfaklara bak" onPress={() => yonlendir.replace("/")} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: bosluk.lg,
              paddingBottom: bosluk["3xl"],
            }}
          >
            {/*
              Kalemler SUNUCUNUN çözdüğü listeden çiziliyor, cihazdakinden
              değil: ad ve fiyat orada güncel. Özet henüz gelmediyse cihazdaki
              adlarla bir ara görüntü çiziliyor — boş ekran göstermektense.
            */}
            {ozet
              ? ozet.kalemler.map((kalem) => (
                  <Kalem key={kalem.satirId} kalem={kalem} adetAyarla={adetAyarla} />
                ))
              : kalemler.map((k) => (
                  <View key={k.satirId} style={{ paddingVertical: bosluk.md }}>
                    <Metin boyut="md">
                      {k.adet} × {k.ad}
                    </Metin>
                  </View>
                ))}

            <Kupon
              metin={kuponMetni}
              setMetin={setKuponMetni}
              uygulanan={ozet?.tutarlar.kuponKodu ?? null}
              hata={ozet?.kuponHatasi ?? null}
              uygula={() => kuponAyarla(kuponMetni)}
              kaldir={() => {
                setKuponMetni("");
                kuponAyarla(null);
              }}
            />

            {ozet ? <Tutarlar ozet={ozet} /> : null}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: bosluk.lg,
              paddingTop: bosluk.md,
              paddingBottom: kenar.bottom + bosluk.md,
              borderTopWidth: 1,
              borderTopColor: renk.cizgi,
              backgroundColor: renk.beyaz,
              gap: bosluk.sm,
            }}
          >
            {ozet && !ozet.tutarlar.minSepetKarsilandi ? (
              /*
               * Minimum sepet uyarısı düğmenin ÜSTÜNDE, düğme de pasif.
               * Yalnızca pasif düğme bırakılsaydı kullanıcı neden
               * basamadığını bilemezdi.
               */
              <Metin boyut="xs" renkli={renk.domatesKoyu} ortala>
                Minimum sepet tutarı {ozet.tutarlar.minSepet} ₺. {""}
                {Math.max(0, ozet.tutarlar.minSepet - ozet.tutarlar.araToplam)} ₺ daha eklemelisin.
              </Metin>
            ) : null}

            <Dugme
              baslik={
                durum.asama === "girisli" ? "Siparişi tamamla" : "Giriş yap ve devam et"
              }
              tamGenislik
              bekliyor={hesaplaniyor && !ozet}
              pasif={!ozet || !ozet.tutarlar.minSepetKarsilandi}
              onPress={() => {
                /*
                 * Giriş KAPIDA değil BURADA isteniyor: sipariş gerçek bir
                 * kimlik gerektiriyor (adres, telefon, ödeme). Katalog ve
                 * sepet misafire açık — bkz. kök yerleşimindeki 5.1.1(v) notu.
                 */
                if (durum.asama !== "girisli") yonlendir.push("/giris");
                else yonlendir.push("/odeme");
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}

function Kalem({
  kalem,
  adetAyarla,
}: {
  kalem: SiparisKalemDto;
  adetAyarla: (satirId: string, adet: number) => void;
}) {
  const ekstraToplam = kalem.ekstralar?.reduce((t, e) => t + e.fiyat, 0) ?? 0;
  const satirToplam = (kalem.fiyat + ekstraToplam) * kalem.adet;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: bosluk.md,
        paddingVertical: bosluk.md,
        borderBottomWidth: 1,
        borderBottomColor: renk.cizgi,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Metin boyut="md" agirlik="orta">
          {kalem.ad}
        </Metin>
        {kalem.ekstralar && kalem.ekstralar.length > 0 ? (
          <Metin boyut="xs" renkli={renk.metinIkincil}>
            {kalem.ekstralar.map((e) => e.ad).join(", ")}
          </Metin>
        ) : null}
        <Metin boyut="sm" agirlik="kalin">
          {satirToplam} ₺
        </Metin>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.md,
          paddingHorizontal: bosluk.md,
          paddingVertical: 6,
          borderRadius: yaricap.tam,
          borderWidth: 1,
          borderColor: renk.cizgi,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${kalem.ad} azalt`}
          onPress={() => adetAyarla(kalem.satirId, kalem.adet - 1)}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name={kalem.adet === 1 ? "trash-can-outline" : "minus"}
            size={16}
            color={renk.kahve[800]}
          />
        </Pressable>
        <Metin boyut="sm" agirlik="kalin">
          {kalem.adet}
        </Metin>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${kalem.ad} artır`}
          onPress={() => adetAyarla(kalem.satirId, kalem.adet + 1)}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="plus" size={16} color={renk.kahve[800]} />
        </Pressable>
      </View>
    </View>
  );
}

function Kupon({
  metin,
  setMetin,
  uygulanan,
  hata,
  uygula,
  kaldir,
}: {
  metin: string;
  setMetin: (d: string) => void;
  uygulanan: string | null;
  hata: string | null;
  uygula: () => void;
  kaldir: () => void;
}) {
  if (uygulanan) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.sm,
          marginTop: bosluk.lg,
          padding: bosluk.md,
          borderRadius: yaricap.lg,
          backgroundColor: `${renk.nane}1A`,
        }}
      >
        <MaterialCommunityIcons name="ticket-percent-outline" size={18} color={renk.naneKoyu} />
        <Metin boyut="sm" agirlik="orta" renkli={renk.naneKoyu} style={{ flex: 1 }}>
          {uygulanan} uygulandı
        </Metin>
        <Pressable accessibilityRole="button" onPress={kaldir} hitSlop={8}>
          <Metin boyut="sm" renkli={renk.metinIkincil}>
            Kaldır
          </Metin>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ marginTop: bosluk.lg, gap: bosluk.xs }}>
      <View style={{ flexDirection: "row", gap: bosluk.sm }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: bosluk.lg,
            height: 44,
            borderRadius: yaricap.tam,
            borderWidth: 1,
            borderColor: renk.cizgi,
            backgroundColor: renk.krem,
          }}
        >
          <TextInput
            value={metin}
            onChangeText={setMetin}
            placeholder="Kupon kodu"
            placeholderTextColor={renk.metinIkincil}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={uygula}
            returnKeyType="done"
            style={{
              ...yazi.sm,
              fontFamily: yaziAilesi.govde,
              color: renk.metin,
              paddingVertical: 0,
            }}
          />
        </View>
        <Dugme baslik="Uygula" tur="ikincil" onPress={uygula} pasif={metin.trim().length === 0} />
      </View>
      {hata ? (
        <Metin boyut="xs" renkli={renk.domatesKoyu}>
          {hata}
        </Metin>
      ) : null}
    </View>
  );
}

function Tutarlar({ ozet }: { ozet: NonNullable<ReturnType<typeof useSepet>["ozet"]> }) {
  const t = ozet.tutarlar;

  return (
    <View
      style={{
        marginTop: bosluk.lg,
        padding: bosluk.lg,
        borderRadius: yaricap.xl,
        backgroundColor: renk.krem,
        gap: bosluk.sm,
        boxShadow: golge.yumusak,
      }}
    >
      <Satir etiket="Ara toplam" deger={`${t.araToplam} ₺`} />
      <Satir
        etiket="Teslimat"
        deger={t.teslimatUcreti === 0 ? "Ücretsiz" : `${t.teslimatUcreti} ₺`}
      />
      {t.indirim > 0 ? (
        <Satir etiket="İndirim" deger={`-${t.indirim} ₺`} renkli={renk.naneKoyu} />
      ) : null}
      <View style={{ height: 1, backgroundColor: renk.cizgi, marginVertical: bosluk.xs }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Metin baslik boyut="lg">
          Toplam
        </Metin>
        <Metin baslik boyut="lg">
          {t.toplam} ₺
        </Metin>
      </View>
    </View>
  );
}

function Satir({ etiket, deger, renkli }: { etiket: string; deger: string; renkli?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Metin boyut="sm" renkli={renk.metinIkincil}>
        {etiket}
      </Metin>
      <Metin boyut="sm" agirlik="orta" renkli={renkli}>
        {deger}
      </Metin>
    </View>
  );
}
