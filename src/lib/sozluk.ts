import type { Dil } from "./dil";

/**
 * SÖZLÜK — sitenin bütün arayüz metinleri.
 *
 * Tek dosyada duruyor ki bir metnin İngilizcesi var mı, tek bakışta
 * görülebilsin; dağıtılmış çeviri dosyalarında bir yerin çevrilmediği
 * ancak turist müşteri o sayfada takılınca anlaşılıyor.
 *
 * KURAL: yeni bir arayüz metni eklerken İngilizcesi de aynı anda buraya
 * yazılır. Anahtar yoksa Türkçesi gösterilir — sayfa asla boş kalmaz ama
 * eksik çeviri de gizlenmez.
 *
 * Anahtar biçimi: `alan.parca` (ör. `sepet.bos`). Değişkenli metinlerde
 * `{ad}` yer tutucusu kullanılıyor.
 */
export const sozluk: Record<string, Record<Dil, string>> = {
  /* ── Genel ── */
  "genel.yukleniyor": { tr: "Yükleniyor…", en: "Loading…" },
  "genel.kapat": { tr: "Kapat", en: "Close" },
  "genel.vazgec": { tr: "Vazgeç", en: "Cancel" },
  "genel.kaydet": { tr: "Kaydet", en: "Save" },
  "genel.sil": { tr: "Sil", en: "Delete" },
  "genel.duzenle": { tr: "Düzenle", en: "Edit" },
  "genel.geri": { tr: "Geri", en: "Back" },
  "genel.devam": { tr: "Devam et", en: "Continue" },
  "genel.tumunuGor": { tr: "Tümünü gör", en: "See all" },
  "genel.detay": { tr: "Detay", en: "Details" },
  "genel.ara": { tr: "Ara", en: "Search" },
  "genel.evet": { tr: "Evet", en: "Yes" },
  "genel.hayir": { tr: "Hayır", en: "No" },
  "genel.zorunlu": { tr: "Zorunlu", en: "Required" },
  "genel.istegeBagli": { tr: "İsteğe bağlı", en: "Optional" },
  "genel.hata": { tr: "Bir şeyler ters gitti.", en: "Something went wrong." },
  "genel.icerigeGec": { tr: "İçeriğe geç", en: "Skip to content" },

  /* ── Başlık / menü ── */
  "menu.anasayfa": { tr: "Ana sayfa", en: "Home" },
  "menu.restoranlar": { tr: "Restoranlar", en: "Restaurants" },
  "menu.seflerinElinden": { tr: "Şeflerin Elinden", en: "From Our Chefs" },
  "menu.kampanyalar": { tr: "Kampanyalar", en: "Deals" },
  "menu.nasilCalisir": { tr: "Nasıl çalışır", en: "How it works" },
  "menu.iletisim": { tr: "İletişim", en: "Contact" },
  "menu.destek": { tr: "Destek", en: "Support" },
  "menu.hesabim": { tr: "Hesabım", en: "My account" },
  "menu.girisYap": { tr: "Giriş yap", en: "Sign in" },
  "menu.hesapOlustur": { tr: "Hesap oluştur", en: "Sign up" },
  "menu.cikisYap": { tr: "Çıkış yap", en: "Sign out" },
  "menu.siparislerim": { tr: "Siparişlerim", en: "My orders" },
  "menu.anaMenu": { tr: "Ana menü", en: "Main menu" },
  "menu.mobilMenu": { tr: "Mobil ana menü", en: "Mobile main menu" },
  "menu.menuyuAc": { tr: "Menüyü aç", en: "Open menu" },
  "menu.menuyuKapat": { tr: "Menüyü kapat", en: "Close menu" },

  /* ── Dil değiştirici ── */
  "dil.secim": { tr: "Dil", en: "Language" },
  "dil.turkce": { tr: "Türkçe", en: "Turkish" },
  "dil.ingilizce": { tr: "İngilizce", en: "English" },
  "dil.degistir": { tr: "Dili değiştir", en: "Change language" },

  /* ── Sepet ── */
  "sepet.baslik": { tr: "Sepetim", en: "My cart" },
  "sepet.bos": { tr: "Sepetin boş", en: "Your cart is empty" },
  "sepet.bosAciklama": {
    tr: "Beğendiğin bir yemeği sepete ekle, buradan devam edelim.",
    en: "Add a dish you like to your cart and we'll continue from here.",
  },
  "sepet.ekle": { tr: "Sepete ekle", en: "Add to cart" },
  "sepet.eklendi": { tr: "Sepete eklendi", en: "Added to cart" },
  "sepet.cikar": { tr: "Çıkar", en: "Remove" },
  "sepet.adet": { tr: "Adet", en: "Qty" },
  "sepet.araToplam": { tr: "Ara toplam", en: "Subtotal" },
  "sepet.teslimatUcreti": { tr: "Teslimat ücreti", en: "Delivery fee" },
  "sepet.toplam": { tr: "Toplam", en: "Total" },
  "sepet.odemeyeGec": { tr: "Ödemeye geç", en: "Go to checkout" },
  "sepet.alisverisiSurdur": { tr: "Alışverişe devam et", en: "Keep shopping" },
  "sepet.sepetiAc": { tr: "Sepeti aç", en: "Open cart" },

  /* ── Ürün / menü ── */
  "urun.fiyatYakinda": { tr: "Fiyat yakında", en: "Price coming soon" },
  "urun.menudeDegil": { tr: "Menüde değil", en: "Not on the menu" },
  "urun.tukendi": { tr: "Tükendi", en: "Sold out" },
  "urun.aciklama": { tr: "Açıklama", en: "Description" },
  "urun.porsiyon": { tr: "Porsiyon", en: "Portion" },

  /* ── Anket ── */
  "anket.ustBaslik": { tr: "Kısa anket", en: "Quick poll" },
  "anket.ilkOyuSenVer": { tr: "İlk oyu sen ver", en: "Be the first to vote" },
  "anket.kisiOyVerdi": { tr: "{sayi} kişi oy verdi", en: "{sayi} people voted" },
  "anket.seninOyun": { tr: "senin oyun", en: "your vote" },

  /* ── Kampanyalar ── */
  "kampanya.ustBaslik": { tr: "Fırsatlar", en: "Deals" },
  "kampanya.baslik": { tr: "Bu haftanın kampanyaları", en: "This week's deals" },
  "kampanya.aciklama": {
    tr: "Karta dokun, kodu kopyala — ödeme adımında yapıştır, indirim otomatik uygulanır.",
    en: "Tap a card to copy the code — paste it at checkout and the discount applies automatically.",
  },
  "kampanya.kopyalandi": { tr: "Kopyalandı ✓", en: "Copied ✓" },
  "kampanya.yalnizca": { tr: "Yalnızca {gunler}", en: "Only on {gunler}" },

  /* ── Hesap ── */
  "hesap.girisYap": { tr: "Giriş yap", en: "Sign in" },
  "hesap.kayitOl": { tr: "Hesap oluştur", en: "Create account" },
  "hesap.eposta": { tr: "E-posta", en: "Email" },
  "hesap.parola": { tr: "Parola", en: "Password" },
  "hesap.parolaTekrar": { tr: "Parola (tekrar)", en: "Password (again)" },
  "hesap.adSoyad": { tr: "Ad soyad", en: "Full name" },
  "hesap.telefon": { tr: "Telefon", en: "Phone" },
  "hesap.parolamiUnuttum": { tr: "Parolamı unuttum", en: "Forgot my password" },
  "hesap.dogrulamaKodu": { tr: "Doğrulama kodu", en: "Verification code" },
  "hesap.kodGonder": { tr: "Kod gönder", en: "Send code" },
  "hesap.googleIleDevam": { tr: "Google ile devam et", en: "Continue with Google" },
  "hesap.veya": { tr: "veya", en: "or" },
  "hesap.hesabinVarMi": { tr: "Zaten hesabın var mı?", en: "Already have an account?" },
  "hesap.hesabinYokMu": { tr: "Hesabın yok mu?", en: "Don't have an account?" },
  "hesap.parolaZayif": {
    tr: "Bu parola daha önce sızmış parola listelerinde görüldü. Başka bir parola seç.",
    en: "This password has appeared in known data breaches. Please choose another one.",
  },

  /* ── Sipariş ── */
  "siparis.durumu": { tr: "Sipariş durumu", en: "Order status" },
  "siparis.no": { tr: "Sipariş no", en: "Order no" },
  "siparis.odemeBekliyor": { tr: "Ödeme bekleniyor", en: "Awaiting payment" },
  "siparis.hazirlaniyor": { tr: "Hazırlanıyor", en: "Being prepared" },
  "siparis.hazir": { tr: "Hazır", en: "Ready" },
  "siparis.yolda": { tr: "Yolda", en: "On the way" },
  "siparis.teslimEdildi": { tr: "Teslim edildi", en: "Delivered" },
  "siparis.iptal": { tr: "İptal", en: "Cancelled" },
  "siparis.odemeBasarisiz": { tr: "Ödeme başarısız", en: "Payment failed" },
  "siparis.teslimatAdresi": { tr: "Teslimat adresi", en: "Delivery address" },
  "siparis.siparisVer": { tr: "Siparişi tamamla", en: "Place order" },
  "siparis.bosListe": { tr: "Henüz siparişin yok.", en: "You have no orders yet." },

  /* ── Yorumlar ── */
  "yorum.baslik": { tr: "Yorumlar", en: "Reviews" },
  "yorum.yaz": { tr: "Yorum yaz", en: "Write a review" },
  "yorum.yok": { tr: "Henüz yorum yok.", en: "No reviews yet." },
  "yorum.cevapla": { tr: "Cevapla", en: "Reply" },
  "yorum.cevabi": { tr: "Mutfağın cevabı", en: "Reply from the kitchen" },
  "yorum.puan": { tr: "Puan", en: "Rating" },

  /* ── Arama ── */
  "arama.yerTutucu": {
    tr: "Şef, restoran veya yemek ara",
    en: "Search for a chef, restaurant or dish",
  },
  "arama.sonucYok": { tr: "Sonuç bulunamadı.", en: "No results found." },
  "arama.sonuc": { tr: "{sayi} sonuç", en: "{sayi} results" },

  /* ── Altbilgi ── */
  "altbilgi.hakkimizda": { tr: "Hakkımızda", en: "About us" },
  "altbilgi.kurumsal": { tr: "Kurumsal", en: "Company" },
  "altbilgi.yardim": { tr: "Yardım", en: "Help" },
  "altbilgi.haklariSakli": { tr: "Tüm hakları saklıdır.", en: "All rights reserved." },
  "altbilgi.bizeUlas": { tr: "Bize ulaş", en: "Get in touch" },

  /* ── Başvuru / kurye / restoran ── */
  "basvuru.kurye": { tr: "Kurye ol", en: "Become a courier" },
  "basvuru.restoran": { tr: "Restoranını ekle", en: "Add your restaurant" },
  "basvuru.evHanimi": { tr: "Mutfağını aç", en: "Open your kitchen" },
  "basvuru.gonder": { tr: "Başvuruyu gönder", en: "Submit application" },
  "basvuru.tumAlanlar": {
    tr: "Başvurunun değerlendirilebilmesi için bütün alanların doldurulması gerekiyor.",
    en: "All fields must be filled in for your application to be reviewed.",
  },

  /* ── Altbilgi metinleri ── */
  "altbilgi.aciklama": { tr: "Ne Yersin? sipariş, mutfak, kurye ve teslimat takibini tek sistemde birleştirir. Restoranlar için panel, kuryeler için mobil uygulama, müşteriler için canlı takip. Teslimat bölgesi: İstanbul / Beylikdüzü.", en: "Ne Yersin? brings ordering, the kitchen, couriers and delivery tracking together in one system. A dashboard for restaurants, a mobile app for couriers, live tracking for customers. Delivery area: Istanbul / Beylikdüzü." },
  "altbilgi.logoAlt": { tr: "Ne Yersin? logosu", en: "Ne Yersin? logo" },
  "altbilgi.ilceBaslik": { tr: "İstanbul ilçelerine yemek siparişi", en: "Food delivery to Istanbul districts" },
  "altbilgi.ilceSiparis": { tr: "{ilce} yemek siparişi", en: "food delivery in {ilce}" },
  "altbilgi.hizmetYok": { tr: "— henüz hizmet yok", en: "— not served yet" },
  "altbilgi.mutfaklaraGore": { tr: "Mutfaklara göre", en: "By cuisine" },

  /* ── Ana sayfa: giriş seçimi ve duyurular ── */
  "girisSecimi.baslik": { tr: "Bugün nereden yersin?", en: "Where are you eating from today?" },
  "girisSecimi.aciklama": { tr: "İstediğini seç — sonra üstteki sekmelerden diğerine tek tıkla geçebilirsin.", en: "Pick one — you can switch to the other from the tabs above at any time." },
  "girisSecimi.sefBaslik": { tr: "Şeflerin Elinden", en: "From Our Chefs" },
  "girisSecimi.sefAciklama": { tr: "Kendi mutfağından pişiren ev hanımları ve şefler. Dükkân kirası yok, o fark fiyata binmiyor.", en: "Home cooks and chefs cooking in their own kitchens. No shop rent, so that cost never reaches the price." },
  "girisSecimi.isletmeBaslik": { tr: "İşletmeler", en: "Businesses" },
  "girisSecimi.isletmeAciklama": { tr: "Burger, pizza, döner, kebap… Canın dışarıdan bir şey çekiyorsa restoranlar da burada.", en: "Burgers, pizza, doner, kebab… If you're craving something from a restaurant, they're here too." },
  "girisSecimi.hepsi": { tr: "Hepsini birlikte göster", en: "Show everything together" },
  "duyuru.kuryeTakibi": { tr: "Yeni: canlı kurye takibi Beylikdüzü'nde aktif", en: "New: live courier tracking is active in Beylikdüzü" },
  "duyuru.ucretsizTeslimat": { tr: "Beylikdüzü'nde tüm restoranlarda ücretsiz teslimat", en: "Free delivery from every restaurant in Beylikdüzü" },
  "duyuru.ilkSiparis": { tr: "İlk siparişe 60 TL indirim — kod: MERHABA60", en: "60 TL off your first order — code: MERHABA60" },
  "duyuru.sepetIndirimi": { tr: "600 TL üzeri sepette 100 TL indirim — kod: SEPET100", en: "100 TL off carts over 600 TL — code: SEPET100" },
  "duyuru.kapidaOdeme": { tr: "Kapıda ödeme: nakit veya IBAN'a havale", en: "Pay at the door: cash or bank transfer" },
  "duyuru.evYemegi": { tr: "Şeflerin elinden ev yemeği — Beylikdüzü'nde", en: "Home cooking from our chefs — in Beylikdüzü" },

  /* ── Kampanya kartları ve anket sürükleme ── */
  "kampanya.gecerliDegil": { tr: "{baslik} — bugün geçerli değil", en: "{baslik} — not valid today" },
  "kampanya.koduKopyala": { tr: "{baslik} — kupon kodunu kopyala", en: "{baslik} — copy the coupon code" },
  "kampanya.restoranlaraGit": { tr: "{baslik} — restoranlara git", en: "{baslik} — go to restaurants" },
  "anket.surukleyerekTasi": { tr: "Sürükleyerek taşı", en: "Drag to move" },
  "anket.geriyeAl": { tr: "Anketi bir kutu geriye al", en: "Move the poll one slot back" },
  "anket.ileriyeAl": { tr: "Anketi bir kutu ileriye al", en: "Move the poll one slot forward" },

  /* ── Sepet ── */
  "sepet.ucretsiz": { tr: "Ücretsiz", en: "Free" },
  "sepet.teslimat": { tr: "Teslimat", en: "Delivery" },
  "sepet.bosalt": { tr: "Sepeti boşalt", en: "Empty the cart" },
  "sepet.henuzBos": { tr: "Sepetin henüz boş", en: "Your cart is still empty" },
  "sepet.bosGozAt": { tr: "Bölgendeki restoranlara göz at, beğendiğin ürünleri sepete ekle.", en: "Browse the restaurants in your area and add what you like to your cart." },
  "sepet.restoranlaraGozAt": { tr: "Restoranlara göz at", en: "Browse restaurants" },
  "sepet.menuyeDon": { tr: "Menüye dön, ürün ekle", en: "Back to the menu, add something" },
  "sepet.menudenEkle": { tr: "Menüden ürün ekledikçe sepetin burada görünecek.", en: "As you add items from the menu, your cart will show up here." },
  "sepet.urunSayisi": { tr: "{sayi} ürün", en: "{sayi} items" },
  "sepet.ozetBaslik": { tr: "Sepetim, {sayi} ürün, {tutar}", en: "My cart, {sayi} items, {tutar}" },
  "sepet.bosEtiket": { tr: "Sepetim boş", en: "My cart is empty" },
  "sepet.adediAzalt": { tr: "{ad} adedini azalt", en: "Decrease quantity of {ad}" },
  "sepet.adediArtir": { tr: "{ad} adedini artır", en: "Increase quantity of {ad}" },
  "sepet.satiriKaldir": { tr: "{ad} ürününü sepetten çıkar", en: "Remove {ad} from the cart" },
  "sepet.ozellestir": { tr: "Özelleştir", en: "Customize" },
  "sepet.ekstraMalzeme": { tr: "Ekstra malzeme", en: "Extra toppings" },
  "sepet.icecekEkle": { tr: "İçecek eklemek ister misin?", en: "Would you like to add a drink?" },
  "sepet.sepetiDegistir": { tr: "Sepeti değiştir", en: "Replace the cart" },
  "sepet.farkliRestoran": { tr: "Sepetinde başka bir mutfaktan ürün var. Devam edersen sepetin bu mutfakla değişir.", en: "Your cart has items from another kitchen. If you continue, your cart will be replaced with this one." },

  /* ── Sepet çakışması ── */
  "sepet.catismaBaslik": { tr: "Sepetini değiştirelim mi?", en: "Shall we replace your cart?" },
  "sepet.catismaAciklama": { tr: "Sepetinde başka bir restorandan ürünler var. Aynı siparişte yalnızca tek restorandan ürün olabilir.", en: "Your cart has items from another restaurant. A single order can only contain items from one restaurant." },
  "sepet.catismaMetin": { tr: "Sepetinde {mutfak} siparişi duruyor. Devam edersen o sepet silinir ve {urun} ile yeni bir sepet başlatılır.", en: "Your cart currently holds an order from {mutfak}. If you continue, that cart is cleared and a new one starts with {urun}." },

  /* ── Ödeme akışı ── */
  "odeme.iletisimBilgileri": { tr: "İletişim bilgileri", en: "Contact details" },
  "odeme.teslimatAdresi": { tr: "Teslimat adresi", en: "Delivery address" },
  "odeme.odemeYontemi": { tr: "Ödeme yöntemi", en: "Payment method" },
  "odeme.yalnizcaBeylikduzu": { tr: "Yalnızca Beylikdüzü", en: "Beylikdüzü only" },
  "odeme.adSoyad": { tr: "Ad Soyad", en: "Full name" },
  "odeme.adSoyadYer": { tr: "Adınız ve soyadınız", en: "Your first and last name" },
  "odeme.telefon": { tr: "Telefon", en: "Phone" },
  "odeme.telefonIpucu": { tr: "Kurye bu numarayı arar", en: "Your courier will call this number" },
  "odeme.eposta": { tr: "E-posta", en: "Email" },
  "odeme.epostaIpucu": { tr: "Sipariş özeti buraya gider", en: "Your order summary goes here" },
  "odeme.ilce": { tr: "İlçe", en: "District" },
  "odeme.ilceSecin": { tr: "İlçe seçin", en: "Select a district" },
  "odeme.mahalle": { tr: "Mahalle", en: "Neighbourhood" },
  "odeme.mahalleYer": { tr: "Örn. Caferağa", en: "e.g. Caferağa" },
  "odeme.caddeSokak": { tr: "Cadde / Sokak", en: "Street" },
  "odeme.caddeYer": { tr: "Örn. Moda Caddesi, Güneş Sokak", en: "e.g. Moda Avenue, Güneş Street" },
  "odeme.binaNo": { tr: "Bina No", en: "Building no" },
  "odeme.daireNo": { tr: "Daire No", en: "Flat no" },
  "odeme.zorunluDegil": { tr: "Zorunlu değil", en: "Optional" },
  "odeme.adresTarifi": { tr: "Adres tarifi", en: "Directions" },
  "odeme.adresTarifiIpucu": { tr: "Zorunlu değil — kuryeye yardımcı olur", en: "Optional — helps your courier find you" },
  "odeme.adresTarifiYer": { tr: "Örn. eczanenin yanındaki apartman, zil çalışmıyor", en: "e.g. the building next to the pharmacy, the doorbell is broken" },
  "odeme.siparisNotu": { tr: "Sipariş notu", en: "Order note" },
  "odeme.siparisNotuYer": { tr: "Örn. sos ayrı gelsin, soğan olmasın", en: "e.g. sauce on the side, no onions" },
  "odeme.kartGuvenli": { tr: "Kart bilgilerin iyzico'nun güvenli sayfasında girilir, sunucularımıza", en: "Your card details are entered on iyzico's secure page, never reaching our" },
  "odeme.kartAcik": { tr: "Kartla önceden ödeyebilir ya da kapıda nakit/IBAN ile ödeyebilirsin.", en: "You can pay by card in advance, or pay at the door in cash or by bank transfer." },
  "odeme.kartKapali": { tr: "Kart ödemesi şu an kullanılamıyor; kapıda nakit veya IBAN ile ödeyebilirsin.", en: "Card payment is unavailable right now; you can pay at the door in cash or by bank transfer." },
  "odeme.formAlinamadi": { tr: "Ödeme formu alınamadı. Kapıda ödeme ile devam edebilirsin.", en: "The payment form could not be loaded. You can continue with payment at the door." },
  "odeme.yonlendiriliyor": { tr: "Güvenli ödemeye yönlendiriliyor…", en: "Redirecting to secure payment…" },
  "odeme.olusturuluyor": { tr: "Sipariş oluşturuluyor…", en: "Creating your order…" },
  "odeme.siparisiOlustur": { tr: "Siparişi oluştur", en: "Place the order" },
  "odeme.siparisOzeti": { tr: "Sipariş özeti", en: "Order summary" },
  "odeme.kaldir": { tr: "Kaldır", en: "Remove" },
  "odeme.uygula": { tr: "Uygula", en: "Apply" },
  "odeme.siparisNumarasi": { tr: "Sipariş numarası", en: "Order number" },
  "odeme.kopyalandi": { tr: "Kopyalandı ✓", en: "Copied ✓" },
  "odeme.kopyalamakIcin": { tr: "Kopyalamak için dokun", en: "Tap to copy" },
  "odeme.kapidaBilgiler": { tr: "Kapıda ödeme bilgileri", en: "Paying at the door" },
  "odeme.kapida1": { tr: "Siparişin hazırlanıyor; ödemeyi şimdi yapmana gerek yok.", en: "Your order is being prepared; there is no need to pay now." },
  "odeme.kapida2": { tr: "Kurye kapına geldiğinde nakit ödeyebilir ya da yukarıdaki IBAN'a havale yapabilirsin.", en: "When the courier arrives you can pay in cash, or transfer to the IBAN above." },
  "odeme.kapida3": { tr: "Havaleyi seçersen açıklama alanına yalnızca sipariş numaranı yaz ve dekontu kuryeye göster.", en: "If you transfer, put only your order number in the reference and show the receipt to the courier." },
  "odeme.siparisIcerigi": { tr: "Sipariş içeriği", en: "Order contents" },
  "odeme.yeniSiparis": { tr: "Yeni sipariş ver", en: "Place a new order" },
  "odeme.anaSayfayaDon": { tr: "Ana sayfaya dön", en: "Back to home" },

  /* ── Ana sayfa bölümleri ── */
  "hero.rozet": { tr: "Yemek ve Kurye Sistemi", en: "Food Delivery & Courier System" },
  "hero.vurgu": { tr: "Söyle", en: "Just say it" },
  "hero.baslikSonu": { tr: "gerisini biz halledelim.", en: "and we'll handle the rest." },
  "hero.aciklama": { tr: "Sipariş, mutfak, kurye ve teslimat takibi tek sistemde. Sen sadece ne yiyeceğine karar ver — sıcak, hızlı ve söz verdiğimiz dakikada kapında.", en: "Ordering, the kitchen, couriers and delivery tracking in one system. All you do is decide what to eat — hot, fast, and at your door the minute we promised." },
  "hero.guvenMutfak": { tr: "mutfak ve mağaza", en: "kitchens and shops" },
  "hero.guvenTeslimat": { tr: "teslimat ücreti", en: "delivery fee" },
  "hero.guvenIlce": { tr: "ilçe: Beylikdüzü", en: "district: Beylikdüzü" },
  "hero.guvenPuanlama": { tr: "puanlama başlığı", en: "rating criteria" },
  "hero.sicaklikHizTad": { tr: "Sıcaklık · Hız · Tad", en: "Heat · Speed · Taste" },
  "hero.kuryeYolda": { tr: "Kurye yolda", en: "Courier on the way" },
  "hero.ucretsizTeslimat": { tr: "Tüm siparişlerde ücretsiz teslimat", en: "Free delivery on every order" },
  "hero.kapidaOdeme": { tr: "Kapıda nakit veya havale", en: "Cash or bank transfer at the door" },
  "hero.canliTakip": { tr: "Canlı kurye takibi", en: "Live courier tracking" },
  "kategori.baslik": { tr: "Ne canın çekiyor?", en: "What are you craving?" },
  "restoran.tumRestoranlar": { tr: "Tüm restoranlar", en: "All restaurants" },
  "restoran.bolgeyeTeslimat": { tr: "{ilce} bölgesine teslimat yapanlar", en: "Delivering to {ilce}" },
  "restoran.bolgendeki": { tr: "Bölgendeki tüm restoranlar", en: "All restaurants in your area" },
  "restoran.filtreAciklama": { tr: "Puan, teslimat süresi, minimum sepet ve kampanyaya göre filtrele.", en: "Filter by rating, delivery time, minimum cart and deals." },
  "restoran.sirala": { tr: "Sırala", en: "Sort" },
  "restoran.filtreleriSifirla": { tr: "Filtreleri sıfırla", en: "Clear filters" },
  "restoran.baskaIlce": { tr: "Başka ilçe seç", en: "Choose another district" },
  "oneCikan.ustBaslik": { tr: "Popüler", en: "Popular" },
  "oneCikan.baslik": { tr: "Bu hafta öne çıkanlar", en: "This week's highlights" },
  "oneCikan.aciklama": { tr: "Puanı, teslimat süresi ve tekrar sipariş oranı en yüksek restoranlar.", en: "The restaurants with the best ratings, delivery times and repeat-order rates." },
  "nasil.ustBaslik": { tr: "Nasıl çalışır", en: "How it works" },
  "nasil.aciklama": { tr: "Sipariş girişinden teslime kadar her adım aynı akışta izlenir — kopan hiçbir halka yok.", en: "Every step from placing the order to delivery is tracked in the same flow — no broken links." },
  "rozet.ustBaslik": { tr: "Öne çıkanlar", en: "Highlights" },
  "rozet.baslik": { tr: "Mutfaklardan notlar", en: "Notes from the kitchens" },
  "rozet.aciklama": { tr: "Mutfak türü ve etiket gibi doğrulanabilir bilgilerden hesaplanır.", en: "Calculated from verifiable facts such as cuisine type and tags." },
  "ayinHanimlari.ustBaslik": { tr: "Ev Mutfağı", en: "Home Kitchen" },
  "ayinHanimlari.baslik": { tr: "Ayın Hanımları", en: "Cooks of the Month" },
  "ayinHanimlari.aciklama": { tr: "Kendi mutfağından, ev yapımı lezzetlerle katılan şeflerimiz.", en: "Our chefs cooking home-made food in their own kitchens." },
  "ayinHanimlari.evYapimi": { tr: "Ev Yapımı", en: "Home-made" },
  "sss.ustBaslik": { tr: "Sıkça sorulan sorular", en: "Frequently asked questions" },
  "sss.baslik": { tr: "Merak edilenler", en: "What people ask" },
  "sss.aciklama": { tr: "Aradığın cevabı bulamadıysan iletişim sayfasından bize yazabilirsin.", en: "If you can't find your answer, write to us from the contact page." },
  "ekranlar.ustBaslik": { tr: "Tek platform, üç rol", en: "One platform, three roles" },
  "ekranlar.aciklama": { tr: "Her rol yalnızca kendi işini görür; ama üçü aynı sipariş kaydı üzerinde çalışır.", en: "Each role sees only its own work, yet all three act on the same order record." },
  "evHanimi.aciklama": { tr: "Evinde pişirip satmak istiyorsan başvur, onaylandığın gün kendi adınla bir mutfak", en: "If you want to cook at home and sell, apply — the day you're approved you get a kitchen in your own name" },
  "evHanimi.basvuruYap": { tr: "Başvuru yap", en: "Apply now" },
  "evHanimi.nasilIsliyor": { tr: "Nasıl işliyor?", en: "How does it work?" },
  "mobil.aciklama1": { tr: "Sipariş vermek, takip etmek ve tekrar sipariş etmek için en hızlı yol.", en: "The fastest way to order, track and reorder." },
  "mobil.aciklama2": { tr: "Bildirimler açık olduğunda kuryenin kapına kaç dakika kaldığını sen sormadan öğrenirsin.", en: "With notifications on, you'll know how many minutes away your courier is without asking." },
  "mobil.karekod": { tr: "Kamerayı doğrult, uygulamayı indir", en: "Point your camera, download the app" },
  "teslimatTakibi.canli": { tr: "Canlı", en: "Live" },
  "teslimatTakibi.zamaninda": { tr: "Zamanında", en: "On time" },

  /* ── Restoran sayfası, yorumlar, arama, destek ── */
  "restoranSayfa.teslimat": { tr: "Teslimat", en: "Delivery" },
  "restoranSayfa.minSepet": { tr: "Min. sepet", en: "Min. cart" },
  "restoranSayfa.sertifikalar": { tr: "Sertifikalar", en: "Certificates" },
  "restoranSayfa.menuYok": { tr: "Bu restoranın menüsü henüz yüklenmedi.", en: "This restaurant's menu has not been added yet." },
  "restoranSayfa.menuKategorileri": { tr: "Menü kategorileri", en: "Menu categories" },
  "restoranSayfa.populer": { tr: "Popüler", en: "Popular" },
  "restoranSayfa.siparisYakinda": { tr: "Sipariş için yakında", en: "Available to order soon" },
  "restoranSayfa.teslimatBolgeleri": { tr: "Teslimat bölgeleri", en: "Delivery areas" },
  "restoranSayfa.digerRestoranlar": { tr: "Diğer restoranlara dön", en: "Back to other restaurants" },
  "yorum.degerlendirmeler": { tr: "Değerlendirmeler", en: "Reviews" },
  "yorum.yazabilmekIcin": { tr: "Değerlendirme yazabilmek için bu mutfaktan teslim edilmiş ve daha önce", en: "To write a review you need a delivered order from this kitchen that you have not" },
  "yorum.mutfaginCevabi": { tr: "Mutfağın cevabı", en: "Reply from the kitchen" },
  "yorum.sicaklik": { tr: "Sıcaklık", en: "Temperature" },
  "yorum.teslimatHizi": { tr: "Teslimat Hızı", en: "Delivery speed" },
  "yorum.yorumunYer": { tr: "Yorumun (isteğe bağlı)…", en: "Your review (optional)…" },
  "yorum.gonderiliyor": { tr: "Gönderiliyor…", en: "Sending…" },
  "yorum.degerlendirmeyiGonder": { tr: "Değerlendirmeyi gönder", en: "Submit review" },
  "yorum.cevabiDuzenle": { tr: "Cevabı düzenle", en: "Edit reply" },
  "yorum.musteriyeCevabin": { tr: "Müşteriye cevabın…", en: "Your reply to the customer…" },
  "yorum.cevabiYayinla": { tr: "Cevabı yayınla", en: "Publish reply" },
  "arama.teslimatAdresi": { tr: "Teslimat adresi", en: "Delivery address" },
  "arama.ilceSec": { tr: "İlçe seç", en: "Choose a district" },
  "arama.istanbulIlce": { tr: "İstanbul, {ilce}", en: "Istanbul, {ilce}" },
  "arama.buyukYerTutucu": { tr: "Şef, restoran veya yemek ara — örn. Makbule Şef", en: "Search for a chef, restaurant or dish — e.g. Makbule Şef" },
  "destek.sohbetiKapat": { tr: "Destek sohbetini kapat", en: "Close support chat" },
  "destek.canliDestek": { tr: "Canlı destek", en: "Live support" },
  "destek.adin": { tr: "Adın", en: "Your name" },
  "destek.siparisNo": { tr: "Sipariş numarası (varsa)", en: "Order number (if any)" },
  "destek.neOldu": { tr: "Ne oldu? Kısaca anlat…", en: "What happened? Tell us briefly…" },
  "destek.talebiGonder": { tr: "Talebi gönder", en: "Send request" },

  /* ── Değerlendirme eksenleri ── */
  "yorum.tad": { tr: "Tad", en: "Taste" },
  "yorum.yildizEtiketi": { tr: "5 üzerinden {puan}", en: "{puan} out of 5" },

  /* ── Hesap, giriş, kayıt, profil ── */
  "form.gonderiliyor": { tr: "Gönderiliyor…", en: "Sending…" },
  "form.dogrulaniyor": { tr: "Doğrulanıyor…", en: "Verifying…" },
  "form.degistiriliyor": { tr: "Değiştiriliyor…", en: "Changing…" },
  "form.dogrula": { tr: "Doğrula", en: "Verify" },
  "basvuru.telefonIpucu": { tr: "Seninle bu numaradan iletişime geçeceğiz.", en: "We'll contact you on this number." },
  "basvuru.epostaIpucu": { tr: "Onaylanırsa bu adresle giriş yapacaksın.", en: "If approved, you'll sign in with this address." },
  "basvuru.parolaIpucu": { tr: "En az 8 karakter. Başvurun onaylandığında bu parolayla giriş yaparsın.", en: "At least 8 characters. You'll sign in with this password once your application is approved." },
  "basvuru.aciklamaIpucu": { tr: "Zorunlu. Deneyimin, neler yaptığın, hangi semtte çalışacağın… (en az 30 karakter)", en: "Required. Your experience, what you cook, which neighbourhood you'll work in… (at least 30 characters)" },
  "basvuru.basvuruyuGonder": { tr: "Başvuruyu gönder", en: "Submit application" },
  "giris.epostaVeyaKullanici": { tr: "E-posta veya kullanıcı adı", en: "Email or username" },
  "giris.yapiliyor": { tr: "Giriş yapılıyor…", en: "Signing in…" },
  "giris.baslik": { tr: "Giriş Yap", en: "Sign In" },
  "giris.aciklama": { tr: "Hesabınla giriş yap.", en: "Sign in to your account." },
  "giris.googleKapali": { tr: "Google girişi şu an kullanılamıyor. E-posta ve parolanla girebilirsin.", en: "Google sign-in is unavailable right now. You can sign in with your email and password." },
  "giris.googleZamanAsimi": { tr: "Google girişi tamamlanamadı; istek zaman aşımına uğramış olabilir. Tekrar dene.", en: "Google sign-in could not be completed; the request may have timed out. Please try again." },
  "giris.googleDogrulama": { tr: "Google hesabın doğrulanamadı. Tekrar dene ya da parolanla gir.", en: "We could not verify your Google account. Try again or sign in with your password." },
  "giris.googleYonetici": { tr: "Google hesabınla giriş yapılamadı. E-posta ve parolanla girebilirsin.", en: "You could not be signed in with your Google account. Please use your email and password." },
  "giris.googleHesap": { tr: "Google hesabınla bir kayıt açılamadı. Destekle iletişime geç.", en: "We could not create an account from your Google profile. Please contact support." },
  "kayit.epostaIpucu": { tr: "Doğrulama kodu bu adrese gönderilecek.", en: "The verification code will be sent to this address." },
  "kayit.telefonIpucu": { tr: "İsteğe bağlı — sipariş formunda hazır gelir.", en: "Optional — it will be pre-filled in the order form." },
  "kayit.olusturuluyor": { tr: "Hesap oluşturuluyor…", en: "Creating your account…" },
  "kayit.dogrulaVeAc": { tr: "Doğrula ve hesabımı aç", en: "Verify and open my account" },
  "kod.yenidenGonder": { tr: "Kod gelmedi mi? Yeniden gönder", en: "Code didn't arrive? Send it again" },
  "parola.mevcut": { tr: "Mevcut parolan", en: "Your current password" },
  "parola.mevcutIpucu": { tr: "Güvenlik için parolanı doğruluyoruz.", en: "We verify your password for security." },
  "parola.degistir": { tr: "Parolamı değiştir", en: "Change my password" },
  "parola.kodGonder": { tr: "Doğrulama kodu gönder", en: "Send verification code" },
  "parola.adresimiDegistir": { tr: "Adresimi değiştir", en: "Change my address" },
  "parola.unuttumIpucu": { tr: "Hesabını açarken kullandığın adres.", en: "The address you used when you opened your account." },
  "parola.kodGonderildi": { tr: "{eposta} adresine gönderildi.", en: "Sent to {eposta}." },
  "profil.slogan": { tr: "Slogan", en: "Tagline" },
  "profil.sloganIpucu": { tr: "Profilinin en üstünde görünen tek cümle.", en: "The single line shown at the top of your profile." },
  "profil.sloganYer": { tr: "Örn. Annemin tarifleriyle, her gün taze", en: "e.g. My mother's recipes, fresh every day" },
  "profil.uzmanlik": { tr: "Uzmanlık", en: "Speciality" },
  "profil.uzmanlikIpucu": { tr: "Neyi en iyi yapıyorsun?", en: "What do you make best?" },
  "profil.uzmanlikYer": { tr: "Örn. El açması mantı, içli köfte ve ev usulü tatlılar", en: "e.g. Hand-rolled mantı, içli köfte and home-style desserts" },
  "profil.alimAdresi": { tr: "Alım adresi", en: "Pickup address" },
  "profil.alimAdresiIpucu": { tr: "Kurye kapına gelecek — mahalle, sokak, bina ve daire.", en: "The courier comes to your door — neighbourhood, street, building and flat." },
  "profil.alimAdresiYer": { tr: "Örn. Adnan Kahveci Mah. Yavuz Sultan Selim Cad. No: 12 Daire: 5, Beylikdüzü", en: "e.g. Adnan Kahveci Mah. Yavuz Sultan Selim Cad. No: 12 Flat: 5, Beylikdüzü" },
  "profil.kuryeTelefonu": { tr: "Kurye telefonu", en: "Courier phone" },
  "profil.kuryeTelefonuIpucu": { tr: "Kurye kapıya gelince arayabilsin.", en: "So the courier can call when they arrive." },
  "profil.ozgecmis": { tr: "Özgeçmiş", en: "About you" },
  "profil.ozgecmisIpucu": { tr: "Hikayeni anlat: nerede öğrendin, kaç yıldır yapıyorsun?", en: "Tell your story: where did you learn, how long have you been cooking?" },
  "profil.ozgecmisYer": { tr: "Kendini müşterilere tanıt…", en: "Introduce yourself to customers…" },
  "profil.sertifikalar": { tr: "Sertifikalar ve belgeler", en: "Certificates and documents" },
  "profil.sertifikaIpucu": { tr: "Her satıra bir tane yaz.", en: "Write one per line." },

  /* ── Kod alanı ── */
  "kod.postaKapali": { tr: "E-posta gönderimi henüz açık değil.", en: "Email delivery is not switched on yet." },

  /* ── Sıkça sorulan sorular ── */
  "sss.s1": { tr: "Ne Yersin? hangi bölgelerde hizmet veriyor?", en: "Which areas does Ne Yersin? serve?" },
  "sss.c1": { tr: "Şu an yalnızca İstanbul / Beylikdüzü'ne teslimat yapıyoruz. Adres seçiminde teslimat yaptığımız ilçeler listelenir; teslimat ücreti tüm restoranlarda ücretsizdir. Yeni ilçeler açıldıkça adres listesine kendiliğinden eklenecek.", en: "For now we only deliver to Istanbul / Beylikdüzü. The districts we serve are listed when you pick an address, and delivery is free from every restaurant. New districts will appear in the list automatically as they open." },
  "sss.s2": { tr: "Nasıl ödeme yapabiliyorum?", en: "How can I pay?" },
  "sss.c2": { tr: "Ödemeyi kapıda yapıyorsun: kurye geldiğinde nakit verebilir ya da IBAN'a havale yapabilirsin. Havaleyi seçersen açıklama alanına yalnızca sipariş numaranı yazman ve dekontu kuryeye göstermen yeterli. Önceden ödeme yapmana gerek yok.", en: "You pay at the door: hand cash to the courier or make a bank transfer to our IBAN. If you transfer, just put your order number in the reference and show the receipt to the courier. There is no need to pay in advance." },
  "sss.s3": { tr: "Teslimat ücreti var mı?", en: "Is there a delivery fee?" },
  "sss.c3": { tr: "Yok. Şu an tüm siparişlerde teslimat ücretsiz — ne müşteriden ne de yemeği yapandan alınıyor. Ödeme ekranında sepet tutarını kalem kalem görürsün, sürpriz kalem çıkmaz.", en: "No. Delivery is currently free on every order — charged neither to the customer nor to the cook. You see your cart itemised at checkout; nothing unexpected appears." },
  "sss.s4": { tr: "Siparişim gecikirse ne olur?", en: "What happens if my order is late?" },
  "sss.c4": { tr: "Sipariş durumunu hesabından takip edersin; hazırlık başlamadan iptal etme hakkın var. Bir aksaklık olursa iletişim sayfasından bize yaz, siparişi tek tek inceleyip çözüyoruz.", en: "You can follow the order status from your account, and you may cancel before preparation starts. If something goes wrong, write to us from the contact page — we look at each order individually and sort it out." },
  "sss.s5": { tr: "Mutfağımı veya restoranımı nasıl eklerim?", en: "How do I add my kitchen or restaurant?" },
  "sss.c5": { tr: "Başvuru formunu doldurursun; başvurun yöneticiye düşer ve onaylandığı anda hesabın açılıp kendi adına bir mutfak sayfan oluşur. Evinde pişirenler için ayrıntılar Ev Hanımları sayfasında.", en: "You fill in the application form; it reaches our team, and the moment it is approved your account opens with a kitchen page in your own name. Details for people cooking at home are on the Home Cooks page." },
  "sss.s6": { tr: "Kurye olmak için ne gerekiyor?", en: "What do I need to become a courier?" },
  "sss.c6": { tr: "Ehliyet, kendi aracın (motosiklet, bisiklet veya elektrikli scooter) ve akıllı telefon. Başvurunu gönderdikten sonra yönetici onayıyla kurye paneline erişirsin; sana atanan siparişi yalnızca sen görürsün.", en: "A driving licence, your own vehicle (motorcycle, bicycle or e-scooter) and a smartphone. Once your application is approved you get access to the courier dashboard, where only the orders assigned to you are visible." },
  "sss.s7": { tr: "Sipariş verilerim nasıl kullanılıyor?", en: "How is my order data used?" },
  "sss.c7": { tr: "Siparişini alabilmek ve teslim edebilmek için gereken bilgileri (ad, telefon, adres) alıyoruz. Bu bilgiler siparişini hazırlayan mutfağa ve teslimatı yapan kuryeye, yalnızca işlerini yapabilecekleri kadarıyla gösterilir. Parolan geri döndürülemez biçimde şifrelenerek saklanır. Ayrıntılı aydınlatma metnimiz hazırlanıyor; yayımlandığında bu sayfadan ulaşabileceksin.", en: "We collect what we need to take and deliver your order: name, phone and address. That information is shown to the kitchen preparing your order and the courier delivering it, and only as far as they need it to do their job. Your password is stored irreversibly hashed. Our detailed privacy notice is being prepared and will be linked from this page once published." },

  /* ── Giriş sayfası ── */
  "giris.hepsiAyniYer": { tr: "Müşteri, şef ve kurye hesapları aynı yerden girer.", en: "Customer, chef and courier accounts all sign in here." },
  "giris.sepetBekliyor": { tr: "Sipariş verebilmek için giriş yapman gerekiyor. Sepetin bekliyor.", en: "You need to sign in to place an order. Your cart is waiting." },
  "giris.googleNotu": { tr: "Hesabını Google ile açtıysan parolan yoktur — “Google ile devam et” ile gir. Parolayla da girmek istersen “Parolamı unuttum” adımından kendine bir parola belirleyebilirsin.", en: "If you opened your account with Google you have no password — use “Continue with Google”. If you'd rather sign in with a password, set one from “Forgot my password”." },
  "giris.musteriKayit": { tr: "Müşteri olarak kayıt ol", en: "Sign up as a customer" },
  "giris.sefKuryeMisin": { tr: "Şef, ev hanımı veya kurye misin?", en: "Are you a chef, home cook or courier?" },
  "giris.basvuruOlustur": { tr: "Başvuru oluştur", en: "Start an application" },

  /* ── Restoran kartı ── */
  "kart.sefMutfagi": { tr: "Şef mutfağı", en: "Chef's kitchen" },
  "kart.yeni": { tr: "Yeni", en: "New" },
  "kart.semt": { tr: "{semt} / İstanbul", en: "{semt} / Istanbul" },
  "kart.degerlendirme": { tr: "{sayi} değerlendirme", en: "{sayi} reviews" },
  "kart.degerlendirilmedi": { tr: "henüz değerlendirilmedi", en: "not rated yet" },
  "kart.teslimatSuresi": { tr: "Teslimat süresi", en: "Delivery time" },
  "kart.minimumSepet": { tr: "Minimum sepet", en: "Minimum cart" },
  "kart.teslimatUcreti": { tr: "Teslimat ücreti", en: "Delivery fee" },
  "kart.dakika": { tr: "{bas}–{son} dk", en: "{bas}–{son} min" },
  "kart.min": { tr: "min {tutar}", en: "min {tutar}" },

  /* ── Sunucu hata mesajları ── */
  "hata.adSoyad": { tr: "Ad ve soyadınızı girin.", en: "Please enter your first and last name." },
  "hata.telefonBicim": { tr: "Telefonu 5XXXXXXXXX biçiminde girin.", en: "Enter the phone as 5XXXXXXXXX." },
  "hata.epostaGecersiz": { tr: "Geçerli bir e-posta adresi girin.", en: "Please enter a valid email address." },
  "hata.parolaKisa": { tr: "Parola en az 8 karakter olmalı.", en: "Your password must be at least 8 characters." },
  "hata.basvuruTuru": { tr: "Başvuru türünü seçin.", en: "Please choose an application type." },
  "hata.basvuruAciklama": { tr: "Kendinden bahseden bölümü doldur — en az 30 karakter. Başvurun buna göre değerlendirilecek.", en: "Please fill in the section about yourself — at least 30 characters. Your application is assessed on it." },
  "hata.hesapVar": { tr: "Bu e-posta ile zaten bir hesap var. Giriş yapın.", en: "An account with this email already exists. Please sign in." },
  "hata.basvuruBekliyor": { tr: "Bu e-posta ile bekleyen bir başvurun zaten var. Sonuçlanmasını bekle.", en: "You already have a pending application with this email. Please wait for the outcome." },
  "hata.basvuruOnayli": { tr: "Başvurun onaylanmış. Doğrudan giriş yapabilirsin.", en: "Your application was approved. You can sign in directly." },
  "hata.hesapYok": { tr: "Hesap bulunamadı.", en: "Account not found." },
  "hata.parolaYanlis": { tr: "Parolan yanlış.", en: "Your password is incorrect." },
  "hata.mevcutParolaYanlis": { tr: "Mevcut parolan yanlış.", en: "Your current password is incorrect." },
  "hata.yeniParolaKisa": { tr: "Yeni parola en az 8 karakter olmalı.", en: "The new password must be at least 8 characters." },
  "hata.parolalarTutmuyor": { tr: "Yeni parolalar birbirini tutmuyor.", en: "The new passwords do not match." },
  "hata.parolaAyni": { tr: "Yeni parola eskisiyle aynı olamaz.", en: "The new password cannot be the same as the old one." },
  "hata.googleEposta": { tr: "Google hesabındaki e-posta geçersiz.", en: "The email on your Google account is invalid." },
  "hata.sefProfiliYok": { tr: "Bu hesaba bağlı bir şef profili yok.", en: "There is no chef profile linked to this account." },
  "hata.odemeBaslatilamadi": { tr: "iyzico ödeme formu başlatılamadı.", en: "The iyzico payment form could not be started." },
  "hata.odemeDogrulanamadi": { tr: "Ödeme sağlayıcısı yanıtı doğrulanamadı.", en: "The payment provider's response could not be verified." },
  "hata.odemeUlasilamadi": { tr: "Ödeme sağlayıcısına ulaşılamadı. Lütfen tekrar deneyin.", en: "The payment provider could not be reached. Please try again." },
  "hata.odemeTamamlanamadi": { tr: "Ödeme tamamlanamadı.", en: "The payment could not be completed." },
  "hata.odemeSonucDogrulanamadi": { tr: "Ödeme sonucu doğrulanamadı.", en: "The payment result could not be verified." },
  "hata.odemeSonucSorgulanamadi": { tr: "Ödeme sonucu sorgulanamadı.", en: "The payment result could not be queried." },
  "hata.anketSecenek": { tr: "Geçerli bir seçenek seç.", en: "Please choose a valid option." },
  "hata.oyKaydedilemedi": { tr: "Oyun kaydedilemedi, birazdan tekrar dene.", en: "Your vote could not be saved. Please try again shortly." },

  /* ── Hesap formu etiketleri ── */
  "hesap.adVeSoyad": { tr: "Ad ve soyad", en: "First and last name" },
  "hesap.enAz8": { tr: "En az 8 karakter.", en: "At least 8 characters." },
  "hesap.yeniParola": { tr: "Yeni parola", en: "New password" },
  "hesap.yeniParolaTekrar": { tr: "Yeni parola (tekrar)", en: "New password (again)" },
  "hesap.yeniEposta": { tr: "Yeni e-posta", en: "New email" },
  "hesap.yeniAdresiDogrula": { tr: "Yeni adresini doğrula", en: "Verify your new address" },
  "hesap.parolaBelirle": { tr: "Parola belirle", en: "Set a password" },
  "hesap.kendindenBahset": { tr: "Kendinden bahset", en: "Tell us about yourself" },

  /* ── Giriş hataları ── */
  "hata.girisBasarisiz": { tr: "Kullanıcı adı/e-posta veya parola hatalı.", en: "Incorrect username/email or password." },
  "hata.cokFazlaDeneme": { tr: "Çok fazla başarısız deneme. {dakika} dakika sonra tekrar dene.", en: "Too many failed attempts. Please try again in {dakika} minutes." },
  "hata.yoneticiYapilandirilmadi": { tr: "Yönetici girişi yapılandırılmadı (ADMIN_PASSWORD eksik).", en: "Admin sign-in is not configured (ADMIN_PASSWORD missing)." },

  /* ── Sipariş sonucu ve teslimat takibi ── */
  "sonuc.basarili": { tr: "Ödemen alındı", en: "Payment received" },
  "sonuc.basarisiz": { tr: "Ödeme tamamlanamadı", en: "Payment could not be completed" },
  "sonuc.basariliAciklama": { tr: "Siparişin restorana iletildi. Hazırlanmaya başladığında bildirim alacaksın.", en: "Your order has reached the restaurant. You'll be notified when they start preparing it." },
  "sonuc.basarisizAciklama": { tr: "Kartından tutar çekilmediyse endişelenme. Tekrar deneyebilir ya da kapıda nakit/IBAN ile ödeyebilirsin.", en: "Don't worry if nothing was charged to your card. You can try again, or pay at the door in cash or by bank transfer." },
  "sonuc.adim1": { tr: "Restoran siparişini onaylayıp hazırlamaya başlıyor.", en: "The restaurant confirms your order and starts preparing it." },
  "sonuc.adim2": { tr: "Yemeğin tahmini bitiş saatine göre kurye atanıyor.", en: "A courier is assigned based on when your food is expected to be ready." },
  "sonuc.adim3": { tr: "Kurye yola çıktığında canlı takip bağlantısı gönderiliyor.", en: "You get a live tracking link when the courier sets off." },
  "sonuc.neden1": { tr: "Kartın internetten alışverişe kapalı olabilir — bankanı arayıp açtırabilirsin.", en: "Your card may be closed to online purchases — call your bank to enable it." },
  "sonuc.neden2": { tr: "3D Secure doğrulaması zaman aşımına uğramış olabilir.", en: "The 3D Secure verification may have timed out." },
  "takip.siparisAlindi": { tr: "Sipariş alındı", en: "Order received" },
  "takip.siparisAlindiNot": { tr: "Restoran siparişi onayladı", en: "The restaurant confirmed the order" },
  "takip.hazirlaniyor": { tr: "Mutfakta hazırlanıyor", en: "Being prepared in the kitchen" },
  "takip.hazirlaniyorNot": { tr: "Tahmini bitiş 19:16", en: "Estimated ready at 19:16" },
  "takip.teslimEdildi": { tr: "Teslim edildi", en: "Delivered" },
  "takip.teslimEdildiNot": { tr: "Kapıda teslim alındı", en: "Handed over at the door" },

  /* ── Destek widgetı ── */
  "destek.kisa": { tr: "Destek", en: "Support" },
  "destek.asistan": { tr: "Destek asistanı", en: "Support assistant" },
  "destek.yanitSuresi": { tr: "Genelde birkaç saniyede yanıtlar", en: "Usually replies in seconds" },

  /* ── İletişim formu ── */
  "iletisim.restoranEkle": { tr: "Restoranını ekle", en: "Add your restaurant" },
  "iletisim.restoranAciklama": { tr: "İşletmeni Ne Yersin?'e ekle, koşulları birlikte konuşalım.", en: "Add your business to Ne Yersin? and let's discuss the terms together." },
  "iletisim.kuryeAciklama": { tr: "Kendi saatini seç, haftalık ödeme al.", en: "Choose your own hours, get paid weekly." },
  "iletisim.kurumsal": { tr: "Kurumsal çözüm", en: "Business solution" },
  "iletisim.kurumsalAciklama": { tr: "Toplu sipariş ve işletmene özel çalışma koşulları.", en: "Bulk ordering and terms tailored to your business." },
  "iletisim.isletmeAdi": { tr: "İşletme adı", en: "Business name" },
  "iletisim.sirketAdi": { tr: "Şirket adı", en: "Company name" },
  "iletisim.seciniz": { tr: "Seçiniz", en: "Select" },
  "iletisim.restoranMesajYer": { tr: "Kaç şubeniz var, hangi mutfak, günlük kaç sipariş bekliyorsunuz?", en: "How many branches, what cuisine, how many orders a day do you expect?" },
  "iletisim.kuryeMesajYer": { tr: "Hangi ilçede, hangi araçla ve hangi saatlerde çalışmak istiyorsun?", en: "Which district, which vehicle and which hours would you like to work?" },
  "iletisim.genelMesajYer": { tr: "Kısaca ihtiyacını anlat.", en: "Briefly describe what you need." },

  /* ── İletişim formu başlığı ── */
  "iletisim.formu": { tr: "{konu} formu", en: "{konu} form" },

  /* ── Sayfa başlıkları ve hesabım ── */
  "sayfa.nasilBaslik1": { tr: "Siparişten", en: "From your order" },
  "sayfa.nasilBaslik2": { tr: "kapına", en: "to your door" },
  "sayfa.nasilBaslik3": { tr: "kadar", en: "" },
  "sayfa.nasilAciklama": { tr: "Dört adımda ne olduğunu ve siparişini nasıl takip edeceğini anlatalım.", en: "Four steps: what happens, and how to follow your order." },
  "sayfa.ekranlarAciklama": { tr: "Müşteri, kurye ve restoran tarafında işleri yürüten arayüzler.", en: "The interfaces that run things on the customer, courier and restaurant side." },
  "hesabim.bilgilerim": { tr: "Hesap bilgilerim", en: "My account details" },
  "hesabim.epostaDogrulandi": { tr: "E-posta doğrulandı", en: "Email verified" },
  "hesabim.epostaDogrulanmadi": { tr: "E-posta doğrulanmadı", en: "Email not verified" },
  "hesabim.uyelik": { tr: "Üyelik", en: "Member since" },
  "hesabim.verdigimSiparis": { tr: "Verdiğim sipariş", en: "Orders placed" },
  "hesabim.odenen": { tr: "Ödenen", en: "Paid" },
  "hesabim.mutfagimaGelen": { tr: "Mutfağıma gelen", en: "Orders to my kitchen" },

  /* ── Hakkımızda sayfası ── */
  "hakkimizda.nedenKurduk": { tr: "Neden kurduk", en: "Why we started" },
  "hakkimizda.hikayeBaslik1": { tr: "Bir tabak yemeğin fiyatında", en: "A plate of food carries" },
  "hakkimizda.hikayeBaslik2": { tr: "yemekten başka çok şey var", en: "far more than food in its price" },
  "hakkimizda.nasilCalisiyoruz": { tr: "Nasıl çalışıyoruz", en: "How we work" },
  "hakkimizda.aldigimizKararlar": { tr: "Aldığımız kararlar", en: "The decisions we made" },
  "hakkimizda.kararlarAciklama": { tr: "Bunlar slogan değil, sistemin nasıl kurulduğunu belirleyen tercihler.", en: "These are not slogans — they are the choices that shape how the system is built." },
  "hakkimizda.siradaNeVar": { tr: "Sırada ne var", en: "What's next" },
  "hakkimizda.hedeflerimiz": { tr: "Hedeflerimiz", en: "Our goals" },
  "hakkimizda.henuzYapilmadi": { tr: "henüz yapılmadı", en: "not done yet" },
  "hakkimizda.hedefAciklama": { tr: "— sırayla hayata geçirmeyi planladığımız maddeler.", en: "— items we plan to build, one after another." },
  "hakkimizda.planlanan": { tr: "Planlanan", en: "Planned" },
  "hakkimizda.bizeUlas": { tr: "Bize ulaş", en: "Get in touch" },
  "hakkimizda.telefon": { tr: "Telefon:", en: "Phone:" },
  "hakkimizda.eposta": { tr: "E-posta:", en: "Email:" },
  "hakkimizda.bolge": { tr: "Bölge:", en: "Area:" },
  "hakkimizda.aramizaKatil": { tr: "Aramıza katıl", en: "Join us" },
  "hakkimizda.gorselAlt": { tr: "Ev mutfağında hazırlanan yemek", en: "Food prepared in a home kitchen" },

  /* ── Ev Hanımları sayfası ── */
  "evh.neden": { tr: "Neden", en: "Why" },
  "evh.engelBaslik1": { tr: "Engel yemek yapmak değil —", en: "The obstacle isn't the cooking —" },
  "evh.engelBaslik2": { tr: "geri kalan her şey", en: "it's everything else" },
  "evh.engelAciklama": { tr: "Evinde iyi yemek yapan çok kişi var. Bu işi satışa çeviremeyenlerin takıldığı yer hep aynı üç madde.", en: "Plenty of people cook well at home. Those who can't turn it into a business get stuck on the same three things." },
  "evh.nasilBaslarim": { tr: "Nasıl başlarım", en: "How do I start" },
  "evh.dortAdim": { tr: "Başvurudan ilk siparişe dört adım", en: "Four steps from application to first order" },
  "evh.dortAdimAciklama": { tr: "Hepsi bugün çalışıyor — anlatılan akışın tamamı sistemde kurulu.", en: "All of it works today — the whole flow described here is already built." },
  "evh.bugunSistemde": { tr: "Bugün sistemde olan", en: "What exists today" },
  "evh.onaylandiginGun": { tr: "Onaylandığın gün", en: "The day you're approved" },
  "evh.elindeNeOluyor": { tr: "elinde ne oluyor?", en: "what do you get?" },
  "evh.ozellikAciklama": { tr: "Aşağıdakiler söz değil, kurulu özellikler. Henüz yapılmamış olanlar sayfanın alt tarafında ayrı listede.", en: "These are built features, not promises. Anything not built yet is in a separate list further down the page." },
  "evh.degerlendirme": { tr: "Değerlendirme", en: "Ratings" },
  "evh.ucAyriNot": { tr: "Tek yıldız değil, üç ayrı not", en: "Not one star — three separate scores" },
  "evh.degerlendirmeAciklama": { tr: "Müşteri siparişini üç başlıkta ayrı ayrı puanlar. Böylece iyi olduğun taraf da, düzeltmen gereken taraf da kaybolmaz.", en: "Customers rate their order under three separate headings, so neither what you do well nor what needs fixing gets lost." },
  "evh.resmiTaraf": { tr: "Resmî taraf", en: "The official side" },
  "evh.belgelerBaslik1": { tr: "Belgeler", en: "Don't let the paperwork" },
  "evh.belgelerBaslik2": { tr: "seni korkutmasın", en: "put you off" },
  "evh.resmiAciklama": { tr: "Bu süreçler kişinin kendi adına yürüyor — ama hangi belge nereden alınır, sırası nedir, birlikte çözüyoruz.", en: "These processes run in your own name — but which document comes from where and in what order, we work out together." },
  "evh.yolHaritasi": { tr: "Yol haritası", en: "Roadmap" },
  "evh.siradaNeVar": { tr: "Sırada ne var?", en: "What's next?" },
  "evh.yolHaritasiAciklama": { tr: "— proje dosyasında yazan ve sırayla hayata geçirilecek maddeler. Var olan özelliklerle karışmasın diye ayrı tutuyoruz.", en: "— items written in the project plan that will be built one by one. We keep them separate so they aren't confused with existing features." },
  "evh.basvurmadanOnce": { tr: "Başvurmadan önce", en: "Before you apply" },
  "evh.sssAciklama": { tr: "Aradığın cevap yoksa iletişim sayfasından yazabilirsin.", en: "If your answer isn't here, write to us from the contact page." },

  /* ── Şef paneli ── */
  "panel.duzenleniyor": { tr: "“{ad}” düzenleniyor", en: "Editing “{ad}”" },
  "panel.yeniUrun": { tr: "Yeni ürün ekle", en: "Add a new item" },
  "panel.bolum": { tr: "Bölüm", en: "Section" },
  "panel.urunAdi": { tr: "Ürün adı", en: "Item name" },
  "panel.fiyat": { tr: "Fiyat (TL)", en: "Price (TL)" },
  "panel.fiyatIpucu": { tr: "Boş bırakırsan menüde 'fiyat yakında' görünür.", en: "Leave it blank and the menu will show 'price coming soon'." },
  "panel.fiyatYer": { tr: "Örn. 180", en: "e.g. 180" },
  "panel.birimZorunlu": { tr: "Bu bölümde önemli: kaç gram, kaç litre?", en: "Important in this section: how many grams, how many litres?" },
  "panel.birimIstege": { tr: "İstersen porsiyon bilgisi yazabilirsin.", en: "You can add portion information if you like." },
  "panel.birimYerAgirlik": { tr: "Örn. 500 g cam kavanoz", en: "e.g. 500 g glass jar" },
  "panel.birimYerPorsiyon": { tr: "Örn. 2 kişilik", en: "e.g. serves 2" },
  "panel.aciklamaIpucu": { tr: "Neyle yaptığını kısaca anlat.", en: "Briefly say what you made it with." },
  "panel.aciklamaYer": { tr: "Örn. Köy sütünden, yayıkta çalkalanmış, katkısız.", en: "e.g. From village milk, churned by hand, no additives." },
  "panel.kaydediliyor": { tr: "Kaydediliyor…", en: "Saving…" },
  "panel.degisikligiKaydet": { tr: "Değişikliği kaydet", en: "Save changes" },
  "panel.urunuEkle": { tr: "Ürünü ekle", en: "Add item" },
  "panel.fiyatGirilmedi": { tr: "Fiyat girilmedi", en: "No price set" },
  "panel.menudenKaldir": { tr: "Menüden kaldır", en: "Remove from menu" },
  "panel.menuyeKoy": { tr: "Menüye koy", en: "Put on the menu" },
  "panel.sayfamiGor": { tr: "Sayfamı gör", en: "View my page" },
  "panel.sef": { tr: "Şef", en: "Chef" },
  "panel.evHanimi": { tr: "Ev Hanımı", en: "Home Cook" },

  /* ── Sipariş doğrulama ve kategoriler ── */
  "hata.restoranYok": { tr: "Restoran bulunamadı.", en: "Restaurant not found." },
  "hata.sepetBos": { tr: "Sepetiniz boş.", en: "Your cart is empty." },
  "hata.ilceSec": { tr: "Listeden bir İstanbul ilçesi seçin.", en: "Choose an Istanbul district from the list." },
  "hata.teslimatYok": { tr: "{restoran}, {ilce} ilçesine teslimat yapmıyor.", en: "{restoran} does not deliver to {ilce}." },
  "hata.mahalleGerekli": { tr: "Mahalle bilgisi gerekli.", en: "The neighbourhood is required." },
  "hata.acikAdres": { tr: "Cadde/sokak bilgisini içeren açık adres girin.", en: "Enter a full address including the street." },
  "hata.binaNo": { tr: "Bina numarası gerekli.", en: "The building number is required." },
  "hata.minSepet": { tr: "Minimum sepet tutarı {tutar} TL. Sepetinize {eksik} TL daha ekleyin.", en: "The minimum cart total is {tutar} TL. Add {eksik} TL more to your cart." },
  "kategori.yakinda": { tr: "yakında", en: "coming soon" },
  "kategori.restoran": { tr: "restoran", en: "restaurants" },
  "kategori.magaza": { tr: "mağaza", en: "shops" },
  "giris.googleKayit": { tr: "Google ile kayıt ol", en: "Sign up with Google" },

  /* ── Ödeme eylemi hataları ── */
  "hata.kartKapali": { tr: "Kart ödemesi şu an kullanılamıyor. Kapıda ödeme ile devam edebilirsin.", en: "Card payment is unavailable right now. You can continue with payment at the door." },
  "hata.gecerliUrunYok": { tr: "Sepetinizde geçerli ürün yok.", en: "There are no valid items in your cart." },
  "hata.girisGerekli": { tr: "Sipariş vermek için giriş yapmalısın.", en: "You need to sign in to place an order." },
};

