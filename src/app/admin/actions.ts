"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { cikisYap, girisYap, oturumAl } from "@/lib/oturum";
import { depoAl } from "@/lib/depo";
import type { SiparisDurumu } from "@/lib/siparis";

export type GirisSonucu = { hata?: string };

export async function adminGiris(
  _oncekiDurum: GirisSonucu,
  formVerisi: FormData,
): Promise<GirisSonucu> {
  const eposta = String(formVerisi.get("eposta") ?? "");
  const parola = String(formVerisi.get("parola") ?? "");
  /* Kod yalnızca yönetici girişinde ve ikinci faktör kuruluysa denetleniyor. */
  const kod = String(formVerisi.get("kod") ?? "");

  const sonuc = await girisYap(eposta, parola, kod);
  if (!sonuc.basarili) return { hata: sonuc.hata };
  // Şef hesabı bu formdan girerse yönetici paneline değil, kendi paneline gider.
  redirect(sonuc.rol === "admin" ? "/admin" : "/panel");
}

export async function adminCikis(): Promise<void> {
  await cikisYap();
  redirect("/admin/giris");
}

const GECERLI_DURUMLAR: SiparisDurumu[] = [
  "odeme-bekliyor",
  "odendi",
  "hazir",
  "yolda",
  "teslim-edildi",
  "odeme-basarisiz",
  "iptal",
];

/** Sipariş durumunu elle günceller (havale dekontu eşleştiğinde kullanılır). */
export async function durumuGuncelle(siparisNo: string, durum: string): Promise<void> {
  // Yetki kontrolü server action içinde tekrar yapılır — sayfa korumasına güvenilmez.
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  if (!GECERLI_DURUMLAR.includes(durum as SiparisDurumu)) return;

  const depo = await depoAl();
  await depo.durumGuncelle(siparisNo, durum as SiparisDurumu, {
    odemeMesaji: `Durum ${oturum.eposta} tarafından elle güncellendi.`,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/siparis/${siparisNo}`);
}
