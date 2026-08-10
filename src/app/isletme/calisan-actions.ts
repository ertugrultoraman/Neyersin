"use server";

import { revalidatePath } from "next/cache";

import { hataMetni } from "@/lib/hata-metni";
import { hesapDepoAl, parolaOzetle } from "@/lib/hesaplar";
import { isletmeSahibiMi, oturumAl } from "@/lib/oturum";

export type CalisanDurumu = { hata?: string; basari?: string };

const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * İŞLETME ÇALIŞANLARI — kasa ve mutfak girişleri.
 *
 * Çalışan hesabı, işletmenin mutfağına bağlı ikinci bir hesap. Yalnızca
 * sipariş tahtasını görüyor: fiyat değiştiremiyor, çalışma saatlerini
 * kaydıramıyor, profili düzenleyemiyor ve ciro raporunu görmüyor
 * (bkz. lib/oturum.ts `isletmeSahibiMi`).
 *
 * Yetki JETONDA taşındığı için çalışan çıkarıldığında hesabı SİLİNİYOR,
 * yetkisi düşürülmüyor: eski jeton süresi dolana kadar geçerli kalırdı.
 */
async function sahipOturumu(): Promise<{ slug: string } | { hata: string }> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: await hataMetni("oturum.gerekli") };
  if (!isletmeSahibiMi(oturum)) return { hata: await hataMetni("calisan.yalnizcaSahip") };
  if (!oturum.restoranSlug) return { hata: await hataMetni("saat.mutfakYok") };
  return { slug: oturum.restoranSlug };
}

export async function calisanEkleAction(
  _oncekiDurum: CalisanDurumu,
  formVerisi: FormData,
): Promise<CalisanDurumu> {
  const yetki = await sahipOturumu();
  if ("hata" in yetki) return { hata: yetki.hata };

  const ad = String(formVerisi.get("ad") ?? "").trim().slice(0, 80);
  const eposta = String(formVerisi.get("eposta") ?? "").trim().toLowerCase();
  const parola = String(formVerisi.get("parola") ?? "");

  if (ad.length < 2) return { hata: await hataMetni("calisan.adGerekli") };
  if (!EPOSTA_DESENI.test(eposta)) return { hata: await hataMetni("hata.epostaGecersiz") };
  if (parola.length < 8) return { hata: await hataMetni("calisan.parolaKisa") };

  const depo = await hesapDepoAl();
  if (await depo.hesapBul(eposta)) return { hata: await hataMetni("calisan.epostaVar") };

  try {
    await depo.hesapEkle({
      eposta,
      ad,
      parolaHash: await parolaOzetle(parola),
      rol: "isletme",
      restoranSlug: yetki.slug,
      isletmeYetkisi: "calisan",
      /*
       * Adresi işletme sahibi giriyor; çalışandan ayrıca kod doğrulaması
       * istemek, hesabı açan kişi zaten sorumluyken gereksiz bir engel.
       */
      epostaDogrulandi: true,
      olusturmaTarihi: new Date().toISOString(),
    });
  } catch {
    return { hata: await hataMetni("calisan.eklenemedi") };
  }

  revalidatePath("/isletme");
  return { basari: await hataMetni("calisan.eklendi", { ad }) };
}

export async function calisanCikarAction(
  _oncekiDurum: CalisanDurumu,
  formVerisi: FormData,
): Promise<CalisanDurumu> {
  const yetki = await sahipOturumu();
  if ("hata" in yetki) return { hata: yetki.hata };

  const eposta = String(formVerisi.get("eposta") ?? "").trim().toLowerCase();
  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);

  /*
   * Hedefin GERÇEKTEN bu işletmenin çalışanı olduğu doğrulanıyor. Yalnızca
   * e-postaya bakılsaydı bir işletme sahibi, formdaki adresi değiştirerek
   * başka bir işletmenin çalışanını — ya da kendi sahibini — silebilirdi.
   */
  if (!hesap || hesap.restoranSlug !== yetki.slug || hesap.isletmeYetkisi !== "calisan") {
    return { hata: await hataMetni("calisan.bulunamadi") };
  }

  try {
    await depo.hesapSil(eposta);
  } catch {
    return { hata: await hataMetni("calisan.cikarilamadi") };
  }

  revalidatePath("/isletme");
  return { basari: await hataMetni("calisan.cikarildi", { ad: hesap.ad }) };
}
