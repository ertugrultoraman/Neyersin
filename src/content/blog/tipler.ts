export type Blok =
  | { tur: "p"; metin: string }
  | { tur: "h2"; metin: string }
  | { tur: "h3"; metin: string }
  | { tur: "liste"; sirali?: boolean; maddeler: string[] }
  | { tur: "alinti"; metin: string; kaynak?: string }
  | { tur: "bilgi"; baslik: string; metin: string }
  | { tur: "tablo"; basliklar: string[]; satirlar: string[][] }
  | { tur: "gorsel"; anahtar: string; altyazi?: string }
  | { tur: "sayilar"; ogeler: { deger: string; etiket: string }[] }
  | { tur: "adimlar"; ogeler: { baslik: string; metin: string }[] };

export type BlogKategorisi =
  | "Sektörel Otomasyon"
  | "Teslimat Lojistiği"
  | "Veri & Analitik"
  | "Restoran Teknolojileri"
  | "Ürün & Fiyatlandırma";

export type Yazi = {
  slug: string;
  baslik: string;
  ozet: string;
  kategori: BlogKategorisi;
  etiketler: string[];
  tarih: string;
  guncelleme?: string;
  okumaDk: number;
  yazar: { ad: string; unvan: string };
  kapak: string;
  oneCikan?: boolean;
  bloklar: Blok[];
};

const TR_HARITA: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  I: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** Başlıktan çapa (anchor) kimliği üretir — Türkçe karakter güvenli. */
export function basligaId(metin: string): string {
  return metin
    .replace(/[çğıöşüÇĞİIÖŞÜâîû]/g, (m) => TR_HARITA[m] ?? m)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Yazıdaki h2'lerden içindekiler tablosu çıkarır. */
export function icindekiler(yazi: Yazi): { id: string; metin: string }[] {
  return yazi.bloklar
    .filter((b): b is { tur: "h2"; metin: string } => b.tur === "h2")
    .map((b) => ({ id: basligaId(b.metin), metin: b.metin }));
}