/** `{ad}` yer tutucularını dolduruyor. */
function yerlestir(metin: string, degiskenler?: Record<string, string | number>): string {
  if (!degiskenler) return metin;
  return metin.replace(/\{(\w+)\}/g, (tam, ad: string) =>
    ad in degiskenler ? String(degiskenler[ad]) : tam,
  );
}

export type Ceviri = (anahtar: string, degiskenler?: Record<string, string | number>) => string;

/**
 * Verilen dil için çeviri işlevi üretir.
 *
 * Anahtar sözlükte yoksa ANAHTARIN KENDİSİ değil, varsa Türkçesi dönüyor;
 * ikisi de yoksa anahtar dönüyor. Böylece eksik çeviri sayfayı bozmuyor,
 * yalnızca o metin Türkçe kalıyor.
 */
export function ceviri(dil: Dil): Ceviri {
  return (anahtar, degiskenler) => {
    const kayit = sozluk[anahtar];
    if (!kayit) return yerlestir(anahtar, degiskenler);
    return yerlestir(kayit[dil] ?? kayit.tr, degiskenler);
  };
}

/**
 * İki dilli içerik alanı seçer: `sec(dil, urun.ad, urun.adEn)`.
 *
 * İngilizcesi girilmemişse Türkçesi gösteriliyor — turist ziyaretçi için
 * boş bir alan, Türkçe bir addan çok daha kötü.
 */
