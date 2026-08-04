import { NextResponse, type NextRequest } from "next/server";

/**
 * KAPALI MOD.
 *
 * `BAKIM_MODU` açıkken site dışarıya TAMAMEN KAPALI: her istek düz bir
 * **404** alıyor. Bilerek "bakımdayız" demiyoruz — kapalı ama var olduğunu
 * söyleyen bir sayfa, tarayan birine "burada çalışan bir uygulama var, sonra
 * tekrar gel" demek olurdu. 404, arkasında bir şey olmadığını söyler.
 *
 * Yönetici girişi de dahil HİÇBİR yol açık değil. İçeri girmenin tek yolu
 * `BAKIM_ANAHTARI` gizli adresi: `https://site/<anahtar>` bir kez açılınca
 * tarayıcıya bir bilet çerezi yazılıyor ve o tarayıcı siteyi normal görüyor.
 * Zaten giriş yapmış yöneticinin oturum çerezi de kabul ediliyor.
 *
 * Arkadaki hiçbir veri silinmiyor — yalnızca dışarıya kapı kapalı.
 * Açmak için: Vercel'de `BAKIM_MODU` değişkenini sil (ya da 0 yap).
 */

const OTURUM_COOKIE = "ny_oturum";
const BILET_COOKIE = "ny_bilet";
const BILET_GUN = 30;

function bakimAcikMi(): boolean {
  const deger = (process.env.BAKIM_MODU ?? "").trim().toLowerCase();
  return deger !== "" && deger !== "0" && deger !== "false" && deger !== "kapali";
}

const kodlayici = new TextEncoder();

function base64url(tampon: ArrayBuffer): string {
  let ham = "";
  for (const bayt of new Uint8Array(tampon)) ham += String.fromCharCode(bayt);
  return btoa(ham).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(metin: string): Promise<string> {
  const ozet = await crypto.subtle.digest("SHA-256", kodlayici.encode(metin));
  return [...new Uint8Array(ozet)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Uzunluk sızdırmayan karşılaştırma — anahtar tahmin turlarıyla ölçülmesin. */
function esitMi(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

/**
 * Oturum imza anahtarı — `src/lib/oturum.ts` ile AYNI türetme.
 * Orada değişirse burası da değişmeli.
 */
async function oturumAnahtari(): Promise<string | null> {
  const acik = process.env.ADMIN_SESSION_SECRET;
  if (acik && acik.length >= 16) return acik;

  const parola = process.env.ADMIN_PASSWORD ?? "";
  if (parola.length > 0) return sha256Hex(`ny-oturum:${parola}`);

  return null;
}

/** Çerez gerçekten imzalı ve süresi geçmemiş bir YÖNETİCİ oturumu mu? */
async function yoneticiOturumu(jeton: string | undefined): Promise<boolean> {
  if (!jeton) return false;
  const parcalar = jeton.split(".");
  if (parcalar.length !== 2) return false;
  const [kodlu, imza] = parcalar;

  const anahtar = await oturumAnahtari();
  if (!anahtar) return false;

  try {
    const anahtarNesnesi = await crypto.subtle.importKey(
      "raw",
      kodlayici.encode(anahtar),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const beklenen = base64url(
      await crypto.subtle.sign("HMAC", anahtarNesnesi, kodlayici.encode(kodlu)),
    );
    if (!esitMi(beklenen, imza)) return false;

    const yuk = JSON.parse(atob(kodlu.replace(/-/g, "+").replace(/_/g, "/"))) as {
      rol?: string;
      bitis?: number;
    };
    if (typeof yuk.bitis !== "number" || yuk.bitis < Math.floor(Date.now() / 1000)) return false;
    return yuk.rol === "admin";
  } catch {
    return false;
  }
}

/**
 * Düz 404 — sunucunun kendi hata sayfası gibi görünüyor.
 *
 * Marka adı, çerçeve izi, "yakında" ibaresi yok; tarayan biri buradan hiçbir
 * şey öğrenemesin.
 */
function bulunamadi(): NextResponse {
  return new NextResponse(
    "<!doctype html><html><head><title>404 Not Found</title></head>" +
      "<body><h1>Not Found</h1><p>The requested URL was not found on this server.</p></body></html>",
    {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        // Kapalıyken hiçbir sayfa indekslenmesin.
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

export async function middleware(istek: NextRequest) {
  if (!bakimAcikMi()) return NextResponse.next();

  const yol = istek.nextUrl.pathname;
  const anahtar = (process.env.BAKIM_ANAHTARI ?? "").trim();

  /*
   * GİZLİ AÇMA ADRESİ. `/<anahtar>` açılınca bilet çerezi yazılıp ana sayfaya
   * dönülüyor; adres çubuğunda anahtar kalmıyor (geçmişe/loglara düşmesin).
   */
  if (anahtar.length >= 16 && yol === `/${anahtar}`) {
    const hedef = istek.nextUrl.clone();
    hedef.pathname = "/";
    hedef.search = "";
    const cevap = NextResponse.redirect(hedef);
    cevap.cookies.set(BILET_COOKIE, anahtar, {
      httpOnly: true,
      sameSite: "lax",
      secure: istek.nextUrl.protocol === "https:",
      path: "/",
      maxAge: BILET_GUN * 24 * 60 * 60,
    });
    return cevap;
  }

  const bilet = istek.cookies.get(BILET_COOKIE)?.value ?? "";
  if (anahtar.length >= 16 && esitMi(bilet, anahtar)) return NextResponse.next();

  if (await yoneticiOturumu(istek.cookies.get(OTURUM_COOKIE)?.value)) {
    return NextResponse.next();
  }

  return bulunamadi();
}

export const config = {
  /** Statik dosyalar ara katmandan geçmiyor — boşuna maliyet çıkarmasınlar. */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
