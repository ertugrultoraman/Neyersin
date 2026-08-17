"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";

import { hesapDepoAl } from "@/lib/hesaplar";
import type { DestekTalebi } from "@/lib/hesaplar/tipler";
import { oturumAl } from "@/lib/oturum";
import { hataMetni } from "@/lib/hata-metni";
import { destekTalebiBildir } from "@/lib/yonetici-bildirim";

export type AltinSefDurumu = { hata?: string; basari?: string };

function talepNoUret(): string {
  const t = new Date();
  const g = `${String(t.getFullYear()).slice(2)}${String(t.getMonth() + 1).padStart(2, "0")}${String(
    t.getDate(),
  ).padStart(2, "0")}`;
  return `DT-${g}-${crypto.randomInt(1000, 9999)}`;
}

export async function altinSefBasvuruAction(
  _oncekiDurum: AltinSefDurumu,
  formVerisi: FormData,
): Promise<AltinSefDurumu> {
  /*
   * Sayfanın kapısı (bkz. panel/altin-sef/page.tsx) aynı üç koşulu arıyor ama
   * eylem doğrudan da çağrılabildiği için burada tekrar bakılıyor. Koşullar
   * ayrı ayrı yanıtlanıyor: girişi olan bir müşteriye "önce giriş yap" demek,
   * yapacak bir şey bırakmıyordu.
   */
  const oturum = await oturumAl();
  if (!oturum) return { hata: await hataMetni("oturum.gerekli") };
  if (oturum.rol !== "sef") return { hata: await hataMetni("altinSef.yalnizcaSef") };
  if (!oturum.restoranSlug) return { hata: await hataMetni("altinSef.mutfakYok") };

  const mesaj = String(formVerisi.get("mesaj") ?? "").trim();
  if (mesaj.length < 40) {
    return { hata: await hataMetni("altinSef.kisaMesaj") };
  }

  const simdi = new Date().toISOString();
  const konu = `Altın Şef Başvurusu (${oturum.restoranSlug ?? oturum.ad})`;

  const talep: DestekTalebi = {
    id: crypto.randomUUID(),
    no: talepNoUret(),
    konu,
    mesaj,
    ad: oturum.ad,
    eposta: oturum.eposta,
    durum: "acik",
    olusturmaTarihi: simdi,
    guncellemeTarihi: simdi,
  };

  try {
    await (await hesapDepoAl()).destekEkle(talep);
    destekTalebiBildir(talep);
  } catch {
    return { hata: await hataMetni("genel.hata") };
  }

  revalidatePath("/panel/altin-sef");
  revalidatePath("/admin/destek");
  return { basari: "altinSef.basarili" };
}
