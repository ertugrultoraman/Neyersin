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
