import type { Yazi } from "../tipler";

export const dinamikTeslimatUcreti: Yazi = {
  slug: "dinamik-teslimat-ucreti",
  baslik: "Dinamik Teslimat Ücreti ve Kampanya Motoru Nasıl Kurulur?",
  ozet:
    "Sabit teslimat ücreti yakın siparişte müşteriyi kaçırır, uzak siparişte zarar ettirir. " +
    "Mesafe, yoğunluk, sepet tutarı ve hava koşullarını birlikte değerlendiren bir " +
    "fiyatlandırma motorunu adım adım kuruyoruz — kampanya kurallarıyla çatışmadan.",
  kategori: "Ürün & Fiyatlandırma",
  etiketler: ["fiyatlandırma", "teslimat ücreti", "kampanya", "birim ekonomi"],
  tarih: "2026-05-22",
  okumaDk: 12,
  yazar: { ad: "Ne Yersin? Ürün Ekibi", unvan: "Fiyatlandırma ve Büyüme" },
  kapak: "blog/dinamik-teslimat-ucreti-kapak",
  bloklar: [
    {
      tur: "p",
      metin:
        "Teslimat ücreti, platform ekonomisinde en çok basitleştirilen kalemdir. Tek bir sayı " +
        "belirlenir ve herkese uygulanır. Sorun şu ki bu sayı iki yönlü olarak yanlıştır: " +
        "500 metre ötedeki müşteri için gereğinden pahalı olduğu için sipariş kaybettirir, " +
        "6 kilometre ötedeki müşteri için gereğinden ucuz olduğu için her siparişte zarar " +
        "yazdırır. Dinamik teslimat ücreti bu iki ucu birlikte düzeltmeyi hedefler; ancak " +
        "yanlış kurulduğunda müşteride güven kaybı yaratma potansiyeli de yüksektir.",
    },
    {
      tur: "h2",
      metin: "Önce maliyeti bilmek: bir teslimat gerçekte ne kadar tutuyor?",
    },
    {
      tur: "p",
      metin:
        "Fiyatlandırma tartışmasına maliyet bilinmeden girilemez. Bir teslimatın maliyeti tek " +
        "bir kalem değildir ve mesafeyle doğrusal artmaz. Gerçek maliyet en az beş " +
        "bileşenden oluşur.",
    },
    {
      tur: "tablo",
      basliklar: ["Bileşen", "Davranışı", "Not"],
      satirlar: [
        ["Kurye zamanı", "Süreyle artar", "Mesafeden çok trafiğe ve bina içi süreye bağlı"],
        ["Yakıt / enerji", "Mesafeyle artar", "Toplam maliyette sanılandan küçük pay"],
        ["Mutfakta bekleme", "Atama zamanlamasına bağlı", "Kötü atama, maliyeti sessizce büyütür"],
        ["Boş dönüş", "Bölge yoğunluğuna bağlı", "Seyrek bölgelerde en büyük gizli kalem"],
        ["Başarısız teslimat", "Olasılıksal", "Adres kalitesi ve iletişimle azalır"],
      ],
    },
    {
      tur: "p",
      metin:
        "Bu tablodaki en öğretici satır \"boş dönüş\"tür. Yoğun bir mahallede kurye teslimat " +
        "sonrası hemen yeni siparişe başlar; seyrek bir bölgede ise merkeze dönmek zorunda " +
        "kalır ve bu süre hiçbir siparişe faturalanamaz. Bu yüzden teslimat maliyeti mesafenin " +
        "değil, bölgesel sipariş yoğunluğunun fonksiyonudur.",
    },
    {
      tur: "bilgi",
      baslik: "Anahtar içgörü",
      metin:
        "İki müşteri restorandan aynı mesafede olabilir ama biri yoğun bir mahallede, diğeri " +
        "seyrek bir bölgede oturuyorsa maliyetleri belirgin biçimde farklıdır. Yalnızca " +
        "mesafeye dayanan ücret modelleri bu farkı hiç göremez.",
    },
    {
      tur: "h2",
      metin: "Modelin girdileri: hangi değişken hangi ağırlıkta?",
    },
    {
      tur: "p",
      metin:
        "Dinamik ücret modelini kurarken en büyük tehlike, girdiyi çoğaltmaktır. On beş " +
        "değişkenli bir model teoride hassastır, pratikte açıklanamaz hâle gelir ve müşteri " +
        "güvenini kaybeder. Sahada dört girdi işin büyük kısmını çözer.",
    },
    {
      tur: "adimlar",
      ogeler: [
        {
          baslik: "Mesafe kademesi",
          metin:
            "Sürekli bir formül yerine kademe kullanın: 0–2 km, 2–4 km, 4–7 km gibi. Kademe, " +
            "müşteriye açıklanabilir olduğu için itiraz üretmez.",
        },
        {
          baslik: "Bölge yoğunluğu çarpanı",
          metin:
            "Bölgenin geçmiş sipariş yoğunluğuna göre 0,9–1,3 aralığında bir çarpan. Bu, boş " +
            "dönüş maliyetini fiyata yansıtan bileşendir.",
        },
        {
          baslik: "Anlık arz/talep dengesi",
          metin:
            "Bekleyen sipariş sayısının müsait kurye sayısına oranı. Yalnızca yukarı değil " +
            "aşağı da çalışmalı: kurye fazlaysa ücret düşer.",
        },
        {
          baslik: "Sepet tutarı eşikleri",
          metin:
            "Belirli tutarın üzerinde ücretin kademeli düşmesi. Bu, hem sepet büyütür hem de " +
            "birim başına teslimat maliyetini seyreltir.",
        },
      ],
    },
    {
      tur: "p",
      metin:
        "Hava durumu beşinci bir girdi olarak eklenebilir ama dikkatli olmak gerekir. Yağışta " +
        "ücretin artması operasyonel olarak doğrudur — kurye arzı düşer, süreler uzar. " +
        "Müşteri tarafında ise bu artış kolayca \"kötü havada fırsatçılık\" olarak okunur. " +
        "Uygulanabilir çözüm, artışı müşteriye değil kurye primine yansıtmak ve farkı platform " +
        "payından karşılamaktır.",
    },
    {
      tur: "h2",
      metin: "Şeffaflık olmadan dinamik fiyat çalışmaz",
    },
    {
      tur: "p",
      metin:
        "Dinamik fiyatlandırmanın başarısızlık nedenlerinin başında matematik değil iletişim " +
        "gelir. Aynı restorandan dün 15 TL, bugün 24 TL teslimat ücreti gören müşteri, " +
        "sistemin bozuk veya kendisinin kandırıldığını düşünür. Bu algı, ücretin doğru " +
        "hesaplanmış olmasından bağımsız olarak sipariş kaybettirir.",
    },
    {
      tur: "liste",
      maddeler: [
        "Ödeme ekranında ücret dökümü gösterilir: temel ücret, mesafe kademesi, yoğunluk durumu, indirimler.",
        "Artış nedeni tek cümleyle açıklanır: \"şu anda bölgende sipariş yoğunluğu yüksek\".",
        "Ücretin düşeceği eşik gösterilir: \"sepetine 40 TL daha eklersen teslimat ücretsiz\".",
        "Üst sınır tanımlanır ve iletilir; sınırsız artan bir ücret hiçbir açıklamayla kabul görmez.",
        "Fiyat, sepete ürün eklendikçe değil yalnızca tanımlı eşiklerde değişir — her tıklamada oynayan fiyat güven kırar.",
      ],
    },
    {
      tur: "gorsel",
      anahtar: "blog/dinamik-teslimat-ucreti-icerik",
      altyazi:
        "Ücret dökümünün ödeme ekranında açıkça gösterilmesi, dinamik fiyatlandırmaya karşı " +
        "en etkili itiraz azaltıcıdır.",
    },
    {
      tur: "h2",
      metin: "Kampanya motoru: kuralların çatışmasını yönetmek",
    },
    {
      tur: "p",
      metin:
        "Teslimat ücreti tek başına durmaz; kampanyalarla aynı sepette buluşur. \"İlk " +
        "siparişte 60 TL indirim\", \"ücretsiz teslimat rozeti\", \"iki alana bir bedava\" ve " +
        "\"200 TL üzeri kargo bedava\" aynı anda geçerli olduğunda hangisinin uygulanacağı " +
        "belirsizse sonuç ya müşteri şikâyeti ya beklenmedik zarar olur.",
    },
    {
      tur: "p",
      metin:
        "Bu yüzden kampanya motoru, indirim listesi değil bir öncelik ve birleşebilirlik " +
        "modeli olarak tasarlanmalıdır. Her kampanya için üç özelliğin tanımlanması gerekir: " +
        "uygulama sırası, başka kampanyalarla birleşebilir mi, ve hangi tutar üzerinden " +
        "hesaplanır.",
    },
    {
      tur: "tablo",
      basliklar: ["Kampanya tipi", "Uygulama sırası", "Birleşebilir mi", "Hesap tabanı"],
      satirlar: [
        ["Ürün bazlı indirim (2 al 1 öde)", "1", "Evet", "Kalem tutarı"],
        ["Sepet yüzde indirimi", "2", "Kısıtlı", "İndirimli kalem toplamı"],
        ["Kupon (tutar indirimi)", "3", "Kısıtlı", "Sepet ara toplamı"],
        ["Ücretsiz teslimat", "4", "Evet", "Teslimat ücreti kalemi"],
        ["Cüzdan/puan kullanımı", "5", "Evet", "Genel toplam"],
      ],
    },
    {
      tur: "p",
      metin:
        "Sıranın önemi bir örnekle netleşir: %20 sepet indirimi ile 60 TL kupon birlikte " +
        "kullanıldığında, kuponun indirimden önce mi sonra mı uygulandığı nihai tutarı " +
        "değiştirir. Bu kural sistemde açıkça tanımlanmazsa her geliştirici farklı " +
        "varsayımla kod yazar ve tutarsızlık kaçınılmaz olur.",
    },
    {
      tur: "bilgi",
      baslik: "Zarar koruması (guardrail)",
      metin:
        "Kampanya motoruna mutlaka bir alt sınır kontrolü ekleyin: tüm indirimler " +
        "uygulandıktan sonra platform payı ve teslimat maliyeti karşılanamıyorsa sipariş " +
        "onaylanmadan önce kural devreye girer. Bu kontrol olmadan iyi niyetli iki kampanyanın " +
        "üst üste gelmesi doğrudan zarar üretir.",
    },
    {
      tur: "h2",
      metin: "Nasıl test edilir: A/B olmadan yayına alma",
    },
    {
      tur: "p",
      metin:
        "Fiyatlandırma değişiklikleri, etkisini yalnızca dönüşüm oranında değil sepet " +
        "tutarında, sipariş sıklığında ve iptal oranında da gösterir. Bu yüzden tek metriğe " +
        "bakan bir test yanıltıcıdır: dönüşüm düşerken sepet tutarı arttığı için toplam kâr " +
        "yükselmiş olabilir.",
    },
    {
      tur: "liste",
      sirali: true,
      maddeler: [
        "Bölge bazlı kademeli açılım: modeli tek bir ilçede açın, benzer bir ilçeyi kontrol grubu olarak bırakın.",
        "En az iki hafta bekleyin: hafta içi/hafta sonu ve maaş dönemi etkilerini görmek için gerekli minimum süre.",
        "Metrik setini birlikte izleyin: dönüşüm, ortalama sepet, sipariş başına katkı, iptal oranı, tekrar sipariş oranı.",
        "Müşteri destek taleplerini kodlayarak sayın: \"teslimat ücreti\" gerekçeli talep sayısı en hızlı uyarı sinyalidir.",
        "Geri alma planı hazır olsun: modeli tek anahtarla eski sabit ücrete döndürebilmek zorunludur.",
      ],
    },
    {
      tur: "sayilar",
      ogeler: [
        { deger: "4", etiket: "modelde yeterli olan girdi sayısı" },
        { deger: "2 hafta", etiket: "anlamlı test için minimum süre" },
        { deger: "5", etiket: "birlikte izlenmesi gereken metrik" },
      ],
    },
    {
      tur: "alinti",
      metin:
        "Dinamik fiyatlandırmada asıl ürün fiyat değil, fiyatın açıklanabilirliğidir.",
    },
    {
      tur: "p",
      metin:
        "Kapanışta pratik bir öneri: modeli kurmaya mesafe kademeleri ve sepet eşikleriyle " +
        "başlayın, yoğunluk çarpanını ancak elinizde bölge bazlı en az iki aylık veri " +
        "olduğunda ekleyin. Anlık arz/talep bileşeni ise en son gelmeli — çünkü en çok " +
        "açıklama gerektiren ve en hızlı güven kaybettirebilen bileşen odur.",
    },
  ],
};
