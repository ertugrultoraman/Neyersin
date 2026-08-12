import { alanAnahtari, jetonAc, jetonPaketle } from "../imza";
import { rolMu, type Rol } from "../hesaplar";
import { adminMi, oturumAnahtari } from "../oturum";

/**
 * MOBİL JETONLARI — native uygulamanın oturum taşıyıcısı.
 *
 * Neden çerez değil: `lib/oturum.ts` oturumu `HttpOnly` çerezle taşıyor ve bu
 * tarayıcı için doğru karar. Native uygulamada çerez kavramı yok; jeton
 * `Authorization: Bearer …` başlığıyla gidiyor ve cihazda güvenli alanda
 * (iOS Keychain / Android Keystore, expo-secure-store) saklanıyor.
 *
 * İKİ JETON, İKİ FARKLI ÖMÜR:
 *
 *  - ERİŞİM (1 saat)   — her isteğe eklenen jeton. Rol, mutfak ve yetki
 *    bilgisini İÇİNDE taşıyor ki her istekte veritabanına gidilmesin.
 *  - YENİLEME (180 gün) — yalnızca yeni erişim jetonu almaya yarar. İçinde
 *    rol YOK; sadece kim olduğu ve hangi cihaz olduğu yazıyor.
 *
 * Ömürlerin bu şekilde ayrılmasının sebebi YETKİ TAZELİĞİ. Jetonlar durum
 * tutmadığı için tek tek geri çağrılamıyor; içindeki rol, yazıldığı andaki
 * rol. Tek uzun ömürlü jeton kullansaydık, yöneticinin düşürdüğü bir yetki
 * aylarca geçerli kalırdı. Yenileme akışı hesabı veritabanından TEKRAR
 * okuduğu için yetki değişikliği en geç bir saat içinde uygulamaya yansıyor —
 * web çerezinin 8 saatlik penceresinden de dar.
 *
 * Kullanıcı bu bir saati hiç görmüyor: istemci 401 alınca yenileme jetonuyla
 * sessizce tazeleyip isteği tekrarlıyor (bkz. packages/ortak/src/api/istemci.ts).
 */

const ERISIM_SURESI_SN = 60 * 60; // 1 saat
const YENILEME_SURESI_SN = 180 * 24 * 60 * 60; // 180 gün

/**
 * Alan ayrımı: mobil jetonları web çerezinden FARKLI bir anahtarla imzalanıyor.
 *
 * Aynı anahtar kullanılsaydı, ele geçirilen bir mobil erişim jetonu çerez
 * olarak yapıştırıldığında web tarafında da geçerli olurdu — mobil jeton çok
 * daha uzun süre cihazda durduğu için bu gereksiz bir risk.
 */
function erisimAnahtari(): string {
  return alanAnahtari("ny-mobil-erisim", oturumAnahtari());
}

function yenilemeAnahtari(): string {
  return alanAnahtari("ny-mobil-yenileme", oturumAnahtari());
}

/** Erişim jetonunun gövdesi — oturumun tamamı. */
export type MobilOturum = {
  tur: "erisim";
  eposta: string;
  ad: string;
  rol: Rol;
  restoranSlug?: string;
  isletmeYetkisi?: "sahip" | "calisan";
  /** Hangi cihaz — çıkışta ve push jetonu eşlemesinde kullanılıyor. */
  cihaz: string;
  sonKullanma: number;
};

/** Yenileme jetonunun gövdesi — bilerek yetkisiz, yalnızca kimlik. */
export type YenilemeYuku = {
  tur: "yenileme";
  eposta: string;
  cihaz: string;
  sonKullanma: number;
};

export type OturumBilgisi = Omit<MobilOturum, "tur" | "sonKullanma" | "cihaz">;

function simdi(): number {
  return Math.floor(Date.now() / 1000);
}

export function erisimJetonuUret(bilgi: OturumBilgisi, cihaz: string): string {
  const yuk: MobilOturum = {
    ...bilgi,
    tur: "erisim",
    eposta: bilgi.eposta.toLowerCase(),
    cihaz,
    sonKullanma: simdi() + ERISIM_SURESI_SN,
  };
  return jetonPaketle(yuk, erisimAnahtari());
}

export function yenilemeJetonuUret(eposta: string, cihaz: string): string {
  const yuk: YenilemeYuku = {
    tur: "yenileme",
    eposta: eposta.toLowerCase(),
    cihaz,
    sonKullanma: simdi() + YENILEME_SURESI_SN,
  };
  return jetonPaketle(yuk, yenilemeAnahtari());
}

/** İki jetonu birlikte üretir — giriş ve yenileme uçları bunu döner. */
export function jetonCiftiUret(bilgi: OturumBilgisi, cihaz: string) {
  return {
    erisimJetonu: erisimJetonuUret(bilgi, cihaz),
    yenilemeJetonu: yenilemeJetonuUret(bilgi.eposta, cihaz),
    /** İstemci saatini sunucuya güvenmeden ayarlayabilsin diye saniye cinsinden. */
    erisimSuresi: ERISIM_SURESI_SN,
  };
}

export function erisimJetonuCoz(jeton: string): MobilOturum | null {
  const yuk = jetonAc<MobilOturum>(jeton, erisimAnahtari());
  if (!yuk) return null;

  /*
   * `tur` kontrolü şart. Anahtarlar ayrı olduğu için yenileme jetonu buraya
   * zaten düşmez; yine de tür alanı jetonun ne olduğunu jetonun KENDİSİNDE
   * yazıyor — ileride anahtar türetme sadeleştirilirse bu satır tek başına
   * karışmayı engeller.
   */
  if (yuk.tur !== "erisim") return null;
  if (typeof yuk.sonKullanma !== "number" || yuk.sonKullanma < simdi()) return null;
  if (!rolMu(yuk.rol)) return null;
  // Yönetici listesinden çıkarılan biri jetonu geçerli olsa da admin kalmasın.
  if (yuk.rol === "admin" && !adminMi(yuk.eposta)) return null;

  return yuk;
}

export function yenilemeJetonuCoz(jeton: string): YenilemeYuku | null {
  const yuk = jetonAc<YenilemeYuku>(jeton, yenilemeAnahtari());
  if (!yuk) return null;
  if (yuk.tur !== "yenileme") return null;
  if (typeof yuk.sonKullanma !== "number" || yuk.sonKullanma < simdi()) return null;
  if (typeof yuk.eposta !== "string" || !yuk.eposta) return null;
  return yuk;
}

/**
 * İstekteki `Authorization: Bearer …` başlığından oturumu çözer.
 *
 * Başlık yoksa ya da jeton geçersizse `null` — çağıran taraf 401 döner.
 */
export function istektenOturum(istek: Request): MobilOturum | null {
  const baslik = istek.headers.get("authorization") ?? "";
  const [sema, jeton] = baslik.split(" ");
  if (sema?.toLowerCase() !== "bearer" || !jeton) return null;
  return erisimJetonuCoz(jeton.trim());
}
