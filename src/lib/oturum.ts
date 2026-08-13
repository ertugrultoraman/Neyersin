import crypto from "node:crypto";

import { cookies, headers } from "next/headers";

import { hesapDepoAl, parolaDogrula, rolMu, type Rol } from "./hesaplar";
import { basarisizDeneme, denemeleriSifirla, girisDenenebilirMi } from "./giris-sinirlayici";
import { hataMetni } from "./hata-metni";
import { ikinciFaktorAcikMi, ikinciFaktorDogrula } from "./ikinci-faktor";
import { jetonAc, jetonPaketle, sabitZamanliEsit } from "./imza";

/**
 * Oturum yönetimi — iki rol için tek mekanizma.
 *
 *  - **admin**: `ADMIN_EMAILS` listesindeki e-postalar, `ADMIN_PASSWORD` ile
 *    girer. Kullanıcı tablosunda kaydı yoktur; panelin tamamına erişir.
 *  - **sef**:  veritabanındaki hesap kaydıyla girer, yalnızca kendi restoran
 *    profilini düzenleyebilir.
 *
 * Tasarım kararları:
 *  - Oturum çerezi HMAC-SHA256 ile imzalanır; sunucuda durum tutulmaz.
 *  - Parola ASLA kodda tutulmaz, karşılaştırmalar sabit zamanlıdır.
 *  - İmza anahtarı yapılandırılmamışsa süreç başına rastgele üretilir; bu
 *    durumda oturumlar yeniden başlatmada düşer ama ASLA tahmin edilemez.
 */

const COOKIE_ADI = "ny_oturum";
const OTURUM_SURESI_SN = 60 * 60 * 8; // 8 saat

/** Varsayılan yönetici — kullanıcının talebi üzerine tanımlı. */
const VARSAYILAN_ADMINLER = ["ertugrultoraman@hotmail.com"];

/**
 * Yönetici, e-posta yerine kısa bir kullanıcı adıyla da girebilir.
 * `ADMIN_KULLANICI_ADI` ile değiştirilebilir; parola yine `ADMIN_PASSWORD`.
 */
function adminKullaniciAdi(): string {
  return (process.env.ADMIN_KULLANICI_ADI ?? "admin").trim().toLowerCase();
}

export function adminEpostalari(): string[] {
  const ham = process.env.ADMIN_EMAILS;
  const liste = ham
    ? ham
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : VARSAYILAN_ADMINLER;
  return liste.length > 0 ? liste : VARSAYILAN_ADMINLER;
}

export function adminMi(kimlik: string): boolean {
  const temiz = kimlik.trim().toLowerCase();
  return temiz === adminKullaniciAdi() || adminEpostalari().includes(temiz);
}

/**
 * Yöneticinin OTURUMDA taşınacak adresi — her zaman gerçek bir e-posta.
 *
 * Yönetici kısa kullanıcı adıyla da girebiliyor ("admin"). Oturuma yazılan
 * adres yazdığı kimlik olduğu için, kullanıcı adıyla girildiğinde oturumun
 * e-posta alanı "admin" oluyordu — bu bir e-posta değil ve zinciri kırıyordu:
 *
 *  - Sipariş doğrulaması adresi oturumdan okuyor (bkz. siparis-olustur.ts);
 *    yönetici kendi sitesinden sipariş veremiyor, form doğru olsa bile
 *    "e-posta geçersiz" hatası alıyordu.
 *  - Sipariş özeti postası gönderilecek bir adres bulamıyordu.
 *  - Kişi başı kupon kuralı "admin" kimliğine yazılıyordu.
 *
 * Kullanıcı adıyla girişte listedeki İLK adres kullanılıyor; e-postayla
 * girişte yazdığı adres korunuyor (birden fazla yönetici olabilir).
 */
export function adminOturumEpostasi(kimlik: string): string {
  const temiz = kimlik.trim().toLowerCase();
  if (adminEpostalari().includes(temiz)) return temiz;
  return adminEpostalari()[0] ?? temiz;
}

/** Parola tanımlı değilse yönetici girişi kapalı (şef girişi etkilenmez). */
export function adminYapilandirildiMi(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length > 0;
}

/** Süreç ömrü boyunca sabit, yapılandırma yoksa kullanılan yedek anahtar. */
const GECICI_ANAHTAR = crypto.randomBytes(32).toString("hex");

