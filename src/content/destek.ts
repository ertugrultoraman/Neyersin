/**
 * Canlı destek asistanının adım ağacı.
 *
 * NEDEN ADIMLI: Asistan serbest metin üreten bir dil modeli DEĞİL. Sipariş,
 * ödeme ve iptal gibi konularda uydurma cevap vermek gerçek zarar verir
 * ("paranız 3 gün içinde iade edilir" gibi). Bu yüzden cevaplar önceden
 * yazılmış ve doğru; asistan yalnızca kullanıcıyı doğru cevaba yönlendiriyor.
 * Çözemediği her yerde gerçek bir destek talebi açıyor.
 *
 * Dil modeli anahtarı geldiğinde serbest metin sorular buraya ek olarak
 * bağlanabilir — akış aynı kalır, sadece "başka bir konu" dalı zenginleşir.
 */

export type DestekSecenek = {
  etiket: string;
  /** İngilizce etiket; yoksa Türkçesi gösteriliyor. */
  etiketEn?: string;
  hedef: string;
};

export type DestekAdimi = {
  id: string;
  /** Asistanın söylediği. Satır satır balon olarak gösterilir. */
  mesaj: string[];
  /** Aynı satırların İngilizcesi; yoksa Türkçesi gösteriliyor. */
  mesajEn?: string[];
  secenekler?: DestekSecenek[];
  /** Cevabın sonunda gösterilen site içi bağlantı. */
  baglanti?: { etiket: string; etiketEn?: string; href: string };
  /** Bu adımda destek talebi formu açılır. */
  talepAc?: boolean;
  /** Açılacak talebin konusu. */
  konu?: string;
};

export const DESTEK_BASLANGIC = "kok";

