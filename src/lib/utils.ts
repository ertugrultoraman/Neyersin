/**
 * Aramada karşılaştırma için metni sadeleştirir.
 *
 * Türkçe harfleri ASCII karşılığına indiriyor: klavyesinde Türkçe olmayan
 * ya da acele yazan kişi "makbule sef" yazınca "Makbule Şef"i bulamıyordu.
 * Büyük/küçük dönüşümü de Türkçe kurallarına göre (I/İ ayrımı).
 */
const TURKCE_ASCII: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

export function aramaMetni(ham: string): string {
  return ham
    .toLocaleLowerCase("tr-TR")
    .split("")
    .map((h) => TURKCE_ASCII[h] ?? h)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Aranan kelimelerin HEPSİ havuzda geçiyor mu?
 *
 * Tam cümle eşleşmesi arıyorduk; "makbule mantı" yazan kişi hiçbir sonuç
 * alamıyordu çünkü o sıra hiçbir yerde geçmiyor. Artık kelimeler ayrı ayrı
 * aranıyor, sıraları önemli değil.
 */
export function aramaEslesiyorMu(havuz: string, sorgu: string): boolean {
  const hedef = aramaMetni(havuz);
  const kelimeler = aramaMetni(sorgu).split(" ").filter(Boolean);
  if (kelimeler.length === 0) return true;
  return kelimeler.every((k) => hedef.includes(k));
}

/** Koşullu class birleştirici — clsx'e ihtiyaç duymayacak kadar basit tutuldu. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export function paraFormatla(kurus: number): string {
  return tl.format(kurus);
}

export function tarihFormatla(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Anahtardan türetilen kararlı (deterministik) sayı.
 * Placeholder görsellerin her build'de aynı görünmesi için kullanılır.
 */
export function tohum(deger: string): number {
  let h = 2166136261;
  for (let i = 0; i < deger.length; i += 1) {
    h ^= deger.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
