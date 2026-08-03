"use server";

import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import { oturumAl } from "@/lib/oturum";
import { kuryeAlabilirMi, type SiparisDurumu } from "@/lib/siparis";

export type TeslimatDurumu = { hata?: string; basari?: string };

/**
 * Mutfak "hazır" der — kurye artık alabilir.
 *
 * Yalnızca o siparişin mutfağı ve yönetici çağırabilir; hangi mutfağa ait
 * olduğu SİPARİŞTEN okunuyor, formdan gelen bilgiye güvenilmiyor.
 */
export async function siparisHazirAction(
  _oncekiDurum: TeslimatDurumu,
  formVerisi: FormData,
): Promise<TeslimatDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: "Giriş yapman gerekiyor." };

  const siparisNo = String(formVerisi.get("siparisNo") ?? "").trim();
  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: "Sipariş bulunamadı." };

  const yetkili =
    oturum.rol === "admin" ||
    (oturum.rol === "sef" && oturum.restoranSlug === siparis.restoranSlug);
  if (!yetkili) return { hata: "Bu siparişi güncelleme yetkin yok." };

  if (siparis.durum !== "odendi") {
    return { hata: "Yalnızca hazırlanmakta olan sipariş 'hazır' yapılabilir." };
  }

  await depo.durumGuncelle(siparisNo, "hazir");
  revalidatePath("/panel");
  revalidatePath("/admin");
  revalidatePath("/hesabim/siparisler");
  return { basari: `${siparisNo} kurye için hazır olarak işaretlendi.` };
}

/**
 * KURYE TESLİM ALDI — sipariş yola çıkıyor.
 *
 * Yalnızca siparişe ATANMIŞ kurye basabilir. Başka bir kurye sipariş
 * numarasını bilse bile işleyemiyor; atama sipariş kaydından okunuyor.
 */
export async function teslimAldimAction(
  _oncekiDurum: TeslimatDurumu,
  formVerisi: FormData,
): Promise<TeslimatDurumu> {
  return kuryeAdimi(formVerisi, "yolda");
}

/** Kurye müşteriye teslim etti — sipariş tamamlandı. */
export async function teslimEttimAction(
  _oncekiDurum: TeslimatDurumu,
  formVerisi: FormData,
): Promise<TeslimatDurumu> {
  return kuryeAdimi(formVerisi, "teslim-edildi");
}

async function kuryeAdimi(
  formVerisi: FormData,
  hedef: SiparisDurumu,
): Promise<TeslimatDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: "Giriş yapman gerekiyor." };

  const siparisNo = String(formVerisi.get("siparisNo") ?? "").trim();
  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: "Sipariş bulunamadı." };

  // Yetki: siparişe atanmış kurye ya da yönetici.
  const yetkili =
    oturum.rol === "admin" ||
    (oturum.rol === "kurye" && siparis.atananKurye === oturum.eposta);
  if (!yetkili) return { hata: "Bu teslimat sana atanmamış." };

  if (hedef === "yolda" && !kuryeAlabilirMi(siparis.durum)) {
    return { hata: "Mutfak bu siparişi henüz hazır olarak işaretlemedi." };
  }
  if (hedef === "teslim-edildi" && siparis.durum !== "yolda") {
    return { hata: "Önce siparişi teslim almalısın." };
  }

  await depo.durumGuncelle(siparisNo, hedef);
  revalidatePath("/panel");
  revalidatePath("/admin");
  revalidatePath("/hesabim/siparisler");
  return {
    basari:
      hedef === "yolda"
        ? `${siparisNo} teslim alındı, müşteriye götürüyorsun.`
        : `${siparisNo} teslim edildi. Eline sağlık.`,
  };
}
