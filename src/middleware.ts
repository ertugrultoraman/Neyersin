import { NextResponse, type NextRequest } from "next/server";

/**
 * KAPALI MOD.
 *
 * `BAKIM_MODU` açıkken site dışarıya TAMAMEN KAPALI: her istek, tarayıcının
 * "Bu siteye ulaşılamıyor" ağ hatası ekranının bir kopyasını 404 durum koduyla
 * alıyor (bkz. `ulasilamiyor`). Bilerek "bakımdayız" demiyoruz — kapalı ama var
 * olduğunu söyleyen bir sayfa, tarayan birine "burada çalışan bir uygulama var,
 * sonra tekrar gel" demek olurdu.
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

/** Mobil uygulamaların tek giriş kapısı — bkz. `mobilDali`. */
const MOBIL_ONEKI = "/api/mobil/";

/**
 * Bakım modundayken mobil API açık kalsın mı?
 *
 * Varsayılan KAPALI. Site kapatmak bilinçli bir karar; API'yi otomatik açık
 * bırakmak, kapatılan sitenin katalogunu (restoranlar, menüler, fiyatlar)
 * `/api/mobil/v1/restoranlar` adresinden herkese açık tutmak olurdu — yani
 * kapıyı kapatıp pencereyi açık bırakmak.
 *
 * Geliştirme sırasında `.env.local` içinde 1 yapılıyor; uygulama canlıya
 * çıkacağı zaman Vercel'de de açılacak.
 */
function mobilBakimdaAcikMi(): boolean {
  const deger = (process.env.MOBIL_BAKIMDA_ACIK ?? "").trim().toLowerCase();
  return deger !== "" && deger !== "0" && deger !== "false" && deger !== "kapali";
}

/**
 * Bakım modu YALNIZCA ortam değişkeniyle açılıyor; kaynakta varsayılanı yok.
 *
 * Bir ara `?? "1"` yazılmıştı — değişkeni tanımlanmamış her ortam (yeni bir
 * önizleme dağıtımı, temiz bir kopya) kendini ziyaretçilere kapalı bulurdu.
 * Siteyi kapatmak bilinçli bir karar; varsayılanı açık olmalı.
 */
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
 * Ziyaretçinin ADRES ÇUBUĞUNDA duran adres.
 *
 * `nextUrl` işe yaramıyor: önde bir vekil var (yerelde `scripts/https-sunucu.mjs`,
 * üretimde Vercel) ve orası iç sunucuyu — `http://localhost:3000` — gösteriyor.
 * Hata ekranında "localhost yazımında hata olup olmadığını kontrol edin" yazıyor,
 * gizli açma adresinin yönlendirmesi de iç adrese gidip tarayıcıda SSL hatasına
 * dönüşüyordu.
 *
 * Başlıklar ziyaretçiden geldiği için alan adı KISITLI bir karakter kümesine
 * indirgeniyor — buradan üretilen kök, yönlendirme adresi olarak kullanılıyor.
 */
function ziyaretciAdresi(istek: NextRequest): { alan: string; kok: string; guvenli: boolean } {
  const hamKonak =
    istek.headers.get("x-forwarded-host") ?? istek.headers.get("host") ?? istek.nextUrl.host;
  const konak =
    (hamKonak.split(",")[0] ?? "").trim().replace(/[^a-zA-Z0-9.:-]/g, "").slice(0, 100) ||
    istek.nextUrl.host;

  const hamSema =
    (istek.headers.get("x-forwarded-proto") ?? "").split(",")[0].trim() ||
    istek.nextUrl.protocol.replace(":", "");
  const guvenli = hamSema === "https";

  return { alan: konak.split(":")[0], kok: `${guvenli ? "https" : "http"}://${konak}`, guvenli };
}

/**
 * "Bu siteye ulaşılamıyor" — tarayıcının ağ hata ekranının kopyası.
 *
 * Kapalıyken ziyaretçi, adresin arkasında hiçbir şey yokmuş izlenimi alsın
 * isteniyor. Önceden düz bir 404 gövdesi dönülüyordu; o da bilgi vermiyordu ama
 * "sunucu var, sayfa yok" diyordu.
 *
 * NEDEN KOPYA, GERÇEĞİ DEĞİL: ekrandaki `DNS_PROBE_FINISHED_NXDOMAIN` satırını
 * tarayıcı yalnızca ALAN ADI ÇÖZÜLEMEDİĞİNDE yazar — yani hiçbir sunucuya
 * ulaşamadan. Bu kod çalıştığında bağlantı çoktan kurulmuş olduğu için o
 * satırı sunucu tarafından ürettirmek mümkün değil. Bağlantıyı düşürmek aynı
 * ekranı getirirdi ama kod satırı `ERR_CONNECTION_RESET` olurdu ve Vercel'de
 * ara katman bir cevap döndürmek zorunda olduğu için orada hiç çalışmazdı.
 * Kopya, her iki ortamda da aynı görünen tek çözüm.
 *
 * SINIRLARI: adres çubuğu hâlâ siteyi gösterir ve sayfa gerçek bir cevapla
 * gelir; bakan kişi isterse ayırt edebilir. Amaç kimseyi kandırmak değil,
 * kapalı bir siteyi ilgi çekmeden kapalı tutmak.
 *
 * Durum kodu 404 kalıyor: arama motorları için "burada bir şey yok" demenin
 * doğru yolu o.
 */
