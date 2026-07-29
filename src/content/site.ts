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
    "Restoranlar için panel, kuryeler için mobil uygulama, müşteriler için canlı takip.",
  url: siteUrlBul(),
  eposta: "merhaba@neyersin.com",
  telefon: "0850 000 00 00",
  adres: "Ünalan Mah. Teknoloji Cad. No: 12, Ataşehir / İstanbul",

  navigasyon: [
    { etiket: "Nasıl Çalışır", href: "/#nasil-calisir" },
    { etiket: "Ekranlar", href: "/#ekranlar" },
    { etiket: "Restoranlar", href: "/#restoranlar" },
    { etiket: "Sektörler", href: "/sektorler" },
    { etiket: "Veri Değerlendirme", href: "/veri-degerlendirme" },
    { etiket: "Blog", href: "/blog" },
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
        { etiket: "Hakkımızda", href: "/#nasil-calisir" },
        { etiket: "Nasıl Çalışır", href: "/#nasil-calisir" },
        { etiket: "Sektörler", href: "/sektorler" },
        { etiket: "Veri Değerlendirme", href: "/veri-degerlendirme" },
        { etiket: "Blog", href: "/blog" },
      ],
    },
    {
      baslik: "İş Ortakları",
      baglantilar: [
        { etiket: "Restoranını Ekle", href: "/#restoran-ekle" },
        { etiket: "Kurye Ol", href: "/#kurye-ol" },
        { etiket: "Kurumsal Çözümler", href: "/sektorler/kurumsal-catering" },
        { etiket: "Entegrasyonlar", href: "/veri-degerlendirme#entegrasyon" },
        { etiket: "Franchise Paketi", href: "/sektorler" },
      ],
    },
    {
      baslik: "Yardım",
      baglantilar: [
        { etiket: "Sıkça Sorulan Sorular", href: "/#sss" },
        { etiket: "Sipariş Takibi", href: "/#teslimat-takibi" },
        { etiket: "İletişim", href: "/#iletisim" },
        { etiket: "Geri Bildirim", href: "/#iletisim" },
      ],
    },
    {
      baslik: "Yasal",
      baglantilar: [
        { etiket: "Kullanım Koşulları", href: "/#yasal" },
        { etiket: "Gizlilik Politikası", href: "/#yasal" },
        { etiket: "KVKK Aydınlatma Metni", href: "/#yasal" },
        { etiket: "Çerez Politikası", href: "/#yasal" },
      ],
    },
  ],
} as const;

/** Footer'daki şehir ve mutfak bazlı iç bağlantılar (SEO için). */
export const sehirler = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Kayseri",
  "Eskişehir",
  "Trabzon",
  "Samsun",
  "Diyarbakır",
  "Mersin",
];

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
