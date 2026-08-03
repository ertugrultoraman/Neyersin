/** Site geneli sabitler: kimlik, navigasyon, footer ve iletişim bilgileri. */

function siteUrlBul(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Vercel production/preview deploy'larında otomatik gelir
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const site = {
  ad: "Ne Yersin?",
  slogan: "Yemek ve Kurye Sistemi",
  vurgu: "Hızlı ve Kolay Teslimat!",
  aciklama:
    "Ne Yersin? sipariş, mutfak, kurye ve teslimat takibini tek sistemde birleştirir. " +
    "Restoranlar için panel, kuryeler için mobil uygulama, müşteriler için canlı takip. " +
    "Teslimat bölgesi: İstanbul / Beylikdüzü.",
  url: siteUrlBul(),
  eposta: "merhaba@neyersin.net",
  telefon: "0538 725 97 94",
  adres: "Beylikdüzü / İstanbul",

  navigasyon: [
    // İki alışveriş tarafı ayrı adreslerde duruyor ki menüde de ayrı yerleri olsun.
    { etiket: "Şeflerin Elinden", href: "/seflerin-elinden" },
    { etiket: "İşletmeler", href: "/isletmeler" },
    { etiket: "Nasıl Çalışır", href: "/nasil-calisir" },
    { etiket: "Ev Hanımları", href: "/ev-hanimlari" },
    { etiket: "Hakkımızda", href: "/hakkimizda" },
  ],

  sosyal: [
    { etiket: "Instagram", href: "https://instagram.com", kisa: "IG" },
    { etiket: "X", href: "https://x.com", kisa: "X" },
    { etiket: "LinkedIn", href: "https://linkedin.com", kisa: "in" },
    { etiket: "YouTube", href: "https://youtube.com", kisa: "YT" },
  ],

  footer: [
    {
      baslik: "Ne Yersin?",
      baglantilar: [
        { etiket: "Şeflerin Elinden", href: "/seflerin-elinden" },
        { etiket: "İşletmeler", href: "/isletmeler" },
        { etiket: "Tüm Mutfaklar", href: "/restoranlar" },
        { etiket: "Nasıl Çalışır", href: "/nasil-calisir" },
        { etiket: "Ekranlar", href: "/ekranlar" },
        { etiket: "Hakkımızda", href: "/hakkimizda" },
      ],
    },
    {
      baslik: "İş Ortakları",
      baglantilar: [
        { etiket: "Ev Hanımı / Şef Ol", href: "/ev-hanimlari" },
        { etiket: "Restoranını Ekle", href: "/iletisim?konu=restoran" },
        { etiket: "Kurye Ol", href: "/iletisim?konu=kurye" },
        { etiket: "Kurumsal Çözümler", href: "/iletisim?konu=kurumsal" },
        { etiket: "Hakkımızda", href: "/hakkimizda" },
      ],
    },
    {
      baslik: "Yardım",
      baglantilar: [
        { etiket: "Sıkça Sorulan Sorular", href: "/#sss" },
        { etiket: "Sipariş Takibi", href: "/#teslimat-takibi" },
        // Sipariş/hesap yardımı iletişim formundan değil, canlı destekten yürüyor.
        { etiket: "Canlı Destek", href: "#destek" },
        { etiket: "İletişim", href: "/iletisim" },
      ],
    },
    /*
     * YASAL BÖLÜM GEÇİCİ OLARAK GİZLİ.
     *
     * Dört bağlantı da `/#yasal` çapasına gidiyordu ve orada telif satırından
     * başka bir şey yoktu: "KVKK Aydınlatma Metni"ne tıklayan kişi hiçbir
     * metin görmüyordu. Olmayan bir belgeyi varmış gibi göstermek, hiç
     * göstermemekten kötü — hem ziyaretçiyi yanıltıyor hem KVKK açısından
     * yanlış bir izlenim veriyor.
     *
     * Metinler (hukukçu onaylı) hazırlanınca bu bölüm geri açılacak ve her
     * biri kendi sayfasına bağlanacak.
     */
  ],
} as const;

/**
 * Footer'daki iç bağlantılar (SEO için). Hizmet alanı yalnızca İstanbul olduğu
 * için şehir listesi yerine ilçe listesi kullanılıyor — kaynak: content/istanbul.ts
 */
export { ilceAdlari as ilceler } from "./istanbul";

export const mutfaklar = [
  "Burger",
  "Pizza",
  "Döner",
  "Kebap",
  "Ev Yemekleri",
  "Tavuk",
  "Çiğ Börek",
  "Balık",
  "Tatlı",
  "Kahve",
  "Dünya Mutfağı",
  "Vegan",
  "Çorba",
  "Pide & Lahmacun",
];