export function sec(dil: Dil, turkce: string, ingilizce?: string | null): string {
  return dil === "en" && ingilizce ? ingilizce : turkce;
}

/**
 * TERİM SÖZLÜĞÜ — mutfak türleri, etiketler, bölüm adları.
 *
 * Bunlar içerik verisinde Türkçe METİN olarak duruyor ve aynı zamanda SÜZGEÇ
 * ANAHTARI: liste sayfası "Pizza" etiketiyle karşılaştırarak filtreliyor.
 * Anahtara çevirmek süzmeyi bozacağı için ayrı bir harita tutuluyor ve
 * yalnızca GÖSTERİRKEN uygulanıyor.
 *
 * Karşılığı olmayan terim Türkçe kalıyor — "Çiğ Börek" gibi bazı adların
 * zorlama çevirisi, aslından daha anlaşılmaz oluyor.
 */
export const TERIMLER: Record<string, string> = {
  "Tavuk": "Chicken",
  "Kanat": "Wings",
  "Fast Food": "Fast Food",
  "Pizza": "Pizza",
  "İtalyan": "Italian",
  "Kebap": "Kebab",
  "Izgara": "Grill",
  "Meze": "Meze",
  "Ev Yemekleri": "Home Cooking",
  "Çorba": "Soup",
  "Türk Mutfağı": "Turkish Cuisine",
  "Burger": "Burger",
  "Döner": "Doner",
  "Dürüm": "Wrap",
  "Tatlı": "Dessert",
  "Pasta": "Cake",
  "Dondurma": "Ice Cream",
  "Kahve": "Coffee",
  "Sandviç": "Sandwich",
  "Kahvaltı": "Breakfast",
  "Balık": "Fish",
  "Deniz Ürünleri": "Seafood",
  "Vegan": "Vegan",
  "Salata": "Salad",
  "Sağlıklı": "Healthy",
  "Çiğ Börek": "Çiğ Börek",
  "Hamur İşi": "Pastry",
  "Pide & Lahmacun": "Pide & Lahmacun",
  "Dünya Mutfağı": "World Cuisine",
  "Hint": "Indian",
  "Uzak Doğu": "East Asian",
  "Börek": "Börek",
  "Fırın": "Bakery",
  "Tost": "Toasted Sandwich",
  "Market": "Grocery",
  "Atıştırmalık": "Snacks",
  "İçecek": "Drinks",
  "Popüler": "Popular",
  "Editörün Seçimi": "Editor's Choice",
  "Odun Ateşi": "Wood Fired",
  "En Yüksek Puan": "Top Rated",
  "Yeni": "New",
  "Bütçe Dostu": "Budget Friendly",
  "Ev Yapımı": "Home-made",
  "Sabah Servisi": "Morning Service",
  "Günlük Taze": "Fresh Daily",
  "Taş Fırın": "Stone Oven",
  "Gece Açık": "Open Late",

  /* Menü bölümleri */
  "Kanatlar": "Wings",
  "Yanında İyi Gider": "Goes Well With",
  "Taş Fırın Pizzalar": "Stone Oven Pizzas",
  "Başlangıç & Salata": "Starters & Salads",
  "Tatlı & İçecek": "Desserts & Drinks",
  "Izgara & Kebap": "Grill & Kebab",
  "Mezeler": "Meze",
  "Günün Yemekleri": "Dishes of the Day",
  "Çorbalar": "Soups",
  "Burgerler": "Burgers",
  "Yan Ürün & İçecek": "Sides & Drinks",
  "Ekstralar": "Extras",
  "Pastalar": "Cakes",
  "Dondurma & İçecek": "Ice Cream & Drinks",
  "Kahveler": "Coffees",
  "Kahvaltı & Sandviç": "Breakfast & Sandwiches",
  "Ana Yemekler": "Main Dishes",
  "Kaseler": "Bowls",
  "Salata & İçecek": "Salads & Drinks",
  "Yanında": "On the Side",
  "Pideler": "Pide",
  "Lahmacun & Çorba": "Lahmacun & Soup",
  "Hint Mutfağı": "Indian Cuisine",
  "Ekmek & İçecek": "Bread & Drinks",
  "Tost & Sandviç": "Toasties & Sandwiches",
  "Gece Menüsü": "Late Night Menu",
  "Temel İhtiyaç": "Essentials",
  "Atıştırmalık & İçecek": "Snacks & Drinks",
  "Ara Sıcaklar": "Hot Starters",
  "Hamur İşleri": "Pastries",
  "Ev Yapımı Ürünler": "Home-made Products",
  "Tatlılar": "Desserts",
  "İçecekler": "Drinks",
  "Ara Sıcak": "Hot Starter",
  "Salata & Meze": "Salads & Meze",
};

/** Mutfak türü / etiket gibi tek kelimelik içerik terimlerini çevirir. */
export function terim(dil: Dil, metin: string): string {
  if (dil !== "en") return metin;
  return TERIMLER[metin] ?? metin;
}

/** Terim listesini çevirir: `["Pizza", "Tatlı"]` → `["Pizza", "Dessert"]`. */
export function terimler(dil: Dil, liste: readonly string[]): string[] {
  return liste.map((m) => terim(dil, m));
}
