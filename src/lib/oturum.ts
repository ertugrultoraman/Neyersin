import crypto from "node:crypto";

import { cookies, headers } from "next/headers";

import { hesapDepoAl, parolaDogrula, type Rol } from "./hesaplar";

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

/** Parola tanımlı değilse yönetici girişi kapalı (şef girişi etkilenmez). */
export function adminYapilandirildiMi(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length > 0;
}

/** Süreç ömrü boyunca sabit, yapılandırma yoksa kullanılan yedek anahtar. */
const GECICI_ANAHTAR = crypto.randomBytes(32).toString("hex");

function oturumAnahtari(): string {
  const acik = process.env.ADMIN_SESSION_SECRET;
  if (acik && acik.length >= 16) return acik;

  const parola = process.env.ADMIN_PASSWORD ?? "";
  if (parola.length > 0) {
    return crypto.createHash("sha256").update(`ny-oturum:${parola}`).digest("hex");
  }
  return GECICI_ANAHTAR;
}

function b64url(veri: string | Buffer): string {
  return Buffer.from(veri).toString("base64url");
}

function imzala(yuk: string): string {
  return crypto.createHmac("sha256", oturumAnahtari()).update(yuk).digest("base64url");
}

function sabitZamanliEsit(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export type Oturum = {
  eposta: string;
  ad: string;
  rol: Rol;
  /** Şef ise düzenleme yetkisi olan tek restoran. */
  restoranSlug?: string;
  bitis: number;
};

function jetonUret(oturum: Omit<Oturum, "bitis">): string {
  const yuk: Oturum = {
    ...oturum,
    eposta: oturum.eposta.toLowerCase(),
    bitis: Math.floor(Date.now() / 1000) + OTURUM_SURESI_SN,
  };
  const kodlu = b64url(JSON.stringify(yuk));
  return `${kodlu}.${imzala(kodlu)}`;
}

function jetonCoz(jeton: string): Oturum | null {
  const parcalar = jeton.split(".");
  if (parcalar.length !== 2) return null;
  const [kodlu, imza] = parcalar;

  if (!sabitZamanliEsit(imza, imzala(kodlu))) return null;

  try {
    const yuk = JSON.parse(Buffer.from(kodlu, "base64url").toString("utf8")) as Oturum;
    if (typeof yuk.bitis !== "number" || yuk.bitis < Math.floor(Date.now() / 1000)) return null;
    // Yönetici listesinden çıkarılan biri, çerezi geçerli olsa da admin kalmasın.
    if (yuk.rol === "admin" && !adminMi(yuk.eposta)) return null;
    if (!["admin", "sef", "kurye", "musteri"].includes(yuk.rol)) return null;
    return yuk;
  } catch {
    return null;
  }
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

/**
 * Tek giriş kapısı: önce yönetici, sonra şef hesabı denenir.
 * Hangi adımda takıldığı dışarı sızdırılmaz — her hatada aynı mesaj döner.
 */
export async function girisYap(kimlik: string, parola: string): Promise<GirisSonuc> {
  const temizKimlik = (kimlik ?? "").trim().toLowerCase();
  const HATA = "Kullanıcı adı/e-posta veya parola hatalı.";

  if (adminMi(temizKimlik)) {
    if (!adminYapilandirildiMi()) {
      return { basarili: false, hata: "Yönetici girişi yapılandırılmadı (ADMIN_PASSWORD eksik)." };
    }
    if (!sabitZamanliEsit(parola ?? "", process.env.ADMIN_PASSWORD ?? "")) {
      return { basarili: false, hata: HATA };
    }
    await cerezeYaz({ eposta: temizKimlik, ad: "Yönetici", rol: "admin" });
    return { basarili: true, rol: "admin" };
  }

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(temizKimlik);
  if (!hesap || !(await parolaDogrula(parola ?? "", hesap.parolaHash))) {
    return { basarili: false, hata: HATA };
  }

  await cerezeYaz({
    eposta: hesap.eposta,
    ad: hesap.ad,
    rol: hesap.rol,
    restoranSlug: hesap.restoranSlug,
  });
  return { basarili: true, rol: hesap.rol };
}

/** Kayıt sonrası kullanıcıyı doğrudan içeri alır. */
export async function oturumAc(oturum: Omit<Oturum, "bitis">): Promise<void> {
  await cerezeYaz(oturum);
}

export async function cikisYap(): Promise<void> {
  const cerezler = await cookies();
  cerezler.delete(COOKIE_ADI);
}

/** Geçerli oturumu döner, yoksa null. */
export async function oturumAl(): Promise<Oturum | null> {
  const cerezler = await cookies();
  const jeton = cerezler.get(COOKIE_ADI)?.value;
  if (!jeton) return null;
  return jetonCoz(jeton);
}

/** Bu oturum, verilen restoran profilini düzenleyebilir mi? */
export function duzenleyebilirMi(oturum: Oturum | null, restoranSlug: string): boolean {
  if (!oturum) return false;
  if (oturum.rol === "admin") return true;
  return oturum.rol === "sef" && oturum.restoranSlug === restoranSlug;
}

/** Rolüne göre kullanıcının ana ekranı. */
export function rolAnaSayfasi(rol: Rol): string {
  if (rol === "admin") return "/admin";
  if (rol === "musteri") return "/hesabim";
  return "/panel";
}
