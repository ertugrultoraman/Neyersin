const { withInfoPlist, withMainActivity, createRunOncePlugin } = require("expo/config-plugins");

/**
 * YÜKSEK YENİLEME HIZI (120 fps) — iOS ProMotion + Android high refresh rate.
 *
 * Expo bu iki ayarı VARSAYILAN OLARAK VERMİYOR; ikisi de elle açılmazsa
 * uygulama 120 Hz ekranlı bir telefonda bile 60 fps'e kilitli kalır. Reanimated
 * worklet'leri ne kadar hızlı olursa olsun, platform kareyi sunmuyorsa fark
 * edilmez — bu yüzden eklenti performans işinin İLK adımı.
 *
 *  - iOS   : `CADisableMinimumFrameDurationOnPhone`. Apple, pil ömrü için
 *            iPhone'da kare süresine 60 Hz'lik bir ALT SINIR koyuyor; bu bayrak
 *            o sınırı kaldırıyor ve CADisplayLink 120 Hz'e çıkabiliyor.
 *            (iPad'de sınır zaten yok; bayrağın adı "OnPhone" bu yüzden.)
 *  - Android: `preferredDisplayModeId`. Android cihaz yenileme hızını kendi
 *            seçiyor ve pil tasarrufu için çoğu zaman 60 Hz'de bırakıyor.
 *            Pencereye "şu modu istiyorum" demek gerekiyor.
 *
 * Not: bu eklenti YALNIZCA tavanı açar. Gerçekten 120 fps görmek için kare
 * bütçesi 8.3 ms — animasyonlar UI thread'de (Reanimated), listeler FlashList,
 * görseller expo-image olmalı. Aksi hâlde tavan açık ama kareler yetişmiyor.
 */

const MARKER = "yuksek-fps eklentisi";

/** iOS: ProMotion kare süresi alt sınırını kaldır. */
function iosAyari(config) {
  return withInfoPlist(config, (yapilandirma) => {
    yapilandirma.modResults.CADisableMinimumFrameDurationOnPhone = true;
    return yapilandirma;
  });
}

/**
 * Android: MainActivity.onCreate içine en yüksek yenileme modunu seçen kodu ekler.
 *
 * `supportedModes` içinden en yüksek `refreshRate`'i seçiyoruz; cihaz 144 Hz ise
 * 144'ü, 120 ise 120'yi alır. Sabit "120" yazmak 90 Hz'lik orta segment
 * telefonlarda isteği geçersiz kılardı.
 */
function androidAyari(config) {
  return withMainActivity(config, (yapilandirma) => {
    let icerik = yapilandirma.modResults.contents;

    if (icerik.includes(MARKER)) return yapilandirma;

    if (yapilandirma.modResults.language !== "kt") {
      throw new Error(
        `[yuksek-fps] MainActivity Kotlin bekleniyordu, "${yapilandirma.modResults.language}" bulundu.`,
      );
    }

    // 1) Build sınıfı import edilmemişse ekle (SDK sürüm kontrolü için gerekli).
    if (!/^import android\.os\.Build$/m.test(icerik)) {
      icerik = icerik.replace(
        /^(package .+\n)/m,
        `$1\nimport android.os.Build\n`,
      );
    }

    // 2) super.onCreate(...) çağrısının hemen ardına yenileme hızı isteğini koy.
    const onCreateDeseni = /(\n(\s*)super\.onCreate\([^)]*\)\n)/;
    if (!onCreateDeseni.test(icerik)) {
      throw new Error(
        "[yuksek-fps] MainActivity içinde super.onCreate(...) bulunamadı; eklenti kodu yerleştiremedi.",
      );
    }

    icerik = icerik.replace(onCreateDeseni, (_tam, eslesme, girinti) => {
      const kod = [
        ``,
        `${girinti}// --- ${MARKER}: cihazın desteklediği EN YÜKSEK yenileme hızını iste ---`,
        `${girinti}// Android pil tasarrufu için ekranı çoğu zaman 60 Hz'de bırakır; 120 Hz`,
        `${girinti}// panelden gerçekten 120 fps almak için pencerenin bunu açıkça istemesi gerekir.`,
        `${girinti}if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {`,
        `${girinti}  @Suppress("DEPRECATION")`,
        `${girinti}  val ekran = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) display`,
        `${girinti}              else windowManager.defaultDisplay`,
        `${girinti}  ekran?.supportedModes?.maxByOrNull { it.refreshRate }?.let { mod ->`,
        `${girinti}    window.attributes = window.attributes.apply { preferredDisplayModeId = mod.modeId }`,
        `${girinti}  }`,
        `${girinti}}`,
        ``,
      ].join("\n");
      return `${eslesme}${kod}`;
    });

    yapilandirma.modResults.contents = icerik;
    return yapilandirma;
  });
}

const yuksekFps = (config) => androidAyari(iosAyari(config));

module.exports = createRunOncePlugin(yuksekFps, "yuksek-fps", "1.0.0");
