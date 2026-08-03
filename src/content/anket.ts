/**
 * Ana sayfadaki anket.
 *
 * Amaç: hangi yemeğe talep var, gerçek veriyle görmek. Yeni mutfak
 * ararken ve menü kararlarında tahmin yerine bu sayılara bakılıyor.
 *
 * Anketin bir bitiş tarihi YOK — sürekli açık kalıyor, sonuç her zaman
 * güncel bir eğilim gösteriyor.
 */
export type AnketSecenegi = {
  id: string;
  etiket: string;
};

export const ANKET_SORUSU = "Genelde ne yemeyi tercih ediyorsunuz?";

export const anketSecenekleri: AnketSecenegi[] = [
  { id: "tavuk-doner", etiket: "Tavuk döner" },
  { id: "pizza", etiket: "Pizza" },
  { id: "hamburger", etiket: "Hamburger" },
  { id: "manti", etiket: "Mantı" },
  { id: "et-doner", etiket: "Et döner" },
];

export function anketSecenegiBul(id: string): AnketSecenegi | undefined {
  return anketSecenekleri.find((s) => s.id === id);
}
