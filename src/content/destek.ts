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
  hedef: string;
};

export type DestekAdimi = {
  id: string;
  /** Asistanın söylediği. Satır satır balon olarak gösterilir. */
  mesaj: string[];
  secenekler?: DestekSecenek[];
  /** Cevabın sonunda gösterilen site içi bağlantı. */
  baglanti?: { etiket: string; href: string };
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
    secenekler: [
      { etiket: "Siparişim nerede?", hedef: "siparis-nerede" },
      { etiket: "Siparişimi iptal etmek istiyorum", hedef: "iptal" },
      { etiket: "Ödeme ile ilgili sorum var", hedef: "odeme" },
      { etiket: "Kuponum çalışmadı", hedef: "kupon" },
      { etiket: "Yemekle ilgili bir sorun var", hedef: "yemek-sorun" },
      { etiket: "Şef / ev hanımı olmak istiyorum", hedef: "sef-olmak" },
      { etiket: "Kurye olmak istiyorum", hedef: "kurye-olmak" },
      { etiket: "Başka bir konu", hedef: "diger" },
    ],
  },

  // ---------------- Sipariş takibi ----------------
  {
    id: "siparis-nerede",
    mesaj: [
      "Siparişlerinin durumunu hesabından adım adım görebilirsin: alındı, hazırlanıyor, yolda, teslim edildi.",
      "Durumu kontrol ettin mi?",
    ],
    baglanti: { etiket: "Siparişlerim", href: "/hesabim" },
    secenekler: [
      { etiket: "Baktım, hâlâ 'hazırlanıyor' görünüyor", hedef: "gecikme" },
      { etiket: "Yolda görünüyor ama gelmedi", hedef: "gecikme" },
      { etiket: "Teslim edildi yazıyor ama elime ulaşmadı", hedef: "teslim-sorunu" },
      { etiket: "Başa dön", hedef: "kok" },
    ],
  },
  {
    id: "gecikme",
    mesaj: [
      "Hazırlık süresi mutfağa göre değişiyor; profil sayfasında her mutfağın tahmini süresi yazıyor.",
      "Söz verilen süreyi belirgin şekilde aştıysa siparişi bize bildir — kuryeye ve mutfağa biz ulaşalım.",
    ],
    secenekler: [
      { etiket: "Destek talebi oluştur", hedef: "talep-gecikme" },
      { etiket: "Başa dön", hedef: "kok" },
    ],
  },
  {
    id: "talep-gecikme",
    mesaj: ["Sipariş numaranı ve kısa bir açıklama yaz, hemen bakalım."],
    talepAc: true,
    konu: "Sipariş gecikmesi",
  },
  {
    id: "teslim-sorunu",
    mesaj: [
      "Bu durumda kurye kaydını ve teslim saatini kontrol etmemiz gerekiyor.",
      "Talebini aç, siparişi tek tek inceleyelim.",
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
    baglanti: { etiket: "Siparişlerim", href: "/hesabim" },
    secenekler: [
      { etiket: "İptal düğmesi görünmüyor", hedef: "talep-iptal" },
      { etiket: "Başa dön", hedef: "kok" },
    ],
  },
  {
    id: "talep-iptal",
    mesaj: ["Sipariş numaranı yaz, durumu kontrol edip sana dönelim."],
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
    secenekler: [
      { etiket: "Kartla ödeyebilir miyim?", hedef: "kart" },
      { etiket: "Ödeme yaptım ama sipariş görünmüyor", hedef: "talep-odeme" },
      { etiket: "Başa dön", hedef: "kok" },
    ],
  },
  {
    id: "kart",
    mesaj: [
      "Kartla ödeme altyapısı kurulu ama şu an kapalı — henüz aktif etmedik.",
      "Bugün için kapıda nakit veya IBAN'a havale çalışıyor.",
    ],
    secenekler: [{ etiket: "Başa dön", hedef: "kok" }],
  },
  {
    id: "talep-odeme",
    mesaj: ["Sipariş numaranı ve ödeme şeklini yaz, kaydı kontrol edelim."],
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
    secenekler: [
      { etiket: "Kurallara uyuyorum ama yine de çalışmadı", hedef: "talep-kupon" },
      { etiket: "Başa dön", hedef: "kok" },
    ],
  },
  {
    id: "talep-kupon",
    mesaj: ["Kupon kodunu ve sepet tutarını yaz, neden geçmediğine bakalım."],
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
    baglanti: { etiket: "Siparişlerim", href: "/hesabim" },
    secenekler: [
      { etiket: "Eksik veya yanlış ürün geldi", hedef: "talep-eksik" },
      { etiket: "Yemek bozuk / yenmeyecek haldeydi", hedef: "talep-bozuk" },
      { etiket: "Başa dön", hedef: "kok" },
    ],
  },
  {
    id: "talep-eksik",
    mesaj: ["Sipariş numaranı ve hangi ürünün eksik/yanlış geldiğini yaz."],
    talepAc: true,
    konu: "Eksik veya yanlış ürün",
  },
  {
    id: "talep-bozuk",
    mesaj: [
      "Bu ciddi bir konu, doğrudan biz ilgileniyoruz.",
      "Sipariş numaranı ve durumu yaz; mümkünse fotoğrafı e-postayla da gönder.",
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
    baglanti: { etiket: "Ev Hanımları sayfası", href: "/ev-hanimlari" },
    secenekler: [
      { etiket: "Başvuru yapmak istiyorum", hedef: "basvuru-yonlendir" },
      { etiket: "Vergi ve belgeler ne olacak?", hedef: "resmi" },
      { etiket: "Başa dön", hedef: "kok" },
    ],
  },
  {
    id: "resmi",
    mesaj: [
      "Belirli bir cironun altında kalan ev üretimi için Esnaf Muafiyet Belgesi süreci var.",
      "Gıda üretim kaydı ise Tarım ve Orman Bakanlığı'ndan alınıyor.",
      "Bu süreçlerde yol gösteriyoruz ama belgeler kişinin kendi adına düzenleniyor.",
    ],
    baglanti: { etiket: "Ayrıntılar", href: "/ev-hanimlari" },
    secenekler: [{ etiket: "Başa dön", hedef: "kok" }],
  },
  {
    id: "kurye-olmak",
    mesaj: [
      "Ehliyet, kendi aracın (motosiklet, bisiklet veya elektrikli scooter) ve akıllı telefon yeterli.",
      "Başvurun yönetici onayından geçtikten sonra kurye paneline erişirsin; sana atanan siparişi yalnızca sen görürsün.",
    ],
    secenekler: [
      { etiket: "Başvuru yapmak istiyorum", hedef: "basvuru-yonlendir" },
      { etiket: "Başa dön", hedef: "kok" },
    ],
  },
  {
    id: "basvuru-yonlendir",
    mesaj: ["Başvuru formu hazır — birkaç dakikanı alır."],
    baglanti: { etiket: "Başvuru formunu aç", href: "/hesap/basvuru" },
    secenekler: [{ etiket: "Başa dön", hedef: "kok" }],
  },

  // ---------------- Diğer ----------------
  {
    id: "diger",
    mesaj: [
      "Anlat bakalım — konuyu yaz, ekibe iletelim.",
      "Sana e-posta ile dönüş yapacağız.",
    ],
    talepAc: true,
    konu: "Genel destek",
  },
];

export function destekAdimiBul(id: string): DestekAdimi | undefined {
  return destekAdimlari.find((a) => a.id === id);
}
