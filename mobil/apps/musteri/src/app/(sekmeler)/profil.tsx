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

  /*
   * Misafir de bu sekmeye girebiliyor: katalog hesap istemiyor (bkz. kök
   * yerleşimindeki 5.1.1(v) notu). `null` dönülseydi girişsiz kullanıcı boş
   * beyaz bir ekran görür ve giriş yapacak yeri hiç bulamazdı — çıkış
   * yaptıktan sonra geri dönmenin tek yolu da burası.
   */
  if (durum.asama !== "girisli") return <MisafirProfili />;

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
      {/*
        Doğrulanmamış e-posta artık DOKUNULABİLİR: eskiden yalnızca "adresin
        doğrulanmadı" yazıyordu ve doğrulamanın yolu uygulamada yoktu — kişi
        uyarıyı okuyup hiçbir şey yapamıyordu.
      */}
      {!kullanici.epostaDogrulandi ? (
        <>
          <Bosluk y={bosluk.lg} />
          <Pressable
            accessibilityRole="button"
            onPress={() => yonlendir.push("/hesap-ayarlari")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: bosluk.sm,
              padding: bosluk.lg,
              borderRadius: yaricap.lg,
              backgroundColor: `${renk.sari[500]}26`,
            }}
          >
            <Metin boyut="sm" agirlik="orta" renkli={renk.kahve[800]} style={{ flex: 1 }}>
              E-posta adresin henüz doğrulanmadı. Doğrulamak için dokun.
            </Metin>
            <Metin boyut="sm" agirlik="kalin" renkli={renk.kahve[800]}>
              →
            </Metin>
          </Pressable>
        </>
      ) : null}

      <Bosluk y={bosluk.xl} />

      {/* Sipariş geçmişi kendi sekmesinde; buradaki kısayollar hesabın kendisi. */}
      <Dugme
        baslik="Hesap ayarları"
        tur="ikincil"
        onPress={() => yonlendir.push("/hesap-ayarlari")}
        tamGenislik
      />

      <Bosluk y={bosluk.sm} />

      <Dugme
        baslik="Kendi mutfağını aç"
        tur="ikincil"
        onPress={() => yonlendir.push("/basvuru")}
        tamGenislik
      />

      <Bosluk y={bosluk["2xl"]} />

      <Dugme baslik="Çıkış yap" tur="ikincil" onPress={cikisYap} tamGenislik />
    </Sayfa>
  );
}

/**
 * Girişsiz kullanıcının profil sekmesi.
 *
 * Kayıt ekranı YOK, yalnızca giriş var: hesap açmak şu an web üzerinden
 * yürüyor (şef/ev hanımı/kurye başvurusu yönetici onayından geçiyor, müşteri
 * kaydı e-posta doğrulaması istiyor). Uygulamaya yarım bir kayıt formu koymak,
 * onay bekleyen kişiyi "kaydoldum ama giremiyorum" durumunda bırakırdı.
 */
function MisafirProfili() {
  const yonlendir = useRouter();

  return (
    <Sayfa baslik="Profil">
      <View
        style={{
          alignItems: "center",
          gap: bosluk.md,
          padding: bosluk.xl,
          borderRadius: yaricap["2xl"],
          borderWidth: 1,
          borderColor: renk.cizgi,
          backgroundColor: renk.krem,
        }}
      >
        <Metin baslik boyut="lg" ortala>
          Henüz giriş yapmadın
        </Metin>
        <Metin boyut="sm" renkli={renk.metinIkincil} ortala>
          Mutfaklara ve menülere bakmaya devam edebilirsin. Sipariş vermek,
          adreslerini ve geçmiş siparişlerini görmek için giriş yap.
        </Metin>
        <Bosluk y={bosluk.xs} />
        <Dugme baslik="Giriş yap" onPress={() => yonlendir.push("/giris")} tamGenislik />
      </View>
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