export const destekAdimlari: DestekAdimi[] = [
  {
    id: "kok",
    mesaj: [
      "Merhaba! Ne Yersin? destek asistanıyım.",
      "Hangi konuda yardım istersin?",
    ],
    mesajEn: [
      "Hello! I'm the Ne Yersin? support assistant.",
      "What can I help you with?",
    ],
    secenekler: [
      { etiket: "Siparişim nerede?", etiketEn: "Where is my order?", hedef: "siparis-nerede" },
      { etiket: "Siparişimi iptal etmek istiyorum", etiketEn: "I want to cancel my order", hedef: "iptal" },
      { etiket: "Ödeme ile ilgili sorum var", etiketEn: "I have a payment question", hedef: "odeme" },
      { etiket: "Kuponum çalışmadı", etiketEn: "My coupon didn't work", hedef: "kupon" },
      { etiket: "Yemekle ilgili bir sorun var", etiketEn: "There's a problem with the food", hedef: "yemek-sorun" },
      { etiket: "Şef / ev hanımı olmak istiyorum", etiketEn: "I want to become a chef / home cook", hedef: "sef-olmak" },
      { etiket: "Kurye olmak istiyorum", etiketEn: "I want to become a courier", hedef: "kurye-olmak" },
      { etiket: "Başka bir konu", etiketEn: "Something else", hedef: "diger" },
    ],
  },

  // ---------------- Sipariş takibi ----------------
  {
    id: "siparis-nerede",
    mesaj: [
      "Siparişlerinin durumunu hesabından adım adım görebilirsin: alındı, hazırlanıyor, yolda, teslim edildi.",
      "Durumu kontrol ettin mi?",
    ],
    mesajEn: [
      "You can follow your order step by step from your account: received, being prepared, on the way, delivered.",
      "Have you checked the status?",
    ],
    baglanti: { etiket: "Siparişlerim", etiketEn: "My orders", href: "/hesabim" },
    secenekler: [
      { etiket: "Baktım, hâlâ 'hazırlanıyor' görünüyor", etiketEn: "I checked — it still says 'being prepared'", hedef: "gecikme" },
      { etiket: "Yolda görünüyor ama gelmedi", etiketEn: "It says on the way but it hasn't arrived", hedef: "gecikme" },
      { etiket: "Teslim edildi yazıyor ama elime ulaşmadı", etiketEn: "It says delivered but I never got it", hedef: "teslim-sorunu" },
      { etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" },
    ],
  },
  {
    id: "gecikme",
    mesaj: [
      "Hazırlık süresi mutfağa göre değişiyor; profil sayfasında her mutfağın tahmini süresi yazıyor.",
      "Söz verilen süreyi belirgin şekilde aştıysa siparişi bize bildir — kuryeye ve mutfağa biz ulaşalım.",
    ],
    mesajEn: [
      "Preparation time varies by kitchen; each kitchen's estimate is on its profile page.",
      "If it is well past the promised time, let us know — we'll contact the courier and the kitchen.",
    ],
    secenekler: [
      { etiket: "Destek talebi oluştur", etiketEn: "Open a support request", hedef: "talep-gecikme" },
      { etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" },
    ],
  },
  {
    id: "talep-gecikme",
    mesaj: ["Sipariş numaranı ve kısa bir açıklama yaz, hemen bakalım."],
    mesajEn: [
      "Write your order number and a short description and we'll look right away.",
    ],
    talepAc: true,
    konu: "Sipariş gecikmesi",
  },
  {
    id: "teslim-sorunu",
    mesaj: [
      "Bu durumda kurye kaydını ve teslim saatini kontrol etmemiz gerekiyor.",
      "Talebini aç, siparişi tek tek inceleyelim.",
    ],
    mesajEn: [
      "In that case we need to check the courier record and the delivery time.",
      "Open a request and we'll go through the order in detail.",
    ],
    talepAc: true,
    konu: "Teslim edildi göründü ama ulaşmadı",
  },

  // ---------------- İptal ----------------
  {
    id: "iptal",
    mesaj: [
      "Hazırlık başlamadan siparişini kendin iptal edebilirsin — hesabındaki siparişin yanında 'İptal et' düğmesi var.",
      "Hazırlık başladıysa düğme kapanır, çünkü yemek pişmeye başlamış olur.",
    ],
    mesajEn: [
      "You can cancel your order yourself before preparation starts — there is a 'Cancel' button next to it in your account.",
      "Once preparation starts the button disappears, because your food is already being cooked.",
    ],
    baglanti: { etiket: "Siparişlerim", etiketEn: "My orders", href: "/hesabim" },
    secenekler: [
      { etiket: "İptal düğmesi görünmüyor", etiketEn: "I can't see the cancel button", hedef: "talep-iptal" },
      { etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" },
    ],
  },
  {
    id: "talep-iptal",
    mesaj: ["Sipariş numaranı yaz, durumu kontrol edip sana dönelim."],
    mesajEn: [
      "Write your order number, we'll check the status and get back to you.",
    ],
    talepAc: true,
    konu: "İptal talebi",
  },

  // ---------------- Ödeme ----------------
  {
    id: "odeme",
    mesaj: [
      "Ödeme kapıda yapılıyor: kurye geldiğinde nakit verebilir ya da IBAN'a havale yapabilirsin.",
      "Havalede açıklama alanına yalnızca sipariş numaranı yazman ve dekontu kuryeye göstermen yeterli.",
      "Önceden ödeme yapmana gerek yok.",
    ],
    mesajEn: [
      "Payment is made at the door: hand cash to the courier or transfer to our IBAN.",
      "For a transfer, just put your order number in the reference and show the receipt to the courier.",
      "There is no need to pay in advance.",
    ],
    secenekler: [
      { etiket: "Kartla ödeyebilir miyim?", etiketEn: "Can I pay by card?", hedef: "kart" },
      { etiket: "Ödeme yaptım ama sipariş görünmüyor", etiketEn: "I paid but the order isn't showing", hedef: "talep-odeme" },
      { etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" },
    ],
  },
  {
    id: "kart",
    mesaj: [
      "Kartla ödeme altyapısı kurulu ama şu an kapalı — henüz aktif etmedik.",
      "Bugün için kapıda nakit veya IBAN'a havale çalışıyor.",
    ],
    mesajEn: [
      "Card payment is built but currently switched off — we haven't enabled it yet.",
      "For now, cash at the door or a bank transfer both work.",
    ],
    secenekler: [{ etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" }],
  },
  {
    id: "talep-odeme",
    mesaj: ["Sipariş numaranı ve ödeme şeklini yaz, kaydı kontrol edelim."],
    mesajEn: [
      "Write your order number and payment method and we'll check the record.",
    ],
    talepAc: true,
    konu: "Ödeme sorunu",
  },

  // ---------------- Kupon ----------------
  {
    id: "kupon",
    mesaj: [
      "Kuponların kendi kuralları var:",
      "MERHABA60 — yalnızca ilk siparişte, 225 TL alt limit. HAFTASONU25 — yalnızca cumartesi ve pazar. SEPET100 — 600 TL ve üzeri sepette.",
      "Kupon üye e-postana bağlı kontrol edilir; ilk sipariş kuponu daha önce sipariş verdiysen çalışmaz.",
    ],
    mesajEn: [
      "Each coupon has its own rules:",
      "MERHABA60 — first order only, 225 TL minimum. HAFTASONU25 — Saturdays and Sundays only. SEPET100 — carts of 600 TL and over.",
      "Coupons are checked against your account email; the first-order coupon will not work if you have ordered before.",
    ],
    secenekler: [
      { etiket: "Kurallara uyuyorum ama yine de çalışmadı", etiketEn: "I meet the rules but it still didn't work", hedef: "talep-kupon" },
      { etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" },
    ],
  },
  {
    id: "talep-kupon",
    mesaj: ["Kupon kodunu ve sepet tutarını yaz, neden geçmediğine bakalım."],
    mesajEn: [
      "Write the coupon code and your cart total and we'll see why it was rejected.",
    ],
    talepAc: true,
    konu: "Kupon çalışmadı",
  },

  // ---------------- Yemek sorunu ----------------
  {
    id: "yemek-sorun",
    mesaj: [
      "Üzgünüm. Sorunun nerede olduğunu anlamamız için siparişini üç başlıkta puanlayabilirsin: sıcaklık, teslimat hızı ve tad.",
      "Puanlar mutfağın profilinde görünür ve düşük puan alan profiller incelemeye alınır.",
    ],
    mesajEn: [
      "I'm sorry. To understand what went wrong you can rate your order on three points: temperature, delivery speed and taste.",
      "Ratings appear on the kitchen's profile, and low-scoring profiles are reviewed.",
    ],
    baglanti: { etiket: "Siparişlerim", etiketEn: "My orders", href: "/hesabim" },
    secenekler: [
      { etiket: "Eksik veya yanlış ürün geldi", etiketEn: "An item was missing or wrong", hedef: "talep-eksik" },
      { etiket: "Yemek bozuk / yenmeyecek haldeydi", etiketEn: "The food was spoiled / inedible", hedef: "talep-bozuk" },
      { etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" },
    ],
  },
  {
    id: "talep-eksik",
    mesaj: ["Sipariş numaranı ve hangi ürünün eksik/yanlış geldiğini yaz."],
    mesajEn: [
      "Write your order number and which item was missing or wrong.",
    ],
    talepAc: true,
    konu: "Eksik veya yanlış ürün",
  },
  {
    id: "talep-bozuk",
    mesaj: [
      "Bu ciddi bir konu, doğrudan biz ilgileniyoruz.",
      "Sipariş numaranı ve durumu yaz; mümkünse fotoğrafı e-postayla da gönder.",
    ],
    mesajEn: [
      "This is serious and we handle it directly.",
      "Write your order number and what happened; if you can, email us a photo as well.",
    ],
    talepAc: true,
    konu: "Gıda güvenliği şikâyeti",
  },

  // ---------------- Katılım ----------------
  {
    id: "sef-olmak",
    mesaj: [
      "Evinde pişirip satmak istiyorsan başvuru formunu doldurman yeterli: ad, telefon, e-posta ve kendine bir parola.",
      "Başvurun yöneticiye düşer; onaylandığı anda hesabın açılır ve adınla bir mutfak sayfan oluşur.",
    ],
    mesajEn: [
      "If you want to cook at home and sell, just fill in the application form: name, phone, email and a password.",
      "Your application reaches our team; the moment it is approved your account opens with a kitchen page in your name.",
    ],
    baglanti: { etiket: "Ev Hanımları sayfası", etiketEn: "Home Cooks page", href: "/ev-hanimlari" },
    secenekler: [
      { etiket: "Başvuru yapmak istiyorum", etiketEn: "I want to apply", hedef: "basvuru-yonlendir" },
      { etiket: "Vergi ve belgeler ne olacak?", etiketEn: "What about tax and paperwork?", hedef: "resmi" },
      { etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" },
    ],
  },
  {
    id: "resmi",
    mesaj: [
      "Belirli bir cironun altında kalan ev üretimi için Esnaf Muafiyet Belgesi süreci var.",
      "Gıda üretim kaydı ise Tarım ve Orman Bakanlığı'ndan alınıyor.",
      "Bu süreçlerde yol gösteriyoruz ama belgeler kişinin kendi adına düzenleniyor.",
    ],
    mesajEn: [
      "For home production below a certain turnover there is a Tradesman Exemption Certificate process.",
      "The food production registration is issued by the Ministry of Agriculture and Forestry.",
      "We guide you through these steps, but the documents are issued in your own name.",
    ],
    baglanti: { etiket: "Ayrıntılar", etiketEn: "Details", href: "/ev-hanimlari" },
    secenekler: [{ etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" }],
  },
  {
    id: "kurye-olmak",
    mesaj: [
      "Kendi aracın (motosiklet, moped, bisiklet veya elektrikli scooter), aracına uygun ehliyet ve akıllı telefon yeterli. 50 cc moped için B sınıfı ehliyet de geçerli; bisiklet ve scooterda ehliyet aranmıyor.",
      "Başvurun yönetici onayından geçtikten sonra kurye paneline erişirsin; sana atanan siparişi yalnızca sen görürsün.",
    ],
    mesajEn: [
      "Your own vehicle (motorcycle, moped, bicycle or e-scooter), a licence that matches it and a smartphone are enough. A class B licence also covers a 50cc moped; no licence is needed for a bicycle or e-scooter.",
      "Once your application is approved you get access to the courier dashboard, where only the orders assigned to you are visible.",
    ],
    secenekler: [
      { etiket: "Başvuru yapmak istiyorum", etiketEn: "I want to apply", hedef: "basvuru-yonlendir" },
      { etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" },
    ],
  },
  {
    id: "basvuru-yonlendir",
    mesaj: ["Başvuru formu hazır — birkaç dakikanı alır."],
    mesajEn: [
      "The application form is ready — it takes a couple of minutes.",
    ],
    baglanti: { etiket: "Başvuru formunu aç", etiketEn: "Open the application form", href: "/hesap/basvuru" },
    secenekler: [{ etiket: "Başa dön", etiketEn: "Back to start", hedef: "kok" }],
  },

  // ---------------- Diğer ----------------
  {
    id: "diger",
    mesaj: [
      "Anlat bakalım — konuyu yaz, ekibe iletelim.",
      "Sana e-posta ile dönüş yapacağız.",
    ],
    mesajEn: [
      "Go ahead — describe the issue and we'll pass it to the team.",
      "We'll get back to you by email.",
    ],
    talepAc: true,
    konu: "Genel destek",
  },
];

export function destekAdimiBul(id: string): DestekAdimi | undefined {
  return destekAdimlari.find((a) => a.id === id);
}
