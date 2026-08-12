/**
 * Ne Yersin? — Mobil tasarım dili.
 *
 * Değerler web sitesindeki `src/app/globals.css` dosyasından BİREBİR taşındı.
 * İki platform aynı markayı konuşsun diye tek kaynak orası kabul ediliyor:
 * orada bir ton değişirse burada da değişmeli, yoksa uygulama ile site
 * zamanla birbirinden ayrışır.
 */

/* --------------------------------------------------------------------------
 * Renk
 * ----------------------------------------------------------------------- */

/** Birincil sarı — 500 tonu logo dosyasından örneklendi. */
export const sari = {
  50: "#fffdf0",
  100: "#fff6d1",
  200: "#ffea9c",
  300: "#ffdb5e",
  400: "#fed229",
  500: "#fdc806",
  600: "#e0ac00",
  700: "#b58600",
  800: "#8c6600",
  900: "#6d4f04",
} as const;

/** Kahve / mürekkep — başlıklar, gövde metni, koyu yüzeyler. */
export const kahve = {
  50: "#fbf7f3",
  100: "#f2e9e0",
  200: "#e0cfbf",
  300: "#c2a488",
  400: "#9a7351",
  500: "#7a5433",
  600: "#5c3c22",
  700: "#462c17",
  800: "#34200f",
  900: "#241608",
} as const;

export const renk = {
  sari,
  kahve,

  /** Sayfa zemini beyaz; krem yalnızca yüzen katmanlarda (bkz. globals.css). */
  beyaz: "#ffffff",
  krem: "#fff9ef",
  kremKoyu: "#fdf1dd",

  /**
   * Sarı şerit üzerindeki yazı rengi. Saf siyah doygun sarıda sert duruyor;
   * bu ton siyah okunuyor ama göz yormuyor (#fdc806 üzerinde ~14:1, AAA).
   */
  murekkep: "#141210",

  domates: "#e4452c",
  domatesKoyu: "#b8321d",
  nane: "#12a67a",
  naneKoyu: "#0b7d5b",

  /** Metin hiyerarşisi — gövde kahve-800, ikincil kahve-400. */
  metin: kahve[800],
  metinIkincil: kahve[400],
  baslik: kahve[900],

  /** Ayırıcı çizgi: kahve-900'ün %10 saydamı (globals.css `border-color`). */
  cizgi: "rgba(36, 22, 8, 0.10)",
} as const;

/**
 * Sipariş durumlarının rengi.
 *
 * Durum listesi `src/lib/siparis.ts` içindeki `SiparisDurumu` ile aynı — oraya
 * yeni bir durum eklenirse burada da karşılığı olmalı, yoksa rozet renksiz kalır.
 */
export const durumRengi = {
  "odeme-bekliyor": sari[600],
  odendi: kahve[500],
  hazir: sari[500],
  yolda: "#12a67a",
  "teslim-edildi": "#0b7d5b",
  "odeme-basarisiz": "#e4452c",
  iptal: kahve[300],
} as const;

/* --------------------------------------------------------------------------
 * Ölçü
 * ----------------------------------------------------------------------- */

/** 4'ün katları — web'deki Tailwind ölçeğiyle aynı ritim. */
export const bosluk = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export const yaricap = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  /** globals.css `--radius-4xl` */
  "4xl": 28,
  /** globals.css `--radius-5xl` */
  "5xl": 36,
  tam: 9999,
} as const;

/* --------------------------------------------------------------------------
 * Tipografi
 * ----------------------------------------------------------------------- */

/**
 * Web'de başlıklar Baloo (yuvarlak, samimi), gövde Manrope.
 * Mobilde de aynı ikili kullanılıyor; yüklenmezse sistem yazı tipine düşer.
 */
export const yaziAilesi = {
  baslik: "Baloo2_700Bold",
  baslikOrta: "Baloo2_600SemiBold",
  govde: "Manrope_400Regular",
  govdeOrta: "Manrope_500Medium",
  govdeKalin: "Manrope_700Bold",
} as const;

export const yazi = {
  "2xs": { fontSize: 11, lineHeight: 16 },
  xs: { fontSize: 12, lineHeight: 18 },
  sm: { fontSize: 14, lineHeight: 21 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 26 },
  xl: { fontSize: 20, lineHeight: 28 },
  "2xl": { fontSize: 24, lineHeight: 30 },
  "3xl": { fontSize: 30, lineHeight: 34 },
  "4xl": { fontSize: 36, lineHeight: 39 },
} as const;

/* --------------------------------------------------------------------------
 * Gölge — sıcak tonlu, gri değil
 * ----------------------------------------------------------------------- */

/**
 * React Native 0.76+ (New Architecture) `boxShadow` destekliyor; web'deki
 * çok katmanlı gölgeler birebir taşınabiliyor. Eski `shadow*` prop'ları tek
 * katman alabildiği için o yol seçilmedi — iki katmanlı gölge markanın
 * "yumuşak kalkma" hissini veren şey.
 */
export const golge = {
  yumusak: "0px 1px 2px rgba(36, 22, 8, 0.04), 0px 4px 16px rgba(36, 22, 8, 0.08)",
  kart: "0px 2px 4px rgba(36, 22, 8, 0.05), 0px 12px 28px rgba(36, 22, 8, 0.12)",
  kalkik: "0px 8px 12px rgba(36, 22, 8, 0.08), 0px 28px 56px rgba(36, 22, 8, 0.20)",
  sari: "0px 8px 24px rgba(224, 172, 0, 0.45)",
} as const;

/* --------------------------------------------------------------------------
 * Hareket
 * ----------------------------------------------------------------------- */

/**
 * Easing eğrileri — kontrol noktaları olarak.
 *
 * Reanimated'in `Easing.bezier(...)` fonksiyonuna yayılarak veriliyor:
 *   `Easing.bezier(...egri.yumusak)`
 * Ortak paket Reanimated'e bağımlı olmasın diye burada yalnızca sayılar var;
 * eğriyi kuran taraf uygulamanın kendisi.
 *
 * Kural (web'den devralındı): hiçbir geçiş `linear` ya da varsayılan `ease`
 * olmayacak — kaba/ani geçişler markanın hissini bozuyor.
 */
export const egri = {
  /** Genel amaçlı; giriş ve çıkışta yumuşak. */
  yumusak: [0.22, 1, 0.36, 1],
  /** Ekrandan çıkan öğeler. */
  cikis: [0.4, 0, 0.2, 1],
  /** Hafif yaylanma — düğme basımı, rozet açılışı. */
  yayli: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/**
 * Süreler (ms).
 *
 * 120 Hz'de bir kare 8.3 ms. Buradaki en kısa süre (120 ms) bile ~14 kare
 * demek; yani hepsi akıcı görünecek kadar uzun. Daha kısası 60 Hz'lik
 * cihazlarda "bir anda oldu" hissi veriyor.
 */
export const sure = {
  ani: 120,
  hizli: 180,
  normal: 260,
  yavas: 420,
} as const;

/* --------------------------------------------------------------------------
 * Erişilebilirlik
 * ----------------------------------------------------------------------- */

/** Dokunma hedefi alt sınırı — Apple 44pt, Google 48dp önerir. */
export const DOKUNMA_HEDEFI = 48;
