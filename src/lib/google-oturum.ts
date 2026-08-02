import crypto from "node:crypto";

/**
 * "Google ile devam et" — OAuth 2.0 / OpenID Connect yönlendirme akışı.
 *
 * Neden JS kütüphanesi (Google Identity Services) değil de sunucu tarafı
 * yönlendirme: tarayıcıya üçüncü taraf betiği eklemek gerekmiyor, mevcut sıkı
 * CSP'ye dokunulmuyor ve kimlik doğrulama tamamen sunucuda kalıyor.
 *
 * Gerekli ortam değişkenleri:
 *   GOOGLE_ISTEMCI_ID       Google Cloud Console → OAuth istemci kimliği
 *   GOOGLE_ISTEMCI_SIRRI    aynı ekrandaki istemci sırrı
 *   GOOGLE_YONLENDIRME      (isteğe bağlı) tam geri dönüş adresi. Verilmezse
 *                           istekten türetilir. Google, kayıtlı adresle
 *                           BİREBİR eşleşme aradığı için sabitlemek güvenli.
 *
 * Hiçbiri tanımlı değilse özellik kapalıdır; giriş ekranında düğme çıkmaz.
 */

const YETKI_UCU = "https://accounts.google.com/o/oauth2/v2/auth";
const JETON_UCU = "https://oauth2.googleapis.com/token";
const BEKLENEN_ISS = ["https://accounts.google.com", "accounts.google.com"];

/** Durum çerezi: CSRF koruması + dönüş yolu, 10 dakika ömürlü. */
export const DURUM_COOKIE = "ny_google_durum";
export const DURUM_SURESI_SN = 600;

export function googleYapilandirildiMi(): boolean {
  return Boolean(process.env.GOOGLE_ISTEMCI_ID && process.env.GOOGLE_ISTEMCI_SIRRI);
}

/**
 * Geri dönüş adresi. Ortam değişkeni varsa o kullanılır; yoksa isteğin
 * kendisinden türetilir — vekil arkasında çalıştığımız için şema ve alan adı
 * `x-forwarded-*` başlıklarından okunuyor.
 */
/**
 * Sitenin DIŞARIDAN görünen kökü (şema + alan adı).
 *
 * `new URL(istek.url).origin` KULLANILAMAZ: HTTPS vekilinin arkasında Next
 * isteği 127.0.0.1:3000'de karşılıyor ve origin "https://localhost:3000"
 * çıkıyordu — yönlendirmeler kullanıcıyı var olmayan bir adrese atıyordu.
 * Vekil `x-forwarded-proto` ve `x-forwarded-host` gönderiyor; doğrusu onlar.
 */
export function siteKoku(istek: Request): string {
  const bas = istek.headers;
  const alan = bas.get("x-forwarded-host") ?? bas.get("host") ?? "localhost:3000";
  const sema =
    bas.get("x-forwarded-proto") ??
    (alan.startsWith("localhost") || alan.startsWith("127.0.0.1") ? "http" : "https");
  return `${sema}://${alan}`;
}

export function yonlendirmeAdresi(istek: Request): string {
  const sabit = process.env.GOOGLE_YONLENDIRME?.trim();
  if (sabit) return sabit;
  return `${siteKoku(istek)}/api/oturum/google/callback`;
}

export type DurumYuku = { durum: string; nonce: string; donus: string };

/**
 * Sabit zamanlı karşılaştırma. `===` ile karşılaştırmak teoride durumu
 * karakter karakter tahmin etmeye kapı aralar; maliyeti sıfır olduğu için
 * doğrusu yapılıyor.
 */
export function esitMi(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length || x.length === 0) return false;
  return crypto.timingSafeEqual(x, y);
}

/** Çerezde saklanacak durum bilgisi — imzalı değil, karşılaştırmalı. */
export function durumUret(donus: string): DurumYuku {
  return {
    durum: crypto.randomBytes(24).toString("base64url"),
    nonce: crypto.randomBytes(16).toString("base64url"),
    donus,
  };
}

