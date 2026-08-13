/**
 * İki uygulamanın PAYLAŞTIĞI Expo yapılandırması.
 *
 * `app.config.ts` dosyaları bunu çağırıp kendi farklarını üstüne biniyor.
 * Ortaklaştırmanın sebebi: sürüm numarası, marka renkleri, API adresi ve
 * 120 fps eklentisi iki uygulamada da AYNI olmalı. Ayrı ayrı yazılsaydı
 * biri güncellenip diğeri unutulurdu — özellikle `surum` alanı, mağazaya
 * iki farklı sürüm numarasıyla çıkmak demek olurdu.
 *
 * Düz JavaScript: Expo bu dosyayı yapılandırma okurken Node içinde
 * çalıştırıyor, Metro'dan geçmiyor.
 */

/** Marka paleti — src/app/globals.css ile aynı değerler. */
const MARKA = {
  sari: "#fdc806",
  kahveKoyu: "#241608",
  murekkep: "#141210",
  beyaz: "#ffffff",
};

/**
 * Sunucu adresi.
 *
 * Geliştirmede telefon, bilgisayarın `localhost`una ulaşamaz — bu yüzden
 * `EXPO_PUBLIC_API_TABAN` ile makinenin yerel ağ adresi veriliyor
 * (ör. http://192.168.1.20:3000). Tanımsızsa canlı sunucu kullanılıyor.
 */
function apiTabani() {
  return process.env.EXPO_PUBLIC_API_TABAN ?? "https://neyersin.net";
}

/**
 * Android'de harita için Google Maps anahtarı ZORUNLU (iOS'ta Apple Maps
 * kullanıldığı için gerekmiyor). Anahtar koda gömülmüyor; tanımlı değilse
 * yapılandırmaya hiç eklenmiyor ve harita gri görünüyor — sessizce
 * çalışıyormuş gibi yapmaktansa eksikliğin görünmesi tercih edildi.
 */
function haritaAnahtari() {
  const anahtar = (process.env.GOOGLE_MAPS_ANAHTARI ?? "").trim();
  return anahtar.length > 0 ? { googleMaps: { apiKey: anahtar } } : undefined;
}

/** Her iki uygulamanın da kullandığı sürüm — mağaza sürümü buradan yönetiliyor. */
const SURUM = "1.0.0";

/**
 * Derlemelerin gittiği Expo hesabı. Yazılı olması, başka bir hesapla giriş
 * yapılmış kabukta `eas build` çalıştırıldığında sessizce yanlış hesaba proje
 * açılmasını engelliyor — EAS bu durumda hata veriyor.
 */
const SAHIP = "neyersin";

/**
 * @param {object} ozel Uygulamaya özel alanlar
 * @param {string} ozel.ad Mağazada görünen ad
 * @param {string} ozel.slug EAS projesinin adı (expo.dev/accounts/neyersin/projects/…)
 * @param {string} ozel.easProje EAS proje kimliği (UUID)
 * @param {string} ozel.paket iOS bundleIdentifier / Android package
 * @param {string} ozel.sema Derin bağlantı şeması
 * @param {any[]} [ozel.eklentiler] Ek config plugin'leri
 * @param {object} [ozel.ios] iOS üzerine binen alanlar
 * @param {object} [ozel.android] Android üzerine binen alanlar
 */
function ortakYapilandirma(ozel) {
  return {
    name: ozel.ad,
    slug: ozel.slug,
    owner: SAHIP,
    version: SURUM,
    orientation: "portrait",
    scheme: ozel.sema,

    /*
     * Site yalnızca AÇIK temada tasarlandı (globals.css'te koyu palet yok).
     * "automatic" bırakılsaydı koyu tema seçili telefonlarda yarısı koyu,
     * yarısı açık bir arayüz çıkardı.
     */
    userInterfaceStyle: "light",

    /* 120 fps'in ön koşulu — eski köprü mimarisi bu kare bütçesini taşımıyor. */
    newArchEnabled: true,

    icon: "./assets/images/icon.png",

    ios: {
      supportsTablet: true,
      bundleIdentifier: ozel.paket,
      ...ozel.ios,
    },

    android: {
      package: ozel.paket,
      adaptiveIcon: {
        backgroundColor: MARKA.sari,
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      ...(haritaAnahtari() ? { config: haritaAnahtari() } : {}),
      ...ozel.android,
    },

    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          backgroundColor: MARKA.sari,
          image: "./assets/images/splash-icon.png",
          imageWidth: 180,
        },
      ],
      /* iOS ProMotion kilidini ve Android yenileme hızını açar. */
      "ortak/eklentiler/yuksek-fps",
      ...(ozel.eklentiler ?? []),
    ],

    /*
     * HAVADAN GÜNCELLEME (EAS Update).
     *
     * JS ve varlıklar mağazadan/APK'dan bağımsız güncelleniyor: `eas update`
     * yeni paketi yayınlıyor, uygulama bir sonraki açılışta indirip
     * ONDAN SONRAKİ açılışta uyguluyor. Bir metin düzeltmesi için herkese
     * yeniden APK kurdurmak, sahadaki kuryenin vardiya ortasında uygulama
     * indirmesi demekti.
     *
     * NATIVE DEĞİŞİKLİK BUNUN DIŞINDA: yeni bir native paket, izin ya da SDK
     * yükseltmesi hâlâ yeni derleme istiyor. `fingerprint` politikası tam da
     * bunun için — native taraf değiştiğinde çalışma zamanı sürümü kendiliğinden
     * değişiyor ve eski APK, çalıştıramayacağı bir güncellemeyi İNDİRMİYOR.
     * Elle yönetilen bir sürüm numarasında bu ayrımı yapmayı unutmak,
     * kuryenin telefonunda açılışta çöken bir uygulama demekti.
     */
    updates: {
      url: `https://u.expo.dev/${ozel.easProje}`,
      /*
       * Açılışta güncelleme İNDİRİLENE KADAR BEKLENMİYOR (0). Bekleseydi,
       * şebekesi zayıf bir kurye her açılışta beyaz ekranda kalırdı; eldeki
       * paket hemen açılıyor, yeni paket arka planda iniyor.
       */
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: { policy: "fingerprint" },

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      apiTaban: apiTabani(),
      /*
       * Anahtarın KENDİSİ değil, VARLIĞI paylaşılıyor. Uygulama anahtar
       * yokken haritayı hiç kurmuyor, yerine markalı bir yer tutucu çiziyor
       * (bkz. gorunum/Harita.tsx) — anahtarsız react-native-maps Android'de
       * boş gri bir dikdörtgen bırakıyor ve bu, ekranın bozuk olduğu izlenimi
       * veriyor. Anahtarın kendisi JS paketine ASLA girmiyor; yalnızca native
       * yapılandırmaya yazılıyor.
       */
      haritaVar: Boolean(haritaAnahtari()),
      /*
       * Yapılandırma DİNAMİK (app.config.ts) olduğu için `eas init` bu
       * kimliği kendisi yazamıyor, ekrana basıp elle eklenmesini istiyor —
       * app.json kullanılsaydı otomatik yazardı. Elle eklendi.
       */
      eas: { projectId: ozel.easProje },
    },
  };
}

module.exports = { ortakYapilandirma, MARKA, SURUM };
