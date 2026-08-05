import { dosyaDepo } from "./dosya";
import type { SiparisDepo } from "./tipler";

export type { KayitliSiparis, Ozet, SatisSayimi, SiparisDepo, SiparisFiltresi } from "./tipler";

let secilen: Promise<SiparisDepo> | null = null;

/**
 * Çalışma ortamına göre depo seçer:
 *  - DATABASE_URL varsa → Postgres (kalıcı, serverless uyumlu)
 *  - yoksa              → dosya (yerel geliştirme; Vercel'de KALICI DEĞİL)
 *
 * Postgres adaptörü dinamik import ediliyor; DATABASE_URL yoksa `postgres`
 * paketi hiç yüklenmez.
 *
 * SÖZ saklanıyor, depo nesnesi değil. Önceki hâlde `secilen` daha
 * `hazirla()` BEKLENMEDEN atanıyordu: aynı anda gelen ikinci çağıran hazır
 * sanıp şema oluşmadan sorgu atabiliyordu. Sözü saklamak hem bunu, hem de
 * hazırlığın birden fazla kez çalışmasını engelliyor.
 */
export function depoAl(): Promise<SiparisDepo> {
  secilen ??= depoSec().catch((hata) => {
    secilen = null;
    throw hata;
  });
  return secilen;
}

async function depoSec(): Promise<SiparisDepo> {
  const depo = process.env.DATABASE_URL ? (await import("./postgres")).postgresDepo : dosyaDepo;
  await depo.hazirla();
  return depo;
}

/** Arayüzde uyarı göstermek için: depo kalıcı mı? */
export function depoKaliciMi(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Vercel gibi salt-okunur dosya sistemi olan ortamda mıyız? */
export function serverlessMi(): boolean {
  return Boolean(process.env.VERCEL);
}
