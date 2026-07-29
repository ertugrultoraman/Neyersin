import type { Yazi } from "../tipler";

export const restoranOtomasyonuRehberi: Yazi = {
  slug: "restoran-otomasyonu-rehberi",
  baslik: "Restoran Otomasyonu: Siparişten Mutfağa Uçtan Uca Rehber",
  ozet:
    "Bir siparişin müşterinin telefonundan mutfağa, paketleme bankosundan kuryenin çantasına " +
    "kadar geçtiği yolu adım adım çıkarıyoruz. Hangi adımın otomasyona ihtiyacı olduğunu, " +
    "hangisinin insan kararı gerektirdiğini ve yatırımın nereden geri döndüğünü anlatıyoruz.",
  kategori: "Sektörel Otomasyon",
  etiketler: ["restoran", "otomasyon", "operasyon", "KDS", "kurye"],
  tarih: "2026-07-14",
  okumaDk: 14,
  yazar: { ad: "Ne Yersin? Ürün Ekibi", unvan: "Operasyon ve Ürün" },
  kapak: "blog/restoran-otomasyonu-rehberi-kapak",
  oneCikan: true,
  bloklar: [
    {
      tur: "p",
      metin:
        "Restoran otomasyonu konuşulurken tartışma çoğu zaman yazılım seçimine indirgenir. " +
        "Oysa bir restoranın gerçek problemi hangi programı kullandığı değil, siparişin " +
        "sistemler arasında kaç kez elle taşındığıdır. Telefonla alınan siparişin deftere " +
        "yazılması, oradan mutfağa bağırılması, paketlenirken içeriğin akılda tutulması ve " +
        "kuryenin adresi ekrandan okuyup not etmesi — bunların her biri bilgi kaybı ve gecikme " +
        "üretir. Bu rehberde otomasyonu bir ürün listesi olarak değil, siparişin yolculuğundaki " +
        "kopma noktalarını kapatma işi olarak ele alıyoruz.",
    },
    {
      tur: "h2",
      metin: "Siparişin yolculuğunu haritalamadan otomasyon kurulamaz",
    },
    {
      tur: "p",
      metin:
        "Herhangi bir yazılıma karar vermeden önce yapılması gereken tek şey var: mevcut " +
        "akışı olduğu gibi, iyileştirmeden yazmak. Çoğu işletme bunu yaptığında siparişin " +
        "sandığından çok daha fazla elden geçtiğini görür. Tipik bir paket servis akışı şu " +
        "durakları içerir.",
    },
    {
      tur: "adimlar",
      ogeler: [
        {
          baslik: "1. Sipariş girişi",
          metin:
            "Müşteri online kanaldan, telefondan veya kapıdan sipariş verir. Her kanalın kendi " +
            "kayıt yeri olduğunda mutfak toplam yükü göremez.",
        },
        {
          baslik: "2. Kabul ve süre sözü",
          metin:
            "Sipariş kabul edilirken müşteriye bir teslim süresi söylenir. Bu süre gerçek " +
            "kapasiteye değil çoğunlukla alışkanlığa dayanır.",
        },
        {
          baslik: "3. Mutfak sıralaması",
          metin:
            "Hangi siparişin önce hazırlanacağına karar verilir. Kağıt fişte bu karar fişin " +
            "sırasına, yani tesadüfe bırakılır.",
        },
        {
          baslik: "4. Hazırlık ve pişirme",
          metin:
            "Ürünler istasyonlara dağılır. Farklı pişirme süreleri koordine edilmezse bir " +
            "kalem hazırken diğeri bekler ve ikisi de soğur.",
        },
        {
          baslik: "5. Paketleme ve kontrol",
          metin:
            "Sipariş içeriği kontrol edilir, poşetlenir. Eksik ürün şikâyetlerinin büyük kısmı " +
            "tam bu adımda doğar.",
        },
        {
          baslik: "6. Kurye ataması ve teslim",
          metin:
            "Kurye çağrılır, adrese gider, teslim eder. Kurye çok erken çağrılırsa mutfakta " +
            "bekler; çok geç çağrılırsa yemek tezgâhta bekler.",
        },
      ],
    },
    {
      tur: "bilgi",
      baslik: "Otomasyonun ilk kuralı",
      metin:
        "Bir adımı otomatikleştirmeden önce o adımın süresini ölçün. Ölçülmeyen bir adımın " +
        "iyileştiğini kimse kanıtlayamaz; yazılım masrafı da bu yüzden tartışma konusu olur.",
    },
    {
      tur: "h2",
      metin: "Tek sipariş kuyruğu: en az konuşulan, en çok kazandıran adım",
    },
    {
      tur: "p",
      metin:
        "Restoranlarda en yaygın gizli maliyet, kanalların birbirini görmemesidir. Online " +
        "siparişler bir tablette, telefon siparişleri kasada, salon siparişleri POS'ta " +
        "birikirken mutfak bu üç akışı zihninde birleştirmek zorunda kalır. Yoğun saatlerde bu " +
        "birleştirme işi kaçınılmaz olarak bozulur ve sıralama hissiyata kalır.",
    },
    {
      tur: "p",
      metin:
        "Tek sipariş kuyruğu, tüm kanalları aynı listeye düşürür ve sıralamayı iki net " +
        "kritere bağlar: siparişin geliş saati ve müşteriye söz verilen teslim saati. Bu " +
        "ikisi birlikte değerlendirildiğinde \"az önce gelen ama 40 dakika sonrası için " +
        "planlanmış\" bir sipariş, \"yirmi dakika önce gelmiş ve şimdi çıkması gereken\" bir " +
        "siparişin önüne geçmez. Kulağa basit geliyor; sahada gecikme oranını en hızlı " +
        "düşüren müdahale genellikle bu oluyor.",
    },
    {
      tur: "gorsel",
      anahtar: "blog/restoran-otomasyonu-rehberi-icerik",
      altyazi:
        "Mutfak ekranı, sipariş sıralamasını fişin fiziksel sırasından çıkarıp söz verilen " +
        "teslim saatine bağlar.",
    },
    {
      tur: "h2",
      metin: "Hazırlık süresi sabit değil, hesaplanan bir değerdir",
    },
    {
      tur: "p",
      metin:
        "Menüde her ürün için tek bir hazırlık süresi tanımlamak, otomasyon projelerinin en " +
        "sık yaptığı basitleştirmedir. Gerçekte bir burgerin hazırlanma süresi, o anda " +
        "ızgarada kaç sipariş olduğuna, vardiyada kaç kişinin çalıştığına ve siparişin kaç " +
        "kalemden oluştuğuna göre değişir. Sabit süre varsayımı, boş saatlerde gereksiz uzun, " +
        "yoğun saatlerde ise tutulamayacak kadar kısa bir söz üretir.",
    },
    {
      tur: "p",
      metin:
        "Dinamik hazırlık süresi hesabı en az üç girdiye bakar: aktif sipariş sayısı, ürün " +
        "bazlı geçmiş ortalama hazırlık süresi ve vardiyadaki personel kapasitesi. Bu üçlü " +
        "birleştirildiğinde söz verilen süre yoğunlukta kendiliğinden uzar. Müşteri tarafında " +
        "bu, uzun bekleme değil, tutulan söz olarak deneyimlenir — ki memnuniyeti belirleyen " +
        "şey sürenin kısalığı değil, tahminin doğruluğudur.",
    },
    {
      tur: "alinti",
      metin:
        "Müşteri 25 dakika bekleyip 25 dakikada teslim almayı, 20 dakika sözü alıp 35 " +
        "dakikada teslim almaya her zaman tercih eder.",
    },
    {
      tur: "h2",
      metin: "Kurye atamasının zamanlaması: iki yönlü bir bekleme problemi",
    },
    {
      tur: "p",
      metin:
        "Kurye ataması genellikle iki uçtan biriyle yapılır: sipariş girer girmez çağırmak ya " +
        "da yemek hazır olduğunda çağırmak. İkisi de maliyetlidir. Erken çağırmak kuryeyi " +
        "mutfakta bekletir, yani teslimat kapasitesini boşa harcar. Geç çağırmak yemeği " +
        "tezgâhta bekletir, yani ürün kalitesini düşürür.",
    },
    {
      tur: "p",
      metin:
        "Doğru yaklaşım, atamayı tahmini bitiş saatine göre yapmaktır. Sipariş hazırlanmaya " +
        "başladığında sistem bitiş saatini tahmin eder ve o saate ulaşabilecek kuryeyi " +
        "yönlendirir. Kurye ile yemek aynı anda tezgâhta buluşur. Ne Yersin? tarafında bu " +
        "hesaplama kuryenin mevcut konumu, üzerindeki aktif teslimat sayısı ve restorana " +
        "tahmini varış süresini birlikte değerlendirir.",
    },
    {
      tur: "tablo",
      basliklar: ["Atama stratejisi", "Kurye bekleme", "Yemek bekleme", "Uygun olduğu durum"],
      satirlar: [
        ["Sipariş girişinde ata", "Yüksek", "Yok", "Çok kısa hazırlık süreli menüler"],
        ["Yemek hazır olunca ata", "Yok", "Yüksek", "Kurye yoğunluğu çok fazla olan bölgeler"],
        ["Tahmini bitişe göre ata", "Düşük", "Düşük", "Karma menüler — önerilen yaklaşım"],
      ],
    },
    {
      tur: "h2",
      metin: "Paketleme: en küçük yatırımın en yüksek getirisi",
    },
    {
      tur: "p",
      metin:
        "Eksik ürün, restoranların aldığı olumsuz yorumlarda soğuk yemekten sonra en sık " +
        "görülen gerekçedir ve neredeyse tamamı paketleme adımında oluşur. Buna karşılık " +
        "çözümü şaşırtıcı derecede ucuzdur: paketleme ekranında sipariş kalemlerini tek tek " +
        "onaylatmak. Fiziksel bir kontrol adımını dijital bir onaya bağlamak, hem hatayı " +
        "azaltır hem de hatanın nerede oluştuğunu ölçülebilir kılar.",
    },
    {
      tur: "liste",
      maddeler: [
        "Her kalem paketlenirken ekranda işaretlenir; eksik işaretle sipariş kapatılamaz.",
        "Sos, çatal-kaşık ve içecek gibi \"unutulan kalemler\" ayrı kontrol satırı olarak durur.",
        "Poşete basılan etikette sipariş numarası ve kalem sayısı bulunur; kurye tesliminde eşleşme kontrolü yapılır.",
        "Eksik ürün şikâyeti geldiğinde hangi personelin hangi adımda onay verdiği kayıtlıdır — suçlama için değil, eğitim için.",
      ],
    },
    {
      tur: "h2",
      metin: "Menü ve stok senkronu: iptallerin sessiz kaynağı",
    },
    {
      tur: "p",
      metin:
        "Tükenen bir ürünün satışta kalması, müşteri açısından en can sıkıcı deneyimlerden " +
        "biridir: sipariş verilir, para çekilir, sonra restoran arayıp ürünün olmadığını " +
        "söyler. Bu noktada iptal edilen sipariş yalnızca o günün cirosunu değil, müşterinin " +
        "geri gelme olasılığını da düşürür.",
    },
    {
      tur: "p",
      metin:
        "Otomasyon burada gösterişsiz ama etkilidir: mutfak ekranından tek dokunuşla " +
        "kapatılan ürün, aynı saniyede tüm satış kanallarında görünmez olur ve tanımlı saatte " +
        "otomatik geri açılır. Kritik nokta, kapatma işleminin mutfakta çalışan kişinin " +
        "elinin altında olmasıdır. Ürünü kapatmak için yöneticiyi beklemek gerekiyorsa, " +
        "pratikte hiç kapatılmaz.",
    },
    {
      tur: "h2",
      metin: "Hangi adım otomasyona uygun değil?",
    },
    {
      tur: "p",
      metin:
        "Otomasyon rehberlerinin çoğu her şeyin otomatikleştirilebileceğini varsayar. Sahada " +
        "durum böyle değildir ve bunu kabul etmek projeyi kurtarır. İnsan kararı gerektiren " +
        "adımları zorla otomatikleştirmek, personelin sistemi baypas etmesine yol açar — " +
        "bu da tüm veriyi güvenilmez hâle getirir.",
    },
    {
      tur: "liste",
      maddeler: [
        "İstisnai müşteri şikâyetlerinin çözümü: jest kararı (indirim, ikram, iade) insana ait olmalı, sistem yalnızca öneri sunmalı.",
        "Kalite kontrolü: bir ürünün servis edilebilir olup olmadığına ekran karar veremez.",
        "Yoğunluk anında menü kısıtlaması: hangi kalemin geçici olarak kapatılacağı mutfağın o anki gerçekliğine bağlıdır.",
        "Yeni personelin sıralama eğitimi: sistem sıralamayı önerir, ama neden o sıra olduğunu anlatmak yöneticinin işidir.",
      ],
    },
    {
      tur: "h2",
      metin: "Yatırım nereden geri döner?",
    },
    {
      tur: "p",
      metin:
        "Otomasyonun geri dönüşü genellikle \"personel azaltma\" olarak sunulur; sahada asıl " +
        "kaynak farklıdır. Kazanç üç kalemde toplanır: teslim süresinin kısalmasıyla artan " +
        "sipariş kapasitesi, hata ve iptal kaynaklı kayıpların azalması, ve aynı personelle " +
        "daha fazla siparişin karşılanabilmesi. Aşağıdaki değerler Ne Yersin? altyapısını " +
        "kullanan işletmelerin ortalama iyileşme aralıklarıdır.",
    },
    {
      tur: "sayilar",
      ogeler: [
        { deger: "%18", etiket: "ortalama teslim süresinde kısalma" },
        { deger: "%42", etiket: "eksik ürün şikâyetinde azalma" },
        { deger: "%11", etiket: "aynı personelle karşılanan ek sipariş" },
      ],
    },
    {
      tur: "h2",
      metin: "Nereden başlamalı?",
    },
    {
      tur: "p",
      metin:
        "Bütün adımları aynı anda değiştirmeye çalışmak, otomasyon projelerinin en bilinen " +
        "başarısızlık nedenidir. Bunun yerine sırayı kazanca göre kurmak gerekir: önce " +
        "ölçüm, sonra en çok kayıp üreten adım. Pratikte işleyen sıra genellikle şudur.",
    },
    {
      tur: "adimlar",
      ogeler: [
        {
          baslik: "Hafta 1–2: Ölç",
          metin:
            "Sipariş kabulünden çıkışa kadar geçen süreyi ve gecikme oranını mevcut sistemle " +
            "kaydedin. Karşılaştırma noktası olmadan hiçbir iyileşme kanıtlanamaz.",
        },
        {
          baslik: "Hafta 3–4: Tek kuyruk ve mutfak ekranı",
          metin:
            "Kanalları birleştirin, kağıt fişi kaldırın. Bu adım tek başına gecikme oranında " +
            "en büyük düşüşü sağlar.",
        },
        {
          baslik: "Hafta 5–6: Paketleme kontrolü",
          metin:
            "Eksik ürün şikâyetlerini hedefleyin. Yatırımı en düşük, etkisi en görünür adım " +
            "budur.",
        },
        {
          baslik: "Hafta 7–8: Dinamik süre ve kurye ataması",
          metin:
            "Artık elinizde yeterli geçmiş veri olduğu için süre tahmini anlamlı çalışır; " +
            "kurye atamasını bu tahmine bağlayın.",
        },
        {
          baslik: "Sonrası: Raporla ve dar boğazı kovala",
          metin:
            "Haftalık gecikme ve iptal nedenlerini gözden geçirin. Otomasyon bir kurulum " +
            "değil, sürekli daralan bir dar boğaz takibidir.",
        },
      ],
    },
    {
      tur: "p",
      metin:
        "Özetle: restoran otomasyonu yazılım satın almakla başlamaz, siparişin yolculuğunu " +
        "dürüstçe yazmakla başlar. Kopma noktaları bir kez görünür hâle geldiğinde hangi " +
        "adımın otomasyona ihtiyacı olduğu kendiliğinden ortaya çıkar — ve genellikle o adım, " +
        "başta tahmin edilenden çok daha sıradan bir yerde durur.",
    },
  ],
};
