import type { ExpoConfig } from "expo/config";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ortakYapilandirma, MARKA } = require("ortak/eklentiler/ortak-yapilandirma");

/**
 * NE YERSİN KURYE
 *
 * Ayrı bir binary olmasının sebebi ARKA PLAN KONUMU. Kurye, telefonu cebinde
 * ekran kapalıyken de konum bildirmek zorunda — müşterinin canlı takibi buna
 * bağlı. Bu izin müşteri uygulamasında bulunsaydı, uygulamayı indiren herkes
 * için sürekli konum izni istenmiş olurdu.
 *
 * İZİN METİNLERİ MAĞAZA İNCELEMESİNİN GEÇTİĞİ YER. Apple, arka plan konumu
 * isteyen uygulamaları elle inceliyor ve metnin "neden" sorusuna somut cevap
 * vermesini bekliyor; "uygulamanın çalışması için gerekli" gibi genel bir
 * cümle doğrudan ret sebebi. Aşağıdaki metinler bu yüzden teslimat işini
 * açıkça anlatıyor.
 */
const yapilandirma: ExpoConfig = ortakYapilandirma({
  ad: "Ne Yersin Kurye",
  slug: "ne-yersin-kurye",
  paket: "net.neyersin.kurye",
  sema: "neyersinkurye",

  eklentiler: [
    [
      "expo-notifications",
      {
        icon: "./assets/images/android-icon-monochrome.png",
        color: MARKA.sari,
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Sana en yakın siparişleri gösterebilmek ve teslimat rotanı çizebilmek için konumun kullanılıyor.",
        locationAlwaysAndWhenInUsePermission:
          "Teslimat sırasında uygulama arka plandayken de konumun paylaşılıyor; müşteri siparişinin nerede olduğunu canlı görüyor. Teslimat bitince paylaşım durur.",
        /*
         * Android'de arka plan konumu, KALICI BİLDİRİMLİ bir ön plan servisi
         * olmadan çalışmıyor (Doze/arka plan kısıtları isteği susturuyor).
         * Bildirim ayrıca dürüstlük gereği: kurye, konumunun paylaşıldığını
         * ekranında görüyor.
         */
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
  ],

  ios: {
    infoPlist: {
      /* Ekran kapalıyken konum güncellemesi alabilmenin tek yolu. */
      UIBackgroundModes: ["location", "remote-notification"],

      /*
       * expo-location bu alanı doldurmazsak İngilizce şablon metniyle
       * ("Allow $(PRODUCT_NAME) to access your location") bırakıyor. Apple,
       * amacı açıklamayan genel izin metinlerini reddediyor — üstelik metin
       * kullanıcıya da İngilizce görünürdü. Alan iOS 10 ve öncesi için
       * kalmış olsa da Info.plist'e yazıldığı için düzeltiliyor.
       */
      NSLocationAlwaysUsageDescription:
        "Teslimat sırasında uygulama arka plandayken de konumun paylaşılıyor; müşteri siparişinin nerede olduğunu canlı görüyor. Teslimat bitince paylaşım durur.",
    },
  },

  android: {
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
      "POST_NOTIFICATIONS",
      /* Teslimat sırasında ekranın sönmemesi için (expo-keep-awake). */
      "WAKE_LOCK",
    ],
  },
});

export default yapilandirma;
