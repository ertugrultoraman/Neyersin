import type { NextRequest } from "next/server";

import { hesapDepoAl, type SefProfili } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import type { SefProfiliDto, SefProfiliGirdisi } from "@/lib/mobil/tipler";
import { restoranCoz } from "@/lib/restoran-listesi";

/**
 * GET  /api/mobil/v1/mutfak/profil → şefin kendi profili
 * POST /api/mobil/v1/mutfak/profil → profili kaydeder
 *
 * Web'deki panel profil formunun aynısı — aynı alanlar, aynı sınırlar.
 *
 * İKİ ALAN FORMDAN GEÇMİYOR ve bu bilinçli:
 *  - ALTIN ŞEF: yalnızca yönetici veriyor. Formdan geçseydi (ya da eksik
 *    alan "hayır" sayılsaydı) şef sloganını her düzelttiğinde unvanı sessizce
 *    düşerdi — web'de tam olarak bu hata yaşandı.
 *  - GALERİ: kareler ayrı bir uçtan yükleniyor. Bu form onları göndermiyor;
 *    `undefined` yazılsaydı slogan düzeltmek bütün fotoğrafları silerdi.
 * İkisi de mevcut kayıttan korunuyor.
 */
const kirp = (deger: string | undefined, sinir: number) =>
  (deger ?? "").trim().slice(0, sinir) || undefined;

export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    const slug = oturum.restoranSlug;
    if (!slug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    const depo = await hesapDepoAl();
    const [profil, restoran, hesap] = await Promise.all([
      depo.profilAl(slug),
      restoranCoz(slug),
      depo.hesapBul(oturum.eposta),
    ]);

    const cevap: SefProfiliDto = {
      restoranSlug: slug,
      restoranAdi: restoran?.ad ?? slug,
      ...(profil?.slogan ? { slogan: profil.slogan } : {}),
      ...(profil?.uzmanlik ? { uzmanlik: profil.uzmanlik } : {}),
      ...(profil?.biyografi ? { biyografi: profil.biyografi } : {}),
      ...(profil?.sertifikalar ? { sertifikalar: profil.sertifikalar } : {}),
      ...(profil?.deneyimYili ? { deneyimYili: profil.deneyimYili } : {}),
      ...(profil?.memleket ? { memleket: profil.memleket } : {}),
      ...(profil?.imzaYemegi ? { imzaYemegi: profil.imzaYemegi } : {}),
      galeri: profil?.galeri ?? [],
      ...(profil?.alimAdresi ? { alimAdresi: profil.alimAdresi } : {}),
      ...(profil?.alimTelefonu ? { alimTelefonu: profil.alimTelefonu } : {}),
      fotografVar: Boolean(hesap?.fotografUrl),
    };
    return basarili(cevap);
  });
}

export async function POST(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    const slug = oturum.restoranSlug;
    if (!slug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    const govde = await govdeOku<Partial<SefProfiliGirdisi>>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    /*
     * DENEYİM YILI makul bir aralıkta: boş bırakılabiliyor ama "150 yıldır
     * pişiriyorum" yazılamıyor. Üst sınır 70 — 12 yaşında başlayıp 82 yaşında
     * hâlâ pişiren birini bile kapsıyor, ötesi yazım hatası (web'deki kuralın
     * aynısı).
     */
    const hamYil = Number(govde.deneyimYili ?? 0);
    const deneyimYili =
      Number.isFinite(hamYil) && hamYil >= 1 && hamYil <= 70 ? Math.round(hamYil) : undefined;

    const depo = await hesapDepoAl();
    const mevcut = await depo.profilAl(slug);

    const profil: SefProfili = {
      restoranSlug: slug,
      slogan: kirp(govde.slogan, 120),
      uzmanlik: kirp(govde.uzmanlik, 160),
      biyografi: kirp(govde.biyografi, 4000),
      sertifikalar: kirp(govde.sertifikalar, 2000),
      deneyimYili,
      memleket: kirp(govde.memleket, 80),
      imzaYemegi: kirp(govde.imzaYemegi, 80),
      /* Formdan geçmeyen iki alan mevcut kayıttan korunuyor. */
      galeri: mevcut?.galeri,
      altinSef: mevcut?.altinSef ?? false,
      alimAdresi: kirp(govde.alimAdresi, 300),
      alimTelefonu: kirp(govde.alimTelefonu, 20),
      guncellemeTarihi: new Date().toISOString(),
    };

    await depo.profilKaydet(profil);
    return basarili({ basari: "Profilin kaydedildi." });
  });
}
