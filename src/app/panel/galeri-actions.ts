"use server";

import crypto from "node:crypto";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { hataMetni } from "@/lib/hata-metni";
import { hesapDepoAl } from "@/lib/hesaplar";
import { duzenleyebilirMi, oturumAl } from "@/lib/oturum";

export type GaleriDurumu = { hata?: string; basari?: string };

/**
 * MUTFAKTAN KARELER — şefin kendi çektiği fotoğraflar.
 *
 * NEDEN AYRI BİR YÜKLEME AKIŞI: profil formu metin kaydediyor, fotoğraf ise
 * dosya. Aynı forma konsaydı şef tek bir kare eklemek için bütün profili
 * yeniden göndermek zorunda kalırdı — ve gönderim sırasında bir alan
 * boşsa, dokunmadığı bir bilgiyi silerdi.
 *
 * YÜZ FOTOĞRAFININ YERİNE GEÇMİYOR, yanında duruyor: bazı ev hanımları
 * yüzünü koymak istemiyor ve bu tercihe saygı duyulması gerekiyor. Tencerenin
 * başındaki bir kare de "bunu kim, nerede pişiriyor" sorusuna cevap veriyor.
 *
 * SVG bilerek yasak: içine betik gömülüp tarayıcıda çalıştırılabiliyor
 * (aynı kural: hesap/fotograf-actions).
 */
const IZINLI_TURLER = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const AZAMI_BOYUT = 4 * 1024 * 1024;
/**
 * Profil sayfası albüm değil, mutfağa açılan küçük bir pencere.
 *
 * DIŞA AKTARILMIYOR: "use server" dosyasından yalnızca async işlev
 * verilebiliyor; sabit olarak paylaşılsaydı derleme patlıyordu. Arayüz
 * tarafındaki kopyası MutfakKareleri içinde duruyor.
 */
const AZAMI_KARE = 6;

/**
 * Düzenlenecek mutfağı belirler ve yetkiyi SUNUCUDA doğrular.
 *
 * Slug formdan yalnızca YÖNETİCİ için okunuyor; şefin kendi oturumundaki
 * mutfak kullanılıyor. Aksi hâlde gizli alandaki slug'ı değiştiren biri
 * başkasının profiline fotoğraf koyabilirdi.
 */
async function hedefMutfak(formVerisi: FormData): Promise<string | null> {
  const oturum = await oturumAl();
  if (!oturum) return null;

  const slug =
    oturum.rol === "admin"
      ? String(formVerisi.get("restoranSlug") ?? "").trim() || oturum.restoranSlug
      : oturum.restoranSlug;

  if (!slug || !duzenleyebilirMi(oturum, slug)) return null;
  return slug;
}

function tazele(slug: string) {
  revalidatePath("/panel");
  revalidatePath(`/restoran/${slug}`);
}

export async function mutfakKaresiYukleAction(
  _oncekiDurum: GaleriDurumu,
  formVerisi: FormData,
): Promise<GaleriDurumu> {
  const slug = await hedefMutfak(formVerisi);
  if (!slug) return { hata: await hataMetni("saat.yetkiYok") };

  const dosya = formVerisi.get("kare");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { hata: await hataMetni("fotograf.sec") };
  }
  if (!IZINLI_TURLER.includes(dosya.type)) return { hata: await hataMetni("fotograf.tur") };
  if (dosya.size > AZAMI_BOYUT) return { hata: await hataMetni("fotograf.buyuk") };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { hata: await hataMetni("fotograf.depoYok") };

  const depo = await hesapDepoAl();
  const profil = await depo.profilAl(slug);
  const mevcut = profil?.galeri ?? [];

  if (mevcut.length >= AZAMI_KARE) {
    return { hata: await hataMetni("profil.kareSinir", { adet: AZAMI_KARE }) };
  }

  try {
    const uzanti = dosya.type.split("/")[1] ?? "jpg";
    const { url } = await put(`ny/mutfak/${crypto.randomUUID()}.${uzanti}`, dosya, {
      access: "public",
      contentType: dosya.type,
    });

    await depo.profilKaydet({
      /*
       * Mevcut profilin ÜSTÜNE yazılıyor: yalnızca galeri alanı değişiyor.
       * Boş bir nesneyle kaydedilseydi biyografi, uzmanlık ve Altın Şef
       * unvanı bir fotoğraf yüklendiği için silinirdi.
       */
      ...(profil ?? { restoranSlug: slug, guncellemeTarihi: new Date().toISOString() }),
      restoranSlug: slug,
      galeri: [...mevcut, url],
      guncellemeTarihi: new Date().toISOString(),
    });
  } catch (hata) {
    console.error("mutfak karesi yuklenemedi:", hata);
    return { hata: await hataMetni("fotograf.yuklenemedi") };
  }

  tazele(slug);
  return { basari: await hataMetni("profil.kareEklendi") };
}

/** Tek kareyi kaldırır; diğerleri ve profilin geri kalanı yerinde kalır. */
export async function mutfakKaresiSilAction(
  _oncekiDurum: GaleriDurumu,
  formVerisi: FormData,
): Promise<GaleriDurumu> {
  const slug = await hedefMutfak(formVerisi);
  if (!slug) return { hata: await hataMetni("saat.yetkiYok") };

  const url = String(formVerisi.get("url") ?? "").trim();
  if (!url) return { hata: await hataMetni("profil.kareSecilmedi") };

  const depo = await hesapDepoAl();
  const profil = await depo.profilAl(slug);
  if (!profil) return { hata: await hataMetni("hata.sefProfiliYok") };

  const kalan = (profil.galeri ?? []).filter((k: string) => k !== url);

  /*
   * Blob'daki dosya SİLİNMİYOR, yalnızca profilden düşüyor. Adres tahmin
   * edilemeyen bir UUID ve kimseye bağlanmıyor; silme çağrısı başarısız
   * olsaydı kare profilde durmaya devam ederdi — kullanıcının gördüğü
   * sonucu, temizlenmemiş bir dosyaya bağlamak yanlış olurdu.
   */
  await depo.profilKaydet({
    ...profil,
    galeri: kalan.length > 0 ? kalan : undefined,
    guncellemeTarihi: new Date().toISOString(),
  });

  tazele(slug);
  return { basari: await hataMetni("profil.kareKaldirildi") };
}
