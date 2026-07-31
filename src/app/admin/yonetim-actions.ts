"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import {
  basvuruOnayla,
  basvuruReddet,
  hesapDepoAl,
  type BasvuruTuru,
  type Rol,
} from "@/lib/hesaplar";
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

  const sonuc = await basvuruOnayla({
    id: String(formVerisi.get("id") ?? ""),
    rol: String(formVerisi.get("rol") ?? "") as BasvuruTuru,
    semt: String(formVerisi.get("semt") ?? ""),
    not: String(formVerisi.get("not") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  // Yeni mutfak açıldıysa restoran listeleri tazelensin.
  revalidatePath("/admin/basvurular");
  revalidatePath("/restoranlar");
  revalidatePath("/");

  return {
    basari: sonuc.veri.atananRestoran
      ? `Onaylandı, hesap açıldı. Mutfak sayfası: /restoran/${sonuc.veri.atananRestoran}`
      : "Onaylandı, kurye hesabı açıldı. Kişi artık giriş yapabilir.",
  };
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
/**
 * Bir hesabın rolünü değiştirir.
 *
 * Şeflikten çıkarılan kişinin mutfağı silinmez, yalnızca bağlantısı kesilir —
 * mutfağı ve geçmiş siparişleri kaybolmasın diye. Mutfağı tamamen kaldırmak
 * için hesabı silme eylemi kullanılır.
 */
export async function rolDegistirAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const eposta = String(formVerisi.get("eposta") ?? "");
  const yeniRol = String(formVerisi.get("rol") ?? "") as Rol;
  if (!["sef", "kurye", "musteri"].includes(yeniRol)) {
    return { hata: "Geçerli bir rol seç." };
  }

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return { hata: "Hesap bulunamadı." };

  await depo.hesapEkle({
    ...hesap,
    rol: yeniRol,
    // Yalnızca şef rolünde mutfak bağlantısı anlamlı.
    restoranSlug: yeniRol === "sef" ? hesap.restoranSlug : undefined,
  });

  revalidatePath("/admin/hesaplar");
  return { basari: `${hesap.ad} artık ${ROL_ETIKETLERI[yeniRol]}.` };
}

/** Hesabı ve (varsa) otomatik açılmış mutfağını siler. */
export async function hesapSilAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const eposta = String(formVerisi.get("eposta") ?? "");
  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return { hata: "Hesap bulunamadı." };

  if (hesap.restoranSlug) {
    // Yalnızca çalışma zamanında açılmış mutfaklar silinebilir; içerik
    // dosyasındaki sabit restoranlar koddan yönetilir, buradan silinmez.
    await depo.mutfakSil(hesap.restoranSlug);
  }
  await depo.hesapSil(eposta);

  revalidatePath("/admin/hesaplar");
  revalidatePath("/restoranlar");
  revalidatePath("/");
  return { basari: `${hesap.ad} hesabı silindi.` };
}

const ROL_ETIKETLERI: Record<string, string> = {
  admin: "yönetici",
  sef: "şef",
  kurye: "kurye",
  musteri: "müşteri",
};

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
