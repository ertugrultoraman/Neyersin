import crypto from "node:crypto";

import { put } from "@vercel/blob";
import type { NextRequest } from "next/server";

import { hesapDepoAl } from "@/lib/hesaplar";
import { basarili, gecersiz, sunucuHatasi } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { AZAMI_KARE, AZAMI_KARE_BOYUTU, IZINLI_KARE_TURLERI } from "@/lib/mutfak-kare";

/**
 * POST   /api/mobil/v1/mutfak/kare → mutfaktan bir kare yükler
 * DELETE /api/mobil/v1/mutfak/kare?url=… → kareyi profilden kaldırır
 *
 * MUTFAKTAN KARELER — şefin kendi çektiği fotoğraflar. Yüz fotoğrafının
 * yerine geçmiyor, yanında duruyor: yüzünü koymak istemeyen ev hanımı için de
 * bir yol (bkz. panel/galeri-actions — web tarafındaki aynı akış).
 *
 * TELEFONDAN YÜKLEME asıl yeri: fotoğraf zaten telefonda çekiliyor. Web'de
 * aynı işi yapmak için kişinin fotoğrafı bilgisayara aktarması gerekiyordu.
 *
 * SVG bilerek yasak: içine betik gömülüp tarayıcıda çalıştırılabiliyor.
 */

export async function POST(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"], hiz: "agir" }, async (oturum) => {
    const slug = oturum.restoranSlug;
    if (!slug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    let form: FormData;
    try {
      form = await istek.formData();
    } catch {
      return gecersiz("Fotoğraf okunamadı.");
    }

    const dosya = form.get("kare");
    if (!(dosya instanceof File) || dosya.size === 0) return gecersiz("Bir fotoğraf seç.");
    if (!IZINLI_KARE_TURLERI.includes(dosya.type)) {
      return gecersiz("JPG, PNG, WebP veya AVIF olmalı.");
    }
    if (dosya.size > AZAMI_KARE_BOYUTU) return gecersiz("Fotoğraf en fazla 4 MB olabilir.");
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return gecersiz("Görsel deposu yapılandırılmadı.");
    }

    const depo = await hesapDepoAl();
    const profil = await depo.profilAl(slug);
    const mevcut = profil?.galeri ?? [];
    if (mevcut.length >= AZAMI_KARE) {
      return gecersiz(`En fazla ${AZAMI_KARE} kare ekleyebilirsin. Önce birini kaldır.`);
    }

    try {
      const uzanti = dosya.type.split("/")[1] ?? "jpg";
      const { url } = await put(`ny/mutfak/${crypto.randomUUID()}.${uzanti}`, dosya, {
        access: "public",
        contentType: dosya.type,
      });

      /*
       * Mevcut profilin ÜSTÜNE yazılıyor: yalnızca galeri değişiyor. Boş bir
       * nesneyle kaydedilseydi biyografi, uzmanlık ve Altın Şef unvanı bir
       * fotoğraf yüklendiği için silinirdi.
       */
      const galeri = [...mevcut, url];
      await depo.profilKaydet({
        ...(profil ?? { restoranSlug: slug, guncellemeTarihi: new Date().toISOString() }),
        restoranSlug: slug,
        galeri,
        guncellemeTarihi: new Date().toISOString(),
      });

      return basarili({ galeri }, 201);
    } catch (e) {
      console.error("[mobil] mutfak karesi yuklenemedi:", e);
      return sunucuHatasi("Fotoğraf yüklenemedi, tekrar dene.");
    }
  });
}

export async function DELETE(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    const slug = oturum.restoranSlug;
    if (!slug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    const url = istek.nextUrl.searchParams.get("url")?.trim() ?? "";
    if (!url) return gecersiz("Kaldırılacak kare belirtilmedi.");

    const depo = await hesapDepoAl();
    const profil = await depo.profilAl(slug);
    if (!profil) return gecersiz("Bu hesaba bağlı bir şef profili yok.");

    /*
     * Blob'daki dosya SİLİNMİYOR, yalnızca profilden düşüyor. Adres tahmin
     * edilemeyen bir UUID ve kimseye bağlanmıyor; silme çağrısı başarısız
     * olsaydı kare profilde durmaya devam ederdi (web tarafıyla aynı karar).
     */
    const kalan = (profil.galeri ?? []).filter((k) => k !== url);
    await depo.profilKaydet({
      ...profil,
      galeri: kalan.length > 0 ? kalan : undefined,
      guncellemeTarihi: new Date().toISOString(),
    });

    return basarili({ galeri: kalan });
  });
}
