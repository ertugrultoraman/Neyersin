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
  sloganEn: "Food Delivery & Courier System",
  vurgu: "Hızlı ve Kolay Teslimat!",
  vurguEn: "Fast and Easy Delivery!",
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
    { etiket: "Şeflerin Elinden", etiketEn: "From Our Chefs", href: "/seflerin-elinden" },
    { etiket: "İşletmeler", etiketEn: "Businesses", href: "/isletmeler" },
    { etiket: "Nasıl Çalışır", etiketEn: "How It Works", href: "/nasil-calisir" },
    { etiket: "Ev Hanımları", etiketEn: "Home Cooks", href: "/ev-hanimlari" },
    { etiket: "Hakkımızda", etiketEn: "About Us", href: "/hakkimizda" },
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
      baslikEn: "Ne Yersin?",
      baglantilar: [
        { etiket: "Şeflerin Elinden", etiketEn: "From Our Chefs", href: "/seflerin-elinden" },
        { etiket: "İşletmeler", etiketEn: "Businesses", href: "/isletmeler" },
        { etiket: "Tüm Mutfaklar", etiketEn: "All Kitchens", href: "/restoranlar" },
        { etiket: "Nasıl Çalışır", etiketEn: "How It Works", href: "/nasil-calisir" },
        { etiket: "Ekranlar", etiketEn: "Screens", href: "/ekranlar" },
        { etiket: "Hakkımızda", etiketEn: "About Us", href: "/hakkimizda" },
      ],
    },
    {
      baslik: "İş Ortakları",
      baslikEn: "Partners",
      baglantilar: [
        { etiket: "Ev Hanımı / Şef Ol", etiketEn: "Become a Home Cook / Chef", href: "/ev-hanimlari" },
        { etiket: "Restoranını Ekle", etiketEn: "Add Your Restaurant", href: "/iletisim?konu=restoran" },
        { etiket: "Kurye Ol", etiketEn: "Become a Courier", href: "/iletisim?konu=kurye" },
        { etiket: "Kurumsal Çözümler", etiketEn: "Business Solutions", href: "/iletisim?konu=kurumsal" },
        { etiket: "Hakkımızda", etiketEn: "About Us", href: "/hakkimizda" },
      ],
    },
    {
      baslik: "Yardım",
      baslikEn: "Help",
      baglantilar: [
        { etiket: "Sıkça Sorulan Sorular", etiketEn: "Frequently Asked Questions", href: "/#sss" },
        { etiket: "Sipariş Takibi", etiketEn: "Order Tracking", href: "/#teslimat-takibi" },
        // Sipariş/hesap yardımı iletişim formundan değil, canlı destekten yürüyor.
        { etiket: "Canlı Destek", etiketEn: "Live Support", href: "#destek" },
        { etiket: "İletişim", etiketEn: "Contact", href: "/iletisim" },
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
