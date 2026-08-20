import crypto from "node:crypto";

import { put } from "@vercel/blob";
import type { NextRequest } from "next/server";

import { hesapDepoAl } from "@/lib/hesaplar";
import { basarili, gecersiz, sunucuHatasi } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { AZAMI_KARE_BOYUTU, IZINLI_KARE_TURLERI } from "@/lib/mutfak-kare";

/**
 * POST   /api/mobil/v1/hesap/fotograf → profil fotoğrafını değiştirir
 * DELETE /api/mobil/v1/hesap/fotograf → fotoğrafı kaldırır
 *
 * HEDEF HESAP HER ZAMAN OTURUMUNKİ: gövdeden e-posta okunmuyor. Web tarafında
 * yönetici başkasının fotoğrafını değiştirebiliyor (admin/hesaplar ekranı);
 * telefonda böyle bir ekran yok ve olmayan bir ekran için yetki açmak,
 * yalnızca yanlış kullanılabilecek bir kapı bırakırdı.
 *
 * Dosya adında e-posta KULLANILMIYOR: blob adresleri herkese açık ve tahmin
 * edilebilir; adres ele geçse bile kimin hesabı olduğu okunmasın.
 *
 * SVG bilerek yasak (izinli türler ortak dosyada): içine betik gömülüp
 * tarayıcıda çalıştırılabiliyor.
 */
export async function POST(istek: NextRequest) {
  return korumali(istek, { hiz: "agir" }, async (oturum) => {
    let form: FormData;
    try {
      form = await istek.formData();
    } catch {
      return gecersiz("Fotoğraf okunamadı.");
    }

    const dosya = form.get("fotograf");
    if (!(dosya instanceof File) || dosya.size === 0) return gecersiz("Bir fotoğraf seç.");
    if (!IZINLI_KARE_TURLERI.includes(dosya.type)) {
      return gecersiz("JPG, PNG, WebP veya AVIF olmalı.");
    }
    if (dosya.size > AZAMI_KARE_BOYUTU) return gecersiz("Fotoğraf en fazla 4 MB olabilir.");
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return gecersiz("Görsel deposu yapılandırılmadı.");
    }

    try {
      const uzanti = dosya.type.split("/")[1] ?? "jpg";
      const { url } = await put(`ny/profil/${crypto.randomUUID()}.${uzanti}`, dosya, {
        access: "public",
        contentType: dosya.type,
      });
      await (await hesapDepoAl()).fotografKaydet(oturum.eposta, url);
      return basarili({ fotografUrl: url }, 201);
    } catch (e) {
      console.error("[mobil] profil fotografi yuklenemedi:", e);
      return sunucuHatasi("Fotoğraf yüklenemedi, tekrar dene.");
    }
  });
}

/** Fotoğrafı kaldırır — hesap yine adın baş harfleriyle görünür. */
export async function DELETE(istek: NextRequest) {
  return korumali(istek, {}, async (oturum) => {
    await (await hesapDepoAl()).fotografKaydet(oturum.eposta, undefined);
    return basarili({ fotografUrl: null });
  });
}