export function yetkiAdresi(istek: Request, yuk: DurumYuku): string {
  const parametreler = new URLSearchParams({
    client_id: process.env.GOOGLE_ISTEMCI_ID ?? "",
    redirect_uri: yonlendirmeAdresi(istek),
    response_type: "code",
    scope: "openid email profile",
    state: yuk.durum,
    nonce: yuk.nonce,
    // Hesap seçtirir; tek Google hesabı olanlarda da yanlış hesapla girilmesini önler.
    prompt: "select_account",
  });
  return `${YETKI_UCU}?${parametreler.toString()}`;
}

export type GoogleKimligi = {
  eposta: string;
  ad: string;
  epostaDogrulandi: boolean;
};

type JetonCevabi = { id_token?: string; error?: string; error_description?: string };

/** JWT'nin yük kısmını çözer. İmza doğrulaması bilinçli olarak yapılmıyor (aşağıya bak). */
function yukuCoz(idToken: string): Record<string, unknown> | null {
  const parcalar = idToken.split(".");
  if (parcalar.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parcalar[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export type KimlikSonucu =
  | { basarili: true; kimlik: GoogleKimligi }
  | { basarili: false; hata: string };

/**
 * Yetki kodunu kimlik bilgisine çevirir.
 *
 * ID belirteci Google'ın jeton ucundan, TLS üzerinden ve istemci sırrımızla
 * doğrudan alındığı için imza ayrıca doğrulanmıyor (Google'ın kendi önerisi).
 * Buna karşılık `iss`, `aud`, `exp`, `nonce` ve `email_verified` alanlarının
 * hepsi denetleniyor — biri tutmazsa giriş reddedilir.
 */
export async function kimligiAl(
  istek: Request,
  kod: string,
  nonce: string,
): Promise<KimlikSonucu> {
  if (!googleYapilandirildiMi()) {
    return { basarili: false, hata: "Google girişi yapılandırılmadı." };
  }

  let cevap: JetonCevabi;
  try {
    const istekCevabi = await fetch(JETON_UCU, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: kod,
        client_id: process.env.GOOGLE_ISTEMCI_ID ?? "",
        client_secret: process.env.GOOGLE_ISTEMCI_SIRRI ?? "",
        redirect_uri: yonlendirmeAdresi(istek),
        grant_type: "authorization_code",
      }),
    });
    cevap = (await istekCevabi.json()) as JetonCevabi;
  } catch {
    return { basarili: false, hata: "Google'a ulaşılamadı. Biraz sonra tekrar dene." };
  }

  if (!cevap.id_token) {
    return { basarili: false, hata: "Google girişi tamamlanamadı." };
  }

  const yuk = yukuCoz(cevap.id_token);
  if (!yuk) return { basarili: false, hata: "Google yanıtı okunamadı." };

  const iss = String(yuk.iss ?? "");
  const aud = String(yuk.aud ?? "");
  const exp = Number(yuk.exp ?? 0);

  if (!BEKLENEN_ISS.includes(iss)) return { basarili: false, hata: "Google kimliği doğrulanamadı." };
  if (aud !== process.env.GOOGLE_ISTEMCI_ID) {
    return { basarili: false, hata: "Google kimliği bu siteye ait değil." };
  }
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
    return { basarili: false, hata: "Google oturumunun süresi dolmuş. Tekrar dene." };
  }
  if (String(yuk.nonce ?? "") !== nonce) {
    return { basarili: false, hata: "Google yanıtı bu istekle eşleşmiyor." };
  }

  const eposta = String(yuk.email ?? "").trim().toLowerCase();
  if (!eposta.includes("@")) return { basarili: false, hata: "Google hesabında e-posta yok." };

  /*
   * Doğrulanmamış adresi kabul etmek, başkasının adresini kendi Google
   * hesabına yazıp o kişinin hesabını devralmaya yol açardı.
   */
  if (yuk.email_verified !== true) {
    return { basarili: false, hata: "Google hesabındaki e-posta doğrulanmamış." };
  }

  const ad = String(yuk.name ?? "").trim() || eposta.split("@")[0];
  return { basarili: true, kimlik: { eposta, ad, epostaDogrulandi: true } };
}
