"use server";

import crypto from "node:crypto";

import { belgeleriKaydet } from "@/lib/belge-sunucu";
import { hesapDepoAl } from "@/lib/hesaplar";

/**
 * İletişim formunun konuları — hepsi İŞ BAŞVURUSU niteliğinde.
 *
 * "Sipariş desteği" bilerek YOK: mevcut siparişle veya hesapla ilgili yardım
 * canlı destek asistanından alınıyor (bkz. components/destek/DestekWidget).
 * Aynı işi iki ayrı yerden yürütmek hem müşteriyi bölüyor hem de talepleri iki
 * ayrı listeye dağıtıyordu.
 */
export type BasvuruKonusu = "restoran" | "kurye" | "kurumsal";

/** Destek listesinde okunur bir konu basligi olusturmak icin. */
const KONU_ETIKETLERI: Record<BasvuruKonusu, string> = {
  restoran: "Restoran basvurusu",
  kurye: "Kurye basvurusu",
  kurumsal: "Kurumsal basvuru",
};

export type BasvuruGirdisi = {
  konu: BasvuruKonusu;
  adSoyad: string;
  telefon: string;
  eposta: string;
  isletme: string;
  ilce: string;
  mesaj: string;
  /** Basvuruya eklenen resmi evrak — istege bagli. */
  belgeler?: File[];
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

  /*
   * BAŞVURU ARTIK KAYDEDİLİYOR.
   *
   * Önceden yalnızca webhook'a gidip sunucu günlüğüne yazılıyordu; webhook
   * tanımlı değilse başvuru hiçbir yerde durmuyordu ve yönetici işletme
   * başvurusundan haberdar olamıyordu. Belge eklenebildiği için artık büsbütün
   * şart: evrağın bağlanacağı bir kayıt olmalı. Destek talebi olarak
   * saklanıyor — yönetici panelinde zaten bir listesi var.
   *
   * Depo hatası başvuruyu DÜŞÜRMÜYOR: kişi referans numarasını yine alıyor,
   * kayıt webhook ve günlükte kalıyor (siparişlerdeki aynı yaklaşım).
   */
  const talepId = crypto.randomUUID();
  try {
    const depo = await hesapDepoAl();
    await depo.destekEkle({
      id: talepId,
      no: referansNo,
      konu: `${KONU_ETIKETLERI[girdi.konu] ?? "Başvuru"}${girdi.isletme ? ` — ${girdi.isletme}` : ""}`,
      mesaj: `${girdi.mesaj}${girdi.ilce ? `\n\nİlçe: ${girdi.ilce}` : ""}`,
      ad: girdi.adSoyad,
      eposta: girdi.eposta,
      telefon,
      durum: "acik",
      olusturmaTarihi: new Date().toISOString(),
      guncellemeTarihi: new Date().toISOString(),
    });

    const belgeHatasi = await belgeleriKaydet(girdi.belgeler ?? [], "iletisim", talepId);
    if (belgeHatasi) {
      console.error(`[basvuru] belgeler eklenemedi (${referansNo}): ${belgeHatasi}`);
    }
  } catch (hata) {
    console.error(
      `[basvuru] kayit edilemedi (${referansNo}):`,
      hata instanceof Error ? hata.message : hata,
    );
  }

  // Siparişlerle aynı hedefe gider — bkz. src/lib/siparis-deposu.ts açıklaması.
  const webhook = process.env.BASVURU_WEBHOOK_URL ?? process.env.SIPARIS_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Dosyalar webhook'a GİTMİYOR: JSON'a serileşmiyorlar ve zaten
        // veritabanında duruyorlar. Yalnızca kaç tane olduğu bildiriliyor.
        body: JSON.stringify({
          tip: "basvuru",
          referansNo,
          ...girdi,
          belgeler: undefined,
          belgeSayisi: girdi.belgeler?.length ?? 0,
          telefon,
        }),
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
