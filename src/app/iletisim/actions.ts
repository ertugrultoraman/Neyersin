"use server";

/**
 * İletişim formunun konuları — hepsi İŞ BAŞVURUSU niteliğinde.
 *
 * "Sipariş desteği" bilerek YOK: mevcut siparişle veya hesapla ilgili yardım
 * canlı destek asistanından alınıyor (bkz. components/destek/DestekWidget).
 * Aynı işi iki ayrı yerden yürütmek hem müşteriyi bölüyor hem de talepleri iki
 * ayrı listeye dağıtıyordu.
 */
export type BasvuruKonusu = "restoran" | "kurye" | "kurumsal";

export type BasvuruGirdisi = {
  konu: BasvuruKonusu;
  adSoyad: string;
  telefon: string;
  eposta: string;
  isletme: string;
  ilce: string;
  mesaj: string;
};

export type BasvuruSonucu =
  | { basarili: true; referansNo: string }
  | { basarili: false; hatalar: Partial<Record<keyof BasvuruGirdisi, string>> };

const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFON_DESENI = /^0?5\d{9}$/;

export async function basvuruGonder(girdi: BasvuruGirdisi): Promise<BasvuruSonucu> {
  const hatalar: Partial<Record<keyof BasvuruGirdisi, string>> = {};
  const telefon = (girdi.telefon ?? "").replace(/[\s()-]/g, "");

  if (!girdi.adSoyad || girdi.adSoyad.trim().length < 5) {
    hatalar.adSoyad = "Ad ve soyadınızı girin.";
  }
  if (!TELEFON_DESENI.test(telefon)) {
    hatalar.telefon = "Telefonu 5XXXXXXXXX biçiminde girin.";
  }
  if (!EPOSTA_DESENI.test(girdi.eposta ?? "")) {
    hatalar.eposta = "Geçerli bir e-posta adresi girin.";
  }
  if (!girdi.mesaj || girdi.mesaj.trim().length < 15) {
    hatalar.mesaj = "Biraz daha detay yazın (en az 15 karakter).";
  }
  if (girdi.konu === "restoran" && (!girdi.isletme || girdi.isletme.trim().length < 2)) {
    hatalar.isletme = "İşletme adını girin.";
  }

  if (Object.keys(hatalar).length > 0) {
    return { basarili: false, hatalar };
  }

  const referansNo = `NY-B-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // Siparişlerle aynı hedefe gider — bkz. src/lib/siparis-deposu.ts açıklaması.
  const webhook = process.env.BASVURU_WEBHOOK_URL ?? process.env.SIPARIS_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tip: "basvuru", referansNo, ...girdi, telefon }),
      });
    } catch (hata) {
      console.error(
        `[basvuru] webhook'a ulaşılamadı (${referansNo}):`,
        hata instanceof Error ? hata.message : hata,
      );
    }
  }

  console.info(
    "[basvuru]",
    JSON.stringify({ referansNo, konu: girdi.konu, telefon, eposta: girdi.eposta }),
  );

  return { basarili: true, referansNo };
}
