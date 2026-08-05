"use server";

import { revalidatePath } from "next/cache";

import { hesapDepoAl } from "@/lib/hesaplar";
import { hataMetni } from "@/lib/hata-metni";
import { oturumAl } from "@/lib/oturum";
import { kasikAtabilirMi } from "@/lib/sef-kasigi";

export type KasikDurumu = { hata?: string; basari?: string };

/**
 * ŞEF KAŞIĞI atar ya da geri alır.
 *
 * Yetki SUNUCUDA belirleniyor. Arayüzde düğmeyi gizlemek yeterli değil:
 * form gönderimi elle de yapılabilir, o yüzden rol / özgeçmiş / kendine
 * atma denetimlerinin hepsi burada tekrar çalışıyor (bkz. `kasikAtabilirMi`).
 *
 * Özgeçmiş sahibinin KENDİ profilinden okunuyor, istemciden gelen hiçbir
 * alana güvenilmiyor — aksi hâlde biyografisi olmayan bir hesap istekte
 * "biyografim var" diyerek kuralı atlatabilirdi.
 */
export async function kasikAtAction(
  _oncekiDurum: KasikDurumu,
  formVerisi: FormData,
): Promise<KasikDurumu> {
  const hedefSlug = String(formVerisi.get("hedef") ?? "").trim();
  const geriAl = formVerisi.get("geriAl") === "1";
  if (!hedefSlug) return { hata: await hataMetni("kasik.hedefYok") };

  const oturum = await oturumAl();
  if (!oturum) return { hata: await hataMetni("kasik.girisGerekli") };

  const depo = await hesapDepoAl();
  const kendiSlug = oturum.restoranSlug;
  const profil = kendiSlug ? await depo.profilAl(kendiSlug) : null;

  const yetki = kasikAtabilirMi({
    rol: oturum.rol,
    kendiSlug,
    biyografi: profil?.biyografi,
    hedefSlug,
  });
  if (!yetki.olur) return { hata: await hataMetni(yetki.sebep) };

  // Hedefin gerçekten bir şef mutfağı olduğu doğrulanıyor.
  const hedef = await depo.mutfakBul(hedefSlug);
  const { restoranBul } = await import("@/content/restoranlar");
  const sabit = restoranBul(hedefSlug);
  if (!hedef && !sabit?.evSefi) return { hata: await hataMetni("kasik.hedefYok") };

  if (geriAl) {
    await depo.kasikGeriAl(kendiSlug!, hedefSlug);
  } else {
    await depo.kasikAt({
      verenSlug: kendiSlug!,
      alanSlug: hedefSlug,
      tarih: new Date().toISOString(),
    });
  }

  revalidatePath(`/restoran/${hedefSlug}`);
  revalidatePath("/sef-siralamasi");
  return { basari: geriAl ? "kasik.geriAlindi" : "kasik.atildi" };
}
