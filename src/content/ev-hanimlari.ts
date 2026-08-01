/**
 * "Ev Hanımları" sayfasının içeriği.
 *
 * Kaynak: proje dosyasının ANNELERİMİZ / EV HANIMLARI / ŞEFLER bölümü.
 *
 * ÖNEMLİ: Bu dosyada iki ayrı liste var ve karıştırılmamalı —
 *   `bugunVarOlanlar`  → sistemde ÇALIŞAN özellikler
 *   `yolHaritasi`      → proje dosyasında yazan ama HENÜZ YAPILMAMIŞ maddeler
 * Sayfada da bu ayrım görünür şekilde duruyor; başvuran kişiye olmayan bir şey
 * varmış gibi anlatılmıyor.
 */

/** İkon adı — sayfa tarafında gerçek bileşene eşlenir (içerik dosyası bileşen içe aktarmaz). */
export type IkonAnahtari =
  | "dukkan"
  | "kullanici"
  | "yildiz"
  | "kalkan"
  | "rozet"
  | "mutfak"
  | "saat"
  | "scooter"
  | "veri"
  | "grafik"
  | "konum"
  | "simsek";

export type Adim = {
  no: string;
  baslik: string;
  metin: string;
};

export type Ozellik = {
  ikon: IkonAnahtari;
  baslik: string;
  metin: string;
};

export type Eksen = {
  ad: string;
  ozet: string;
  metin: string;
};

export type ResmiKonu = {
  baslik: string;
  kurum: string;
  metin: string;
};

