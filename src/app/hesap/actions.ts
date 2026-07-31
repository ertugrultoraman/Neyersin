"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { hesapDepoAl, sefKaydet, type SefProfili } from "@/lib/hesaplar";
import { cikisYap, girisYap, oturumAc, oturumAl } from "@/lib/oturum";

export type FormDurumu = { hata?: string; basari?: string };

export async function girisAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const sonuc = await girisYap(
    String(formVerisi.get("eposta") ?? ""),
    String(formVerisi.get("parola") ?? ""),
  );
  if (!sonuc.basarili) return { hata: sonuc.hata };

  redirect(sonuc.rol === "admin" ? "/admin" : "/panel");
}

export async function kayitAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const sonuc = await sefKaydet({
    ad: String(formVerisi.get("ad") ?? ""),
    eposta: String(formVerisi.get("eposta") ?? ""),
    parola: String(formVerisi.get("parola") ?? ""),
    restoranSlug: String(formVerisi.get("restoranSlug") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  // Kayıt başarılıysa kullanıcıyı ayrıca giriş yapmaya zorlamıyoruz.
  await oturumAc({
    eposta: sonuc.hesap.eposta,
    ad: sonuc.hesap.ad,
    rol: sonuc.hesap.rol,
    restoranSlug: sonuc.hesap.restoranSlug,
  });
  redirect("/panel");
}

export async function cikisAction(): Promise<void> {
  await cikisYap();
  redirect("/");
}

/**
 * Şef kendi profilini günceller.
 *
 * Yetki kontrolü sunucuda yapılır ve düzenlenecek restoran İSTEMCİDEN
 * ALINMAZ — oturumdaki `restoranSlug` kullanılır. Böylece form alanı
 * değiştirilerek başkasının profili düzenlenemez.
 */
export async function profilKaydetAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");

  const slug = oturum.rol === "admin" ? String(formVerisi.get("restoranSlug") ?? "") : oturum.restoranSlug;
  if (!slug) return { hata: "Bu hesaba bağlı bir şef profili yok." };

  const kirp = (ad: string, sinir: number) =>
    String(formVerisi.get(ad) ?? "").trim().slice(0, sinir) || undefined;

  const profil: SefProfili = {
    restoranSlug: slug,
    slogan: kirp("slogan", 120),
    uzmanlik: kirp("uzmanlik", 160),
    biyografi: kirp("biyografi", 4000),
    sertifikalar: kirp("sertifikalar", 2000),
    iletisim: kirp("iletisim", 300),
    guncellemeTarihi: new Date().toISOString(),
  };

  const depo = await hesapDepoAl();
  await depo.profilKaydet(profil);

  revalidatePath("/panel");
  revalidatePath(`/restoran/${slug}`);
  return { basari: "Profilin kaydedildi." };
}
