"use server";

import { revalidatePath } from "next/cache";

import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export type IzgaraDurumu = { hata?: string; basari?: string };

/** Ana sayfada sürüklenebilir kutuların tanınan anahtarları. */
const ANAHTARLAR = new Set(["sef-kasigi"]);

/**
 * Ana sayfa ızgarasındaki bir kutunun yerini kaydeder.
 *
 * Yetki SUNUCUDA denetleniyor: sürükleme kolunu görmek zaten bir yetki
 * vermiyor ama form elle de gönderilebilir, o yüzden rol burada tekrar
 * doğrulanıyor (anketSiraAction ile aynı yaklaşım).
 *
 * Anahtar beyaz listeden geçiyor — rastgele bir anahtarla tabloya sınırsız
 * satır yazılmasını engelliyor.
 */
export async function izgaraSiraAction(
  _oncekiDurum: IzgaraDurumu,
  formVerisi: FormData,
): Promise<IzgaraDurumu> {
  const oturum = await oturumAl();
  if (oturum?.rol !== "admin") return { hata: "Bu işlem için yönetici girişi gerekiyor." };

  const anahtar = String(formVerisi.get("anahtar") ?? "").trim();
  if (!ANAHTARLAR.has(anahtar)) return { hata: "Geçersiz kutu." };

  const ham = Number(formVerisi.get("sira"));
  if (!Number.isFinite(ham)) return { hata: "Geçersiz konum." };
  const sira = Math.max(-1, Math.min(Math.trunc(ham), 50));

  await (await hesapDepoAl()).izgaraSirasiKaydet({ anahtar, sira });

  revalidatePath("/");
  return { basari: "Kutunun yeri güncellendi." };
}