/**
 * Web oturum çerezinin imza anahtarı.
 *
 * MOBİL DE BUNU TABAN ALIYOR (bkz. lib/mobil/jeton.ts) ama doğrudan
 * kullanmıyor: oradan `alanAnahtari` ile ayrı bir alt anahtar türetiliyor,
 * böylece bir mobil jetonu çerez yerine geçemiyor. Buradaki türetme
 * değişirse `src/middleware.ts` içindeki Web Crypto kopyası da değişmeli.
 */
export function oturumAnahtari(): string {
  const acik = process.env.ADMIN_SESSION_SECRET;
  if (acik && acik.length >= 16) return acik;

  const parola = process.env.ADMIN_PASSWORD ?? "";
  if (parola.length > 0) {
    return crypto.createHash("sha256").update(`ny-oturum:${parola}`).digest("hex");
  }
  return GECICI_ANAHTAR;
}

export type Oturum = {
  eposta: string;
  ad: string;
  rol: Rol;
  /** Şef ise düzenleme yetkisi olan tek restoran. */
  restoranSlug?: string;
  /**
   * İşletme hesabında yetki düzeyi (bkz. `isletmeSahibiMi`).
   *
   * Jetonda taşınıyor ki her yetki kontrolü için veritabanına gidilmesin.
   * Yetki DEĞİŞTİĞİNDE kişinin jetonu eskimiş kalıyor; bu yüzden çalışan
   * çıkarıldığında hesabı da siliniyor — yalnızca yetkisi düşürülseydi eski
   * jetonla süresi dolana kadar sahip gibi davranabilirdi.
   */
  isletmeYetkisi?: "sahip" | "calisan";
  /**
   * VEKÂLET — yönetici bu hesabı "olarak" görüntülüyor.
   *
   * Doluysa oturum aslında bir yöneticiye ait; ekranda kimin adına bakıldığını
   * söyleyen şerit çıkıyor ve tek tıkla yöneticiliğe dönülüyor. Jeton HMAC ile
   * imzalandığı için kullanıcı bu alanı kendi uyduramaz — uydurabilseydi
   * herkes kendini "vekâletle giren yönetici" ilan ederdi.
   *
   * Yetki VERMİYOR: kişi hangi hesaba büründüyse onun yetkileriyle geziyor.
   * Yöneticiye özel ekranlar için rol yine `admin` olmalı.
   */
  vekil?: { eposta: string; ad: string };
  bitis: number;
};

function jetonUret(oturum: Omit<Oturum, "bitis">): string {
  const yuk: Oturum = {
    ...oturum,
    eposta: oturum.eposta.toLowerCase(),
    bitis: Math.floor(Date.now() / 1000) + OTURUM_SURESI_SN,
  };
  return jetonPaketle(yuk, oturumAnahtari());
}

function jetonCoz(jeton: string): Oturum | null {
  const yuk = jetonAc<Oturum>(jeton, oturumAnahtari());
  if (!yuk) return null;

  if (typeof yuk.bitis !== "number" || yuk.bitis < Math.floor(Date.now() / 1000)) return null;
  // Yönetici listesinden çıkarılan biri, çerezi geçerli olsa da admin kalmasın.
  if (yuk.rol === "admin" && !adminMi(yuk.eposta)) return null;
  /*
   * Rol listesi tek kaynaktan (`ROLLER`) geliyor. Burada elle yazılmış bir
   * dizi vardı ve `isletme` eklenmeyi unutulmuştu: işletme hesabı doğru
   * parolayla giriyor, çerez yazılıyor, ama ilk istekte jeton reddedildiği
   * için kişi giriş yapamamış gibi görüyordu.
   */
  if (!rolMu(yuk.rol)) return null;
  /*
   * Vekâlet eden kişi yönetici listesinden çıkarıldıysa jeton tamamen düşer.
   * Yalnızca `vekil` alanını silmek, o kişiyi hedef hesabın SAHİBİ gibi
   * bırakırdı — çıkış düğmesi de kaybolurdu.
   */
  if (yuk.vekil && !adminMi(yuk.vekil.eposta)) return null;

  /*
   * YÖNETİCİNİN ADRESİ ÇÖZÜMLEME ANINDA DA DÜZELTİLİYOR.
   *
   * Düzeltme girişte de var (bkz. adminOturumEpostasi) ama tek başına
   * yetmiyordu: kullanıcı adıyla açılmış ÇEREZLER 8 saat boyunca içinde
   * "admin" taşımaya devam ediyor ve o süre boyunca sipariş verilemiyordu —
   * form doğru adresi gösterse bile sunucu oturumdakine bakıyor. Burada
   * düzeltmek, kimsenin çıkış yapıp yeniden girmesini gerektirmiyor.
   */
  if (yuk.rol === "admin" && !yuk.eposta.includes("@")) {
    return { ...yuk, eposta: adminOturumEpostasi(yuk.eposta) };
  }

  return yuk;
}

