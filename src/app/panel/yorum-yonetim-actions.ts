"use server";

import { revalidatePath } from "next/cache";

import { hesapDepoAl } from "@/lib/hesaplar";
import { duzenleyebilirMi, oturumAl } from "@/lib/oturum";

export type YorumYonetimDurumu = { hata?: string; basari?: string };

const YANIT_SINIRI = 600;

/**
 * MUTFAĞIN YORUMA CEVABI.
 *
 * Tek yönlü değerlendirme adil değil: müşteri şikâyet edince mutfağın
 * "kusura bakmayın, o gün şu oldu" diyebileceği bir yer olmalı. Cevabı
 * yalnızca o mutfağın sahibi (şef, ev hanımı ya da restoran) ve yönetici
 * yazabilir — yetki SUNUCUDA doğrulanıyor, formdan gelen slug'a güvenilmiyor.
 */
export async function yorumYanitlaAction(
  _oncekiDurum: YorumYonetimDurumu,
  formVerisi: FormData,
): Promise<YorumYonetimDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: "Bu işlem için giriş yapman gerekiyor." };

  const yorumId = String(formVerisi.get("yorumId") ?? "").trim();
  if (!yorumId) return { hata: "Yorum bulunamadı." };

  const depo = await hesapDepoAl();
  const yorum = await depo.yorumBul(yorumId);
  if (!yorum) return { hata: "Yorum bulunamadı." };

  /*
   * Hangi mutfağa ait olduğu YORUMDAN okunuyor, formdan değil. Aksi hâlde
   * başka bir şef kendi slug'ını gönderip başkasının yorumuna cevap yazardı.
   */
  if (!duzenleyebilirMi(oturum, yorum.restoranSlug)) {
    return { hata: "Bu yoruma cevap verme yetkin yok." };
  }

  const ham = String(formVerisi.get("yanit") ?? "").trim();
  if (ham.length > YANIT_SINIRI) {
    return { hata: `Cevap en fazla ${YANIT_SINIRI} karakter olabilir.` };
  }

  await depo.yorumYanitla(yorumId, ham.length > 0 ? ham : undefined);

  revalidatePath(`/restoran/${yorum.restoranSlug}`);
  return { basari: ham.length > 0 ? "Cevabın yayınlandı." : "Cevabın kaldırıldı." };
}

/**
 * YORUM SİLME — yalnızca yönetici.
 *
 * Mutfak sahibine verilmiyor: kendi hakkındaki olumsuz yorumu silebilseydi
 * puanlar anlamını yitirir, değerlendirme sistemi süs olurdu. Hakaret veya
 * yanlış bilgi içeren yorumları yönetici kaldırır.
 */
export async function yorumSilAction(
  _oncekiDurum: YorumYonetimDurumu,
  formVerisi: FormData,
): Promise<YorumYonetimDurumu> {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") {
    return { hata: "Yorum silmek yalnızca yöneticinin yetkisinde." };
  }

  const yorumId = String(formVerisi.get("yorumId") ?? "").trim();
  const depo = await hesapDepoAl();
  const yorum = await depo.yorumBul(yorumId);
  if (!yorum) return { hata: "Yorum bulunamadı." };

  await depo.yorumSil(yorumId);

  // Puan ortalaması bu yorumdan besleniyordu; listeler de tazelenmeli.
  revalidatePath(`/restoran/${yorum.restoranSlug}`);
  revalidatePath("/restoranlar");
  revalidatePath("/");
  return { basari: `${yorum.musteriAdi} adlı kişinin yorumu silindi.` };
}
