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
  | "konum";

export type Adim = {
  no: string;
  baslik: string;
  /** İngilizcesi; yoksa Türkçesi gösteriliyor. */
  baslikEn?: string;
  metin: string;
  metinEn?: string;
};

export type Ozellik = {
  ikon: IkonAnahtari;
  baslik: string;
  baslikEn?: string;
  metin: string;
  metinEn?: string;
};

export type Eksen = {
  ad: string;
  adEn?: string;
  ozet: string;
  ozetEn?: string;
  metin: string;
  metinEn?: string;
};

export type ResmiKonu = {
  baslik: string;
  baslikEn?: string;
  kurum: string;
  kurumEn?: string;
  metin: string;
  metinEn?: string;
};

export const evHanimlari = {
  ustBaslik: "Ev Hanımları & Şefler",
  ustBaslikEn: "Home Cooks & Chefs",
  baslik: "Mutfağın zaten var",
  baslikEn: "You already have the kitchen —",
  baslikVurgu: "dükkânın da olsun",
  baslikVurguEn: "now have the shop too",
  ozet:
    "Ne Yersin? evinde pişirip satmak isteyen ev hanımları ve şefler için kuruldu. " +
    "Sen yemeğini yap; müşteriyi bulmayı, kuryeyi ayarlamayı ve tahsilatı biz üstlenelim.",
  ozetEn: "Ne Yersin? was built for home cooks and chefs who want to cook at home and sell. You make the food; we take on finding customers, arranging the courier and collecting the money.",

  /** Sayfa başlığının altındaki kısa rakamlar. */
  rakamlar: [
    {
      deger: "0 TL",
      degerEn: "0 TL",
      etiket: "teslimat ücreti — müşteriden de senden de alınmıyor",
      etiketEn: "delivery fee — charged neither to the customer nor to you",
    },
    {
      deger: "3",
      degerEn: "3",
      etiket: "değerlendirme ekseni: sıcaklık, teslimat hızı, tad",
      etiketEn: "rating criteria: temperature, delivery speed, taste",
    },
    {
      deger: "Onaylı",
      degerEn: "Approved",
      etiket: "giriş — her başvuru yöneticiden geçer",
      etiketEn: "entry — every application is reviewed by us",
    },
  ],

  /** "Neden böyle bir şey lazım" — engelin kendisi. */
  engeller: [
    {
      baslik: "Müşteriye ulaşamamak",
      baslikEn: "Not being able to reach customers",
      metinEn: "Home cooking mostly stays within the neighbourhood and a circle of acquaintances. The demand is there, the food is there; what's missing is a place that brings the two together safely.",
      metin:
        "Ev yemeği çoğunlukla mahalle çevresinde ve tanıdık ağında kalır. Talep var, " +
        "yemek var; ikisini güvenle buluşturan bir yer yok.",
    },
    {
      baslik: "Resmî tarafı tek başına çözmek",
      baslikEn: "Sorting out the paperwork alone",
      metinEn: "Tradesman exemption, food production registration, tax… Working out which document comes from where is where most people give up at the very first step.",
      metin:
        "Esnaf muafiyeti, gıda üretim kaydı, vergi... Hangi belgenin nereden alındığını " +
        "araştırmak çoğu kişinin daha ilk adımda vazgeçtiği yer.",
    },
    {
      baslik: "Tanımadığı mutfağa güvenmemek",
      baslikEn: "Not trusting an unfamiliar kitchen",
      metinEn: "The customer has a point: they don't know who made the food or under what conditions. Without a transparent rating system to build that trust, sales don't grow.",
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
      baslikEn: "Apply",
      metinEn: "You submit the form with your name, phone, email and a password of your choosing. You don't need to register separately — the password you set becomes your sign-in password.",
      metin:
        "Adını, telefonunu, e-postanı ve kendine bir parola belirleyip formu gönderiyorsun. " +
        "Ayrıca üye olmana gerek yok — belirlediğin parola giriş parolan oluyor.",
    },
    {
      no: "02",
      baslik: "Onaylanmayı bekle",
      baslikEn: "Wait for approval",
      metinEn: "Your application reaches our team. Nobody can declare themselves a chef and walk into the system; your role (Chef / Home Cook) is decided during approval.",
      metin:
        "Başvurun yöneticiye düşer. Kimse kendini şef ilan edip sisteme giremez; " +
        "rolün (Şef / Ev Hanımı) onay sırasında belirlenir.",
    },
    {
      no: "03",
      baslik: "Mutfağın açılır",
      baslikEn: "Your kitchen opens",
      metinEn: "The moment you are approved your account opens and a kitchen page is created in your own name. If a kitchen with the same name exists, your address is adjusted so they don't clash.",
      metin:
        "Onaylandığın anda hesabın açılır ve kendi adınla bir mutfak sayfan oluşturulur. " +
        "Aynı isimde başka bir mutfak varsa adresin çakışmayacak şekilde ayarlanır.",
    },
    {
      no: "04",
      baslik: "Sipariş al",
      baslikEn: "Take orders",
      metinEn: "You enter your dishes, your background and your certificates from your dashboard. Orders appear there when they come in; the system assigns the courier, you only look after the food.",
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
      baslikEn: "Your own digital shop",
      metinEn: "A kitchen page in your name: your dishes, your neighbourhood, your rating and customer reviews all in one place. Customers see you in the same list as restaurants.",
      metin:
        "Adına açılan mutfak sayfası: ürünlerin, semtin, puanın ve müşteri yorumların " +
        "tek yerde. Müşteri seni restoranlarla aynı listede görür.",
    },
    {
      ikon: "kullanici",
      baslik: "Özgeçmiş ve sertifika alanı",
      baslikEn: "Space for your background and certificates",
      metinEn: "You write where you've worked before, which dish you're confident in, and your hygiene and health certificates yourself. A page where you can present yourself.",
      metin:
        "Daha önce nerede çalıştığını, hangi yemekte iddialı olduğunu ve hijyen/sağlık " +
        "sertifikalarını kendin yazarsın. Kendini pazarlayabildiğin bir sayfa.",
    },
    {
      ikon: "yildiz",
      baslik: "Üç eksende değerlendirme",
      baslikEn: "Rated on three criteria",
      metinEn: "Your rating isn't squeezed into one star. Temperature, delivery speed and taste are rated separately — where you're strong and what you need to fix are both clear.",
      metin:
        "Puan tek bir yıldıza sıkışmaz. Sıcaklık, teslimat hızı ve tad ayrı ayrı " +
        "puanlanır — hangi tarafta iyi olduğun ve neyi düzeltmen gerektiği net görünür.",
    },
    {
      ikon: "kalkan",
      baslik: "Adresin ve numaran gizli",
      baslikEn: "Your address and number stay private",
      metinEn: "The customer's address and phone are not shown to you, and your number is not given to the customer. Contact goes through the order, which protects both sides.",
      metin:
        "Müşterinin adresi ve telefonu sana gösterilmez; senin numaran da müşteriye " +
        "verilmez. İletişim sipariş üzerinden yürür, bu iki tarafı da korur.",
    },
    {
      ikon: "scooter",
      baslik: "Kuryeyi biz ayarlıyoruz",
      baslikEn: "We arrange the courier",
      metinEn: "Every order is assigned to a single courier — no other courier can see an order that isn't theirs. There is no delivery fee, charged neither to the customer nor to you.",
      metin:
        "Her sipariş tek bir kuryeye atanır — atanmamış siparişi hiçbir kurye göremez. " +
        "Teslimat ücreti yok, müşteriden de senden de alınmıyor.",
    },
    {
      ikon: "veri",
      baslik: "Kapıda nakit veya havale",
      baslikEn: "Cash or bank transfer at the door",
      metinEn: "The customer doesn't have to pay in advance. The courier takes cash at the door, or a transfer is made to the IBAN with the order number in the reference.",
      metin:
        "Müşteri önceden ödeme yapmak zorunda değil. Kurye kapıya gittiğinde nakit alır " +
        "ya da IBAN'a havale yapılır; sipariş numarası açıklamaya yazılır.",
    },
  ],

  /** Üç değerlendirme ekseni — dosyadaki SICAKLIK / TESLİMAT HIZI / TAD. */
  eksenler: [
    {
      ad: "Sıcaklık",
      adEn: "Temperature",
      metinEn: "In home cooking this is where points are lost most often, and usually the cause is not the kitchen but the packaging. Because it's a separate heading, you can see at a glance where the problem is.",
      ozet: "Yemek kapıya sıcak ulaştı mı?",
      ozetEn: "Did the food reach the door hot?",
      metin:
        "Ev yemeğinde en sık düşen puan burada çıkar ve çoğu zaman sebebi mutfak değil, " +
        "paketlemedir. Ayrı bir başlık olduğu için sorunun nerede olduğu ilk bakışta belli olur.",
    },
    {
      ad: "Teslimat Hızı",
      adEn: "Delivery speed",
      metinEn: "This measures both your preparation time and the courier. If your food went out on time but the delivery was late, that's a mark against delivery, not against you.",
      ozet: "Söz verilen sürede geldi mi?",
      ozetEn: "Did it arrive within the promised time?",
      metin:
        "Bu eksen hem hazırlık süreni hem kuryeyi ölçer. Yemeğin geç çıkmadığı hâlde " +
        "gecikme olmuşsa bu, senin değil teslimatın notudur.",
    },
    {
      ad: "Tad",
      adEn: "Taste",
      metinEn: "The reward for the actual work. Only a customer with a delivered order can rate, and only once per order — ratings cannot be invented.",
      ozet: "Yemek beklendiği gibi miydi?",
      ozetEn: "Was the food as expected?",
      metin:
        "Asıl işin karşılığı. Yalnızca teslim edilmiş bir siparişi olan müşteri puan " +
        "verebilir ve her sipariş için yalnızca bir kez — puanlar uydurulamaz.",
    },
  ],

  /** Puan kuralı. */
  puanKurali: {
    esik: "4,2 / 5",
    esikEn: "4.2 / 5",
    metinEn: "Profiles whose average falls below 4.2 are reviewed. The review is evidence-based: order-linked reviews and customer reports are assessed one by one. If the problem continues, the profile is closed to sales. The aim is not to punish but to stop one bad experience damaging the whole idea of home cooking.",
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
      baslikEn: "Tradesman Exemption Certificate",
      metinEn: "There is a tax-exempt tradesman status for people selling what they produce at home below a certain annual turnover. We guide you on which document to get and where; the certificate is issued in your own name.",
      kurum: "Vergi dairesi",
      kurumEn: "Tax office",
      metin:
        "Yıllık belli bir cironun altında, evinde ürettiğini satan kişiler için " +
        "vergiden muaf esnaf statüsü var. Süreçte hangi belgeyi nereden alacağın " +
        "konusunda yol gösteriyoruz; belge kendi adına düzenlenir.",
    },
    {
      baslik: "Gıda İşletme Kaydı",
      baslikEn: "Food Business Registration",
      metinEn: "The registration required to produce from home. The suitability of your kitchen and your production conditions are assessed under it. This is also done in your own name.",
      kurum: "Tarım ve Orman Bakanlığı",
      kurumEn: "Ministry of Agriculture and Forestry",
      metin:
        "Evden üretim için alınması gereken kayıt. Mutfağın uygunluğu ve üretim " +
        "koşulları bu kapsamda değerlendirilir. Bu da kişinin kendi adına yapılır.",
    },
    {
      baslik: "Mükellef desteği",
      baslikEn: "Accounting support",
      metinEn: "For those who pass the exemption limit or want to grow, we plan to offer support from an accountant we work with — so you don't have to go looking for one yourself.",
      kurum: "Anlaşmalı muhasebe",
      kurumEn: "Partner accountant",
      metin:
        "Muafiyet sınırını aşan ya da işini büyütmek isteyenler için anlaşmalı " +
        "mükellef desteği planlanıyor — tek tek muhasebeci aramak zorunda kalmayasın diye.",
    },
  ],

  /** Proje dosyasında yazan ama henüz YAPILMAMIŞ maddeler. Sayfada açıkça böyle etiketli. */
  yolHaritasi: [
    {
      baslik: "Ayın Hanımı rozetleri",
      baslikEn: "Cook of the Month badges",
      metinEn: "Monthly and weekly achievement badges, shown in colour on your profile. The homepage has a 'Cooks of the Month' section today, but the badge system does not exist yet.",
      metin:
        "Aylık ve haftalık başarı rozetleri — profilde renkli olarak görünecek. " +
        "Şu an anasayfada 'Ayın Hanımları' bölümü var, rozet sistemi henüz yok.",
    },
    {
      baslik: "Hikâye ve QR kod",
      baslikEn: "Stories and QR codes",
      metinEn: "Being able to put short videos from your kitchen on your profile, and the customer opening them from a QR code on the packaging.",
      metin:
        "Mutfağından çektiğin kısa videoları profiline koyabilmen ve paketin üstündeki " +
        "QR koddan müşterinin bunu açabilmesi.",
    },
    {
      baslik: "Ne Yersin? Teslimat Kutuları",
      baslikEn: "Ne Yersin? Delivery Lockers",
      metinEn: "Coded, insulated lockers beside shops and depots so couriers don't struggle to park in back streets. You leave the food in the locker and the courier collects it with a code.",
      metin:
        "Ara sokaklarda kuryenin park sorunu yaşamaması için mağaza/depo yanlarına " +
        "şifreli, ısı yalıtımlı teslim dolapları. Yemeği kutuya bırakırsın, kurye kodla alır.",
    },
    {
      baslik: "Tek tıkla muafiyet başvurusu",
      baslikEn: "One-tap exemption application",
      metinEn: "Running the Tradesman Exemption Certificate process from inside the app without filling in forms. Today we only offer guidance on this.",
      metin:
        "Esnaf Muafiyet Belgesi sürecinin uygulama içinden, form doldurmadan " +
        "yürütülebilmesi. Şu an bu konuda yalnızca rehberlik ediyoruz.",
    },
    {
      baslik: "Yöresel yemek başvurusu",
      baslikEn: "Regional dish applications",
      metinEn: "An application flow to add a regional dish that isn't on the list (Kars-style hıngel, içli köfte and so on) and to open a new category for it.",
      metin:
        "Listede olmayan bir yöresel yemeği (Kars usulü hıngel, içli köfte gibi) " +
        "sisteme eklemek için başvuru ve yeni kategori açma akışı.",
    },
    {
      baslik: "Ne Yersin? Eğitim",
      baslikEn: "Ne Yersin? Training",
      metinEn: "Hygiene and kitchen training; letting people who do it well record training videos and be paid for them.",
      metin:
        "Hijyen ve mutfak eğitimleri; iyi yapan kişilerin eğitim videosu çekip " +
        "bunun karşılığını alabilmesi.",
    },
    {
      baslik: "Gizli müşteri denetimi",
      baslikEn: "Mystery shopper checks",
      metinEn: "Checking quality from the inside with random orders. After a check, the profile gets a note saying 'this was a mystery shopper order' along with its rating.",
      metin:
        "Rastgele siparişlerle kalitenin içeriden denetlenmesi. Denetim sonrası " +
        "profile 'bu bir gizli müşteri siparişiydi' notu ve puanlaması düşer.",
    },
    {
      baslik: "Dünya mutfakları",
      baslikEn: "World cuisines",
      metinEn: "Categories such as Afghan, Italian and Syrian cuisine — so anyone cooking their own country's food can build their own market.",
      metin:
        "Afgan, İtalyan, Suriye mutfağı gibi kategoriler — kendi ülkesinin yemeğini " +
        "yapan herkesin kendi pazarını kurabilmesi.",
    },
  ],

  sss: [
    {
      soru: "Ev hanımı olarak nasıl başlarım?",
      soruEn: "How do I start as a home cook?",
      cevapEn: "You fill in the application form: name, phone, email and a password you choose. Your application reaches our team; the moment it is approved your account opens with a kitchen page in your name. You don't need to register separately — you sign in with the same password.",
      cevap:
        "Başvuru formunu doldurursun: ad, telefon, e-posta ve kendine belirlediğin bir " +
        "parola. Başvurun yöneticiye düşer; onaylandığı anda hesabın açılır ve adınla bir " +
        "mutfak sayfan oluşur. Ayrıca üye olman gerekmez, aynı parolayla giriş yaparsın.",
    },
    {
      soru: "Vergi ve resmî belgeler ne olacak?",
      soruEn: "What about tax and official paperwork?",
      cevapEn: "For home production below a certain turnover there is a Tradesman Exemption Certificate process; the food production registration comes from the Ministry of Agriculture and Forestry. We guide you through both — but the documents are issued in your own name.",
      cevap:
        "Belirli bir cironun altında kalan ev üretimi için Esnaf Muafiyet Belgesi süreci " +
        "var; gıda üretim kaydı ise Tarım ve Orman Bakanlığı'ndan alınıyor. Bu süreçlerde " +
        "yol gösteriyoruz — ama belgeler kişinin kendi adına düzenlenir.",
    },
    {
      soru: "Müşteri bana doğrudan ulaşabilir mi?",
      soruEn: "Can customers contact me directly?",
      cevapEn: "No. Your profile carries no phone number or social media handle, and the customer's address and number are not shown to you either. All contact goes through the order, which protects both you and the customer.",
      cevap:
        "Hayır. Profilinde telefon veya sosyal medya adresi paylaşılmaz, müşterinin adresi " +
        "ve numarası da sana gösterilmez. Tüm iletişim sipariş üzerinden yürür; bu hem seni " +
        "hem müşteriyi korur.",
    },
    {
      soru: "Parayı nasıl alacağım?",
      soruEn: "How do I get paid?",
      cevapEn: "The customer pays at the door: cash to the courier, or a transfer to the IBAN. The order number goes in the reference, so which payment belongs to which order stays on record.",
      cevap:
        "Müşteri kapıda ödüyor: kuryeye nakit verir ya da IBAN'a havale yapar. Sipariş " +
        "numarası açıklamaya yazılır, böylece hangi ödemenin hangi siparişe ait olduğu " +
        "kayıtta durur.",
    },
    {
      soru: "Teslimat ücretini ben mi ödüyorum?",
      soruEn: "Do I pay the delivery fee?",
      cevapEn: "No. Delivery is currently free on every order — charged neither to the customer nor to you. The system assigns the courier; you never have to go looking for one.",
      cevap:
        "Hayır. Teslimat şu an tüm siparişlerde ücretsiz — ne müşteriden ne senden " +
        "alınıyor. Kuryeyi sistem atar, sen kurye aramakla uğraşmazsın.",
    },
    {
      soru: "Puanım düşerse ne olur?",
      soruEn: "What happens if my rating drops?",
      cevapEn: "Because ratings appear separately under three headings, it is clear where the problem is. Profiles whose average falls below 4.2 are reviewed; complaints are assessed against order-linked evidence, and if the problem continues the profile is closed.",
      cevap:
        "Değerlendirmeler üç başlıkta ayrı ayrı göründüğü için hangi tarafta sorun olduğu " +
        "bellidir. Ortalaması 4,2'nin altına düşen profiller incelemeye alınır; şikâyetler " +
        "siparişe bağlı kanıtlarla değerlendirilir, sorun sürerse profil kapatılır.",
    },
    {
      soru: "Kaç çeşit yemek yapmam gerekiyor?",
      soruEn: "How many dishes do I need to make?",
      cevapEn: "There is no minimum. Making a single dish very well works in this system too — you write on your profile what you're confident in, and customers come looking for exactly that.",
      cevap:
        "Alt sınır yok. Tek bir yemeği çok iyi yapmak da bu sistemde çalışır — profilinde " +
        "neyde iddialı olduğunu yazarsın, müşteri de zaten onu arayarak gelir.",
    },
    {
      soru: "Şu an nerede hizmet veriyorsunuz?",
      soruEn: "Where do you operate right now?",
      cevapEn: "Istanbul / Beylikdüzü only. You can apply from another district, but you cannot take orders until delivery opens there. We let you know when a new district opens.",
      cevap:
        "Yalnızca İstanbul / Beylikdüzü. Başvurunu başka ilçeden de yapabilirsin ama " +
        "teslimat açılana kadar sipariş alamazsın. Yeni ilçe açıldığında haber veriyoruz.",
    },
  ],
} as const;
