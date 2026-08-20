import type { NextRequest } from "next/server";

import { acikMi, VARSAYILAN_PROGRAM, type HaftaProgrami } from "@/lib/calisma-saatleri";
import { saatleriAl, saatleriKaydet } from "@/lib/calisma-saatleri-depo";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import type { CalismaSaatleriDto, GunProgramiDto } from "@/lib/mobil/tipler";

/**
 * GET  /api/mobil/v1/mutfak/saatler → mutfağın haftalık programı
 * POST /api/mobil/v1/mutfak/saatler → programı ve elden kapatmayı kaydeder
 *
 * İKİ AYRI KAPALILIK: program (haftanın normal düzeni) ve elden kapatma
 * ("bugün yetişemiyorum"). İkincisi programı EZMİYOR, üstüne biniyor; süresi
 * dolunca program yeniden geçerli oluyor.
 *
 * "AÇIK MI" HESABI SUNUCUDA (acikMi): uygulama kuralı yeniden yorumlamıyor.
 * Telefonun saati yanlışsa mutfağın kapalı görünmesi, gerçekten kapalı
 * olmasından bağımsız bir hata olurdu.
 */
const SAAT_DESENI = /^([01]\d|2[0-3]):[0-5]\d$/;

function programOku(ham: unknown): HaftaProgrami {
  if (!Array.isArray(ham) || ham.length !== 7) return VARSAYILAN_PROGRAM;

  return ham.map((gun, i) => {
    const g = gun as Partial<GunProgramiDto> | null;
    const varsayilan = VARSAYILAN_PROGRAM[i];
    return {
      kapali: Boolean(g?.kapali),
      /* Bozuk saat sessizce varsayılana düşüyor: yarım bir programla
         mutfağı gün boyu kapatmak, hata döndürmekten daha kötü. */
      acilis: SAAT_DESENI.test(g?.acilis ?? "") ? (g?.acilis ?? "") : varsayilan.acilis,
      kapanis: SAAT_DESENI.test(g?.kapanis ?? "") ? (g?.kapanis ?? "") : varsayilan.kapanis,
    };
  });
}

function cevapKur(program: HaftaProgrami, elleKapaliBitis?: string): CalismaSaatleriDto {
  const durum = acikMi({ program, ...(elleKapaliBitis ? { elleKapaliBitis } : {}) });
  return {
    program,
    ...(elleKapaliBitis ? { elleKapaliBitis } : {}),
    acik: durum.acik,
    ...(durum.acik ? {} : { sebep: durum.sebep }),
  };
}

export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    if (!oturum.restoranSlug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    const saatler = await saatleriAl(oturum.restoranSlug);
    return basarili(
      cevapKur(saatler?.program ?? VARSAYILAN_PROGRAM, saatler?.elleKapaliBitis),
    );
  });
}

export async function POST(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    const slug = oturum.restoranSlug;
    if (!slug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    const govde = await govdeOku<{
      program?: unknown;
      /* Saat cinsinden: 1, 2, 4 gibi. 0 ya da yokluk elden kapatmayı kaldırıyor. */
      kapatmaSaati?: number;
    }>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const program = programOku(govde.program);
    const saat = Number(govde.kapatmaSaati ?? 0);
    const elleKapaliBitis =
      Number.isFinite(saat) && saat > 0 && saat <= 12
        ? new Date(Date.now() + saat * 60 * 60 * 1000).toISOString()
        : undefined;

    await saatleriKaydet(slug, {
      program,
      ...(elleKapaliBitis ? { elleKapaliBitis } : {}),
    });

    return basarili(cevapKur(program, elleKapaliBitis));
  });
}
