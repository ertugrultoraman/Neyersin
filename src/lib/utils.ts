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
