import manifest from "@/content/generated/images.json";
import prompts from "@/content/image-prompts.json";

/**
 * Görsel çözümleme katmanı.
 *
 * AI ile üretilen görseller `npm run images:generate` ile Vercel Blob'a yüklenir
 * ve public CDN URL'leri `generated/images.json` manifestine yazılır. Manifestte
 * kayıt varsa `next/image` ile o URL kullanılır; yoksa markaya uygun, kararlı
 * bir SVG placeholder çizilir. Böylece API anahtarı olmadan da site eksiksiz
 * görünür ve hiçbir yerde kırık görsel oluşmaz.
 */

export type Oran = "16/9" | "4/3" | "3/2" | "1/1" | "3/4" | "21/9";

type ManifestKaydi = {
  url: string;
  width: number;
  height: number;
  provider?: string;
  generatedAt?: string;
};

type PromptKaydi = {
  key: string;
  aspect: Oran;
  alt: string;
  prompt: string;
  /** "foto" → yemek fotoğrafı stili, yoksa marka illüstrasyonu. Üretim scripti okur. */
  style?: string;
};

const kayitlar = (manifest as { images?: Record<string, ManifestKaydi> }).images ?? {};
const promptDizini = new Map<string, PromptKaydi>(
  (prompts as PromptKaydi[]).map((p) => [p.key, p]),
);

export type CozulmusGorsel =
  | {
      tur: "uzak";
      anahtar: string;
      src: string;
      width: number;
      height: number;
      alt: string;
      oran: Oran;
    }
  | {
      tur: "placeholder";
      anahtar: string;
      alt: string;
      oran: Oran;
    };

const ORAN_SAYISAL: Record<Oran, number> = {
  "16/9": 16 / 9,
  "4/3": 4 / 3,
  "3/2": 3 / 2,
  "1/1": 1,
  "3/4": 3 / 4,
  "21/9": 21 / 9,
};

export function oranSayisal(oran: Oran): number {
  return ORAN_SAYISAL[oran];
}

/**
 * Verilen anahtar için görseli çözer. `alt` ve `oran` prompt kaydından gelir,
 * çağrı yerinde override edilebilir.
 */
export function gorselCoz(
  anahtar: string,
  override?: { alt?: string; oran?: Oran },
): CozulmusGorsel {
  const prompt = promptDizini.get(anahtar);
  const oran = override?.oran ?? prompt?.aspect ?? "16/9";
  const alt = override?.alt ?? prompt?.alt ?? "";
  const kayit = kayitlar[anahtar];

  if (kayit?.url) {
    return {
      tur: "uzak",
      anahtar,
      src: kayit.url,
      width: kayit.width,
      height: kayit.height,
      alt,
      oran,
    };
  }

  return { tur: "placeholder", anahtar, alt, oran };
}

/** Manifestte kaç görsel hazır — README/deploy kontrolü için faydalı. */
export function gorselDurumu(): { hazir: number; toplam: number } {
  return {
    hazir: Object.keys(kayitlar).length,
    toplam: promptDizini.size,
  };
}