function ulasilamiyor(istek: NextRequest): NextResponse {
  const { alan } = ziyaretciAdresi(istek);

  const govde = `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${alan}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; padding: 0;
    font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #fff; color: #202124;
  }
  .kap { max-width: 600px; margin: 0 auto; padding: 100px 24px 0; }
  .ikon { width: 72px; height: 72px; margin-bottom: 28px; }
  h1 { font-size: 1.6rem; font-weight: 400; line-height: 1.3; margin: 0 0 16px; }
  p { font-size: 0.95rem; line-height: 1.65; margin: 0 0 12px; color: #5f6368; }
  .mavi { color: #1a73e8; }
  .kod { font-size: 0.8rem; color: #5f6368; margin-top: 24px; letter-spacing: .02em; }
  .dugme {
    display: inline-block; margin-top: 36px; padding: 9px 20px; border-radius: 20px;
    background: #1a73e8; color: #fff; font-size: 0.9rem; text-decoration: none;
  }
  .dugme:hover { background: #1b66c9; }
  @media (prefers-color-scheme: dark) {
    body { background: #202124; color: #e8eaed; }
    p, .kod { color: #9aa0a6; }
    .dugme { background: #8ab4f8; color: #202124; }
    .dugme:hover { background: #a8c7fa; }
  }
</style>
</head><body>
  <div class="kap">
    <svg class="ikon" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M9 6h33l21 21v39a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"
            stroke="#9aa0a6" stroke-width="4" stroke-linejoin="round"/>
      <path d="M42 6v21h21" stroke="#9aa0a6" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="26" cy="42" r="2.6" fill="#9aa0a6"/>
      <circle cx="44" cy="42" r="2.6" fill="#9aa0a6"/>
      <path d="M27 57c2.6-3.4 6-5.1 9-5.1s6.4 1.7 9 5.1"
            stroke="#9aa0a6" stroke-width="4" stroke-linecap="round"/>
    </svg>
    <h1>Bu siteye ulaşılamıyor</h1>
    <p>${alan} yazımında hata olup olmadığını kontrol edin.</p>
    <p>Yazım doğruysa <span class="mavi">Windows Ağ Teşhisi</span>'ni çalıştırmayı deneyin.</p>
    <p class="kod">DNS_PROBE_FINISHED_NXDOMAIN</p>
    <a class="dugme" href="/">Yeniden Yükle</a>
  </div>
</body></html>`;

  return new NextResponse(govde, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      // Kapalıyken hiçbir sayfa indekslenmesin.
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * MOBİL API — bakım modundan ayrı yönetilen dal.
 *
 * Native uygulama `ulasilamiyor()` sayfasını ASLA almamalı: gövde HTML olduğu
 * için JSON çözümleyici patlıyor ve uygulama "sunucuya ulaşılamadı" diyor.
 * Oysa durum belli — sistem kapalı. Uygulamanın kullanıcıya doğru şeyi
 * söyleyebilmesi için makinece okunabilir bir 503 dönüyor.
 *
 * 503 + `Retry-After` bilinçli: 404 "böyle bir şey yok" demek olurdu ve
 * uygulama sunucu adresini yanlış sanardı.
 */
function mobilDali(): NextResponse | null {
  if (!bakimAcikMi() || mobilBakimdaAcikMi()) return NextResponse.next();

  return NextResponse.json(
    {
      tamam: false,
      hata: {
        kod: "bakimda",
        mesaj: "Ne Yersin şu anda bakımda. Kısa süre içinde yeniden açılacak.",
      },
    },
    {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "600" },
    },
  );
}

export async function middleware(istek: NextRequest) {
  const yol = istek.nextUrl.pathname;

  /*
   * Mobil dalı bakım kontrolünden ÖNCE geliyor: uygulama kapalıyken de bir
   * cevap alabilmeli, sadece cevabın türü değişiyor.
   */
  if (yol.startsWith(MOBIL_ONEKI)) {
    const cevap = mobilDali();
    if (cevap) return cevap;
  }

  if (!bakimAcikMi()) return NextResponse.next();
  /*
   * Anahtarın kaynakta varsayılanı YOK ve olmamalı: bu dosya depoya gidiyor,
   * .env.local gitmiyor. Buraya yazılan bir anahtar, depoyu görebilen herkese
   * bakım modunu atlama adresini vermek demek.
   */
  const anahtar = (process.env.BAKIM_ANAHTARI ?? "").trim();

  /*
   * GİZLİ AÇMA ADRESİ. `/<anahtar>` açılınca bilet çerezi yazılıp ana sayfaya
   * dönülüyor; adres çubuğunda anahtar kalmıyor (geçmişe/loglara düşmesin).
   */
  if (anahtar.length >= 16 && yol === `/${anahtar}`) {
    /*
     * Hedef, ZİYARETÇİNİN adresinden kuruluyor. Eskiden `nextUrl` kopyalanıyordu;
     * vekil arkasında o adres iç sunucuyu gösterdiği için tarayıcı
     * `http://localhost:3000/`e gitmeye çalışıp SSL hatası alıyordu — bilet
     * çerezi yazılıyor ama kişi siteye düşemiyordu.
     *
     * Göreli "/" de olmuyor: ara katman `Location` alanında MUTLAK adres
     * istiyor, aksi hâlde istek 500'e düşüyor.
     */
    const { kok, guvenli } = ziyaretciAdresi(istek);
    const cevap = NextResponse.redirect(`${kok}/`, 307);
    cevap.cookies.set(BILET_COOKIE, anahtar, {
      httpOnly: true,
      sameSite: "lax",
      secure: guvenli,
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

  return ulasilamiyor(istek);
}

export const config = {
  /** Statik dosyalar ara katmandan geçmiyor — boşuna maliyet çıkarmasınlar. */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