/**
 * Çerezin `Secure` işareti isteğin protokolünden türetilir, NODE_ENV'den değil.
 *
 * Neden: `Secure` çerez yalnızca HTTPS'te (ve `localhost` istisnasında) kabul
 * edilir. Üretim derlemesini `http://neyersin.local` gibi özel bir isimle yerel
 * olarak çalıştırdığımızda NODE_ENV="production" olduğu için çerez sessizce
 * düşüyor ve giriş hiç olmamış gibi davranıyordu. Protokole bakmak hem yereli
 * çalıştırıyor hem de canlıda (Vercel `x-forwarded-proto: https`) korumayı
 * aynen sürdürüyor.
 */
async function httpsMi(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim();
  return proto === "https";
}

async function cerezeYaz(oturum: Omit<Oturum, "bitis">): Promise<void> {
  const cerezler = await cookies();
  cerezler.set(COOKIE_ADI, jetonUret(oturum), {
    httpOnly: true,
    sameSite: "lax",
    secure: await httpsMi(),
    path: "/",
    maxAge: OTURUM_SURESI_SN,
  });
}

export type GirisSonuc =
  | { basarili: true; rol: Rol }
  | { basarili: false; hata: string };

export type KimlikSonuc =
  | { basarili: true; oturum: Omit<Oturum, "bitis"> }
  | { basarili: false; hata: string };

/**
 * Tek giriş kapısı: önce yönetici, sonra şef hesabı denenir.
 * Hangi adımda takıldığı dışarı sızdırılmaz — her hatada aynı mesaj döner.
 *
 * ÇEREZ YAZMIYOR, yalnızca kimliği doğruluyor. Ayrımın sebebi mobil: native
 * uygulama çerez kullanmıyor, oturumu Bearer jetonuyla taşıyor (bkz.
 * lib/mobil/jeton.ts). İki taraf da BU fonksiyonu çağırıyor; ayrılmasaydı
 * kaba kuvvet sayacı, yönetici parolası karşılaştırması ve "hangi adımda
 * takıldığını sızdırma" kuralı mobil için ikinci kez yazılırdı — biri
 * düzeltilip diğeri unutulduğunda giriş güvenliği iki farklı davranış
 * gösterirdi.
 */
