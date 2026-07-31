"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import { basvuruOnayla, basvuruReddet } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export type YonetimDurumu = { hata?: string; basari?: string };

/** Her yönetim eylemi kendi yetki kontrolünü yapar — sayfa korumasına güvenilmez. */
async function yoneticiOl() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");
  return oturum;
}

export async function basvuruOnaylaAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const sonuc = await basvuruOnayla(
    String(formVerisi.get("id") ?? ""),
    String(formVerisi.get("restoranSlug") ?? "") || undefined,
    String(formVerisi.get("not") ?? ""),
  );
  if (!sonuc.basarili) return { hata: sonuc.hata };

  revalidatePath("/admin/basvurular");
  return { basari: "Başvuru onaylandı. Kişi artık kaydını tamamlayabilir." };
}

export async function basvuruReddetAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const sonuc = await basvuruReddet(
    String(formVerisi.get("id") ?? ""),
    String(formVerisi.get("not") ?? ""),
  );
  if (!sonuc.basarili) return { hata: sonuc.hata };

  revalidatePath("/admin/basvurular");
  return { basari: "Başvuru reddedildi." };
}

/**
 * Siparişe şef ve kurye atar.
 *
 * Bir sipariş tek bir kuryeye atanır; kurye panelinde yalnızca kendi ataması
 * listelenir. Boş bırakılan alan atamayı kaldırır.
 */
export async function siparisAtaAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const siparisNo = String(formVerisi.get("siparisNo") ?? "");
  if (!siparisNo) return { hata: "Sipariş bulunamadı." };

  const depo = await depoAl();
  await depo.atamaGuncelle(siparisNo, {
    atananSef: String(formVerisi.get("atananSef") ?? "") || null,
    atananKurye: String(formVerisi.get("atananKurye") ?? "") || null,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/siparis/${siparisNo}`);
  return { basari: "Atama kaydedildi." };
}
