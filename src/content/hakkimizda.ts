/**
 * "Hakkımızda" sayfasının içeriği. Kaynak: proje dosyası (Ne Yersin.docx).
 *
 * Blog bölümünün yerine geçti. Buradaki her ifade ya bugün çalışan bir şeyi
 * ya da açıkça "planlanan" diye işaretlenmiş bir hedefi anlatır — sonuç
 * istatistiği veya doğrulanamayan iddia yok.
 */

export type Ilke = {
  baslik: string;
  metin: string;
};

export type Taraf = {
  kim: string;
  ozet: string;
  maddeler: string[];
};

export type Hedef = {
  baslik: string;
  metin: string;
};

export const hakkimizda = {
  ustBaslik: "Hakkımızda",
  baslik: "Yemeği yapan da",
  baslikVurgu: "taşıyan da kazansın",
  ozet:
    "Ne Yersin?, Beylikdüzü'nde ev hanımlarının ve şeflerin kendi mutfağından satış " +
    "yaptığı bir yemek ve kurye sistemi. Amacımız aradaki masrafı kısıp hem üretenin " +
    "eline geçeni hem de müşterinin cebinde kalanı büyütmek.",

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
      metin:
        "Ev mutfağında dükkân kirası yok. Bu farkı zam olarak değil, daha erişilebilir " +
        "fiyat olarak yansıtmak işin temel fikri.",
    },
    {
      baslik: "Teslimat ücretsiz",
      metin:
        "Şu an tüm siparişlerde teslimat 0 TL — ne müşteriden ne üreticiden alınıyor. " +
        "Kuryeyi sistem atıyor, kimse kurye aramakla uğraşmıyor.",
    },
    {
      baslik: "Kapıda ödeme, önden para yok",
      metin:
        "Müşteri önceden ödemek zorunda değil. Kurye geldiğinde nakit veriyor ya da " +
        "IBAN'a havale yapıyor; açıklamaya sipariş numarası yazılıyor.",
    },
    {
      baslik: "Uydurma rakam yok",
      metin:
        "Sitede hiç müşterisi olmayan bir platformun veremeyeceği başarı istatistikleri " +
        "yazmıyor. Ne çalışıyorsa o yazıyor, çalışmayan da açıkça 'planlanan' diyor.",
    },
    {
      baslik: "Kişisel veri asgari düzeyde",
      metin:
        "Müşterinin adresi ve telefonu şefe hiç gösterilmiyor; bu bilgiler yalnızca " +
        "teslimatı yapan kuryede ve yöneticide. Şefin numarası da müşteriye verilmiyor.",
    },
    {
      baslik: "Sipariş tek kuryenin",
      metin:
        "Bir sipariş tek bir kuryeye atanıyor, diğerleri onu hiç görmüyor. Bu kural " +
        "arayüzde gizleme değil, veritabanı sorgusunun kendisinde.",
    },
  ] as Ilke[],

  /** Kimin için ne var. */
  taraflar: [
    {
      kim: "Ev hanımları ve şefler",
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
      metin:
        "Özellikle ev yemeklerinde plastik yerine geri dönüştürülebilir veya depozitolu " +
        "kap modeline geçmek; kabı iade edene puan ya da para dönmesi.",
    },
    {
      baslik: "Teslimat kutuları",
      metin:
        "Ara sokaklarda kuryenin park ve bekleme sorununu bitirmek için mağaza/depo " +
        "yanlarına şifreli, ısı yalıtımlı teslim dolapları koymak.",
    },
    {
      baslik: "Yarı depo / yarı mağaza",
      metin:
        "Bir ilçede her 15–20 sokakta bir depo-mağaza; yanında kuryeler için mola, " +
        "kurutma ve şarj alanı.",
    },
    {
      baslik: "Dünya mutfakları",
      metin:
        "Afgan, İtalyan, Suriye mutfağı gibi kategoriler — kendi ülkesinin yemeğini " +
        "yapan herkesin kendi pazarını kurabilmesi.",
    },
  ] as Hedef[],

  /** Bugünkü kapsam — abartısız. */
  kapsam: [
    { deger: "Beylikdüzü", etiket: "tek teslimat bölgesi" },
    { deger: "0 TL", etiket: "teslimat ücreti" },
    { deger: "3", etiket: "değerlendirme ekseni" },
    { deger: "Onaylı", etiket: "giriş — her başvuru yöneticiden geçer" },
  ],
} as const;
