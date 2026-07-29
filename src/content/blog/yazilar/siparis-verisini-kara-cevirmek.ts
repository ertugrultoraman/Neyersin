import type { Yazi } from "../tipler";

export const siparisVerisiniKaraCevirmek: Yazi = {
  slug: "siparis-verisini-kara-cevirmek",
  baslik: "Sipariş Verisini Kâra Çevirmek: Restoranlar İçin Uygulamalı Veri Rehberi",
  ozet:
    "Her restoran veri topluyor; çok azı bu veriyle karar veriyor. Elinizdeki sipariş " +
    "kayıtlarından menü kârlılığı, saat bazlı kapasite planı ve müşteri elde tutma " +
    "analizini nasıl çıkaracağınızı örneklerle anlatıyoruz.",
  kategori: "Veri & Analitik",
  etiketler: ["veri", "analitik", "menü mühendisliği", "kârlılık", "raporlama"],
  tarih: "2026-06-20",
  guncelleme: "2026-07-19",
  okumaDk: 13,
  yazar: { ad: "Ne Yersin? Veri Ekibi", unvan: "Veri ve Analitik" },
  kapak: "blog/siparis-verisini-kara-cevirmek-kapak",
  bloklar: [
    {
      tur: "p",
      metin:
        "Bir restoranın elinde, farkında olmadığı bir varlık vardır: geçen yılın sipariş " +
        "kayıtları. Bu kayıtlar hangi ürünün ne zaman satıldığını, hangi müşterinin geri " +
        "geldiğini, hangi kampanyanın gerçekten çalıştığını ve mutfağın hangi saatte " +
        "tıkandığını zaten içerir. Sorun veri eksikliği değil; verinin karar üretecek " +
        "biçime hiç getirilmemiş olmasıdır. Bu yazıda, ek bir yatırım yapmadan mevcut " +
        "sipariş verisinden çıkarılabilecek dört analizi ve bunları nasıl kuracağınızı " +
        "anlatıyoruz.",
    },
    {
      tur: "h2",
      metin: "Önce temel: hangi alanlar olmadan hiçbir analiz yapılamaz",
    },
    {
      tur: "p",
      metin:
        "Analitik projelerinin çoğu, veri toplamaya başlandıktan aylar sonra kritik bir " +
        "alanın hiç kaydedilmediğinin fark edilmesiyle tıkanır. Aşağıdaki alanlar, ileride " +
        "yapılacak neredeyse her analizin ön koşuludur ve baştan kaydedilmezse geriye dönük " +
        "üretilemez.",
    },
    {
      tur: "tablo",
      basliklar: ["Alan", "Neden zorunlu"],
      satirlar: [
        ["Sipariş oluşma zamanı (saniye hassasiyetinde)", "Saat bazlı yoğunluk ve süre analizlerinin temeli"],
        ["Durum değişim zaman damgaları", "Kabul, hazırlık başlangıcı/bitişi, kurye alımı, teslim — dar boğaz analizi bunlarla yapılır"],
        ["Kalem bazlı satır kaydı", "Menü kârlılığı için sipariş toplamı yeterli değildir"],
        ["Ürün maliyeti (reçete bazlı)", "Ciro değil kâr analizi yapmanın tek yolu"],
        ["Müşteri kimliği (anonimleştirilmiş)", "Tekrar satın alma ve elde tutma analizleri için"],
        ["İptal / iade nedeni (serbest metin değil, kodlu)", "Kök neden analizi ancak kategorize edilmiş nedenle mümkündür"],
        ["Kanal ve kampanya kodu", "Hangi kampanyanın gerçekten kâr getirdiğini ayırt etmek için"],
      ],
    },
    {
      tur: "bilgi",
      baslik: "En sık yapılan hata",
      metin:
        "İptal nedenini serbest metin olarak kaydetmek. \"müşteri istemedi\", \"iptal\", " +
        "\"gelmedi\" gibi yüzlerce farklı yazım oluşur ve gruplanamaz. Sabit bir neden listesi " +
        "kullanın; \"diğer\" seçeneğine düşen oranı da ayrıca izleyin.",
    },
    {
      tur: "h2",
      metin: "Analiz 1: Menü kârlılığı — popüler ürün kârlı ürün değildir",
    },
    {
      tur: "p",
      metin:
        "Menü kararlarının çoğu satış adedine bakılarak verilir: en çok satan ürün öne " +
        "çıkarılır, az satan menüden çıkarılır. Bu yaklaşım kârlılığı görmezden geldiği için " +
        "sık sık yanlış karara götürür. Klasik menü mühendisliği, ürünleri iki eksende " +
        "değerlendirir: satış hacmi ve birim katkı payı (satış fiyatı eksi malzeme maliyeti).",
    },
    {
      tur: "tablo",
      basliklar: ["Hacim", "Katkı payı", "Sınıf", "Yapılacak"],
      satirlar: [
        ["Yüksek", "Yüksek", "Yıldız", "Menüde en görünür yere koy, stoğunu asla tükettirme"],
        ["Yüksek", "Düşük", "Beygir", "Porsiyon ve maliyeti gözden geçir, küçük fiyat artışını test et"],
        ["Düşük", "Yüksek", "Bilmece", "Görünürlüğü artır, çapraz satışla öner, fotoğrafını yenile"],
        ["Düşük", "Düşük", "Köpek", "Menüden çıkar; mutfak karmaşasını azaltır"],
      ],
    },
    {
      tur: "p",
      metin:
        "Bu tabloyu üretmek için ihtiyacınız olan tek şey kalem bazlı satış kaydı ve reçete " +
        "maliyetidir. Pratik bir uyarı: analizi menü genelinde tek seferde yapmak yerine " +
        "kategori içinde yapın. Tatlıların hacmi ana yemeklerle karşılaştırıldığında her tatlı " +
        "\"düşük hacim\" görünür ve yanlış biçimde köpek sınıfına düşer.",
    },
    {
      tur: "gorsel",
      anahtar: "blog/siparis-verisini-kara-cevirmek-icerik",
      altyazi:
        "Katkı payı ve hacim birlikte okunduğunda, en çok satan ürünün en kârlı ürün " +
        "olmadığı çoğu menüde görülür.",
    },
    {
      tur: "h2",
      metin: "Analiz 2: Saat bazlı kapasite — personel planını veriyle kurmak",
    },
    {
      tur: "p",
      metin:
        "Vardiya planları genellikle geçmiş alışkanlıkla kurulur ve sonuç iki yönlü kayıptır: " +
        "bazı saatlerde gereğinden fazla personel, bazı saatlerde tıkanan mutfak. Sipariş " +
        "verisi bu soruyu net biçimde yanıtlar; ihtiyacınız olan şey saat dilimi bazında iki " +
        "seri: gelen sipariş sayısı ve gerçekleşen hazırlık süresi.",
    },
    {
      tur: "p",
      metin:
        "Bu iki seriyi üst üste koyduğunuzda kritik nokta belirginleşir: hazırlık süresinin " +
        "sipariş sayısıyla birlikte doğrusal artmayı bırakıp fırladığı saat, mutfağın kapasite " +
        "sınırıdır. Personel eklemenin gerçekten karşılığı olan tek saat aralığı da orasıdır. " +
        "Diğer saatlerde eklenen personel, süreyi ölçülebilir biçimde iyileştirmez.",
    },
    {
      tur: "liste",
      sirali: true,
      maddeler: [
        "Son 8–12 haftanın siparişlerini gün ve saat dilimine göre grupla (hafta içi/hafta sonu ayrı tutulmalı).",
        "Her saat dilimi için ortalama ve 90. yüzdelik hazırlık süresini hesapla.",
        "Sipariş sayısı ile süre arasındaki ilişkiyi çiz; kırılma noktasını işaretle.",
        "Kırılma noktasının başladığı saatten 30 dakika önce personel takviyesini planla.",
        "Değişikliğin etkisini iki hafta sonra aynı yöntemle yeniden ölç.",
      ],
    },
    {
      tur: "h2",
      metin: "Analiz 3: Müşteri elde tutma — ikinci sipariş her şeydir",
    },
    {
      tur: "p",
      metin:
        "Yeni müşteri kazanma maliyeti, mevcut müşteriyi geri getirme maliyetinin katbekat " +
        "üzerindedir. Buna karşın çoğu restoran yalnızca toplam sipariş sayısını izler ve bu " +
        "sayının kaç farklı müşteriden geldiğini bilmez. Kritik metrik basittir: ilk siparişi " +
        "veren müşterilerin yüzde kaçı 30 gün içinde ikinci siparişi veriyor?",
    },
    {
      tur: "p",
      metin:
        "Bu oranı hesaplamak için kohort analizi kullanılır: müşteriler ilk sipariş ayına göre " +
        "gruplanır ve her grubun sonraki aylardaki geri dönüş oranı izlenir. Kohortları yan " +
        "yana koyduğunuzda, yaptığınız bir değişikliğin (menü, ambalaj, teslimat süresi, " +
        "kampanya) elde tutma üzerindeki etkisi doğrudan görünür hâle gelir.",
    },
    {
      tur: "tablo",
      basliklar: ["İlk sipariş ayı", "1. ay dönüş", "2. ay", "3. ay", "Yorum"],
      satirlar: [
        ["Mart", "%22", "%14", "%11", "Referans dönem"],
        ["Nisan", "%24", "%15", "%12", "Ambalaj değişimi sonrası hafif iyileşme"],
        ["Mayıs", "%31", "%21", "%17", "Teslim süresi iyileştirmesi devrede"],
        ["Haziran", "%33", "%23", "—", "İyileşme kalıcı görünüyor"],
      ],
    },
    {
      tur: "bilgi",
      baslik: "Kampanya kârlılığını doğru ölçmek",
      metin:
        "Bir indirim kampanyasının başarısı, kampanya dönemindeki ciro artışı değildir. Doğru " +
        "soru şudur: kampanyayla gelen müşterilerin elde tutma oranı, normal müşterilerden " +
        "farklı mı? Yalnızca indirimle sipariş veren ve bir daha dönmeyen bir kitle, ciroyu " +
        "artırırken kârı düşürür.",
    },
    {
      tur: "h2",
      metin: "Analiz 4: Dar boğaz analizi — süre nerede kayboluyor?",
    },
    {
      tur: "p",
      metin:
        "\"Teslimat çok uzun sürüyor\" cümlesi bir teşhis değildir. Toplam süre en az beş " +
        "parçadan oluşur ve iyileştirme yapılacak parça ölçülmeden bulunamaz. Durum değişim " +
        "zaman damgaları kaydediliyorsa bu ayrıştırma doğrudan yapılabilir.",
    },
    {
      tur: "tablo",
      basliklar: ["Aşama", "Tipik pay", "Sık görülen sorun"],
      satirlar: [
        ["Sipariş kabulü", "%3–5", "Manuel onay bekleyen siparişler"],
        ["Hazırlık kuyruğunda bekleme", "%15–30", "Sıralamanın kâğıt fiş sırasına bırakılması"],
        ["Fiili hazırlık/pişirme", "%25–40", "İstasyonlar arası senkron eksikliği"],
        ["Kurye bekleme / alım", "%10–20", "Atama zamanlamasının yanlış olması"],
        ["Yol ve teslim", "%25–35", "Bina içi süre ve adres belirsizliği"],
      ],
    },
    {
      tur: "p",
      metin:
        "Bu dağılım işletmeye göre değişir ve tam olarak bu yüzden ölçülmesi gerekir. Sahada " +
        "sıkça görülen sürpriz, en büyük kaybın pişirmede değil hazırlık kuyruğunda beklemede " +
        "olmasıdır — yani mutfak hızlıdır, sıralama yavaştır. Bu durumda mutfağa personel " +
        "eklemek hiçbir şeyi düzeltmez; sıralama mantığını düzeltmek gerekir.",
    },
    {
      tur: "h2",
      metin: "Raporun kendisi bir ürün: kimse okumuyorsa çalışmıyor",
    },
    {
      tur: "p",
      metin:
        "Teknik olarak doğru ama kimsenin bakmadığı bir pano, hiç kurulmamış panoyla aynı " +
        "değerdedir. Sahada gerçekten kullanılan raporların üç ortak özelliği var: az " +
        "sayıda metrik içerirler, karşılaştırma noktası sunarlar ve bir eylem önerisiyle " +
        "biterler.",
    },
    {
      tur: "liste",
      maddeler: [
        "Ekranda en fazla 5–7 metrik: fazlası dikkatı böler ve panoyu terk ettirir.",
        "Her metriğin yanında karşılaştırma: geçen hafta, geçen ay veya hedef. Tek başına bir sayı yorumlanamaz.",
        "Kırılım imkânı: şube, saat dilimi ve kanal bazında bakılabilmeli.",
        "Eylem odaklı bölüm: \"bu hafta menüden çıkarılması önerilen 3 ürün\" gibi doğrudan karara dönüşen çıktı.",
        "Sabit teslim ritmi: pazartesi sabahı gelen haftalık özet, her an bakılabilen bir panodan daha çok okunur.",
      ],
    },
    {
      tur: "sayilar",
      ogeler: [
        { deger: "4", etiket: "ek yatırım gerektirmeyen temel analiz" },
        { deger: "8-12", etiket: "anlamlı sonuç için gereken hafta sayısı" },
        { deger: "5-7", etiket: "bir panoda yer alması gereken metrik sayısı" },
      ],
    },
    {
      tur: "alinti",
      metin:
        "Veri projelerinin çoğu teknik nedenlerle değil, üretilen çıktının hiçbir kararın " +
        "girdisi olmaması yüzünden ölür.",
    },
    {
      tur: "p",
      metin:
        "Eğer veri altyapısı kurmak için nereden başlanacağı belirsizse, önerimiz şudur: " +
        "durum değişim zaman damgalarını kaydetmeye bugün başlayın ve iptal nedenlerini " +
        "kodlu listeye çevirin. Bu iki değişiklik neredeyse hiçbir maliyet doğurmaz, ama " +
        "yukarıdaki dört analizin tamamını mümkün kılar. Şirketinizin mevcut verisini " +
        "kullanılabilir hâle getirme sürecini birlikte kurmak isterseniz, veri değerlendirme " +
        "hizmetimiz tam olarak bu iş için tasarlandı.",
    },
  ],
};
