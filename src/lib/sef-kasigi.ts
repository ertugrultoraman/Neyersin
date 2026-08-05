/**
 * ŞEF KAŞIĞI — şeften şefe verilen takdir.
 *
 * Müşteri yorumundan ayrı bir ölçü: yorumu herkes yazabiliyor, kaşığı yalnızca
 * ÖZGEÇMİŞİ OLAN bir şef atabiliyor. Böylece "müşteri ne düşünüyor" ile
 * "meslektaşları ne düşünüyor" ayrı ayrı görülebiliyor.
 *
 * Bu dosya SAF: veritabanına ve `next/headers`'a dokunmuyor, istemci
 * bileşenleri de kuralı okuyabilsin diye (bkz. sef-rozetleri.ts'teki aynı not).
 */

export const KASIK_GORSELI = "/rozet/sef-kasigi.png";

/** Kaşık atma yetkisinin sonucu — reddedilirse sebebi sözlük anahtarı olarak. */
export type KasikYetkisi = { olur: true } | { olur: false; sebep: string };

/**
 * Bu kişi bu mutfağa kaşık atabilir mi?
 *
 *  1. Kaşığı yalnızca ŞEF atabilir (müşteri ve kurye atamaz).
 *  2. Şefin kendi mutfağı olmalı — kaşık mutfaktan mutfağa gidiyor.
 *  3. Şef ALTIN ŞEF olmalı: gerçek mesleği de şeflik olan, özgeçmişi güçlü
 *     kişilere yöneticinin verdiği unvan.
 *  4. Kendine kaşık atamaz.
 *
 * (3) önce "özgeçmişi dolu olan" diye ölçülüyordu; biyografi kutusuna iki
 * cümle yazan herkes yetki kazandığı için takdirin değeri kalmıyordu. Artık
 * unvanı YÖNETİCİ veriyor (bkz. SefProfili.altinSef).
 *
 * Yöneticinin kendisi kaşık atmıyor: sıralamanın şeflerin kendi aralarındaki
 * takdiri göstermesi gerekiyor, yönetim müdahalesini değil.
 */
export function kasikAtabilirMi(girdi: {
  rol?: string;
  /** Kaşığı atacak kişinin kendi mutfak slug'ı. */
  kendiSlug?: string;
  /** Kaşığı atacak kişi Altın Şef mi? */
  altinSef?: boolean;
  /** Kaşığın gideceği mutfak. */
  hedefSlug: string;
}): KasikYetkisi {
  if (girdi.rol !== "sef") return { olur: false, sebep: "kasik.yalnizcaSef" };
  if (!girdi.kendiSlug) return { olur: false, sebep: "kasik.mutfakYok" };
  if (!girdi.altinSef) return { olur: false, sebep: "kasik.altinSefGerekli" };
  if (girdi.kendiSlug === girdi.hedefSlug) return { olur: false, sebep: "kasik.kendineOlmaz" };
  return { olur: true };
}

/** Sıralama ölçütleri — sayfadaki sekmeler ve `?olcut=` değerleri. */
export const OLCUTLER = ["siparis", "begeni", "kasik"] as const;
export type Olcut = (typeof OLCUTLER)[number];

export function olcutCoz(deger: string | undefined): Olcut {
  return OLCUTLER.includes(deger as Olcut) ? (deger as Olcut) : "siparis";
}

/** Sekme başlıkları ve satırdaki değerin sözlük anahtarları. */
export const OLCUT_BILGISI: Record<Olcut, { sekme: string; birim: string; birimTek: string }> = {
  siparis: { sekme: "siralama.enCokSiparis", birim: "sefRozeti.siparis", birimTek: "sefRozeti.siparisTek" },
  begeni: { sekme: "siralama.enCokBegenilen", birim: "siralama.puanDeger", birimTek: "siralama.puanDeger" },
  kasik: { sekme: "siralama.enCokKasik", birim: "siralama.kasikAdet", birimTek: "siralama.kasikAdetTek" },
};

/** İlk 20 gösteriliyor — kullanıcının istediği uzunluk. */
export const SIRALAMA_UZUNLUGU = 20;
