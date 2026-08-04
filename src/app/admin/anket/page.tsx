import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { yayindakiAnket } from "@/app/anket-actions";
import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { AnketOlustur } from "@/components/admin/AnketOlustur";
import { AnketSatiri } from "@/components/admin/AnketSatiri";
import { VARSAYILAN_ANKET } from "@/content/anket";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl, type Anket, type AnketOyu } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Anket — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ANKET YÖNETİMİ — yalnızca yönetici.
 *
 * Buradan anket oluşturulur, yayınlanır, silinir; yayındaki anketin sonucu ve
 * KİMİN NE OY VERDİĞİ de burada. Müşteri yalnızca yüzdeleri görüyor, o da
 * ancak oy verdikten sonra. Girişsiz oylar "misafir" olarak sayılıyor —
 * kişiyi tanımlayan bir bilgi zaten toplanmıyor.
 */
export default async function AnketSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  let anketler: Anket[] = [];
  let oylar: AnketOyu[] = [];
  try {
    const depo = await hesapDepoAl();
    [anketler, oylar] = await Promise.all([depo.anketleriListele(), depo.anketOylariListele()]);
  } catch {
    // depo erişilemiyorsa sayfa yine açılsın, boş görünsün
  }

  const acikAnket = await yayindakiAnket();

  /*
   * Varsayılan anket kod dosyasında yaşıyor, veritabanında kaydı olmayabilir.
   * Oyları duruyorsa listede görünmeli — yoksa "0 oy" sanılıp yanlış karar
   * verilir.
   */
  const varsayilanOylari = oylar.filter((o) => o.anketId === VARSAYILAN_ANKET.id).length;
  const listelenecek: Anket[] = [...anketler];
  if (
    !anketler.some((a) => a.id === VARSAYILAN_ANKET.id) &&
    (varsayilanOylari > 0 || anketler.length === 0)
  ) {
    listelenecek.push({ ...VARSAYILAN_ANKET, yayinda: acikAnket.id === VARSAYILAN_ANKET.id });
  }

  // Yayındaki anketin dağılımı
  const acigininOylari = oylar.filter((o) => o.anketId === acikAnket.id);
  const sayim = new Map<string, number>();
  for (const o of acigininOylari) sayim.set(o.secenek, (sayim.get(o.secenek) ?? 0) + 1);
  const toplam = acigininOylari.length;

  const dagilim = acikAnket.secenekler
    .map((s) => {
      const adet = sayim.get(s.id) ?? 0;
      return {
        id: s.id,
        etiket: s.etiket,
        adet,
        yuzde: toplam > 0 ? Math.round((adet / toplam) * 100) : 0,
      };
    })
    .sort((a, b) => b.adet - a.adet);

  const girisliSayisi = acigininOylari.filter((o) => o.girisli).length;
  const etiketBul = (id: string) => acikAnket.secenekler.find((s) => s.id === id)?.etiket ?? id;

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Anket"
      aciklama={`${listelenecek.length} anket · yayındakinde ${toplam} oy (${girisliSayisi} üye, ${toplam - girisliSayisi} misafir)`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <AnketOlustur />

      <section className="mt-6">
        <h2 className="font-display text-base font-extrabold text-kahve-900">Anketler</h2>
        <p className="mt-1 text-xs leading-relaxed text-kahve-500">
          Aynı anda yalnızca bir anket yayında olur; yenisini yayına alınca eskisi kendiliğinden
          iner. Ana sayfada anketin duracağı kutuyu sürükleyerek değiştirebilirsin.
        </p>
        <ul className="mt-3 space-y-2.5">
          {listelenecek.map((a) => (
            <AnketSatiri
              key={a.id}
              anket={{
                id: a.id,
                soru: a.soru,
                secenekSayisi: a.secenekler.length,
                oySayisi: oylar.filter((o) => o.anketId === a.id).length,
                yayinda: a.yayinda,
                tarih: a.olusturmaTarihi,
              }}
            />
          ))}
        </ul>
      </section>

      {toplam === 0 ? (
        <p className="mt-8 rounded-3xl border border-kahve-900/8 bg-white p-10 text-center text-sm text-kahve-500">
          Yayındaki ankete henüz oy verilmedi.
        </p>
      ) : (
        <>
          <section className="mt-6 rounded-3xl border border-kahve-900/8 bg-white p-5">
            <h2 className="font-display text-base font-extrabold text-kahve-900">
              Dağılım — {acikAnket.soru}
            </h2>
            <ul className="mt-4 space-y-3">
              {dagilim.map((d, i) => (
                <li key={d.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-kahve-800">{d.etiket}</span>
                    <span className="text-xs font-bold tabular-nums text-kahve-600">
                      {d.adet} oy · %{d.yuzde}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-kahve-900/8">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-sari-500" : "bg-kahve-900/25"}`}
                      style={{ width: `${d.yuzde}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-3xl border border-kahve-900/8 bg-white p-5">
            <h2 className="font-display text-base font-extrabold text-kahve-900">Oy verenler</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-2xs tracking-wide text-kahve-500 uppercase">
                    <th className="pb-2 pr-4 font-bold">Kişi</th>
                    <th className="pb-2 pr-4 font-bold">Seçimi</th>
                    <th className="pb-2 font-bold">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {acigininOylari.slice(0, 300).map((o) => (
                    <tr key={o.id} className="border-t border-kahve-900/8">
                      <td className="py-2 pr-4">
                        {o.girisli ? (
                          <>
                            <span className="font-bold text-kahve-900">{o.ad ?? "Üye"}</span>
                            <span className="ml-2 text-xs text-kahve-500">
                              {o.secmen.replace(/^hesap:/, "")}
                            </span>
                          </>
                        ) : (
                          <span className="text-kahve-500">Misafir</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 font-semibold text-kahve-800">
                        {etiketBul(o.secenek)}
                      </td>
                      <td className="py-2 text-xs whitespace-nowrap text-kahve-500">
                        {new Date(o.tarih).toLocaleString("tr-TR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AdminKabuk>
  );
}
