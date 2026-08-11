/**
 * "Hakkımızda" sayfasının içeriği. Kaynak: proje dosyası (Ne Yersin.docx).
 *
 * Blog bölümünün yerine geçti. Buradaki her ifade ya bugün çalışan bir şeyi
 * ya da açıkça "planlanan" diye işaretlenmiş bir hedefi anlatır — sonuç
 * istatistiği veya doğrulanamayan iddia yok.
 */

export type Ilke = {
  baslik: string;
  /** İngilizcesi; yoksa Türkçesi gösteriliyor. */
  baslikEn?: string;
  metin: string;
  metinEn?: string;
};

export type Taraf = {
  kim: string;
  kimEn?: string;
  ozet: string;
  ozetEn?: string;
  maddeler: string[];
  maddelerEn?: string[];
};

export type Hedef = {
  baslik: string;
  baslikEn?: string;
  metin: string;
  metinEn?: string;
};

export const hakkimizda = {
  ustBaslik: "Hakkımızda",
  ustBaslikEn: "About Us",
  baslik: "Yemeği yapan da",
  baslikEn: "Both the cook",
  baslikVurgu: "taşıyan da kazansın",
  baslikVurguEn: "and the courier should earn",
  ozet:
    "Ne Yersin?, Beylikdüzü'nde ev hanımlarının ve şeflerin kendi mutfağından satış " +
    "yaptığı bir yemek ve kurye sistemi. Amacımız aradaki masrafı kısıp hem üretenin " +
    "eline geçeni hem de müşterinin cebinde kalanı büyütmek.",
  ozetEn:
    "Ne Yersin? is a food and courier system in Beylikdüzü where home cooks and chefs sell straight from their own kitchens. Our aim is to cut the cost in between, so both the cook takes home more and the customer keeps more.",

  /**
   * Sayfanın başındaki tanıtım kartı — "bunu kim yapıyor" sorusunun cevabı.
   *
   * Fotoğrafı BURADA DEĞİL, yönetici sayfadan yüklüyor (veritabanında duruyor);
   * içerik dosyasına yazılsaydı her fotoğraf değişikliği için yeni dağıtım
   * gerekirdi. Buradaki metinler kartın adı, unvanı ve tek satırlık tanıtımı.
   */
  tanitim: {
    ad: "Ne Yersin? ekibi",
    adEn: "The Ne Yersin? team",
    unvan: "Kurucu ekip",
    unvanEn: "Founding team",
    /*
     * TON: ekibin küçüklüğü ya da işin yeniliği ÖNE ÇIKARILMIYOR. Önceki metin
     * "küçük bir ekibiz" diyordu; kendini küçülten bir tanıtım, sistemi
     * emanet edecek şefin de kuryenin de güvenini baştan zayıflatıyor.
     * Yine de uydurma yok: burada yazan her şey bugün gerçekten yapılan iş.
     */
    satir:
      "Mutfakları tek tek seçiyor, gelen her başvuruyu kendimiz okuyoruz. " +
      "Beylikdüzü'nde kurduğumuz sistemi İstanbul geneline büyütüyoruz.",
    satirEn:
      "We choose every kitchen ourselves and read every application in person. " +
      "The system we built in Beylikdüzü is growing across Istanbul.",
  },

  /** Kuruluş hikâyesinin İngilizcesi — aynı üç paragraf. */
  hikayeEn: [
    "A plate of food carries far more than food in its price: rent, décor, staff, commission. The bigger those items get, the less the customer can afford to eat and the less reaches the person who actually cooked it.",
    "Yet there are people who make the same dish far better at home. What stands in their way is not the cooking; it is reaching customers, collecting money safely, arranging a courier and handling the paperwork. Ne Yersin? takes on exactly those four steps.",
    "The same exhaustion exists on the courier side — five years of burnout building up in this market, a job where you are expected to sort everything out alone and are easily written off. We want to set the courier up as a partner in the system, not a carrier.",
  ],

  /** Kuruluş hikâyesi — üç paragraf, süslemesiz. */
  hikaye: [
    "Bir tabak yemeğin fiyatının içinde yemekten çok başka şeyler var: kira, dekor, " +
      "personel, komisyon. Bu kalemler büyüdükçe hem müşteri daha az yemek yiyebiliyor " +
      "hem de yemeği asıl yapan kişinin eline daha azı geçiyor.",
    "Oysa aynı yemeği evinde çok daha iyi yapan insanlar var. Önlerindeki engel yemek " +
      "yapmak değil; müşteriye ulaşmak, parayı güvenle tahsil etmek, kuryeyi ayarlamak " +
      "ve resmî tarafı çözmek. Ne Yersin? tam olarak bu dört adımı üstleniyor.",
    "Aynı yorgunluk kurye tarafında da var. Beş yıldır piyasada biriken bir tükenmişlik, " +
      "her şeyi tek başına halletmesi beklenen ve kolayca gözden çıkarılan bir meslek. " +
      "Kuryeyi taşıyıcı değil, sistemin ortağı olarak kurmak istiyoruz.",
  ],

  /** Ne yaptığımızı belirleyen kararlar. */
  ilkeler: [
    {
      baslik: "Kira yükü fiyata binmesin",
      baslikEn: "Rent should not reach the price",
      metinEn: "There is no shop rent in a home kitchen. Passing that difference on as a more affordable price rather than as margin is the basic idea of this business.",
      metin:
        "Ev mutfağında dükkân kirası yok. Bu farkı zam olarak değil, daha erişilebilir " +
        "fiyat olarak yansıtmak işin temel fikri.",
    },
    {
      baslik: "Teslimat ücretsiz",
      baslikEn: "Delivery is free",
      metinEn: "Delivery is currently 0 TL on every order — charged neither to the customer nor to the producer. The system assigns the courier; nobody has to go looking for one.",
      metin:
        "Şu an tüm siparişlerde teslimat 0 TL — ne müşteriden ne üreticiden alınıyor. " +
        "Kuryeyi sistem atıyor, kimse kurye aramakla uğraşmıyor.",
    },
    {
      baslik: "Kapıda ödeme, önden para yok",
      baslikEn: "Pay at the door, nothing upfront",
      metinEn: "The customer does not have to pay in advance. They hand cash to the courier or transfer to our IBAN, putting the order number in the reference.",
      metin:
        "Müşteri önceden ödemek zorunda değil. Kurye geldiğinde nakit veriyor ya da " +
        "IBAN'a havale yapıyor; açıklamaya sipariş numarası yazılıyor.",
    },
    {
      baslik: "Uydurma rakam yok",
      baslikEn: "No made-up numbers",
      metinEn: "This site carries no success statistics that a platform with no customers yet could not possibly have. What works is written as working, and what doesn't is plainly marked 'planned'.",
      metin:
        "Sitede hiç müşterisi olmayan bir platformun veremeyeceği başarı istatistikleri " +
        "yazmıyor. Ne çalışıyorsa o yazıyor, çalışmayan da açıkça 'planlanan' diyor.",
    },
    {
      baslik: "Kişisel veri asgari düzeyde",
      baslikEn: "Personal data kept to a minimum",
      metinEn: "The customer's address and phone are never shown to the cook; only the delivering courier and the administrator see them. The cook's number is not given to the customer either.",
      metin:
        "Müşterinin adresi ve telefonu şefe hiç gösterilmiyor; bu bilgiler yalnızca " +
        "teslimatı yapan kuryede ve yöneticide. Şefin numarası da müşteriye verilmiyor.",
    },
    {
      baslik: "Sipariş tek kuryenin",
      baslikEn: "An order belongs to one courier",
      metinEn: "An order is assigned to a single courier and the others never see it. That rule lives in the database query itself, not in interface hiding.",
      metin:
        "Bir sipariş tek bir kuryeye atanıyor, diğerleri onu hiç görmüyor. Bu kural " +
        "arayüzde gizleme değil, veritabanı sorgusunun kendisinde.",
    },
  ] as Ilke[],

  /** Kimin için ne var. */
  taraflar: [
    {
      kim: "Ev hanımları ve şefler",
      kimEn: "Home cooks and chefs",
      ozetEn: "A shop already set up for anyone who wants to cook at home and sell.",
      maddelerEn: [
        "A kitchen page in your own name, with space for your background and certificates",
        "Separate ratings for temperature, delivery speed and taste",
        "Guidance through the Tradesman Exemption Certificate and food production registration",
        "Applications are reviewed by us — nobody can declare themselves a chef and walk in",
      ],
      ozet: "Evinde pişirip satmak isteyen herkes için kurulu bir dükkân.",
      maddeler: [
        "Kendi adına açılan mutfak sayfası, özgeçmiş ve sertifika alanı",
        "Sıcaklık, teslimat hızı ve tad için ayrı ayrı puanlama",
        "Esnaf Muafiyet Belgesi ve gıda üretim kaydı süreçlerinde yol gösterme",
        "Başvurular yöneticiden geçiyor — kimse kendini şef ilan edip giremiyor",
      ],
    },
    {
      kim: "Kuryeler",
      kimEn: "Couriers",
      ozetEn: "A way of working where you are not left alone, with equipment and support.",
      maddelerEn: [
        "A dashboard showing the deliveries assigned to you",
        "Formal employment with social security, minimum wage plus bonus (planned)",
        "Heated seat, waterproof cover, anti-fog helmet and similar equipment (planned)",
        "A support line to reach in case of an accident or a problem (planned)",
      ],
      ozet: "Yalnız bırakılmayan, ekipmanı ve desteği olan bir çalışma düzeni.",
      maddeler: [
        "Kendine atanan teslimatları gördüğü panel",
        "SGK'lı istihdam ve asgari ücret + prim modeli (planlanan)",
        "Isıtmalı koltuk, su geçirmez kılıf, buğu önleyici kask gibi ekipman (planlanan)",
        "Kaza ve sorun anında ulaşılabilecek destek hattı (planlanan)",
      ],
    },
    {
      kim: "Müşteriler",
      kimEn: "Customers",
      ozetEn: "Home cooking you can order while seeing who made it.",
      maddelerEn: [
        "The cook's profile, story and ratings are open",
        "Free delivery, cash or bank transfer at the door",
        "Cancel your own order before preparation starts",
        "Only someone who actually ordered can leave a rating",
      ],
      ozet: "Ev yemeğine, kim yaptığını görerek ulaşmak.",
      maddeler: [
        "Yemeği yapan kişinin profili, hikâyesi ve puanları açık",
        "Ücretsiz teslimat, kapıda nakit veya havale",
        "Hazırlık başlamadan siparişi kendin iptal edebilme",
        "Yalnızca gerçekten sipariş vermiş kişi puan verebiliyor",
      ],
    },
  ] as Taraf[],

  /** Henüz yapılmamış hedefler — açıkça ayrı. */
  hedefler: [
    {
      baslik: "Depozitolu kaplar",
      baslikEn: "Deposit-return containers",
      metinEn: "Moving to recyclable or deposit-return containers instead of plastic, especially for home cooking, with points or money back for returning them.",
      metin:
        "Özellikle ev yemeklerinde plastik yerine geri dönüştürülebilir veya depozitolu " +
        "kap modeline geçmek; kabı iade edene puan ya da para dönmesi.",
    },
    {
      baslik: "Teslimat kutuları",
      baslikEn: "Delivery lockers",
      metinEn: "Coded, insulated delivery lockers beside shops and depots, to end the courier's parking-and-waiting problem in back streets.",
      metin:
        "Ara sokaklarda kuryenin park ve bekleme sorununu bitirmek için mağaza/depo " +
        "yanlarına şifreli, ısı yalıtımlı teslim dolapları koymak.",
    },
    {
      baslik: "Yarı depo / yarı mağaza",
      baslikEn: "Half depot, half shop",
      metinEn: "A depot-shop every 15–20 streets in a district, with a break, drying and charging area for couriers alongside it.",
      metin:
        "Bir ilçede her 15–20 sokakta bir depo-mağaza; yanında kuryeler için mola, " +
        "kurutma ve şarj alanı.",
    },
    {
      baslik: "Dünya mutfakları",
      baslikEn: "World cuisines",
      metinEn: "Categories such as Afghan, Italian and Syrian cuisine — so anyone cooking their own country's food can build their own market.",
      metin:
        "Afgan, İtalyan, Suriye mutfağı gibi kategoriler — kendi ülkesinin yemeğini " +
        "yapan herkesin kendi pazarını kurabilmesi.",
    },
  ] as Hedef[],

  /** Bugünkü kapsam — abartısız. */
  kapsam: [
    {
      deger: "Beylikdüzü",
      degerEn: "Beylikdüzü",
      etiket: "tek teslimat bölgesi",
      etiketEn: "our only delivery area",
    },
    {
      deger: "0 TL",
      degerEn: "0 TL",
      etiket: "teslimat ücreti",
      etiketEn: "delivery fee",
    },
    {
      deger: "3",
      degerEn: "3",
      etiket: "değerlendirme ekseni",
      etiketEn: "rating criteria",
    },
    {
      deger: "Onaylı",
      degerEn: "Approved",
      etiket: "giriş — her başvuru yöneticiden geçer",
      etiketEn: "entry — every application is reviewed by us",
    },
  ],
} as const;
