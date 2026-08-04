import Link from "next/link";
import { tamamlandiMi } from "@/lib/siparis";

import { depoAl } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import type { Yorum, YorumOzeti } from "@/lib/hesaplar/tipler";
import { duzenleyebilirMi, oturumAl } from "@/lib/oturum";
import { YorumFormu } from "./YorumFormu";
import { YorumYonetimi } from "./YorumYonetimi";
import { EksenDokumu, YildizGosterge } from "./Yildizlar";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Bir restoranın/şefin değerlendirmeleri ve yorum yazma alanı.
 *
 * Puanlar üç eksende tutulur (sıcaklık, teslimat hızı, tad); ortalama bu üçünün
 * aritmetik ortalamasıdır. Yalnızca bu mutfaktan TESLİM EDİLMİŞ siparişi olan
 * müşteri yazabilir ve sipariş başına yalnızca bir kez — kural sunucuda da
 * ayrıca uygulanır (bkz. app/hesabim/yorum-actions.ts), buradaki kontrol
 * sadece doğru mesajı göstermek için.
 */
async function yazilabilirSiparis(restoranSlug: string): Promise<string | null> {
  const oturum = await oturumAl();
  if (!oturum) return null;

  try {
    const siparisler = await (await depoAl()).listele({
      musteriEpostasi: oturum.eposta,
      restoranSlug,
      limit: 50,
    });
    const teslimEdilen = siparisler.filter((s) => tamamlandiMi(s.durum));
    if (teslimEdilen.length === 0) return null;

    const hesapDepo = await hesapDepoAl();
    for (const s of teslimEdilen) {
      if (!(await hesapDepo.siparisYorumlandiMi(s.siparisNo))) return s.siparisNo;
    }
    return null;
  } catch {
    return null;
  }
}

export async function YorumBolumu({
  restoranSlug,
  yorumlar,
  ozet,
}: {
  restoranSlug: string;
  yorumlar: Yorum[];
  ozet: YorumOzeti;
}) {
  const c = ceviri(await aktifDil());

  const oturum = await oturumAl();
  const siparisNo = await yazilabilirSiparis(restoranSlug);

  /*
   * İki yetki AYRI:
   *  - Cevap yazma: mutfağın sahibi (ve yönetici). Tek yönlü değerlendirme
   *    adil değil, mutfağın kendini anlatabileceği bir yer olmalı.
   *  - Silme: YALNIZCA yönetici. Mutfak kendi olumsuz yorumunu silebilseydi
   *    puanlar anlamını yitirirdi.
   * Karar sunucuda veriliyor; düğmeler yetkisiz kişiye hiç basılmıyor.
   */
  const sahibiMi = duzenleyebilirMi(oturum, restoranSlug);
  const yoneticiMi = oturum?.rol === "admin";

  return (
    <section
      id="degerlendirmeler"
      className="mt-6 scroll-mt-28 rounded-[1.75rem] border border-kahve-900/8 bg-white p-6 md:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-extrabold text-kahve-900">
          {c("yorum.degerlendirmeler")}
          {ozet.adet > 0 && (
            <span className="ml-2 text-sm font-semibold text-kahve-400">({ozet.adet})</span>
          )}
        </h2>
        {ozet.adet > 0 && (
          <p className="flex items-center gap-2">
            <YildizGosterge puan={ozet.ortalama} boyut="md" />
            <span className="font-display text-lg font-extrabold text-kahve-900">
              {ozet.ortalama.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
              <span className="text-sm font-semibold text-kahve-400"> / 5</span>
            </span>
          </p>
        )}
      </div>

      {ozet.adet === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-kahve-500">
          {c("yorum.henuzYokKisa")}
        </p>
      ) : (
        <EksenDokumu ozet={ozet} className="mt-4" />
      )}

      {/* Yorum yazma alanı */}
      <div className="mt-6 border-t border-kahve-900/8 pt-5">
        {siparisNo ? (
          <>
            <p className="mb-3 text-sm font-bold text-kahve-800">
              Bu mutfaktan bir siparişin teslim edildi — deneyimini paylaşır mısın?
            </p>
            <YorumFormu siparisNo={siparisNo} />
          </>
        ) : oturum ? (
          <p className="text-sm leading-relaxed text-kahve-500">
            {c("yorum.yazabilmekIcin")}{" "}
            değerlendirmediğin bir siparişin olması gerekiyor. Böylece puanlar gerçek
            siparişlere bağlı kalıyor.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-kahve-500">
            {c("yorum.yazmakIcin")}{" "}
            <Link
              href={`/hesap/giris?donus=/restoran/${restoranSlug}`}
              className="font-bold text-sari-700 underline underline-offset-4"
            >
              {c("yorum.girisYapBaglanti")}
            </Link>
            . {c("yorum.sadeceSiparisVeren")}
          </p>
        )}
      </div>

      {yorumlar.length > 0 && (
        <ul className="mt-6 space-y-4 border-t border-kahve-900/8 pt-5">
          {yorumlar.slice(0, 20).map((y) => {
            const kisiselOrtalama =
              Math.round(((y.sicaklik + y.teslimatHizi + y.tad) / 3) * 10) / 10;
            return (
              <li key={y.id}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-extrabold text-kahve-900">{y.musteriAdi}</span>
                  <YildizGosterge puan={kisiselOrtalama} />
                  <span className="text-xs font-bold text-kahve-600">
                    {kisiselOrtalama.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} / 5
                  </span>
                  <span className="text-xs text-kahve-400">
                    {new Date(y.tarih).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <p className="mt-1 text-2xs font-semibold text-kahve-500">
                  {c("yorum.puanKirilimi", {
                    sicaklik: y.sicaklik,
                    teslimat: y.teslimatHizi,
                    tad: y.tad,
                  })}
                </p>
                {y.metin && (
                  <p className="mt-1.5 text-sm leading-relaxed text-kahve-700">{y.metin}</p>
                )}

                {/* Mutfağın cevabı — müşterinin yorumundan görsel olarak ayrı. */}
                {y.yanit && (
                  <div className="mt-2 rounded-2xl border-l-2 border-sari-500 bg-sari-500/8 px-3 py-2">
                    <p className="text-2xs font-bold tracking-wide text-kahve-700 uppercase">
                      {c("yorum.mutfaginCevabi")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-kahve-700">{y.yanit}</p>
                  </div>
                )}

                <YorumYonetimi
                  yorumId={y.id}
                  mevcutYanit={y.yanit}
                  yanitlayabilir={sahibiMi}
                  silebilir={yoneticiMi}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