export async function kimlikDogrula(
  kimlik: string,
  parola: string,
  /**
   * Yöneticinin kimlik doğrulayıcı uygulamasındaki 6 haneli kod.
   *
   * YALNIZCA YÖNETİCİ İÇİN ve yalnızca `ADMIN_TOTP_SECRET` tanımlıysa
   * isteniyor (bkz. lib/ikinci-faktor.ts). Şef/kurye/müşteri girişini
   * etkilemiyor: onların parolası kişisel ve hesapları sınırlı yetkili,
   * yönetici parolası ise tek bir ortam değişkeni ve panelin tamamını açıyor.
   */
  ikinciFaktorKodu?: string,
): Promise<KimlikSonuc> {
  const temizKimlik = (kimlik ?? "").trim().toLowerCase();
  // Hangi adımda takıldığı sızmasın diye TEK mesaj; dili de ziyaretçinin diline göre.
  const HATA = await hataMetni("hata.girisBasarisiz");

  /**
   * Kaba kuvvet koruması: aynı kimlik + IP için 5 başarısız denemeden sonra
   * 15 dakika kilit. Kilit kontrolü parola karşılaştırmasından ÖNCE yapılıyor,
   * yoksa saldırgan yine deneme yapmış olurdu.
   */
  const ip = await istekIpsi();
  const sinir = await girisDenenebilirMi(temizKimlik, ip);
  if (!sinir.izinli) {
    const dakika = Math.ceil(sinir.kalanSaniye / 60);
    return {
      basarili: false,
      hata: await hataMetni("hata.cokFazlaDeneme", { dakika }),
    };
  }

  if (adminMi(temizKimlik)) {
    if (!adminYapilandirildiMi()) {
      return { basarili: false, hata: await hataMetni("hata.yoneticiYapilandirilmadi") };
    }
    if (!sabitZamanliEsit(parola ?? "", process.env.ADMIN_PASSWORD ?? "")) {
      await basarisizDeneme(temizKimlik, ip);
      return { basarili: false, hata: HATA };
    }

    /*
     * İKİNCİ FAKTÖR PAROLADAN SONRA. Önce sorulsaydı, parolayı bilmeyen biri
     * kod deneyerek anahtarın kurulu olup olmadığını öğrenebilirdi.
     *
     * Yanlış kod da kaba kuvvet sayacına yazılıyor: kod altı haneli, yani
     * bir milyon ihtimal — sınırsız deneme hakkı olsaydı otomatik bir betik
     * makul sürede tutturabilirdi.
     */
    if (ikinciFaktorAcikMi() && !ikinciFaktorDogrula(ikinciFaktorKodu ?? "")) {
      await basarisizDeneme(temizKimlik, ip);
      return { basarili: false, hata: await hataMetni("hata.ikinciFaktorGecersiz") };
    }

    await denemeleriSifirla(temizKimlik, ip);
    return {
      basarili: true,
      /* Kullanıcı adıyla girildiyse gerçek adrese çevriliyor (bkz. adminOturumEpostasi). */
      oturum: { eposta: adminOturumEpostasi(temizKimlik), ad: "Yönetici", rol: "admin" },
    };
  }

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(temizKimlik);

  /**
   * Parolası olmayan hesap (Google ile açılmış) parolayla GİREMEZ.
   *
   * `parolaDogrula` boş özette zaten `false` dönüyor; buradaki açık denetim
   * ikinci savunma hattı — ileride özet biçimi değişirse boş parolayla giriş
   * kazara mümkün hâle gelmesin. Hata mesajı diğerleriyle aynı: hesabın Google
   * hesabı olduğunu söylemek, hangi adreslerin kayıtlı olduğunu sızdırırdı.
   */
  const parolasiVar = Boolean(hesap?.parolaHash);
  if (!hesap || !parolasiVar || !(await parolaDogrula(parola ?? "", hesap.parolaHash))) {
    await basarisizDeneme(temizKimlik, ip);
    return { basarili: false, hata: HATA };
  }

  await denemeleriSifirla(temizKimlik, ip);
  return {
    basarili: true,
    oturum: {
      eposta: hesap.eposta,
      ad: hesap.ad,
      rol: hesap.rol,
      restoranSlug: hesap.restoranSlug,
      isletmeYetkisi: hesap.isletmeYetkisi,
    },
  };
}

/**
 * Web girişi — kimliği doğrular ve oturum çerezini yazar.
 *
 * Sunucu eylemleri (app/hesap/actions.ts, app/admin/actions.ts) bunu çağırıyor.
 */
export async function girisYap(
  kimlik: string,
  parola: string,
  ikinciFaktorKodu?: string,
): Promise<GirisSonuc> {
  const sonuc = await kimlikDogrula(kimlik, parola, ikinciFaktorKodu);
  if (!sonuc.basarili) return { basarili: false, hata: sonuc.hata };

  await cerezeYaz(sonuc.oturum);
  return { basarili: true, rol: sonuc.oturum.rol };
}

/** İstemci IP'si — vekil arkasında `x-forwarded-for` ilk değeri geçerlidir. */
export async function istekIpsi(): Promise<string> {
  const h = await headers();
  const iletilen = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return iletilen || h.get("x-real-ip") || "bilinmeyen";
}

/** Kayıt sonrası kullanıcıyı doğrudan içeri alır. */
export async function oturumAc(oturum: Omit<Oturum, "bitis">): Promise<void> {
  await cerezeYaz(oturum);
}

export async function cikisYap(): Promise<void> {
  const cerezler = await cookies();
  cerezler.delete(COOKIE_ADI);
}

/**
 * VEKÂLETE GİR — yönetici, bir hesabı o kişi olarak görüntülemeye başlar.
 *
 * Neden parola öğrenmek yerine bu: parolalar tek yönlü özet olarak saklanıyor,
 * geri getirilemiyor; getirilebilseydi bile kişi parolasını değiştirdiği anda
 * yönetici yine kapıda kalırdı. Vekâlet parolaya hiç dokunmuyor.
 *
 * Çağıran taraf yöneticiliği DOĞRULAMIŞ olmalı — burada tekrar sorulmuyor,
 * çünkü fonksiyon yalnızca yetki kontrolünü zaten yapan eylemden çağrılıyor.
 */
