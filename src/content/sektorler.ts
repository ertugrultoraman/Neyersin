export type Sektor = {
  slug: string;
  ad: string;
  kisaAd: string;
  ozet: string;
  giris: string;
  gorsel: string;
  zorluklar: { baslik: string; metin: string }[];
  otomasyonlar: { baslik: string; metin: string; kazanim: string }[];
  cozumler: { baslik: string; metin: string }[];
  metrikler: { deger: string; etiket: string }[];
  entegrasyonlar: string[];
  sss: { soru: string; cevap: string }[];
};

export const sektorler: Sektor[] = [
  {
    slug: "ev-mutfagi",
    ad: "Ev Mutfağı & Ev Hanımları",
    kisaAd: "Ev Mutfağı",
    ozet:
      "Kendi mutfağından satan ev hanımları ve şefler için: profil, sipariş, hijyen ve " +
      "değerlendirme akışı tek sistemde.",
    giris:
      "Ne Yersin? bugün burada çalışıyor. Evinde pişirip satmak isteyen bir kişinin önündeki " +
      "engel yemek yapmak değil; müşteriye ulaşmak, parayı güvenle tahsil etmek, kuryeyi " +
      "ayarlamak ve resmî tarafı çözmek. Platform bu dört adımı da üstleniyor: kişi başvurur, " +
      "yönetici onaylar, kendi adıyla bir mutfak sayfası açılır ve sipariş almaya başlar. " +
      "Değerlendirme sıcaklık, teslimat hızı ve tad olmak üzere üç ayrı başlıkta yapılır; " +
      "yalnızca gerçekten sipariş vermiş müşteri puan verebilir.",
    gorsel: "sektor/ev-mutfagi-kapak",
    zorluklar: [
      {
        baslik: "Müşteriye ulaşmak",
        metin:
          "Ev yemeği çoğunlukla mahalle çevresiyle ve tanıdık ağıyla sınırlı kalır. Talep var " +
          "ama satıcıyla alıcıyı buluşturan güvenilir bir yer yok.",
      },
      {
        baslik: "Resmî taraf ve tahsilat",
        metin:
          "Vergi, esnaf muafiyeti ve gıda üretim kaydı gibi başlıklar tek başına çözülmesi zor " +
          "konular. Para tahsilatı da elden yürüdüğünde kayıt tutmak imkânsızlaşıyor.",
      },
      {
        baslik: "Güven ve hijyen",
        metin:
          "Müşteri tanımadığı bir mutfaktan yemek almakta tereddüt eder. Karşılıklı güveni " +
          "kuracak şeffaf bir değerlendirme ve denetim düzeni gerekir.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Başvuru ve onay akışı",
        metin:
          "Kimse kendini şef ilan edip sisteme giremez. Kişi ad, telefon ve parolasıyla başvurur; " +
          "yönetici rolünü seçip onayladığında hesabı açılır ve kendi adına mutfak sayfası oluşur.",
        kazanim: "Kontrollü giriş, sahte profil yok",
      },
      {
        baslik: "Üç eksenli değerlendirme",
        metin:
          "Her sipariş sıcaklık, teslimat hızı ve tad başlıklarında ayrı ayrı puanlanır. " +
          "Puan yalnızca teslim edilmiş siparişe ve sipariş başına bir kez verilebilir.",
        kazanim: "Puanlar sipariş kaydına bağlı, uydurulamaz",
      },
      {
        baslik: "Kendi profilini yönetme",
        metin:
          "Şef kendi panelinden özgeçmişini, uzmanlığını, sertifikalarını ve sloganını yazar. " +
          "Doğrudan iletişim bilgisi paylaşılmaz; iletişim sipariş üzerinden yürür.",
        kazanim: "Kendini pazarlayabildiği bir sayfa",
      },
    ],
    cozumler: [
      {
        baslik: "Şef paneli",
        metin:
          "Kendine düşen siparişler, arama ve profil düzenleme tek ekranda. Müşterinin adresi ve " +
          "telefonu şefe gösterilmez — kişisel veri yalnızca teslimatı yapan kuryede ve yöneticide.",
      },
      {
        baslik: "Kurye ataması",
        metin:
          "Sipariş tek bir kuryeye atanır; atanmamış sipariş hiçbir kuryeye görünmez. Kurye " +
          "adresi ve telefonu yalnızca kendi teslimatı için görür.",
      },
      {
        baslik: "Kapıda ödeme",
        metin:
          "Müşteri önceden ödeme yapmak zorunda değil. Kurye geldiğinde nakit verir ya da " +
          "IBAN'a havale yapar; sipariş numarası açıklamaya yazılır.",
      },
    ],
    metrikler: [
      { deger: "3", etiket: "değerlendirme ekseni: sıcaklık, teslimat hızı, tad" },
      { deger: "0 TL", etiket: "teslimat ücreti" },
      { deger: "Onaylı", etiket: "giriş — başvuru yöneticiden geçer" },
    ],
    entegrasyonlar: [
      "Kapıda nakit / IBAN",
      "Kurye ataması",
      "Sipariş takibi",
      "Değerlendirme sistemi",
    ],
    sss: [
      {
        soru: "Ev hanımı olarak nasıl başlarım?",
        cevap:
          "Başvuru formunu doldurursun: ad, telefon, e-posta ve kendine bir parola. Başvurun " +
          "yöneticiye düşer; onaylandığı anda hesabın açılır ve adınla bir mutfak sayfan oluşur. " +
          "Ayrıca kayıt olman gerekmez, belirlediğin parolayla giriş yaparsın.",
      },
      {
        soru: "Vergi ve resmî belgeler ne olacak?",
        cevap:
          "Belirli bir cironun altında kalan ev üretimi için Esnaf Muafiyet Belgesi süreci var; " +
          "gıda üretim kaydı ise Tarım ve Orman Bakanlığı'ndan alınıyor. Bu süreçlerde yol " +
          "gösteriyoruz — ama belgeler kişinin kendi adına düzenlenir.",
      },
      {
        soru: "Müşteri bana doğrudan ulaşabilir mi?",
        cevap:
          "Hayır. Profilinde telefon veya sosyal medya adresi paylaşılmaz. Tüm iletişim sipariş " +
          "üzerinden yürür; bu hem seni hem müşteriyi korur.",
      },
      {
        soru: "Puanım düşerse ne olur?",
        cevap:
          "Değerlendirmeler üç başlıkta ayrı ayrı görünür, yani hangi tarafta sorun olduğu " +
          "belli olur. Sürekli düşük puan alan profiller incelemeye alınır; şikâyetler kanıtla " +
          "birlikte değerlendirilir.",
      },
    ],
  },

  {
    slug: "restoran-kafe",
    ad: "Restoran & Kafe",
    kisaAd: "Restoran",
    ozet:
      "Salon, paket ve online siparişi tek kuyrukta birleştirin; mutfağı ekranla yönetin, " +
      "kuryeyi otomatik atayın.",
    giris:
      "Bir restoranın en pahalı dakikaları, siparişin nerede olduğunun kimse tarafından " +
      "bilinmediği dakikalardır. Ne Yersin? altyapısı salon, telefon, paket servis ve online " +
      "kanalları tek bir sipariş kuyruğunda toplar; her siparişi mutfak ekranına, paketleme " +
      "istasyonuna ve kurye atamasına otomatik olarak taşır. Böylece \"hangi masa bekliyor, " +
      "hangi paket çıktı\" sorusu operasyonel bir tartışma olmaktan çıkar.",
    gorsel: "sektor/restoran-kafe-kapak",
    zorluklar: [
      {
        baslik: "Kanallar birbirini görmüyor",
        metin:
          "Online sipariş tablette, telefon siparişi deftere, salon siparişi POS'a düşünce mutfak " +
          "gerçek yükü hiçbir zaman doğru göremez. Yoğun saatte sıralama hissiyata kalır.",
      },
      {
        baslik: "Hazırlık süresi tahmin edilemiyor",
        metin:
          "Müşteriye verilen süre gerçek mutfak kapasitesine değil, ortalamaya dayanır. Sonuç: " +
          "kurye mutfakta bekler, müşteri kapıda bekler, ikisi de memnuniyetsiz kalır.",
      },
      {
        baslik: "İptal ve iade nedenleri kayıt altında değil",
        metin:
          "Eksik ürün, soğuk teslimat ya da yanlış adres gibi nedenler tek tek konuşulur ama " +
          "sistematik olarak sayılmadığı için kök neden hiç düzelmez.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Tek sipariş kuyruğu",
        metin:
          "Tüm kanallardan gelen siparişler tek listede, geliş saatine ve söz verilen teslim " +
          "saatine göre sıralanır. Mutfak ekranı kolonları otomatik günceller.",
        kazanim: "Kanallar arası karışıklık sıfıra iner",
      },
      {
        baslik: "Dinamik hazırlık süresi",
        metin:
          "Aktif sipariş sayısı, ürün bazlı ortalama pişirme süresi ve vardiyadaki personel " +
          "sayısına göre söz verilen süre canlı hesaplanır; yoğunlukta otomatik uzar.",
        kazanim: "Geciken sipariş oranında belirgin düşüş",
      },
      {
        baslik: "Otomatik kurye ataması",
        metin:
          "Sipariş \"hazırlanıyor\" durumuna geçtiğinde tahmini bitiş saatine en uygun kurye " +
          "çağrılır; kurye mutfağa yemekle aynı anda ulaşır.",
        kazanim: "Mutfakta kurye bekleme süresi kısalır",
      },
      {
        baslik: "Stok ve menü senkronu",
        metin:
          "Tükenmiş ürün mutfak ekranından tek dokunuşla kapatılır ve aynı saniyede tüm satış " +
          "kanallarında görünmez olur; akşam otomatik geri açılır.",
        kazanim: "\"Ürün yok\" kaynaklı iptaller azalır",
      },
      {
        baslik: "Vardiya ve yoğunluk raporu",
        metin:
          "Saat dilimi bazlı sipariş yoğunluğu geçmiş veriyle karşılaştırılır; personel planı " +
          "için haftalık öneri üretilir.",
        kazanim: "Fazla mesai ve boş kapasite birlikte azalır",
      },
    ],
    cozumler: [
      {
        baslik: "Mutfak ekranı (KDS)",
        metin:
          "Kağıt fiş yerine kolonlu ekran: bekleyen, hazırlanan, hazır. Her kartta süre sayacı ve " +
          "gecikme uyarısı bulunur. Dokunmatik ekranla veya barkodla ilerletilir.",
      },
      {
        baslik: "Paketleme kontrol listesi",
        metin:
          "Sipariş içeriği paketleme ekranında tek tek işaretlenir; eksik ürünle çıkan paket " +
          "oranı ölçülebilir hale gelir.",
      },
      {
        baslik: "Restoran paneli",
        metin:
          "Canlı sipariş akışı, günlük ciro, ürün bazlı kârlılık, iptal nedenleri ve kurye " +
          "performansı tek panelde toplanır.",
      },
    ],
    metrikler: [
      { deger: "Tek", etiket: "kuyrukta salon, telefon ve online sipariş" },
      { deger: "0 TL", etiket: "teslimat ücreti — tüm siparişlerde" },
      { deger: "Canlı", etiket: "mutfak ekranı ve kurye takibi" },
    ],
    entegrasyonlar: ["POS / yazarkasa", "Ödeme sağlayıcıları", "Muhasebe (e-fatura)", "Stok yönetimi", "Çağrı merkezi"],
    sss: [
      {
        soru: "Mevcut POS sistemimizi değiştirmemiz gerekir mi?",
        cevap:
          "Gerekmez. Ne Yersin? sipariş katmanı olarak çalışır ve mevcut POS ile çift yönlü " +
          "entegre olur. POS'ta oluşan salon siparişi de tek kuyruğa düşer.",
      },
      {
        soru: "Tek şubelik işletme için de anlamlı mı?",
        cevap:
          "Evet. Tek şubede en hızlı geri dönen kalem mutfak ekranı ve dinamik süre hesabıdır; " +
          "çok şubede ise şube karşılaştırma raporları öne çıkar.",
      },
      {
        soru: "Kurulum ne kadar sürer?",
        cevap:
          "Menü ve şube bilgisi hazırsa tipik kurulum 3–5 iş günüdür. POS entegrasyonu gereken " +
          "durumlarda süre entegrasyon sağlayıcısına göre değişir.",
      },
    ],
  },

  {
    slug: "market-bakkal",
    ad: "Market & Hızlı Market",
    kisaAd: "Market",
    ozet:
      "Raf bazlı toplama sırası, ağırlıklı ürün desteği ve gerçekçi teslimat süresi tahmini için " +
      "kurgulanmış akış.",
    giris:
      "Hızlı markette rekabet mutfakta değil, koridorda kazanılır. Otuz kalemli bir sepetin " +
      "hangi sırayla toplandığı, ürünün hangi reyondan alındığı ve bulunamayan kalemde ne " +
      "yapılacağı önceden tanımlanmadığında teslimat süresi sözünü tutmak imkânsızdır. Ne " +
      "Yersin? market akışı, toplama rotasını raf düzenine göre sıralar ve bulunamayan kalem " +
      "için müşteriye anında alternatif önerir.",
    gorsel: "sektor/market-bakkal-kapak",
    zorluklar: [
      {
        baslik: "Toplama sırası rastgele",
        metin:
          "Sepet ekrana geliş sırasıyla listelenince toplayıcı aynı koridora üç kez girer. " +
          "Kayıp süre doğrudan teslimat süresine biner.",
      },
      {
        baslik: "Bulunamayan ürün siparişi kilitliyor",
        metin:
          "Stokta görünüp rafta olmayan kalem, toplayıcı ile müşteri arasında telefon trafiği " +
          "başlatır; bu süre boyunca sipariş bekler.",
      },
      {
        baslik: "Ağırlıklı ürünlerde tutar oynuyor",
        metin:
          "Meyve, sebze, şarküteri gibi tartılı kalemlerde sepet tutarı ile ödenen tutar " +
          "farklılaşır; iade ve muhasebe düzeltmesi elle yapılır.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Raf sırasına göre toplama listesi",
        metin:
          "Her ürüne reyon ve raf kodu tanımlanır; sepet, mağaza içi yürüyüş rotasına göre " +
          "otomatik sıralanır.",
        kazanim: "Toplama süresinde %25'e varan kısalma",
      },
      {
        baslik: "Akıllı alternatif önerisi",
        metin:
          "Ürün rafta yoksa aynı kategoriden benzer fiyatlı alternatif müşteriye anında " +
          "bildirilir; onay tek dokunuşla verilir.",
        kazanim: "İptal yerine tamamlanan sipariş",
      },
      {
        baslik: "Tartılı ürün mutabakatı",
        metin:
          "Terazi entegrasyonu ile gerçek gramaj sipariş satırına yazılır, tutar farkı ödeme " +
          "tarafında otomatik düzeltilir.",
        kazanim: "Elle iade işlemi ortadan kalkar",
      },
      {
        baslik: "Talep tahmini ve sipariş önerisi",
        metin:
          "Saatlik satış ve hava durumu verisiyle hızlı tükenen kalemler için tedarik önerisi " +
          "üretilir.",
        kazanim: "Raf boşluğu ve fire birlikte azalır",
      },
    ],
    cozumler: [
      {
        baslik: "Toplayıcı mobil uygulaması",
        metin:
          "Barkod okutmalı toplama, eksik kalem bildirimi, paketleme onayı ve poşet etiketi " +
          "basımı tek akışta.",
      },
      {
        baslik: "Karanlık mağaza (dark store) modu",
        metin:
          "Vitrinsiz depo mağazalar için bölge bazlı stok, kapasite limiti ve dinamik teslimat " +
          "süresi yönetimi.",
      },
      {
        baslik: "Zaman sözü panosu",
        metin:
          "Bölge bazlı gerçekleşen teslimat süreleri canlı izlenir; söz tutulmayan siparişte " +
          "otomatik telafi kuralı çalışır.",
      },
    ],
    metrikler: [
      { deger: "Raf", etiket: "sırasına göre toplama listesi" },
      { deger: "Ağırlıklı", etiket: "ürün desteği (kg/gr bazlı)" },
      { deger: "Anlık", etiket: "stok düşümü ve bulunamayan ürün akışı" },
    ],
    entegrasyonlar: ["ERP / stok", "Terazi & barkod", "Ödeme sağlayıcıları", "Sadakat programı"],
    sss: [
      {
        soru: "Raf kodlarını tek tek girmek zorunda mıyız?",
        cevap:
          "Hayır. Mevcut ürün listesi kategori ve reyon bilgisiyle içe aktarılır; raf sırası " +
          "sonrasında toplama verisiyle kendini iyileştirir.",
      },
      {
        soru: "Birden fazla mağazayı aynı panelden yönetebilir miyiz?",
        cevap:
          "Evet. Mağaza bazlı stok ve kapasite ayrı yönetilir, raporlar hem mağaza hem bölge " +
          "kırılımında görülür.",
      },
      {
        soru: "Teslimat süresi sözü her bölgede aynı mı olur?",
        cevap:
          "Söz süresi bölge yoğunluğu ve mesafeye göre sistem tarafından belirlenir; " +
          "tutulamayacak bir süre müşteriye hiç gösterilmez.",
      },
    ],
  },

  {
    slug: "pastane-tatli",
    ad: "Pastane & Tatlı",
    kisaAd: "Pastane",
    ozet:
      "Ön sipariş takvimi, özel pasta talepleri ve kırılgan ürün için hassas teslimat kuralları.",
    giris:
      "Pastanenin operasyonu iki ayrı ritimde çalışır: anlık satış ve günler öncesinden " +
      "planlanan özel sipariş. İkisi aynı üretim kapasitesini paylaştığı için, doğum günü " +
      "pastası taahhüdüyle günlük vitrin üretimini aynı takvimde görmeyen bir işletme " +
      "kaçınılmaz olarak birini aksatır. Ne Yersin? üretim kapasitesini takvim üzerinden " +
      "yönetir ve dolu güne yeni taahhüt alınmasını engeller.",
    gorsel: "sektor/pastane-tatli-kapak",
    zorluklar: [
      {
        baslik: "Ön siparişler kapasiteyi aşıyor",
        metin:
          "Aynı güne verilen özel sipariş sayısı üretim kapasitesinden bağımsız kabul edilince " +
          "teslim gününde kriz çıkar.",
      },
      {
        baslik: "Özel istekler kayboluyor",
        metin:
          "Üzerine yazılacak isim, alerjen notu veya mum sayısı sözlü iletilince mutfağa " +
          "eksik ulaşır.",
      },
      {
        baslik: "Kırılgan ürün taşımada zarar görüyor",
        metin:
          "Standart kurye akışı pasta ile dürümü aynı şekilde taşır; hasarlı teslimat hem iade " +
          "hem itibar kaybı yaratır.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Kapasiteli ön sipariş takvimi",
        metin:
          "Her gün için ürün tipi bazlı üretim kotası tanımlanır; kota dolduğunda o gün " +
          "müşteriye seçenek olarak sunulmaz.",
        kazanim: "Teslim edilemeyen taahhüt riski ortadan kalkar",
      },
      {
        baslik: "Yapılandırılmış özel istek formu",
        metin:
          "İsim yazısı, kat sayısı, alerjen ve süsleme tercihi zorunlu alanlar olarak alınır ve " +
          "üretim fişine birebir basılır.",
        kazanim: "Yanlış hazırlanan özel sipariş azalır",
      },
      {
        baslik: "Hassas teslimat kuralı",
        metin:
          "Kırılgan olarak işaretlenen ürünlerde araç tipi, sabitleme kutusu zorunluluğu ve " +
          "tekli teslimat (sepet birleştirmeme) kuralı devreye girer.",
        kazanim: "Hasarlı teslimat oranı düşer",
      },
      {
        baslik: "Sezon ve gün planlaması",
        metin:
          "Anneler günü, bayram, yılbaşı gibi tepe günler için geçmiş yıl verisiyle üretim ve " +
          "kurye planı önerilir.",
        kazanim: "Tepe günlerde kontrollü büyüme",
      },
    ],
    cozumler: [
      {
        baslik: "Üretim planlama ekranı",
        metin:
          "Günün üretim listesi ürün ve saat bazında sıralanır; ön siparişler önce, vitrin " +
          "üretimi kalan kapasiteye yerleştirilir.",
      },
      {
        baslik: "Teslim saati aralığı seçimi",
        metin:
          "Müşteri saat aralığı seçer; sistem o aralıktaki kurye kapasitesini rezerve eder.",
      },
      {
        baslik: "Fotoğraflı teslim onayı",
        metin:
          "Kurye teslimde ürün fotoğrafı çeker; hasar itirazlarında kayıt üzerinden " +
          "değerlendirme yapılır.",
      },
    ],
    metrikler: [
      { deger: "Kapasite", etiket: "bazlı sipariş kabulü, tepe günlerde taşma yok" },
      { deger: "Randevulu", etiket: "teslim saati seçimi" },
      { deger: "Hassas", etiket: "ürün için özel taşıma notu" },
    ],
    entegrasyonlar: ["Üretim planlama", "e-Arşiv fatura", "SMS / WhatsApp bildirim", "Ödeme sağlayıcıları"],
    sss: [
      {
        soru: "Kişiye özel pasta siparişlerinde ön ödeme alınabilir mi?",
        cevap:
          "Evet. Ürün tipine göre tam ödeme veya kapora oranı tanımlanabilir; kalan tutar " +
          "teslimde tahsil edilir.",
      },
      {
        soru: "Alerjen bilgisini nasıl yönetiyoruz?",
        cevap:
          "Ürün bazlı alerjen etiketleri menüde gösterilir, müşteri notu üretim fişinde ayrı " +
          "bir uyarı alanında öne çıkar.",
      },
      {
        soru: "Aynı gün teslimat da yapabilir miyiz?",
        cevap:
          "Evet. Vitrin ürünleri anlık satışa açık kalır; yalnızca üretim gerektiren kalemler " +
          "takvim kotasına tabidir.",
      },
    ],
  },

  {
    slug: "eczane",
    ad: "Eczane & Sağlık",
    kisaAd: "Eczane",
    ozet:
      "Reçete doğrulama, soğuk zincir takibi ve kimlik kontrollü teslimat için tasarlanmış akış.",
    giris:
      "Sağlık ürünlerinde teslimat hızı önemlidir, ama doğruluk ve izlenebilirlik pazarlık " +
      "konusu değildir. Reçeteli ürünün kime teslim edildiği, soğuk zincir gerektiren bir " +
      "ürünün yolda kaç derecede kaldığı ve kimlik kontrolünün yapılıp yapılmadığı kayıt " +
      "altında olmalıdır. Ne Yersin? eczane akışı bu kontrolleri teslimat adımlarının " +
      "zorunlu parçası hâline getirir.",
    gorsel: "sektor/eczane-kapak",
    zorluklar: [
      {
        baslik: "Reçete doğrulaması akışı kesiyor",
        metin:
          "Reçete kontrolü telefon veya elden yapıldığında sipariş bekler, eczacı zamanını " +
          "koordinasyona harcar.",
      },
      {
        baslik: "Soğuk zincir izlenemiyor",
        metin:
          "Buzdolabı koşulu gerektiren ürünün taşıma koşulu kayıt altına alınmadığında " +
          "sorumluluk belirsizleşir.",
      },
      {
        baslik: "Teslim eden kişi doğrulanmıyor",
        metin:
          "Belirli ürün gruplarında teslimin doğru kişiye yapıldığının kanıtı olmadan yasal " +
          "risk doğar.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Dijital reçete kontrol adımı",
        metin:
          "Sipariş, eczacı onayı verilmeden hazırlığa geçmez; onay ekranında reçete görüntüsü " +
          "ve ürün eşleşmesi birlikte gösterilir.",
        kazanim: "Yanlış ürün teslimi riski azalır",
      },
      {
        baslik: "Soğuk zincir etiketi ve süre limiti",
        metin:
          "Soğuk zincir ürünü içeren siparişte yalıtımlı kutu zorunlu olur, azami yolda kalma " +
          "süresi tanımlanır ve aşımda uyarı düşer.",
        kazanim: "Taşıma koşulu belgelenebilir hâle gelir",
      },
      {
        baslik: "Kimlik kontrollü teslim",
        metin:
          "Gerekli ürün gruplarında kurye uygulamasında kimlik doğrulama adımı zorunlu tutulur; " +
          "teslim ancak onay sonrası kapatılır.",
        kazanim: "Yasal uyum kayıt altına alınır",
      },
      {
        baslik: "Nöbet ve stok yönlendirme",
        metin:
          "Ürün eczanede yoksa aynı bölgedeki stoklu veya nöbetçi eczaneye yönlendirme önerilir.",
        kazanim: "Karşılanamayan talep azalır",
      },
    ],
    cozumler: [
      {
        baslik: "Eczacı onay paneli",
        metin:
          "Bekleyen onaylar, reçete görüntüleri ve ürün eşleştirme tek ekranda; onay ve ret " +
          "gerekçesi kayıt altına alınır.",
      },
      {
        baslik: "İzlenebilir teslim kaydı",
        metin:
          "Her teslim için zaman damgası, konum, teslim alan bilgisi ve gerekiyorsa fotoğraf " +
          "birlikte saklanır.",
      },
      {
        baslik: "Sağlık ürünü kategori kuralları",
        metin:
          "Kategori bazlı satış kısıtı, yaş sınırı ve azami adet kuralları merkezi olarak " +
          "tanımlanır.",
      },
    ],
    metrikler: [
      { deger: "Kayıtlı", etiket: "izlenebilirlik — her teslim adım adım" },
      { deger: "Reçeteli", etiket: "ürün için ayrı onay akışı" },
      { deger: "Soğuk", etiket: "zincir ürünlerde taşıma uyarısı" },
    ],
    entegrasyonlar: ["Eczane yazılımları", "Dijital reçete sistemleri", "Soğuk zincir kutu takibi", "e-Fatura"],
    sss: [
      {
        soru: "Kişisel sağlık verisi nasıl korunuyor?",
        cevap:
          "Reçete görüntüsü yalnızca onay adımında ve yetkili eczacı hesabına gösterilir; " +
          "kurye tarafında ürün adı ve içerik bilgisi paylaşılmaz. Erişimler loglanır.",
      },
      {
        soru: "Reçetesiz ürünlerle reçeteli ürünler aynı sepette olabilir mi?",
        cevap:
          "Olabilir. Sistem sepeti ikiye ayırır: reçetesiz kalemler hemen hazırlanır, reçeteli " +
          "kalemler onay sonrası akışa girer.",
      },
      {
        soru: "Kurye eğitim gereksinimi var mı?",
        cevap:
          "Soğuk zincir ve kimlik kontrolü gerektiren teslimatlar yalnızca ilgili eğitim " +
          "işaretine sahip kuryelere atanır.",
      },
    ],
  },

  {
    slug: "kargo-lojistik",
    ad: "Kargo & Lojistik",
    kisaAd: "Lojistik",
    ozet:
      "Rota kümeleme, taşıma birleştirme ve teslim kanıtı ile son kilometre maliyetini düşürün.",
    giris:
      "Son kilometre, toplam taşıma maliyetinin en büyük ve en az öngörülebilir kalemidir. " +
      "Aynı sokağa gün içinde üç ayrı araç göndermek, başarısız teslimatı ertesi güne " +
      "devretmek ve teslim kanıtını kâğıt imzayla tutmak bu maliyeti sessizce büyütür. " +
      "Ne Yersin? lojistik akışı durakları coğrafi olarak kümeler, kapasiteye göre araç " +
      "atar ve her teslimi dijital kanıtla kapatır.",
    gorsel: "sektor/kargo-lojistik-kapak",
    zorluklar: [
      {
        baslik: "Rotalar elle kuruluyor",
        metin:
          "Durak listesi deneyimle sıralanınca hem yakıt hem süre kaybı oluşur, planlayıcıya " +
          "bağımlılık artar.",
      },
      {
        baslik: "Başarısız teslimat maliyeti gizli",
        metin:
          "Alıcının evde olmadığı teslimatlar tekrar denemeye girer; ikinci denemenin maliyeti " +
          "genelde hiç ölçülmez.",
      },
      {
        baslik: "Teslim kanıtı dağınık",
        metin:
          "İmzalı kâğıt, fotoğraf ve not farklı yerlerde tutulduğu için itiraz süreçleri uzar.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Otomatik rota kümeleme",
        metin:
          "Duraklar mesafe, zaman penceresi ve araç kapasitesine göre kümelenir; sürücü başına " +
          "sıralı görev listesi üretilir.",
        kazanim: "Araç başına durak sayısı artar",
      },
      {
        baslik: "Zaman penceresi bildirimi",
        metin:
          "Alıcıya tahmini teslim aralığı önceden iletilir, uygun değilse tek dokunuşla " +
          "yeniden planlanır.",
        kazanim: "Başarısız ilk teslimat oranı düşer",
      },
      {
        baslik: "Taşıma birleştirme",
        metin:
          "Aynı bölgeye giden farklı siparişler tek sefere birleştirilir; kırılgan veya soğuk " +
          "ürün kuralları birleştirmeyi otomatik engeller.",
        kazanim: "Sefer başına maliyet azalır",
      },
      {
        baslik: "Dijital teslim kanıtı",
        metin:
          "Fotoğraf, konum, zaman damgası ve gerekiyorsa imza tek kayıtta toplanır ve " +
          "gönderiyle ilişkilendirilir.",
        kazanim: "İtiraz çözüm süresi kısalır",
      },
      {
        baslik: "Sürücü performans takibi",
        metin:
          "Durak başına süre, gecikme nedenleri ve ilk denemede teslim oranı sürücü bazında " +
          "raporlanır.",
        kazanim: "Adil ve ölçülebilir performans yönetimi",
      },
    ],
    cozumler: [
      {
        baslik: "Sevkiyat planlama ekranı",
        metin:
          "Haritada küme önizlemesi, sürükle-bırak durak taşıma ve kapasite uyarıları ile " +
          "planlayıcıya kontrol bırakan otomasyon.",
      },
      {
        baslik: "Sürücü mobil uygulaması",
        metin:
          "Sıralı durak listesi, navigasyon aktarımı, teslim/teslim edilemedi nedenleri ve " +
          "çevrimdışı çalışma desteği.",
      },
      {
        baslik: "Kontrol kulesi panosu",
        metin:
          "Gecikme riski taşıyan sevkiyatlar canlı listelenir; müdahale gerektiren durumlar " +
          "önceliklendirilir.",
      },
    ],
    metrikler: [
      { deger: "Dijital", etiket: "teslim kanıtı (imza veya fotoğraf)" },
      { deger: "Rota", etiket: "bazlı kurye ataması" },
      { deger: "Tek", etiket: "panelde tüm sefer takibi" },
    ],
    entegrasyonlar: ["WMS / depo yönetimi", "Kargo firması API'leri", "Filo takip cihazları", "ERP"],
    sss: [
      {
        soru: "Kendi araç filomuz ve anlaşmalı kurye birlikte çalışabilir mi?",
        cevap:
          "Evet. Kapasite aşıldığında sistem tanımlı kurallara göre siparişi anlaşmalı " +
          "taşıyıcıya devreder; maliyet karşılaştırması raporlanır.",
      },
      {
        soru: "Çevrimdışı bölgelerde uygulama çalışır mı?",
        cevap:
          "Sürücü uygulaması görevleri önbelleğe alır; teslim kayıtları bağlantı geldiğinde " +
          "kuyruğa alınmış şekilde senkronlanır.",
      },
      {
        soru: "Rota optimizasyonu kaç durağa kadar ölçekleniyor?",
        cevap:
          "Günlük binlerce durak ölçeğinde çalışır; küme boyutu araç kapasitesi ve zaman " +
          "penceresi kısıtlarıyla sınırlandırılır.",
      },
    ],
  },

  {
    slug: "perakende-eticaret",
    ad: "Perakende & E-ticaret",
    kisaAd: "Perakende",
    ozet:
      "Mağazadan gönderim, aynı gün teslimat ve iade akışını tek stok görünümüyle yönetin.",
    giris:
      "Perakendede en pahalı hata, ürünün aslında var olduğu hâlde \"stokta yok\" görünmesidir. " +
      "Mağaza rafındaki stok ile depo stoğu ayrı yönetildiğinde hem satış kaybedilir hem de " +
      "aynı gün teslimat sözü verilemez. Ne Yersin? tek stok görünümü kurar, siparişi ona en " +
      "yakın karşılama noktasına yönlendirir ve iade akışını aynı sistemde kapatır.",
    gorsel: "sektor/perakende-eticaret-kapak",
    zorluklar: [
      {
        baslik: "Kanal stokları ayrık",
        metin:
          "Mağaza ve depo stoğu ayrı tutulunca web sitesinde satılabilir ürün olduğundan az " +
          "görünür; satış potansiyeli rafta kalır.",
      },
      {
        baslik: "Aynı gün teslimat sözü verilemiyor",
        metin:
          "Siparişin hangi noktadan karşılanacağı sipariş anında belli olmadığı için " +
          "gerçekçi bir teslim süresi hesaplanamaz.",
      },
      {
        baslik: "İade süreci maliyetli",
        metin:
          "İade kargosu, kontrol ve yeniden satışa alma adımları elle yürütülünce ürün " +
          "haftalarca satılamaz durumda kalır.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Tek stok görünümü",
        metin:
          "Mağaza, depo ve tedarikçi stoğu tek havuzda birleştirilir; satılabilir miktar " +
          "kanal bazlı kurallarla belirlenir.",
        kazanim: "Satılabilir ürün görünürlüğü artar",
      },
      {
        baslik: "Akıllı karşılama noktası seçimi",
        metin:
          "Sipariş, mesafe, stok, mağaza iş yükü ve taşıma maliyetine göre en uygun noktaya " +
          "otomatik yönlendirilir.",
        kazanim: "Aynı gün teslimat mümkün hâle gelir",
      },
      {
        baslik: "Mağazadan gönderim akışı",
        metin:
          "Mağaza personeli için toplama, paketleme ve kurye teslim adımları basit bir mobil " +
          "akışa indirilir.",
        kazanim: "Mağaza, mikro depo olarak çalışır",
      },
      {
        baslik: "Otomatik iade ve yeniden satış",
        metin:
          "İade talebi onaylandığında kurye toplaması planlanır, kontrol sonucu ürün otomatik " +
          "olarak yeniden satışa açılır.",
        kazanim: "İade döngüsü kısalır",
      },
    ],
    cozumler: [
      {
        baslik: "Sipariş yönetim katmanı (OMS)",
        metin:
          "Kanal bağımsız sipariş kaydı, bölünmüş gönderim, kısmi iptal ve kısmi iade desteği.",
      },
      {
        baslik: "Mağaza görev ekranı",
        metin:
          "Mağazaya düşen toplama görevleri süre sayacıyla listelenir; kabul edilmeyen görev " +
          "otomatik başka noktaya devredilir.",
      },
      {
        baslik: "Teslimat seçenekleri motoru",
        metin:
          "Aynı gün, ertesi gün, mağazadan teslim ve zaman aralıklı teslimat seçenekleri " +
          "gerçek kapasiteye göre gösterilir.",
      },
    ],
    metrikler: [
      { deger: "Aynı gün", etiket: "şehir içi teslimat penceresi" },
      { deger: "Tek", etiket: "stok havuzu — mağaza ve online" },
      { deger: "İade", etiket: "sürecinde adım adım takip" },
    ],
    entegrasyonlar: ["E-ticaret altyapıları", "ERP", "Pazaryeri entegrasyonları", "Kargo firmaları", "Ödeme sağlayıcıları"],
    sss: [
      {
        soru: "Mevcut e-ticaret sitemizi değiştirmemiz gerekir mi?",
        cevap:
          "Gerekmez. Ne Yersin? sipariş ve teslimat katmanı olarak arkada çalışır; site " +
          "tarafında yalnızca teslimat seçenekleri ve takip ekranı beslenir.",
      },
      {
        soru: "Mağaza personeli ek yük altında kalır mı?",
        cevap:
          "Görev dağıtımı mağaza yoğunluğuna göre yapılır ve mağaza bazlı günlük görev limiti " +
          "tanımlanabilir.",
      },
      {
        soru: "Pazaryeri siparişleri de aynı akışa girer mi?",
        cevap:
          "Evet. Pazaryeri siparişleri tek sipariş havuzuna alınır, aynı karşılama ve teslimat " +
          "kurallarıyla işlenir.",
      },
    ],
  },

  {
    slug: "otel-turizm",
    ad: "Otel & Turizm",
    kisaAd: "Otel",
    ozet:
      "Oda servisi, tesis içi talepler ve misafir bildirimlerini tek görev akışında toplayın.",
    giris:
      "Otelde misafir memnuniyeti çoğu zaman tek bir soruya indirgenir: istediğim şey ne kadar " +
      "sürede geldi? Oda servisi, havlu talebi, teknik arıza ve transfer isteği farklı " +
      "departmanlara farklı kanallardan ulaştığında bu sürenin sahibi yoktur. Ne Yersin? tesis " +
      "içi tüm talepleri tek görev akışına alır, doğru ekibe atar ve süreyi ölçer.",
    gorsel: "sektor/otel-turizm-kapak",
    zorluklar: [
      {
        baslik: "Talepler farklı kanallardan geliyor",
        metin:
          "Telefon, resepsiyon ve mesaj üzerinden gelen istekler tek yerde toplanmadığı için " +
          "kaybolur veya iki kez yapılır.",
      },
      {
        baslik: "Görev sahipliği belirsiz",
        metin:
          "İsteğin hangi departmanda beklediği görünmediğinden gecikmeler ancak misafir " +
          "şikâyetiyle fark edilir.",
      },
      {
        baslik: "Oda servisi maliyeti ölçülmüyor",
        metin:
          "Hangi ürünün hangi saatte ne kadar emekle taşındığı bilinmediği için menü ve fiyat " +
          "kararları veriye dayanmaz.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Tek talep havuzu",
        metin:
          "QR menü, mobil uygulama, resepsiyon ve telefon istekleri aynı görev listesine düşer; " +
          "her görevin sahibi ve süresi vardır.",
        kazanim: "Kaybolan talep sayısı sıfıra yaklaşır",
      },
      {
        baslik: "Departman kuralına göre atama",
        metin:
          "Talep tipi, kat ve vardiyaya göre otomatik atama yapılır; kabul edilmeyen görev " +
          "eskalasyona girer.",
        kazanim: "Yanıt süresi öngörülebilir olur",
      },
      {
        baslik: "Misafire canlı durum bildirimi",
        metin:
          "Talep alındı, hazırlanıyor, yolda ve teslim edildi adımları misafire otomatik " +
          "iletilir.",
        kazanim: "Tekrarlayan \"ne oldu\" aramaları azalır",
      },
      {
        baslik: "Çok dilli menü ve talep formu",
        metin:
          "Misafirin cihaz diline göre içerik otomatik seçilir; personel tarafında talep her " +
          "zaman tesis dilinde görünür.",
        kazanim: "Yabancı misafirde iletişim hatası azalır",
      },
    ],
    cozumler: [
      {
        baslik: "Kat ve servis görev ekranı",
        metin:
          "Vardiyadaki personel için sıralı görev listesi, süre sayacı ve tek dokunuşla " +
          "tamamlama.",
      },
      {
        baslik: "Oda servisi menü yönetimi",
        metin:
          "Saat bazlı menü (kahvaltı, gece menüsü), stok durumu ve oda faturasına aktarım.",
      },
      {
        baslik: "Misafir deneyimi raporu",
        metin:
          "Talep tipi bazlı ortalama yanıt süresi, departman kırılımı ve memnuniyet puanı " +
          "ilişkisi.",
      },
    ],
    metrikler: [
      { deger: "7/24", etiket: "oda servisi sipariş akışı" },
      { deger: "QR", etiket: "ile odadan sipariş" },
      { deger: "Departman", etiket: "bazlı yönlendirme" },
    ],
    entegrasyonlar: ["PMS (otel yönetim sistemi)", "POS", "Oda faturalandırma", "Kanal yöneticisi"],
    sss: [
      {
        soru: "Misafirin uygulama indirmesi gerekiyor mu?",
        cevap:
          "Gerekmiyor. Odadaki QR kod tarayıcıdan açılan web arayüzüyle çalışır; isteyen tesis " +
          "kendi uygulamasına da gömebilir.",
      },
      {
        soru: "Oda faturasına aktarım nasıl çalışıyor?",
        cevap:
          "PMS entegrasyonu ile tutar oda hesabına işlenir; entegrasyon yoksa gün sonu " +
          "mutabakat raporu üretilir.",
      },
      {
        soru: "Sezonluk personel için eğitim yükü ne kadar?",
        cevap:
          "Görev ekranı tek listeden ve üç durumdan oluşur; saha eğitimi tipik olarak yarım " +
          "saatin altındadır.",
      },
    ],
  },

  {
    slug: "kurumsal-catering",
    ad: "Kurumsal Yemek & Catering",
    kisaAd: "Catering",
    ozet:
      "Şirket bazlı sözleşme, bütçe limiti, toplu üretim planı ve konsolide faturalandırma.",
    giris:
      "Kurumsal yemek hizmetinde asıl karmaşıklık mutfakta değil, muhasebe ve hak sahipliği " +
      "tarafındadır: hangi çalışan hangi bütçeyle ne sipariş edebilir, ay sonunda hangi şirkete " +
      "hangi kalemler faturalanır? Ne Yersin? kurumsal akışı, sözleşme kurallarını sipariş " +
      "anında uygular ve dönem sonunda tek konsolide fatura üretir.",
    gorsel: "sektor/kurumsal-catering-kapak",
    zorluklar: [
      {
        baslik: "Bütçe kuralları elle takip ediliyor",
        metin:
          "Çalışan başına günlük limit, katkı payı ve istisnalar tabloda tutulunca hem hata " +
          "hem itiraz doğar.",
      },
      {
        baslik: "Toplu üretim planı geç netleşiyor",
        metin:
          "Kesin adet son ana kadar belli olmadığında ya fire ya eksik üretim oluşur.",
      },
      {
        baslik: "Faturalandırma dağınık",
        metin:
          "Şube, departman ve maliyet merkezi kırılımı olmayan faturalar müşteri tarafında " +
          "onay sürecini uzatır.",
      },
    ],
    otomasyonlar: [
      {
        baslik: "Sözleşme kuralı motoru",
        metin:
          "Şirket, departman ve çalışan seviyesinde günlük limit, katkı payı, izinli menü ve " +
          "sipariş saati kuralları sipariş anında uygulanır.",
        kazanim: "Limit aşımı ve itiraz azalır",
      },
      {
        baslik: "Ön sipariş kesinleştirme",
        metin:
          "Belirlenen saatte sipariş penceresi kapanır, kesin adet üretim planına ve tedarik " +
          "listesine otomatik yansır.",
        kazanim: "Fire ve eksik üretim birlikte azalır",
      },
      {
        baslik: "Toplu teslimat ve dağıtım listesi",
        metin:
          "Siparişler şirket, kat ve departman bazında gruplanır; kurye için tek sevkiyat, " +
          "içeride kolay dağıtım listesi üretilir.",
        kazanim: "Sefer sayısı düşer, dağıtım hızlanır",
      },
      {
        baslik: "Konsolide dönem faturası",
        metin:
          "Dönem sonunda maliyet merkezi kırılımlı tek fatura ve destekleyici detay raporu " +
          "otomatik oluşur.",
        kazanim: "Tahsilat süresi kısalır",
      },
    ],
    cozumler: [
      {
        baslik: "Kurumsal müşteri paneli",
        metin:
          "Şirket yöneticisi çalışan listesini, limitleri ve harcama raporlarını kendi " +
          "panelinden yönetir.",
      },
      {
        baslik: "Toplu üretim planlama",
        metin:
          "Menü bazlı adet, tedarik ihtiyacı ve üretim saat planı tek ekranda; geçmiş dönem " +
          "verisiyle tahmin desteği.",
      },
      {
        baslik: "Beslenme ve alerjen yönetimi",
        metin:
          "Vejetaryen, glutensiz ve alerjen bazlı seçenekler çalışan profiline göre " +
          "önceliklendirilir.",
      },
    ],
    metrikler: [
      { deger: "Maliyet", etiket: "merkezi kırılımlı faturalama" },
      { deger: "Önceden", etiket: "sipariş ve menü planlama" },
      { deger: "Toplu", etiket: "teslimat tek seferde" },
    ],
    entegrasyonlar: ["İK / bordro sistemleri", "e-Fatura", "ERP", "Kurumsal SSO"],
    sss: [
      {
        soru: "Çalışan katkı payı nasıl tahsil ediliyor?",
        cevap:
          "Limit üstü tutar çalışanın kendi ödeme yöntemiyle sipariş anında tahsil edilir; " +
          "şirket payı dönem faturasına yazılır.",
      },
      {
        soru: "Birden fazla lokasyonu olan şirketler için nasıl çalışıyor?",
        cevap:
          "Her lokasyon ayrı teslim noktası ve maliyet merkezi olarak tanımlanır; raporlar " +
          "lokasyon kırılımında üretilir.",
      },
      {
        soru: "Menü döngüsünü biz mi belirliyoruz?",
        cevap:
          "Evet. Haftalık veya dört haftalık döngü tanımlanır; sistem tekrar eden menüleri ve " +
          "beğeni oranlarını raporlar.",
      },
    ],
  },
];

export function sektorBul(slug: string): Sektor | undefined {
  return sektorler.find((s) => s.slug === slug);
}
