"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";

import { hesapDepoAl } from "@/lib/hesaplar";
import type { DestekTalebi } from "@/lib/hesaplar/tipler";
import { oturumAl } from "@/lib/oturum";

export type DestekDurumuSonuc = { hata?: string; talepNo?: string };

/** DT-260801-4821 — kullanıcının kolayca söyleyebileceği kısa numara. */
function talepNoUret(): string {
  const t = new Date();
  const g = `${String(t.getFullYear()).slice(2)}${String(t.getMonth() + 1).padStart(2, "0")}${String(
    t.getDate(),
  ).padStart(2, "0")}`;
  return `DT-${g}-${crypto.randomInt(1000, 9999)}`;
}

const kirp = (d: FormDataEntryValue | null, uzunluk: number) =>
  String(d ?? "").trim().slice(0, uzunluk);

/**
 * Destek talebi açar.
 *
 * Giriş yapmış kullanıcının adı ve e-postası oturumdan alınır; misafir
 * kullanıcı kendi bilgilerini yazar. Talep yönetici panelinde listelenir.
 */
export async function destekTalebiOlustur(
  _oncekiDurum: DestekDurumuSonuc,
  formVerisi: FormData,
): Promise<DestekDurumuSonuc> {
  const oturum = await oturumAl();

  const konu = kirp(formVerisi.get("konu"), 120) || "Genel destek";
  const mesaj = kirp(formVerisi.get("mesaj"), 2000);
  const siparisNo = kirp(formVerisi.get("siparisNo"), 40);
  const ad = oturum?.ad ?? kirp(formVerisi.get("ad"), 80);
  const eposta = (oturum?.eposta ?? kirp(formVerisi.get("eposta"), 120)).toLowerCase();
  const telefon = kirp(formVerisi.get("telefon"), 30);

  if (mesaj.length < 10) {
    return { hata: "Sorunu biraz daha açar mısın? En az 10 karakter yaz." };
  }
  if (!ad) return { hata: "Adını yaz." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) {
    return { hata: "Sana dönebilmemiz için geçerli bir e-posta yaz." };
  }

  const simdi = new Date().toISOString();
  const talep: DestekTalebi = {
    id: crypto.randomUUID(),
    no: talepNoUret(),
    konu,
    mesaj,
    siparisNo: siparisNo || undefined,
    ad,
    eposta,
    telefon: telefon || undefined,
    durum: "acik",
    olusturmaTarihi: simdi,
    guncellemeTarihi: simdi,
  };

  try {
    await (await hesapDepoAl()).destekEkle(talep);
  } catch {
    return {
      hata: "Talep kaydedilemedi. Biraz sonra tekrar dener misin? Acilse iletişim sayfasından yazabilirsin.",
    };
  }

  revalidatePath("/admin/destek");
  return { talepNo: talep.no };
}
