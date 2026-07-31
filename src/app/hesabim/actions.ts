"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import { oturumAl } from "@/lib/oturum";
import { musteriIptalEdebilirMi } from "@/lib/siparis";

export type IptalDurumu = { hata?: string; basari?: string };

/**
 * Müşterinin kendi siparişini iptal etmesi.
 *
 * İki koruma var ve ikisi de SUNUCUDA uygulanır:
 *  1. Sipariş gerçekten bu oturuma mı ait? (başkasının siparişi iptal edilemez)
 *  2. Durum iptale uygun mu? Ödenmiş sipariş iade gerektirdiği için buradan
 *     iptal edilemez; yöneticiden geçer.
 */
export async function siparisIptalAction(
  _oncekiDurum: IptalDurumu,
  formVerisi: FormData,
): Promise<IptalDurumu> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim");

  const siparisNo = String(formVerisi.get("siparisNo") ?? "").trim();
  if (!siparisNo) return { hata: "Sipariş bulunamadı." };

  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: "Sipariş bulunamadı." };

  const sahibi =
    (siparis.musteri?.eposta ?? "").trim().toLowerCase() === oturum.eposta.trim().toLowerCase();
  if (!sahibi && oturum.rol !== "admin") {
    return { hata: "Bu sipariş sana ait değil." };
  }

  if (!musteriIptalEdebilirMi(siparis.durum) && oturum.rol !== "admin") {
    return {
      hata:
        siparis.durum === "iptal"
          ? "Bu sipariş zaten iptal edilmiş."
          : "Bu sipariş artık iptal edilemez. Destek ekibiyle iletişime geç.",
    };
  }

  await depo.durumGuncelle(siparisNo, "iptal", {
    odemeMesaji: `Sipariş ${oturum.eposta} tarafından iptal edildi.`,
  });

  revalidatePath("/hesabim");
  revalidatePath("/admin");
  revalidatePath(`/admin/siparis/${siparisNo}`);
  return { basari: "Siparişin iptal edildi." };
}