export const evHanimlari = {
  ustBaslik: "Ev Hanımları & Şefler",
  baslik: "Mutfağın zaten var",
  baslikVurgu: "dükkânın da olsun",
  ozet:
    "Ne Yersin? evinde pişirip satmak isteyen ev hanımları ve şefler için kuruldu. " +
    "Sen yemeğini yap; müşteriyi bulmayı, kuryeyi ayarlamayı ve tahsilatı biz üstlenelim.",

  /** Sayfa başlığının altındaki kısa rakamlar. */
  rakamlar: [
    { deger: "0 TL", etiket: "teslimat ücreti — müşteriden de senden de alınmıyor" },
    { deger: "3", etiket: "değerlendirme ekseni: sıcaklık, teslimat hızı, tad" },
    { deger: "Onaylı", etiket: "giriş — her başvuru yöneticiden geçer" },
  ],

  /** "Neden böyle bir şey lazım" — engelin kendisi. */
  engeller: [
    {
      baslik: "Müşteriye ulaşamamak",
      metin:
        "Ev yemeği çoğunlukla mahalle çevresinde ve tanıdık ağında kalır. Talep var, " +
        "yemek var; ikisini güvenle buluşturan bir yer yok.",
    },
    {
      baslik: "Resmî tarafı tek başına çözmek",
      metin:
        "Esnaf muafiyeti, gıda üretim kaydı, vergi... Hangi belgenin nereden alındığını " +
        "araştırmak çoğu kişinin daha ilk adımda vazgeçtiği yer.",
    },
    {
      baslik: "Tanımadığı mutfağa güvenmemek",
      metin:
        "Müşteri de haklı: yemeği kimin, hangi koşulda yaptığını bilmiyor. Bu güveni " +
        "kuracak şeffaf bir değerlendirme düzeni olmadan satış büyümüyor.",
    },
  ],

  /** Başvurudan ilk siparişe kadar — bugün gerçekten işleyen akış. */
  adimlar: [
    {
      no: "01",
      baslik: "Başvur",
      metin:
        "Adını, telefonunu, e-postanı ve kendine bir parola belirleyip formu gönderiyorsun. " +
        "Ayrıca üye olmana gerek yok — belirlediğin parola giriş parolan oluyor.",
    },
    {
      no: "02",
      baslik: "Onaylanmayı bekle",
      metin:
        "Başvurun yöneticiye düşer. Kimse kendini şef ilan edip sisteme giremez; " +
        "rolün (Şef / Ev Hanımı) onay sırasında belirlenir.",
    },
    {
      no: "03",
      baslik: "Mutfağın açılır",
      metin:
        "Onaylandığın anda hesabın açılır ve kendi adınla bir mutfak sayfan oluşturulur. " +
        "Aynı isimde başka bir mutfak varsa adresin çakışmayacak şekilde ayarlanır.",
    },
    {
      no: "04",
      baslik: "Sipariş al",
      metin:
        "Panelinden ürünlerini, özgeçmişini ve sertifikalarını girersin. Sipariş geldiğinde " +
        "panelinde görünür; kuryeyi sistem atar, sen yalnızca yemeğe bakarsın.",
    },
  ],

  /** Bugün çalışan özellikler. */
  bugunVarOlanlar: [
    {
      ikon: "dukkan",
      baslik: "Kendi dijital dükkânın",
      metin:
        "Adına açılan mutfak sayfası: ürünlerin, semtin, puanın ve müşteri yorumların " +
        "tek yerde. Müşteri seni restoranlarla aynı listede görür.",
    },
    {
      ikon: "kullanici",
      baslik: "Özgeçmiş ve sertifika alanı",
      metin:
        "Daha önce nerede çalıştığını, hangi yemekte iddialı olduğunu ve hijyen/sağlık " +
        "sertifikalarını kendin yazarsın. Kendini pazarlayabildiğin bir sayfa.",
    },
    {
      ikon: "yildiz",
      baslik: "Üç eksende değerlendirme",
      metin:
        "Puan tek bir yıldıza sıkışmaz. Sıcaklık, teslimat hızı ve tad ayrı ayrı " +
        "puanlanır — hangi tarafta iyi olduğun ve neyi düzeltmen gerektiği net görünür.",
    },
    {
      ikon: "kalkan",
      baslik: "Adresin ve numaran gizli",
      metin:
        "Müşterinin adresi ve telefonu sana gösterilmez; senin numaran da müşteriye " +
        "verilmez. İletişim sipariş üzerinden yürür, bu iki tarafı da korur.",
    },
    {
      ikon: "scooter",
      baslik: "Kuryeyi biz ayarlıyoruz",
      metin:
        "Her sipariş tek bir kuryeye atanır — atanmamış siparişi hiçbir kurye göremez. " +
        "Teslimat ücreti yok, müşteriden de senden de alınmıyor.",
    },
    {
      ikon: "veri",
      baslik: "Kapıda nakit veya havale",
      metin:
        "Müşteri önceden ödeme yapmak zorunda değil. Kurye kapıya gittiğinde nakit alır " +
        "ya da IBAN'a havale yapılır; sipariş numarası açıklamaya yazılır.",
    },
  ],

  /** Üç değerlendirme ekseni — dosyadaki SICAKLIK / TESLİMAT HIZI / TAD. */
  eksenler: [
    {
      ad: "Sıcaklık",
      ozet: "Yemek kapıya sıcak ulaştı mı?",
      metin:
        "Ev yemeğinde en sık düşen puan burada çıkar ve çoğu zaman sebebi mutfak değil, " +
        "paketlemedir. Ayrı bir başlık olduğu için sorunun nerede olduğu ilk bakışta belli olur.",
    },
    {
      ad: "Teslimat Hızı",
      ozet: "Söz verilen sürede geldi mi?",
      metin:
        "Bu eksen hem hazırlık süreni hem kuryeyi ölçer. Yemeğin geç çıkmadığı hâlde " +
        "gecikme olmuşsa bu, senin değil teslimatın notudur.",
    },
    {
      ad: "Tad",
      ozet: "Yemek beklendiği gibi miydi?",
      metin:
        "Asıl işin karşılığı. Yalnızca teslim edilmiş bir siparişi olan müşteri puan " +
        "verebilir ve her sipariş için yalnızca bir kez — puanlar uydurulamaz.",
    },
  ],

  /** Puan kuralı. */
  puanKurali: {
    esik: "4,2 / 5",
    metin:
      "Ortalaması 4,2'nin altına düşen profiller incelemeye alınır. İnceleme kanıta " +
      "dayanır: siparişe bağlı yorumlar ve müşteri bildirimleri tek tek değerlendirilir. " +
      "Sorun devam ediyorsa profil satışa kapatılır. Amaç ceza kesmek değil, kötü " +
      "deneyimin bütün ev mutfağı fikrine zarar vermesini önlemek.",
  },

  /** Resmî taraf — dosyadaki hukuki destek başlığı. */
  resmiKonular: [
    {
      baslik: "Esnaf Muafiyet Belgesi",
      kurum: "Vergi dairesi",
      metin:
        "Yıllık belli bir cironun altında, evinde ürettiğini satan kişiler için " +
        "vergiden muaf esnaf statüsü var. Süreçte hangi belgeyi nereden alacağın " +
        "konusunda yol gösteriyoruz; belge kendi adına düzenlenir.",
    },
    {
      baslik: "Gıda İşletme Kaydı",
      kurum: "Tarım ve Orman Bakanlığı",
      metin:
        "Evden üretim için alınması gereken kayıt. Mutfağın uygunluğu ve üretim " +
        "koşulları bu kapsamda değerlendirilir. Bu da kişinin kendi adına yapılır.",
    },
    {
      baslik: "Mükellef desteği",
      kurum: "Anlaşmalı muhasebe",
      metin:
        "Muafiyet sınırını aşan ya da işini büyütmek isteyenler için anlaşmalı " +
        "mükellef desteği planlanıyor — tek tek muhasebeci aramak zorunda kalmayasın diye.",
    },
  ],

  /** Proje dosyasında yazan ama henüz YAPILMAMIŞ maddeler. Sayfada açıkça böyle etiketli. */
  yolHaritasi: [
    {
      baslik: "Ayın Hanımı rozetleri",
      metin:
        "Aylık ve haftalık başarı rozetleri — profilde renkli olarak görünecek. " +
        "Şu an anasayfada 'Ayın Hanımları' bölümü var, rozet sistemi henüz yok.",
    },
    {
      baslik: "Hikâye ve QR kod",
      metin:
        "Mutfağından çektiğin kısa videoları profiline koyabilmen ve paketin üstündeki " +
        "QR koddan müşterinin bunu açabilmesi.",
    },
    {
      baslik: "Ne Yersin? Teslimat Kutuları",
      metin:
        "Ara sokaklarda kuryenin park sorunu yaşamaması için mağaza/depo yanlarına " +
        "şifreli, ısı yalıtımlı teslim dolapları. Yemeği kutuya bırakırsın, kurye kodla alır.",
    },
    {
      baslik: "Tek tıkla muafiyet başvurusu",
      metin:
        "Esnaf Muafiyet Belgesi sürecinin uygulama içinden, form doldurmadan " +
        "yürütülebilmesi. Şu an bu konuda yalnızca rehberlik ediyoruz.",
    },
    {
      baslik: "Yöresel yemek başvurusu",
      metin:
        "Listede olmayan bir yöresel yemeği (Kars usulü hıngel, içli köfte gibi) " +
        "sisteme eklemek için başvuru ve yeni kategori açma akışı.",
    },
    {
      baslik: "Ne Yersin? Eğitim",
      metin:
        "Hijyen ve mutfak eğitimleri; iyi yapan kişilerin eğitim videosu çekip " +
        "bunun karşılığını alabilmesi.",
    },
    {
      baslik: "Gizli müşteri denetimi",
      metin:
        "Rastgele siparişlerle kalitenin içeriden denetlenmesi. Denetim sonrası " +
        "profile 'bu bir gizli müşteri siparişiydi' notu ve puanlaması düşer.",
    },
    {
      baslik: "Dünya mutfakları",
      metin:
        "Afgan, İtalyan, Suriye mutfağı gibi kategoriler — kendi ülkesinin yemeğini " +
        "yapan herkesin kendi pazarını kurabilmesi.",
    },
  ],

  sss: [
    {
      soru: "Ev hanımı olarak nasıl başlarım?",
      cevap:
        "Başvuru formunu doldurursun: ad, telefon, e-posta ve kendine belirlediğin bir " +
        "parola. Başvurun yöneticiye düşer; onaylandığı anda hesabın açılır ve adınla bir " +
        "mutfak sayfan oluşur. Ayrıca üye olman gerekmez, aynı parolayla giriş yaparsın.",
    },
    {
      soru: "Vergi ve resmî belgeler ne olacak?",
      cevap:
        "Belirli bir cironun altında kalan ev üretimi için Esnaf Muafiyet Belgesi süreci " +
        "var; gıda üretim kaydı ise Tarım ve Orman Bakanlığı'ndan alınıyor. Bu süreçlerde " +
        "yol gösteriyoruz — ama belgeler kişinin kendi adına düzenlenir.",
    },
    {
      soru: "Müşteri bana doğrudan ulaşabilir mi?",
      cevap:
        "Hayır. Profilinde telefon veya sosyal medya adresi paylaşılmaz, müşterinin adresi " +
        "ve numarası da sana gösterilmez. Tüm iletişim sipariş üzerinden yürür; bu hem seni " +
        "hem müşteriyi korur.",
    },
    {
      soru: "Parayı nasıl alacağım?",
      cevap:
        "Müşteri kapıda ödüyor: kuryeye nakit verir ya da IBAN'a havale yapar. Sipariş " +
        "numarası açıklamaya yazılır, böylece hangi ödemenin hangi siparişe ait olduğu " +
        "kayıtta durur.",
    },
    {
      soru: "Teslimat ücretini ben mi ödüyorum?",
      cevap:
        "Hayır. Teslimat şu an tüm siparişlerde ücretsiz — ne müşteriden ne senden " +
        "alınıyor. Kuryeyi sistem atar, sen kurye aramakla uğraşmazsın.",
    },
    {
      soru: "Puanım düşerse ne olur?",
      cevap:
        "Değerlendirmeler üç başlıkta ayrı ayrı göründüğü için hangi tarafta sorun olduğu " +
        "bellidir. Ortalaması 4,2'nin altına düşen profiller incelemeye alınır; şikâyetler " +
        "siparişe bağlı kanıtlarla değerlendirilir, sorun sürerse profil kapatılır.",
    },
    {
      soru: "Kaç çeşit yemek yapmam gerekiyor?",
      cevap:
        "Alt sınır yok. Tek bir yemeği çok iyi yapmak da bu sistemde çalışır — profilinde " +
        "neyde iddialı olduğunu yazarsın, müşteri de zaten onu arayarak gelir.",
    },
    {
      soru: "Şu an nerede hizmet veriyorsunuz?",
      cevap:
        "Yalnızca İstanbul / Beylikdüzü. Başvurunu başka ilçeden de yapabilirsin ama " +
        "teslimat açılana kadar sipariş alamazsın. Yeni ilçe açıldığında haber veriyoruz.",
    },
  ],
} as const;
