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
 * @param {object} ozel Uygulamaya özel alanlar
 * @param {string} ozel.ad Mağazada görünen ad
 * @param {string} ozel.slug EAS proje kimliği
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

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      apiTaban: apiTabani(),
    },
  };
}

module.exports = { ortakYapilandirma, MARKA, SURUM };
