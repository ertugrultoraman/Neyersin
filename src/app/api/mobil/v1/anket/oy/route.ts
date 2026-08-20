import crypto from "node:crypto";

import type { NextRequest } from "next/server";

import { yayindakiAnketler } from "@/app/anket-actions";
import { hesapDepoAl, type AnketOyu } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku, sunucuHatasi } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";
import type { AnketDto } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/anket/oy
 *
 * Ana sayfadaki ankete oy verir ve GÜNCEL SAYILARI geri döner: uygulama oyu
 * gönderip sonucu görmek için ikinci bir istek atmasın.
 *
 * SEÇMEN KİMLİĞİ: girişliyse e-posta, değilse uygulamanın gönderdiği cihaz
 * kimliği. Web'de bu iş çereze yazılan misafir kimliğiyle yapılıyor
 * (bkz. anket-actions → misafirKimligi); uygulamada çerez yok, cihazın kendi
 * kalıcı kimliği aynı işi görüyor. İkisi de kesin koruma değil ve bilerek
 * öyle: daha sıkısı girişi zorunlu kılmak olurdu, o da katılımı düşürürdü.
 *
 * ANKET KİMLİĞİ YAYINDAKİLER ARASINDA ARANIYOR — doğrudan okunsaydı yayından
 * kaldırılmış bir ankete oy yağdırılabilirdi (web tarafındaki kuralın aynısı).
 */
export async function POST(istek: NextRequest) {
  return acik(istek, async (oturum) => {
    const govde = await govdeOku<{ anketId?: string; secenekId?: string; cihaz?: string }>(istek);

    const anketId = govde?.anketId?.trim() ?? "";
    const secenekId = govde?.secenekId?.trim() ?? "";
    const cihaz = govde?.cihaz?.trim() ?? "";

    if (!anketId || !secenekId) return gecersiz("Anket ya da seçenek belirtilmedi.");
    if (!oturum && !cihaz) return gecersiz("Cihaz kimliği gerekiyor.");

    const anket = (await yayindakiAnketler()).find((a) => a.id === anketId);
    if (!anket || !anket.secenekler.some((s) => s.id === secenekId)) {
      return gecersiz("Bu seçenek bu ankette yok.");
    }

    const oy: AnketOyu = {
      id: crypto.randomUUID(),
      anketId: anket.id,
      secmen: oturum ? `hesap:${oturum.eposta}` : `cihaz:${cihaz}`,
      secenek: secenekId,
      ...(oturum?.ad ? { ad: oturum.ad } : {}),
      girisli: Boolean(oturum),
      tarih: new Date().toISOString(),
    };

    try {
      const depo = await hesapDepoAl();
      await depo.anketOyVer(oy);

      /*
       * Oylar oy KAYITLARINDAN sayılıyor, sayaç tutulmuyor: aynı kişi fikrini
       * değiştirip yeniden oy verdiğinde (kayıt güncelleniyor) sayaç yanlış
       * kalırdı. Okuma biraz daha pahalı, karşılığında sayı her zaman doğru.
       */
      const oylar = await depo.anketOylariListele(anket.id);
      const sayim = new Map<string, number>();
      for (const kayit of oylar) {
        sayim.set(kayit.secenek, (sayim.get(kayit.secenek) ?? 0) + 1);
      }

      const cevap: AnketDto = {
        id: anket.id,
        soru: anket.soru,
        secenekler: anket.secenekler.map((s) => ({
          id: s.id,
          etiket: s.etiket,
          oy: sayim.get(s.id) ?? 0,
        })),
        toplamOy: oylar.length,
      };

      return basarili(cevap);
    } catch (e) {
      console.error("[mobil] anket oyu kaydedilemedi:", e);
      return sunucuHatasi("Oyun kaydedilemedi, tekrar dene.");
    }
  });
}
