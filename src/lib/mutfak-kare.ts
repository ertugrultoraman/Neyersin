/**
 * MUTFAKTAN KARELER — ortak sınırlar.
 *
 * NEDEN AYRI DOSYA: sınır üç yerde birden lazım — sunucu eylemi
 * (panel/galeri-actions), panel arayüzü (MutfakKareleri) ve mobil uç
 * (api/mobil/v1/mutfak/kare). Sunucu eylemi dosyası "use server" taşıdığı
 * için oradan SABİT dışa aktarılamıyor (yalnızca async fonksiyon
 * verilebiliyor); sabit orada dursaydı diğer iki yer kendi kopyasını tutmak
 * zorunda kalırdı — ve biri altıdan sekize çıkarıldığında ötekiler sessizce
 * eski sınırda kalırdı.
 */

/** Profil sayfası albüm değil, mutfağa açılan küçük bir pencere. */
export const AZAMI_KARE = 6;

/** Tarayıcıların güvenle gösterdiği biçimler. */
export const IZINLI_KARE_TURLERI = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Tek karenin üst sınırı. */
export const AZAMI_KARE_BOYUTU = 4 * 1024 * 1024;
