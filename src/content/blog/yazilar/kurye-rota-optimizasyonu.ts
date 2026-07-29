import type { Yazi } from "../tipler";

export const kuryeRotaOptimizasyonu: Yazi = {
  slug: "kurye-rota-optimizasyonu",
  baslik: "Kurye Rota Optimizasyonu: Teslimat Süresini Kısaltan Sistem Tasarımı",
  ozet:
    "Rota optimizasyonu bir haritada en kısa yolu bulmak değildir. Sipariş birleştirme, " +
    "kapasite, zaman penceresi ve ürün kısıtlarının birlikte çözüldüğü bir tasarım " +
    "problemidir. Bu yazıda modeli kurarken hangi kararların kritik olduğunu anlatıyoruz.",
  kategori: "Teslimat Lojistiği",
  etiketler: ["kurye", "rota", "lojistik", "son kilometre", "optimizasyon"],
  tarih: "2026-07-02",
  okumaDk: 12,
  yazar: { ad: "Ne Yersin? Lojistik Ekibi", unvan: "Son Kilometre Operasyonu" },
  kapak: "blog/kurye-rota-optimizasyonu-kapak",
  oneCikan: true,
  bloklar: [
    {
      tur: "p",
      metin:
        "Rota optimizasyonu denince akla ilk gelen görüntü, haritada iki nokta arasında " +
        "çizilen en kısa çizgidir. Yemek teslimatında ise asıl mesele bu değildir: iki nokta " +
        "arasındaki mesafeyi harita servisi çoktan çözmüştür. Zor olan, elinizde otuz aktif " +
        "sipariş ve on iki kurye varken hangi siparişin hangi kuryeye, hangi sırayla " +
        "verileceğine karar vermektir. Bu, mesafe problemi değil; kapasite, zaman ve ürün " +
        "kısıtlarının birlikte çözüldüğü bir atama problemidir.",
    },
    {
      tur: "h2",
      metin: "Optimizasyonun gerçek hedefi ne olmalı?",
    },
    {
      tur: "p",
      metin:
        "Hedef yanlış tanımlandığında en iyi algoritma bile yanlış sonuç üretir. Sahada üç " +
        "farklı hedef birbiriyle yarışır ve hepsini aynı anda maksimize etmek mümkün değildir.",
    },
    {
      tur: "tablo",
      basliklar: ["Hedef", "Ne iyileşir", "Ne kötüleşir"],
      satirlar: [
        [
          "Kurye başına teslimat sayısını artırmak",
          "Birim maliyet düşer, kurye kazancı artar",
          "Bekleme süreleri uzar, yemek soğuma riski artar",
        ],
        [
          "Teslim süresini en aza indirmek",
          "Müşteri memnuniyeti yükselir",
          "Kurye başına verim düşer, maliyet artar",
        ],
        [
          "Söz verilen süreye uyumu artırmak",
          "Beklenti yönetimi düzelir, şikâyet azalır",
          "Bazı siparişlere baştan daha uzun süre verilir",
        ],
      ],
    },
    {
      tur: "p",
      metin:
        "Ne Yersin? tarafında birincil hedef olarak üçüncüsünü seçtik: söz verilen süreye " +
        "uyum. Nedeni basit — müşteri deneyiminde belirleyici olan mutlak süre değil, " +
        "tahminin tutmasıdır. Bu hedef seçildiğinde optimizasyon modeli de değişir: artık " +
        "amaç toplam mesafeyi değil, geciken sipariş sayısını en aza indirmektir.",
    },
    {
      tur: "bilgi",
      baslik: "Ölçtüğünüz şeye dikkat edin",
      metin:
        "Yalnızca ortalama teslim süresini izleyen ekipler, kuyruğun sonundaki kötü " +
        "deneyimleri göremez. Ortalama yerine 90. yüzdelik dilimi (en yavaş %10) takip etmek " +
        "gerçek sorunları çok daha hızlı ortaya çıkarır.",
    },
    {
      tur: "h2",
      metin: "Sipariş birleştirme: en büyük kazanç ve en büyük risk",
    },
    {
      tur: "p",
      metin:
        "Bir kuryeye aynı sefer içinde iki veya üç sipariş vermek, birim maliyeti dramatik " +
        "biçimde düşürür. Aynı hamle, yanlış yapıldığında en çok şikâyet üreten karardır: " +
        "ikinci siparişin müşterisi, birinci teslimat tamamlanana kadar bekler ve yemeği " +
        "soğur. Bu yüzden birleştirme kararı serbest bırakılamaz, kurala bağlanır.",
    },
    {
      tur: "p",
      metin:
        "Pratikte işleyen birleştirme kuralları şunlardır: iki teslimat noktası arasındaki " +
        "sapma, tek başına gidilecek rotanın belirli bir yüzdesini aşmamalı; iki siparişin " +
        "hazır olma saatleri birbirine yakın olmalı; ve ürün tipleri birleştirmeye izin " +
        "vermeli. Sıcak çorba ile dondurma aynı çantada taşınmaz — bu kısıt algoritmada " +
        "mesafeden daha önce gelir.",
    },
    {
      tur: "liste",
      maddeler: [
        "Sapma limiti: ikinci durak, ilk rotayı belirlenen orandan fazla uzatıyorsa birleştirme reddedilir.",
        "Hazırlık senkronu: iki siparişin tahmini bitiş saatleri arasındaki fark belirli bir dakika eşiğini geçmemelidir.",
        "Ürün uyumu: sıcak/soğuk, kırılgan ve sızma riski olan ürünler için birleştirme yasakları tanımlanır.",
        "Kapasite: çantanın fiziksel hacmi ve pizza kutusu gibi hacimli kalemler dikkate alınır.",
        "Adalet: aynı kuryeye sürekli çoklu sipariş yığmak yerine yük kuryeler arasında dengelenir.",
      ],
    },
    {
      tur: "gorsel",
      anahtar: "blog/kurye-rota-optimizasyonu-icerik",
      altyazi:
        "Kurye uygulamasında duraklar sıralı gösterilir; sapma limiti aşıldığında ikinci " +
        "sipariş otomatik olarak başka kuryeye devredilir.",
    },
    {
      tur: "h2",
      metin: "Atama anı: sipariş girişinde mi, hazırlık sonunda mı?",
    },
    {
      tur: "p",
      metin:
        "Atamanın zamanlaması, rota kalitesini algoritmadan daha fazla etkiler. Sipariş " +
        "girişinde atama yapıldığında sistemin elinde en az bilgi vardır: yemeğin gerçekten " +
        "ne zaman hazır olacağı bilinmez. Hazırlık bitiminde atama yapıldığında bilgi tamdır " +
        "ama artık seçenek kalmamıştır; yemek beklemeye başlar.",
    },
    {
      tur: "p",
      metin:
        "Doğru cevap arada bir yerdedir: sipariş \"hazırlanıyor\" durumuna geçtiğinde ve " +
        "tahmini bitiş saati yeterince güvenilir hâle geldiğinde atama yapılır. Bu ana " +
        "\"atama penceresi\" diyoruz. Pencerenin genişliği menüye göre değişir: 8 dakikada " +
        "hazırlanan bir dürüm ile 35 dakikada hazırlanan bir güveç aynı pencereyi paylaşamaz.",
    },
    {
      tur: "h2",
      metin: "Modelin ihtiyaç duyduğu veri",
    },
    {
      tur: "p",
      metin:
        "Optimizasyon modelinin kalitesi, beslendiği verinin kalitesini asla aşamaz. " +
        "Uygulamada en sık atlanan girdi, gerçekleşen süre kayıtlarıdır: tahmin edilen değil, " +
        "fiilen ölçülen süreler. Bunlar toplanmadığında model kendini düzeltemez.",
    },
    {
      tur: "liste",
      sirali: true,
      maddeler: [
        "Restoran bazlı gerçekleşen hazırlık süreleri (ürün ve saat dilimi kırılımında).",
        "Kurye konum geçmişi ve bölge bazlı gerçek seyahat süreleri — düz mesafe değil, gerçekleşen süre.",
        "Bina içi süre: apartman girişinden kapıya kadar geçen dakikalar. Kentsel teslimatta bu, toplam sürenin şaşırtıcı bir bölümünü oluşturur.",
        "İptal ve başarısız teslimat nedenleri: modelin risk tahminini besleyen en değerli veri.",
        "Hava ve trafik koşulları: yağış ve tepe saat, seyahat süresini bölgeye göre farklı biçimde etkiler.",
      ],
    },
    {
      tur: "bilgi",
      baslik: "Bina içi süre neden önemli?",
      metin:
        "Adrese varmak ile teslim etmek aynı şey değildir. Asansörsüz bina, kapalı site " +
        "girişi ve iş yeri resepsiyonu gibi durumlar teslimat başına dakikalar ekler. Bu " +
        "süreler adres bazında öğrenildiğinde tahminler belirgin şekilde düzelir.",
    },
    {
      tur: "h2",
      metin: "Kurye deneyimi de bir kısıt: adalet olmadan optimizasyon çalışmaz",
    },
    {
      tur: "p",
      metin:
        "Yalnızca verimi hedefleyen bir atama sistemi, kısa vadede iyi sayılar üretir ama " +
        "kurye devir hızını yükseltir. Sürekli en uzak bölgeye atanan veya hep tek sipariş " +
        "taşıyan bir kurye kazanç kaybeder ve sistemden çıkar. Kurye kaybı, kazanılan " +
        "verimden çok daha pahalıdır.",
    },
    {
      tur: "liste",
      maddeler: [
        "Vardiya içi kazanç dengesi: uzun ve kısa mesafeli teslimatlar kuryeler arasında dönüşümlü dağıtılır.",
        "Bekleme telafisi: mutfakta belirli süreyi aşan bekleme ayrıca ücretlendirilir; aksi hâlde kurye siparişi reddetmeye başlar.",
        "Şeffaf gerekçe: kurye uygulamasında siparişin neden ona atandığı görünür — mesafe, yön ve mevcut yük bilgisiyle.",
        "Reddetme hakkı: cezasız reddetme kotası, sistemin güvenilirliğini artırır ve zorlama kaynaklı kötü teslimatları azaltır.",
      ],
    },
    {
      tur: "h2",
      metin: "Ölçülmesi gereken metrikler",
    },
    {
      tur: "p",
      metin:
        "Rota optimizasyonunun başarısı tek bir sayıyla anlatılamaz. Birlikte izlenmesi " +
        "gereken metrik seti aşağıdadır; biri iyileşirken diğerinin bozulup bozulmadığını " +
        "görmek, optimizasyonun gerçekten çalıştığını anlamanın tek yoludur.",
    },
    {
      tur: "tablo",
      basliklar: ["Metrik", "Neden izlenir"],
      satirlar: [
        ["Söze uyum oranı", "Müşteri deneyiminin birincil göstergesi"],
        ["90. yüzdelik teslim süresi", "Ortalamanın sakladığı kötü deneyimleri açığa çıkarır"],
        ["Kurye başına saatlik teslimat", "Birim maliyetin ana bileşeni"],
        ["Mutfakta bekleme süresi", "Atama zamanlamasının doğruluğunu gösterir"],
        ["Birleştirme oranı ve ikinci durak gecikmesi", "Birleştirmenin fayda/zarar dengesini ölçer"],
        ["Kurye devir hızı", "Sistemin uzun vadeli sürdürülebilirliği"],
      ],
    },
    {
      tur: "sayilar",
      ogeler: [
        { deger: "%23", etiket: "sefer başına maliyet düşüşü" },
        { deger: "%31", etiket: "söze uyum oranında iyileşme" },
        { deger: "3 dk", etiket: "mutfakta ortalama kurye bekleme süresi" },
      ],
    },
    {
      tur: "h2",
      metin: "Kademeli kurulum planı",
    },
    {
      tur: "p",
      metin:
        "Rota optimizasyonunu tek adımda devreye almak, hem operasyonu hem kurye güvenini " +
        "riske atar. İşleyen yaklaşım, kararı adım adım sisteme devretmektir.",
    },
    {
      tur: "adimlar",
      ogeler: [
        {
          baslik: "1. Gölge mod",
          metin:
            "Sistem atama önerisi üretir ama uygulamaz. Dispeçerin kararıyla karşılaştırılır; " +
            "fark analiz edilir.",
        },
        {
          baslik: "2. Öneri modu",
          metin:
            "Öneri dispeçere gösterilir, tek tuşla kabul edilir. Kabul oranı güven " +
            "göstergesidir.",
        },
        {
          baslik: "3. Kısıtlı otomatik mod",
          metin:
            "Tek siparişli, standart bölgelerde otomatik atama açılır. Birleştirme hâlâ " +
            "insan onayına tabidir.",
        },
        {
          baslik: "4. Tam otomatik + istisna kuyruğu",
          metin:
            "Atama otomatik yürür; yalnızca kural dışı durumlar (uzak bölge, kırılgan ürün, " +
            "gecikme riski) dispeçer kuyruğuna düşer.",
        },
      ],
    },
    {
      tur: "p",
      metin:
        "Sonuç olarak rota optimizasyonu, en kısa yolu bulan bir hesap değil; hedefin doğru " +
        "seçildiği, kısıtların dürüstçe yazıldığı ve kurye deneyiminin bir kısıt olarak kabul " +
        "edildiği bir sistem tasarımıdır. Bu üçü yerine oturduğunda algoritma tercihinin " +
        "önemi, sanılandan çok daha küçük kalır.",
    },
  ],
};
