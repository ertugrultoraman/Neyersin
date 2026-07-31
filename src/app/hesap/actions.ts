"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  basvuruOlustur,
  hesapDepoAl,
  musteriKaydet,
  type SefProfili,
} from "@/lib/hesaplar";
import { cikisYap, girisYap, oturumAc, oturumAl, rolAnaSayfasi } from "@/lib/oturum";

export type FormDurumu = { hata?: string; basari?: string };

/** Yönlendirme hedefini yalnızca site içi yollara sınırlar (açık yönlendirme koruması). */
function guvenliDonus(ham: string | null | undefined): string | null {
  if (!ham) return null;
  return ham.startsWith("/") && !ham.startsWith("//") ? ham : null;
}

export async function girisAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const sonuc = await girisYap(
    String(formVerisi.get("kimlik") ?? ""),
    String(formVerisi.get("parola") ?? ""),
  );
  if (!sonuc.basarili) return { hata: sonuc.hata };

  const donus = guvenliDonus(String(formVerisi.get("donus") ?? ""));
  redirect(donus ?? rolAnaSayfasi(sonuc.rol));
}

/** Müşteri kaydı — onay gerekmez, kayıt sonrası doğrudan oturum açılır. */
export async function musteriKayitAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const sonuc = await musteriKaydet({
    ad: String(formVerisi.get("ad") ?? ""),
    eposta: String(formVerisi.get("eposta") ?? ""),
    parola: String(formVerisi.get("parola") ?? ""),
    telefon: String(formVerisi.get("telefon") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  await oturumAc({
    eposta: sonuc.veri.eposta,
    ad: sonuc.veri.ad,
    rol: sonuc.veri.rol,
  });

  const donus = guvenliDonus(String(formVerisi.get("donus") ?? ""));
  redirect(donus ?? "/hesabim");
}

/** Şef / ev hanımı / kurye başvurusu — yöneticiye düşer, hesap açılmaz. */
export async function basvuruAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const sonuc = await basvuruOlustur({
    ad: String(formVerisi.get("ad") ?? ""),
    telefon: String(formVerisi.get("telefon") ?? ""),
    eposta: String(formVerisi.get("eposta") ?? ""),
    parola: String(formVerisi.get("parola") ?? ""),
    tur: String(formVerisi.get("tur") ?? ""),
    mesaj: String(formVerisi.get("mesaj") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  revalidatePath("/admin/basvurular");
  return {
    basari:
      "Başvurun alındı. Yönetici onayladığı anda hesabın açılır ve belirlediğin parolayla giriş yapabilirsin.",
  };
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

  const slug =
    oturum.rol === "admin" ? String(formVerisi.get("restoranSlug") ?? "") : oturum.restoranSlug;
  if (!slug) return { hata: "Bu hesaba bağlı bir şef profili yok." };

  const kirp = (ad: string, sinir: number) =>
    String(formVerisi.get(ad) ?? "")
      .trim()
      .slice(0, sinir) || undefined;

  const profil: SefProfili = {
    restoranSlug: slug,
    slogan: kirp("slogan", 120),
    uzmanlik: kirp("uzmanlik", 160),
    biyografi: kirp("biyografi", 4000),
    sertifikalar: kirp("sertifikalar", 2000),
    guncellemeTarihi: new Date().toISOString(),
  };

  const depo = await hesapDepoAl();
  await depo.profilKaydet(profil);

  revalidatePath("/panel");
  revalidatePath(`/restoran/${slug}`);
  return { basari: "Profilin kaydedildi." };
}
