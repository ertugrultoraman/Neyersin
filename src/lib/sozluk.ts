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
