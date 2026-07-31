"use server";

import crypto from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export type YorumDurumu = { hata?: string; basari?: string };

const puan = (ham: FormDataEntryValue | null) => {
  const sayi = Math.round(Number(ham));
  return Number.isFinite(sayi) && sayi >= 1 && sayi <= 5 ? sayi : 0;
};

/**
 * Sipariş değerlendirmesi — SICAKLIK, TESLİMAT HIZI ve TAD.
 *
 * Kurallar sunucuda uygulanır:
 *  - Sipariş gerçekten bu kişiye mi ait?
 *  - Teslim edilmiş (ödenmiş) mi? İptal/bekleyen sipariş değerlendirilemez.
 *  - Aynı sipariş için ikinci kez yorum yazılamaz.
 * Böylece hiç sipariş vermemiş biri puan veremiyor.
 */
export async function yorumEkleAction(
  _oncekiDurum: YorumDurumu,
  formVerisi: FormData,
): Promise<YorumDurumu> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim");

  const siparisNo = String(formVerisi.get("siparisNo") ?? "").trim();
  const sicaklik = puan(formVerisi.get("sicaklik"));
  const teslimatHizi = puan(formVerisi.get("teslimatHizi"));
  const tad = puan(formVerisi.get("tad"));

  if (!sicaklik || !teslimatHizi || !tad) {
    return { hata: "Üç başlığı da puanla: sıcaklık, teslimat hızı ve tad." };
  }

  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: "Sipariş bulunamadı." };

  const sahibi =
    (siparis.musteri?.eposta ?? "").trim().toLowerCase() === oturum.eposta.trim().toLowerCase();
  if (!sahibi) return { hata: "Bu sipariş sana ait değil." };

  if (siparis.durum !== "odendi") {
    return { hata: "Yalnızca teslim edilmiş siparişleri değerlendirebilirsin." };
  }

  const hesapDepo = await hesapDepoAl();
  if (await hesapDepo.siparisYorumlandiMi(siparisNo)) {
    return { hata: "Bu siparişi zaten değerlendirdin." };
  }

  await hesapDepo.yorumEkle({
    id: crypto.randomUUID(),
    restoranSlug: siparis.restoranSlug,
    siparisNo,
    musteriEposta: oturum.eposta,
    musteriAdi: siparis.musteri.adSoyad || oturum.ad,
    sicaklik,
    teslimatHizi,
    tad,
    metin: String(formVerisi.get("metin") ?? "").trim().slice(0, 1000) || undefined,
    tarih: new Date().toISOString(),
  });

  revalidatePath("/hesabim");
  revalidatePath(`/restoran/${siparis.restoranSlug}`);
  revalidatePath(`/panel/${siparis.restoranSlug}`);
  return { basari: "Değerlendirmen için teşekkürler." };
}
