import type { Anket, AnketSecenegi } from "@/lib/hesaplar/tipler";

/**
 * Ana sayfadaki anket.
 *
 * Amaç: hangi yemeğe talep var, gerçek veriyle görmek. Yeni mutfak
 * ararken ve menü kararlarında tahmin yerine bu sayılara bakılıyor.
 *
 * Anketler artık yönetim panelinden oluşturuluyor (WhatsApp anketi gibi:
 * soru + istenen sayıda seçenek → yayınla → sil). Buradaki anket yalnızca
 * VARSAYILAN: panelde hiç anket yoksa ana sayfa boş kalmasın diye duruyor.
 * Ona verilmiş oylar `varsayilan` kimliğiyle saklanıyor.
 */
export type { AnketSecenegi };

/** WhatsApp anketi de 12 seçenekte duruyor; fazlası okunmuyor. */
export const AZAMI_SECENEK = 12;
export const ASGARI_SECENEK = 2;

/** Varsayılan anketin sorusu. */
export const ANKET_SORUSU = "Genelde ne yemeyi tercih ediyorsunuz?";

export const VARSAYILAN_ANKET: Anket = {
  id: "varsayilan",
  soru: ANKET_SORUSU,
  soruEn: "What do you usually prefer to eat?",
  secenekler: [
    { id: "tavuk-doner", etiket: "Tavuk döner", etiketEn: "Chicken doner" },
    { id: "pizza", etiket: "Pizza", etiketEn: "Pizza" },
    { id: "hamburger", etiket: "Hamburger", etiketEn: "Burger" },
    { id: "manti", etiket: "Mantı", etiketEn: "Mantı (Turkish dumplings)" },
    { id: "et-doner", etiket: "Et döner", etiketEn: "Beef doner" },
  ],
  yayinda: true,
  sira: -1,
  olusturmaTarihi: "2026-01-01T00:00:00.000Z",
};

/** Geriye dönük uyum: eski çağrılar varsayılan anketin seçeneklerini bekliyor. */
export const anketSecenekleri: AnketSecenegi[] = VARSAYILAN_ANKET.secenekler;

export function anketSecenegiBul(id: string): AnketSecenegi | undefined {
  return VARSAYILAN_ANKET.secenekler.find((s) => s.id === id);
}

/**
 * Seçenek kimliği üretir: "Tavuk döner" → "tavuk-doner".
 *
 * Kimlik oyların içine yazıldığı için kararlı olmalı. Aynı ada iki seçenek
 * yazılırsa sona sayı ekleniyor; yoksa iki ayrı seçenek tek sayaca düşerdi.
 */
export function secenekKimligi(etiket: string, kullanilan: Set<string>): string {
  const temel =
    etiket
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "secenek";

  let aday = temel;
  let sayac = 2;
  while (kullanilan.has(aday)) aday = `${temel}-${sayac++}`;
  kullanilan.add(aday);
  return aday;
}
