import type { ExpoConfig } from "expo/config";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ortakYapilandirma, MARKA } = require("ortak/eklentiler/ortak-yapilandirma");

/**
 * NE YERSİN (müşteri uygulaması)
 *
 * Kapsam: müşteri akışının tamamı + şef/işletme paneli + yönetici ekranları.
 * Giriş yapan kişinin rolüne göre farklı sekme takımı açılıyor.
 *
 * ARKA PLAN KONUM İZNİ BİLEREK YOK. Kurye takibi bu uygulamada yalnızca
 * HARİTADA İZLEME olarak var; müşterinin kendi konumu arka planda hiç
 * okunmuyor. İzin burada da istenseydi, uygulamayı indiren herkesin
 * telefonunda sürekli konum izni açılmış olurdu ve Apple incelemede
 * "bu izni ne için kullanıyorsunuz" gerekçesi sorardı. Kurye tarafı bu
 * yüzden ayrı bir binary (apps/kurye).
 */
const yapilandirma: ExpoConfig = ortakYapilandirma({
  ad: "Ne Yersin",
  slug: "ne-yersin",
  paket: "net.neyersin.app",
  sema: "neyersin",

  eklentiler: [
    [
      "expo-notifications",
      {
        /* Bildirim ikonu tek renk olmalı; Android silüet olarak çiziyor. */
        icon: "./assets/images/android-icon-monochrome.png",
        color: MARKA.sari,
      },
    ],
  ],

  ios: {
    infoPlist: {
      /*
       * Sipariş takibi ekranında "beni haritada göster" için — YALNIZCA
       * uygulama açıkken. Arka plan karşılığı (Always) bilerek istenmiyor.
       */
      NSLocationWhenInUseUsageDescription:
        "Teslimat adresini haritada işaretleyebilmen ve siparişini takip ederken kendi konumunu görebilmen için kullanılıyor.",
      /* Profil fotoğrafı ve mutfak görselleri için. */
      NSPhotoLibraryUsageDescription:
        "Profil fotoğrafını değiştirebilmen için galerine erişmemiz gerekiyor.",
      NSCameraUsageDescription:
        "Profil fotoğrafını doğrudan çekebilmen için kameraya erişmemiz gerekiyor.",
    },
  },

  android: {
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "POST_NOTIFICATIONS",
    ],
  },
});

export default yapilandirma;
