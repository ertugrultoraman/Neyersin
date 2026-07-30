import crypto from "node:crypto";

import { cookies } from "next/headers";

/**
 * Admin oturumu.
 *
 * Tasarım kararları:
 *  - Kullanıcı tablosu yok; yönetici listesi ortam değişkeninden gelir. Tek
 *    kişilik bir panel için veritabanı kullanıcı yönetimi gereksiz karmaşıklık.
 *  - Parola ASLA kodda tutulmaz. `ADMIN_PASSWORD` tanımlı değilse panel
 *    kapalıdır — varsayılan parola ile açık bırakmak kabul edilemez.
 *  - Oturum çerezi HMAC-SHA256 ile imzalanır; sunucuda durum tutulmaz.
 *  - Parola karşılaştırması sabit zamanlı (timingSafeEqual).
 */

const COOKIE_ADI = "ny_admin";
const OTURUM_SURESI_SN = 60 * 60 * 8; // 8 saat

/** Varsayılan yönetici — kullanıcının talebi üzerine tanımlı. */
const VARSAYILAN_ADMINLER = ["ertugrultoraman@hotmail.com"];

export function adminEpostalari(): string[] {
  const ham = process.env.ADMIN_EMAILS;
  const liste = ham
    ? ham.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : VARSAYILAN_ADMINLER;
  return liste.length > 0 ? liste : VARSAYILAN_ADMINLER;
}

export function adminMi(eposta: string): boolean {
  return adminEpostalari().includes(eposta.trim().toLowerCase());
}

/** Parola tanımlı değilse panel tamamen kapalı. */
export function adminYapilandirildiMi(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length > 0;
}

function oturumAnahtari(): string {
  /**
   * ADMIN_SESSION_SECRET verilmezse paroladan türetilir. Bu, parola
   * değiştiğinde tüm oturumların geçersiz olması gibi faydalı bir yan etki
   * üretir; ayrı bir sır yönetmek zorunlu değildir.
   */
  const acik = process.env.ADMIN_SESSION_SECRET;
  if (acik && acik.length >= 16) return acik;
  return crypto
    .createHash("sha256")
    .update(`ny-admin-oturum:${process.env.ADMIN_PASSWORD ?? ""}`)
    .digest("hex");
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

export type Oturum = { eposta: string; bitis: number };

function jetonUret(eposta: string): string {
  const yuk: Oturum = {
    eposta: eposta.toLowerCase(),
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
    if (!adminMi(yuk.eposta)) return null;
    return yuk;
  } catch {
    return null;
  }
}

/** Girişi doğrular; başarılıysa oturum çerezini yazar. */
export async function girisYap(
  eposta: string,
  parola: string,
): Promise<{ basarili: true } | { basarili: false; hata: string }> {
  if (!adminYapilandirildiMi()) {
    return { basarili: false, hata: "Admin paneli yapılandırılmadı (ADMIN_PASSWORD eksik)." };
  }

  const temizEposta = (eposta ?? "").trim().toLowerCase();
  const beklenenParola = process.env.ADMIN_PASSWORD ?? "";

  // E-posta ve parola ayrı ayrı doğru/yanlış bilgisi verilmez — aynı mesaj döner.
  const epostaTamam = adminMi(temizEposta);
  const parolaTamam = sabitZamanliEsit(parola ?? "", beklenenParola);

  if (!epostaTamam || !parolaTamam) {
    return { basarili: false, hata: "E-posta veya parola hatalı." };
  }

  const cerezler = await cookies();
  cerezler.set(COOKIE_ADI, jetonUret(temizEposta), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OTURUM_SURESI_SN,
  });

  return { basarili: true };
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