export async function vekaleteGir(
  yonetici: Oturum,
  hedef: { eposta: string; ad: string; rol: Rol; restoranSlug?: string;
           isletmeYetkisi?: "sahip" | "calisan" },
): Promise<void> {
  await cerezeYaz({
    eposta: hedef.eposta,
    ad: hedef.ad,
    rol: hedef.rol,
    restoranSlug: hedef.restoranSlug,
    isletmeYetkisi: hedef.isletmeYetkisi,
    vekil: { eposta: yonetici.eposta, ad: yonetici.ad },
  });
}

/**
 * VEKÂLETTEN ÇIK — yöneticiliğe geri dön.
 *
 * Yönetici oturumu jetondaki `vekil` alanından yeniden kuruluyor; o alan
 * imzalı olduğu için uydurulamaz. Yine de `adminMi` bir kez daha soruluyor:
 * kişi vekâletteyken yönetici listesinden çıkarılmış olabilir.
 */
export async function vekaletiBitir(): Promise<boolean> {
  const oturum = await oturumAl();
  if (!oturum?.vekil || !adminMi(oturum.vekil.eposta)) return false;

  await cerezeYaz({ eposta: oturum.vekil.eposta, ad: oturum.vekil.ad, rol: "admin" });
  return true;
}

/** Geçerli oturumu döner, yoksa null. */
export async function oturumAl(): Promise<Oturum | null> {
  const cerezler = await cookies();
  const jeton = cerezler.get(COOKIE_ADI)?.value;
  if (!jeton) return null;
  return jetonCoz(jeton);
}

/**
 * Kendi mutfağını işleten bir hesap mı? (şef, ev hanımı ya da işletme)
 *
 * `rol === "sef"` yazan her yer bu soruyu sormuyor. İkiye ayrılıyor:
 *  - MUTFAK İŞİ (gelen sipariş, "hazır" demek, profil, ürünler): işletme de
 *    dahil — bunlar mutfak yürütmenin parçası.
 *  - BİREYSEL TAKDİR (Altın Şef, Şef Kaşığı): yalnızca `sef`. Bir kuruma
 *    "Altın Şef" unvanı vermek unvanın anlamını boşaltırdı.
 *
 * Yeni bir mutfak yetkisi eklerken hangisi olduğuna karar verip ya bu
 * yardımcıyı ya da düz `rol === "sef"` kontrolünü kullan.
 */
export function mutfakSahibiMi(rol: Rol): boolean {
  return rol === "sef" || rol === "isletme";
}

/**
 * İşletmenin SAHİBİ mi, yoksa çalışanı mı?
 *
 * Çalışan yalnızca sipariş tahtasını görüyor: kasadaki ya da mutfaktaki kişi
 * fiyat değiştirememeli, çalışma saatlerini kaydırmamalı ve cironun tamamını
 * görmemeli.
 *
 * YETKİSİ BOŞ OLAN İŞLETME SAHİP SAYILIYOR. Alan sonradan eklendi; mevcut
 * bütün işletme hesaplarında boş ve varsayılan "çalışan" olsaydı hepsi kendi
 * panelinden kilitlenirdi.
 */
export function isletmeSahibiMi(oturum: Oturum | null): boolean {
  if (!oturum) return false;
  if (oturum.rol === "admin") return true;
  if (oturum.rol !== "isletme") return false;
  return oturum.isletmeYetkisi !== "calisan";
}

/**
 * Bu oturum, verilen restoran profilini düzenleyebilir mi?
 *
 * İşletme de kendi mutfağının profilini düzenleyebiliyor — profil sayfası
 * ikisinde de aynı: hikâye, sertifikalar, alım adresi. Ama yalnızca SAHİBİ:
 * bu kapıdan ürün yönetimi, fiyat değişikliği ve yorum yanıtları da geçiyor
 * (bkz. app/panel/urun-actions.ts, fiyat-actions.ts, yorum-yonetim-actions.ts).
 */
export function duzenleyebilirMi(oturum: Oturum | null, restoranSlug: string): boolean {
  if (!oturum) return false;
  if (oturum.rol === "admin") return true;
  if (!mutfakSahibiMi(oturum.rol) || oturum.restoranSlug !== restoranSlug) return false;
  return oturum.rol !== "isletme" || isletmeSahibiMi(oturum);
}

/** Rolüne göre kullanıcının ana ekranı. */
export function rolAnaSayfasi(rol: Rol): string {
  if (rol === "admin") return "/admin";
  if (rol === "musteri") return "/hesabim";
  if (rol === "isletme") return "/isletme";
  return "/panel";
}
