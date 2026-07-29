import type { Yazi } from "../tipler";

export const mutfakEkraniKds: Yazi = {
  slug: "mutfak-ekrani-kds",
  baslik: "Mutfak Ekranı (KDS): Kâğıt Fişi Bitirmenin Doğru Yolu",
  ozet:
    "Mutfak ekranı kurmak, fişi ekrana taşımak değildir. Kolon tasarımı, süre sayaçları, " +
    "istasyon ayrımı ve ilerletme mekaniği yanlış kurulduğunda ekran kâğıttan daha yavaş " +
    "çalışır. Bu yazıda çalışan bir KDS'nin nasıl tasarlandığını anlatıyoruz.",
  kategori: "Restoran Teknolojileri",
  etiketler: ["KDS", "mutfak", "operasyon", "arayüz tasarımı"],
  tarih: "2026-06-05",
  okumaDk: 11,
  yazar: { ad: "Ne Yersin? Ürün Ekibi", unvan: "Operasyon ve Ürün" },
  kapak: "blog/mutfak-ekrani-kds-kapak",
  bloklar: [
    {
      tur: "p",
      metin:
        "Mutfak ekranı, restoran teknolojisinde en çok satın alınan ve en sık terk edilen " +
        "üründür. Terk edilme nedeni neredeyse hiçbir zaman donanım değildir; ekranın " +
        "mutfağın çalışma ritmine değil, yazılımın veri modeline göre tasarlanmış olmasıdır. " +
        "Bir aşçı yoğun saatte ekranda arama yapmak, kaydırmak veya menüden seçim yapmak " +
        "istemez. Eldiveni yağlıdır, iki adım ötededir ve elinde tava vardır. Bu yazıda " +
        "mutfakta gerçekten kullanılan bir KDS'nin hangi tasarım kararlarıyla ayrıldığını " +
        "anlatıyoruz.",
    },
    {
      tur: "h2",
      metin: "Kâğıt fişin gerçekten iyi olduğu şeyler",
    },
    {
      tur: "p",
      metin:
        "Kâğıt fişi yenmek için önce neden bu kadar uzun süre dayandığını anlamak gerekir. " +
        "Fişin üç güçlü yanı vardır ve bunları karşılamayan bir ekran kaybeder.",
    },
    {
      tur: "liste",
      maddeler: [
        "Fiziksel konum bir bilgidir: fişi tezgâhın soluna koymak \"bu sırada\" demektir, hiçbir yazılım kadar hızlı iletişim kurar.",
        "Aynı anda birden fazla kişi bakabilir ve kendi fişini eline alabilir; ekran tek bir bakış noktasıdır.",
        "Hiç çökmez ve gecikme yaşatmaz. Ağ sorunu, dokunmatik hassasiyeti veya oturum düşmesi diye bir problemi yoktur.",
      ],
    },
    {
      tur: "bilgi",
      baslik: "Tasarım ilkesi",
      metin:
        "İyi bir KDS, kâğıt fişin bu üç avantajını taklit etmeye çalışır: konumu kolonlarla, " +
        "çok kişili erişimi istasyon ayrımıyla ve güvenilirliği çevrimdışı çalışma " +
        "yeteneğiyle karşılar.",
    },
    {
      tur: "h2",
      metin: "Kolon tasarımı: en fazla üç durum",
    },
    {
      tur: "p",
      metin:
        "KDS arayüzlerinde en yaygın hata, sipariş durumlarını gereğinden fazla parçalamaktır. " +
        "Altı-yedi kolonlu bir ekran teoride daha bilgilendiricidir, pratikte kimse kartları " +
        "o kadar çok kez ilerletmez ve durumlar gerçeği yansıtmayı bırakır. Sahada işleyen " +
        "yapı üç kolondur: bekleyen, hazırlanıyor, hazır.",
    },
    {
      tur: "tablo",
      basliklar: ["Kolon", "Ne anlama gelir", "Kimin sorumluluğunda"],
      satirlar: [
        ["Bekleyen", "Kabul edildi, henüz başlanmadı", "Sıralama mantığı — otomatik"],
        ["Hazırlanıyor", "İstasyonlarda üretimde", "Mutfak ekibi"],
        ["Hazır", "Paketlemeye/kuryeye devredildi", "Paketleme istasyonu"],
      ],
    },
    {
      tur: "p",
      metin:
        "Daha ince kırılıma ihtiyaç varsa bunu kolon eklemek yerine kart üzerindeki " +
        "istasyon işaretleriyle çözmek gerekir: bir kartın içindeki üç kalemden ikisi hazır, " +
        "biri devam ediyorsa bu bilgi kart içinde gösterilir. Kartı bölmek, siparişi bir " +
        "bütün olarak takip etme yeteneğini yok eder.",
    },
    {
      tur: "gorsel",
      anahtar: "blog/mutfak-ekrani-kds-icerik",
      altyazi:
        "Paketleme istasyonu, KDS'nin \"hazır\" kolonuyla eşleşir; kalem kontrolü burada " +
        "yapılır ve eksik ürün şikâyetleri belirgin biçimde azalır.",
    },
    {
      tur: "h2",
      metin: "Süre sayacı: geri sayım mı, geçen süre mi?",
    },
    {
      tur: "p",
      metin:
        "Kartlarda süre göstermenin iki yolu vardır ve ikisi çok farklı davranış üretir. " +
        "Geçen süreyi göstermek (\"bu sipariş 12 dakikadır burada\") bilgilendirici ama " +
        "eylemsizdir. Söz verilen teslim saatine kalan süreyi göstermek (\"çıkışa 6 dakika\") " +
        "doğrudan önceliklendirme üretir.",
    },
    {
      tur: "p",
      metin:
        "Ne Yersin? KDS'de sayaç, söz verilen çıkış saatine göre geri sayar ve üç eşikte renk " +
        "değiştirir: normal, yaklaşıyor, gecikti. Renk körlüğüne karşı yalnızca renge " +
        "güvenilmez; kartın kenarındaki kalınlık ve ikon da değişir. Yoğun mutfakta bir aşçı " +
        "ekrana bakma süresini yarım saniyeyle sınırlar — o yarım saniyede okunması gereken " +
        "tek şey hangi kartın sırada olduğudur.",
    },
    {
      tur: "liste",
      maddeler: [
        "Sayaç, çıkış saatine kalan süreyi gösterir; geçmişse negatif değil, belirgin bir gecikme etiketi olarak görünür.",
        "Renk tek başına bilgi taşımaz; kenar kalınlığı ve ikon da eşlik eder.",
        "Yanıp sönen animasyon kullanılmaz — yoğun mutfakta dikkat dağıtıcıdır ve kısa süre sonra görmezden gelinir.",
        "Kart üzerinde en fazla iki satırlık ürün özeti; detay için karta dokunulur.",
      ],
    },
    {
      tur: "h2",
      metin: "İstasyon ayrımı: herkes her siparişi görmemeli",
    },
    {
      tur: "p",
      metin:
        "Tek ekrana bütün mutfağı sığdırmak, küçük işletmeler için doğru karardır. Izgara, " +
        "soğuk mutfak ve tatlı istasyonlarının ayrıştığı bir mutfakta ise tek ekran " +
        "gürültü üretir: her istasyon kendisiyle ilgisiz kalemleri okumak zorunda kalır.",
    },
    {
      tur: "p",
      metin:
        "Doğru yaklaşım, ürünleri istasyonlara etiketlemek ve her ekranın yalnızca kendi " +
        "kalemlerini göstermesidir. Ancak burada kritik bir tasarım detayı var: istasyon " +
        "ekranı kendi kalemini bitirdiğinde sipariş \"hazır\" olmaz. Sipariş, tüm " +
        "istasyonların kalemleri tamamlandığında hazır olur ve bunu gösteren birleştirme " +
        "ekranı (pass) ayrı durur. Bu ayrım yapılmadığında ürünler farklı zamanlarda çıkar " +
        "ve biri soğur.",
    },
    {
      tur: "bilgi",
      baslik: "Senkron pişirme",
      metin:
        "İstasyon bazlı hazırlık süreleri biliniyorsa sistem, uzun süreli kalemi erken, kısa " +
        "süreli kalemi geç başlatacak şekilde başlama saati önerir. Böylece tüm kalemler " +
        "yaklaşık aynı anda hazır olur. Bu, KDS'nin en az bilinen ama en değerli " +
        "yeteneklerinden biridir.",
    },
    {
      tur: "h2",
      metin: "İlerletme mekaniği: dokunma, barkod, yoksa sesli",
    },
    {
      tur: "p",
      metin:
        "Kartı ilerletmek için gereken hareket ne kadar zorsa, ekran o kadar hızlı terk " +
        "edilir. Dokunmatik ekranlar mutfakta yağlı eldivenle güvenilir çalışmaz; bu yüzden " +
        "tek bir ilerletme yöntemine bağlı kalmamak gerekir.",
    },
    {
      tur: "liste",
      sirali: true,
      maddeler: [
        "Büyük dokunma alanları: kart üzerinde en az 64 piksellik hedef; küçük ikonlarla ilerletme yapılmaz.",
        "Fiziksel buton veya ayak pedalı desteği: en yoğun istasyonlarda en güvenilir yöntem.",
        "Barkod/QR ile paketleme onayı: paketleme istasyonunda poşet etiketi okutularak sipariş kapatılır.",
        "Geri alma (undo): yanlış ilerletilen kart 10 saniye içinde tek dokunuşla geri alınabilmelidir; aksi hâlde personel ilerletmekten çekinir.",
      ],
    },
    {
      tur: "h2",
      metin: "Çevrimdışı çalışma: pazarlık edilemez gereksinim",
    },
    {
      tur: "p",
      metin:
        "Mutfakta internet kesintisi bir olasılık değil, kesinliktir. Ağ koptuğunda ekranın " +
        "boşalması, KDS projelerinin güvenini bir günde yok eder. Doğru mimari, ekranın " +
        "aktif siparişleri yerel olarak tutması ve bağlantı geldiğinde durum değişikliklerini " +
        "kuyruktan senkronlamasıdır.",
    },
    {
      tur: "liste",
      maddeler: [
        "Aktif siparişler cihazda saklanır; kesintide ekran çalışmaya devam eder.",
        "Durum değişiklikleri zaman damgasıyla kuyruğa alınır ve bağlantı gelince sırayla gönderilir.",
        "Bağlantı durumu ekranda küçük ama net bir göstergeyle belirtilir — personel neyin olduğunu bilmelidir.",
        "Kesinti sırasında gelen yeni siparişler için yedek kanal (yazıcı) devrede kalır.",
      ],
    },
    {
      tur: "h2",
      metin: "Geçiş planı: fişi bir günde atmayın",
    },
    {
      tur: "p",
      metin:
        "KDS geçişinde en sık yapılan hata, yazıcıyı ilk gün kapatmaktır. Personel yeni " +
        "sisteme güvenmediği sürece paralel çalışma dönemine ihtiyaç duyar; bu dönem " +
        "kısaltıldığında ekran değil kâğıt kazanır.",
    },
    {
      tur: "adimlar",
      ogeler: [
        {
          baslik: "1. Hafta: Paralel çalışma",
          metin:
            "Ekran ve yazıcı birlikte çalışır. Personel ekrana alışırken fişe de bakabilir; " +
            "güven bu dönemde kurulur.",
        },
        {
          baslik: "2. Hafta: Ekran birincil",
          metin:
            "Sıralama artık ekrandan takip edilir, yazıcı yalnızca yedek olarak açık kalır. " +
            "Ekrandan ilerletme alışkanlığı yerleşir.",
        },
        {
          baslik: "3. Hafta: Yazıcı yedeğe düşer",
          metin:
            "Yazıcı yalnızca bağlantı kesintisinde otomatik devreye girer. Ölçüm başlar: " +
            "gecikme oranı, ilerletme süresi, geri alma sayısı.",
        },
        {
          baslik: "4. Hafta: İnce ayar",
          metin:
            "Kart yoğunluğu, sayaç eşikleri ve istasyon dağılımı gerçek kullanımdan gelen " +
            "veriye göre ayarlanır. Bu adım atlanırsa ekran \"idare eder\" seviyesinde kalır.",
        },
      ],
    },
    {
      tur: "sayilar",
      ogeler: [
        { deger: "3", etiket: "ideal kolon sayısı" },
        { deger: "0,5 sn", etiket: "bir aşçının ekrana bakma süresi" },
        { deger: "4 hafta", etiket: "sağlıklı geçiş süresi" },
      ],
    },
    {
      tur: "alinti",
      metin:
        "Mutfak ekranı bir raporlama aracı değildir. Tek işi, yoğun saatte hangi siparişin " +
        "sırada olduğunu tartışmasız hâle getirmektir.",
    },
    {
      tur: "p",
      metin:
        "Bir KDS'nin başarısını ölçmenin en dürüst yolu, personelin ne dediği değil ne " +
        "yaptığıdır: yazıcı yedeğe düştükten sonra kimse onu geri açmak istemiyorsa ekran " +
        "işini yapıyor demektir. Aksi hâlde sorun mutfakta değil, arayüz tasarımındadır.",
    },
  ],
};
