import { dosyaDepo } from "./dosya";
import type { SiparisDepo } from "./tipler";

export type { KayitliSiparis, Ozet, SiparisDepo, SiparisFiltresi } from "./tipler";

let secilen: SiparisDepo | null = null;

/**
 * Çalışma ortamına göre depo seçer:
 *  - DATABASE_URL varsa → Postgres (kalıcı, serverless uyumlu)
 *  - yoksa              → dosya (yerel geliştirme; Vercel'de KALICI DEĞİL)
 *
 * Postgres adaptörü dinamik import ediliyor; DATABASE_URL yoksa `postgres`
 * paketi hiç yüklenmez.
 */
export async function depoAl(): Promise<SiparisDepo> {
  if (secilen) return secilen;

  if (process.env.DATABASE_URL) {
    const { postgresDepo } = await import("./postgres");
    secilen = postgresDepo;
  } else {
    secilen = dosyaDepo;
  }

  await secilen.hazirla();
  return secilen;
}

/** Arayüzde uyarı göstermek için: depo kalıcı mı? */
export function depoKaliciMi(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Vercel gibi salt-okunur dosya sistemi olan ortamda mıyız? */
export function serverlessMi(): boolean {
  return Boolean(process.env.VERCEL);
}
