import * as Notifications from "expo-notifications";
import { Platform, Vibration } from "react-native";

/**
 * YENİ İŞ UYARISI — ses ve titreşim.
 *
 * Kuryenin telefonu cebinde ya da motorun üstündeki tutucuda; teklifin ömrü
 * 45 saniye. Sessizce açılan bir ekran, kurye ekrana bakmadığı sürece işi
 * kaçırması demekti — üstelik kaçırılan teklif kabul oranını da düşürüyor.
 *
 * SES İÇİN YENİ BİR NATIVE PAKET EKLENMEDİ. `expo-audio` doğrudan ses
 * çalardı ama yeni bir native bağımlılık, yeni bir APK derlemesi ve herkesin
 * elle kurması demek. `expo-notifications` ZATEN kurulu; yerel bir bildirim
 * hem sistem sesini çalıyor hem de uygulama arka plandayken bildirim
 * merkezine düşüyor. Böylece bu özellik havadan güncellemeyle gidebiliyor.
 *
 * TİTREŞİM AYRI BİR KANAL: telefon sessizdeyse ses çalmıyor ama titreşim
 * çalışıyor. Kurye çoğu zaman gürültülü bir yerde ve sesi duymuyor; ikisini
 * birden kullanmak, tek başına sese güvenmekten çok daha güvenilir.
 */

/**
 * Bildirim uygulama ÖNDEYKEN de görünsün.
 *
 * Varsayılan davranış, uygulama açıkken bildirimi göstermemek. Teklif katı
 * zaten ekranda ama sesi getiren şey bildirimin kendisi; gösterilmezse ses
 * de çalmıyor.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

/** Android'de sesin çalması için kanal gerekiyor; iOS'ta karşılığı yok. */
export async function uyariHazirla(): Promise<void> {
  try {
    await Notifications.requestPermissionsAsync();
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("yeni-is", {
        name: "Yeni iş teklifi",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 150, 400],
        sound: "default",
        /* Ekran kilitliyken de görünsün: teklifin ömrü 45 saniye. */
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  } catch {
    /* İzin verilmediyse sessiz kalıyoruz; teklif ekranı yine açılıyor. */
  }
}

/**
 * Yeni bir teklif düştüğünde çağrılıyor.
 *
 * Hata YUTULUYOR: bildirim gönderilemese bile teklif akışı durmamalı. Ses
 * bir yardımcı, işin kendisi değil.
 */
export function yeniIsUyarisi(ucret: number, restoran: string, mesafe: string): void {
  Vibration.vibrate([0, 250, 150, 400]);

  Notifications.scheduleNotificationAsync({
    content: {
      title: `Yeni Sipariş! · ${ucret} ₺`,
      /*
       * MESAFE BAŞLIKTA DEĞİL GÖVDEDE: başlık bildirim listesinde kısalıyor ve
       * parayı kesmek, kuryenin ekrana bakma kararını verdiği tek bilgiyi
       * kesmek olurdu.
       */
      body: [restoran, mesafe && `~${mesafe}`, "45 saniye içinde kabul et"]
        .filter(Boolean)
        .join(" · "),
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === "android" ? { channelId: "yeni-is" } : {}),
    },
    /* null tetikleyici: hemen göster. */
    trigger: null,
  }).catch(() => {});
}
