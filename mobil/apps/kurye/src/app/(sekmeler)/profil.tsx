import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { bosluk, renk, yaricap } from "ortak";

import { useOturum } from "ortak/oturum";
import { Bosluk, Dugme } from "ortak/ui";
import { Metin } from "ortak/ui";
import { Sayfa } from "ortak/ui";

const ROL_ADI: Record<string, string> = {
  admin: "Yönetici",
  sef: "Şef",
  isletme: "İşletme",
  kurye: "Kurye",
  musteri: "Müşteri",
};

export default function ProfilEkrani() {
  const { durum, cikisYap } = useOturum();
  const yonlendir = useRouter();
  if (durum.asama !== "girisli") return null;

  const { kullanici } = durum;

  return (
    <Sayfa baslik="Profil">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.lg,
          padding: bosluk.lg,
          borderRadius: yaricap["2xl"],
          borderWidth: 1,
          borderColor: renk.cizgi,
          backgroundColor: renk.krem,
        }}
      >
        <Avatar ad={kullanici.ad} fotografUrl={kullanici.fotografUrl} />

        <View style={{ flex: 1, gap: 2 }}>
          <Metin baslik boyut="lg" numberOfLines={1}>
            {kullanici.ad || "İsimsiz"}
          </Metin>
          <Metin boyut="sm" renkli={renk.metinIkincil} numberOfLines={1}>
            {kullanici.eposta}
          </Metin>
          <Metin boyut="xs" agirlik="kalin" renkli={renk.kahve[600]}>
            {ROL_ADI[kullanici.rol] ?? kullanici.rol}
          </Metin>
        </View>
      </View>

      {/*
        Doğrulanmamış e-posta kişiyi KAPIDA BIRAKMIYOR (web'de de öyle) —
        yalnızca uyarılıyor. Parola sıfırlama gibi e-postaya güvenen akışlar
        doğrulama istiyor; o akış mobile geldiğinde buraya bir eylem düğmesi
        eklenecek.
      */}
      {!kullanici.epostaDogrulandi ? (
        <>
          <Bosluk y={bosluk.lg} />
          <View
            style={{
              padding: bosluk.lg,
              borderRadius: yaricap.lg,
              backgroundColor: `${renk.sari[500]}26`,
            }}
          >
            <Metin boyut="sm" agirlik="orta" renkli={renk.kahve[800]}>
              E-posta adresin henüz doğrulanmadı.
            </Metin>
          </View>
        </>
      ) : null}

      <Bosluk y={bosluk["2xl"]} />

      {/*
        DESTEĞE İKİNCİ KAPI. Tek giriş ana ekranın sağ üstündeki küçük
        simgeydi; kurye "yetkiliye nasıl ulaşırım" diye ararken önce profile
        bakıyor. Sekme AÇILMADI: destek her gün açılan bir yer değil ve
        beşinci sekme, vardiya boyunca kullanılan üçünü daraltırdı.
      */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Destek — yetkiliyi ara ya da talep aç"
        onPress={() => yonlendir.push("/destek")}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.md,
          padding: bosluk.lg,
          borderRadius: yaricap["2xl"],
          borderWidth: 1,
          borderColor: renk.cizgi,
          backgroundColor: pressed ? renk.kahve[50] : renk.beyaz,
        })}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: yaricap.tam,
            backgroundColor: renk.sari[500],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="headset" size={20} color={renk.murekkep} />
        </View>
        <View style={{ flex: 1 }}>
          <Metin baslik boyut="md">
            Destek
          </Metin>
          <Metin boyut="xs" renkli={renk.metinIkincil}>
            Yetkiliyi ara ya da yazılı talep aç
          </Metin>
        </View>
        <Ionicons name="chevron-forward" size={18} color={renk.kahve[300]} />
      </Pressable>

      <Bosluk y={bosluk.lg} />

      <Dugme baslik="Çıkış yap" tur="ikincil" onPress={cikisYap} tamGenislik />
    </Sayfa>
  );
}

/**
 * Profil fotoğrafı; yoksa adın baş harfleri.
 *
 * Web tarafında da aynı kural geçerli (bkz. Hesap.fotografUrl açıklaması):
 * fotoğraf zorunlu değil ve eksikliği hiçbir ekranı bozmuyor.
 */
function Avatar({ ad, fotografUrl }: { ad: string; fotografUrl?: string }) {
  const olcu = 56;

  if (fotografUrl) {
    return (
      <Image
        source={{ uri: fotografUrl }}
        style={{ width: olcu, height: olcu, borderRadius: yaricap.tam }}
        contentFit="cover"
        /* Ağdan her açılışta yeniden indirmesin; liste kaydırırken de aynı. */
        cachePolicy="memory-disk"
        transition={200}
        accessibilityLabel={`${ad} profil fotoğrafı`}
      />
    );
  }

  const harfler = ad
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toLocaleUpperCase("tr-TR");

  return (
    <View
      style={{
        width: olcu,
        height: olcu,
        borderRadius: yaricap.tam,
        backgroundColor: renk.sari[500],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Metin baslik boyut="lg" agirlik="kalin" renkli={renk.murekkep}>
        {harfler || "?"}
      </Metin>
    </View>
  );
}
