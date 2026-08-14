"use server";

import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import { mutfakSahibiMi, oturumAl } from "@/lib/oturum";
import { calismayaAcikMi, kuryeAlabilirMi, type SiparisDurumu } from "@/lib/siparis";

export type TeslimatDurumu = { hata?: string; basari?: string };

/**
 * Siparişin göründüğü BÜTÜN ekranlar tazelenir.
 *
 * Aynı sipariş beş yerde birden duruyor ve listenin tek tek sayılması gerekiyor.
 * Sipariş tahtası iki yerde çiziliyor — işletmenin kendi panelinde ve
 * yöneticinin işletme görünümünde (bkz. app/admin/isletmeler/[slug]) — ikisi de
 * unutulmuştu: "hazır" denen sipariş, sayfa elle yenilenene kadar "Yeni"
 * sütununda durmaya devam ediyordu.
 *
 * `/admin/isletmeler` için "layout": alt yolları da (her işletmenin kendi
 * sayfası) kapsasın; tek tek slug yazmak, bir sonraki işletme eklendiğinde
 * sessizce eksik kalırdı.
 */
function yenile(): void {
  revalidatePath("/panel");
  revalidatePath("/isletme");
  revalidatePath("/admin");
  revalidatePath("/admin/isletmeler", "layout");
  revalidatePath("/hesabim/siparisler");
}

/**
 * Mutfak "hazır" der — kurye artık alabilir.
 *
 * Yalnızca o siparişin mutfağı ve yönetici çağırabilir; hangi mutfağa ait
 * olduğu SİPARİŞTEN okunuyor, formdan gelen bilgiye güvenilmiyor.
 */
export async function siparisHazirAction(
  _oncekiDurum: TeslimatDurumu,
  formVerisi: FormData,
): Promise<TeslimatDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: "Giriş yapman gerekiyor." };

  const siparisNo = String(formVerisi.get("siparisNo") ?? "").trim();
  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: "Sipariş bulunamadı." };

  /* İşletme de kendi mutfağının siparişini "hazır" yapabiliyor — mutfak işi. */
  const yetkili =
    oturum.rol === "admin" ||
    (mutfakSahibiMi(oturum.rol) && oturum.restoranSlug === siparis.restoranSlug);
  if (!yetkili) return { hata: "Bu siparişi güncelleme yetkin yok." };

  if (siparis.durum === "hazir") {
    return { hata: "Bu sipariş zaten hazır olarak işaretlenmiş." };
  }
  /*
   * Kapıda ödemeli sipariş de "hazır" yapılabiliyor: parası kapıda alınacağı
   * için ömrü boyunca `odeme-bekliyor` kalıyor ve eski kural (`durum ===
   * "odendi"`) o siparişleri mutfakta kilitliyordu (bkz. lib/siparis →
   * calismayaAcikMi).
   */
  if (!calismayaAcikMi(siparis)) {
    return { hata: "Bu siparişin ödemesi henüz alınmadı." };
  }

  await depo.durumGuncelle(siparisNo, "hazir");
  yenile();
  return { basari: `${siparisNo} kurye için hazır olarak işaretlendi.` };
}

/**
 * KURYE TESLİM ALDI — sipariş yola çıkıyor.
 *
 * Yalnızca siparişe ATANMIŞ kurye basabilir. Başka bir kurye sipariş
 * numarasını bilse bile işleyemiyor; atama sipariş kaydından okunuyor.
 */
export async function teslimAldimAction(
  _oncekiDurum: TeslimatDurumu,
  formVerisi: FormData,
): Promise<TeslimatDurumu> {
  return kuryeAdimi(formVerisi, "yolda");
}

/** Kurye müşteriye teslim etti — sipariş tamamlandı. */
export async function teslimEttimAction(
  _oncekiDurum: TeslimatDurumu,
  formVerisi: FormData,
): Promise<TeslimatDurumu> {
  return kuryeAdimi(formVerisi, "teslim-edildi");
}

async function kuryeAdimi(
  formVerisi: FormData,
  hedef: SiparisDurumu,
): Promise<TeslimatDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: "Giriş yapman gerekiyor." };

  const siparisNo = String(formVerisi.get("siparisNo") ?? "").trim();
  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: "Sipariş bulunamadı." };

  // Yetki: siparişe atanmış kurye ya da yönetici.
  const yetkili =
    oturum.rol === "admin" ||
    (oturum.rol === "kurye" && siparis.atananKurye === oturum.eposta);
  if (!yetkili) return { hata: "Bu teslimat sana atanmamış." };

  if (hedef === "yolda" && !kuryeAlabilirMi(siparis.durum)) {
    return { hata: "Mutfak bu siparişi henüz hazır olarak işaretlemedi." };
  }
  if (hedef === "teslim-edildi" && siparis.durum !== "yolda") {
    return { hata: "Önce siparişi teslim almalısın." };
  }

  await depo.durumGuncelle(siparisNo, hedef);
  yenile();
  return {
    basari:
      hedef === "yolda"
        ? `${siparisNo} teslim alındı, müşteriye götürüyorsun.`
        : `${siparisNo} teslim edildi. Eline sağlık.`,
  };
}
