import { dinamikTeslimatUcreti } from "./yazilar/dinamik-teslimat-ucreti";
import { kuryeRotaOptimizasyonu } from "./yazilar/kurye-rota-optimizasyonu";
import { mutfakEkraniKds } from "./yazilar/mutfak-ekrani-kds";
import { restoranOtomasyonuRehberi } from "./yazilar/restoran-otomasyonu-rehberi";
import { siparisVerisiniKaraCevirmek } from "./yazilar/siparis-verisini-kara-cevirmek";
import type { BlogKategorisi, Yazi } from "./tipler";

export * from "./tipler";

/** Yayın tarihine göre yeniden eskiye sıralı yazı listesi. */
export const yazilar: Yazi[] = [
  restoranOtomasyonuRehberi,
  kuryeRotaOptimizasyonu,
  siparisVerisiniKaraCevirmek,
  mutfakEkraniKds,
  dinamikTeslimatUcreti,
].sort((a, b) => b.tarih.localeCompare(a.tarih));

export function yaziBul(slug: string): Yazi | undefined {
  return yazilar.find((y) => y.slug === slug);
}

export const blogKategorileri: BlogKategorisi[] = [
  "Sektörel Otomasyon",
  "Teslimat Lojistiği",
  "Veri & Analitik",
  "Restoran Teknolojileri",
  "Ürün & Fiyatlandırma",
];

/** Aynı kategoriden, sonra kalan yazılardan tamamlanan ilgili yazı listesi. */
export function ilgiliYazilar(yazi: Yazi, adet = 2): Yazi[] {
  const digerleri = yazilar.filter((y) => y.slug !== yazi.slug);
  const ayniKategori = digerleri.filter((y) => y.kategori === yazi.kategori);
  const kalanlar = digerleri.filter((y) => y.kategori !== yazi.kategori);
  return [...ayniKategori, ...kalanlar].slice(0, adet);
}
