import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { anketSecenegiBul, ANKET_SORUSU } from "@/content/anket";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Anket — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ANKET SONUÇLARI — yalnızca yönetici.
 *
 * Müşteri yalnızca yüzdeleri görüyor; kimin ne oy verdiği burada. Girişsiz
 * oylar "misafir" olarak sayılıyor, kim olduğu bilinmiyor — kişiyi tanımlayan
 * bir bilgi zaten toplanmıyor.
 */
export default async function AnketSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  let oylar: Awaited<ReturnType<Awaited<ReturnType<typeof hesapDepoAl>>["anketOylariListele"]>> = [];
  try {
    oylar = await (await hesapDepoAl()).anketOylariListele();
  } catch {
    oylar = [];
  }

  const sayim = new Map<string, number>();
  for (const o of oylar) sayim.set(o.secenek, (sayim.get(o.secenek) ?? 0) + 1);
  const toplam = oylar.length;

  const dagilim = [...sayim.entries()]
    .map(([id, adet]) => ({
      id,
      etiket: anketSecenegiBul(id)?.etiket ?? id,
      adet,
      yuzde: toplam > 0 ? Math.round((adet / toplam) * 100) : 0,
    }))
    .sort((a, b) => b.adet - a.adet);

  const girisliSayisi = oylar.filter((o) => o.girisli).length;

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Anket"
      aciklama={`${toplam} oy · ${girisliSayisi} üyeden, ${toplam - girisliSayisi} misafirden`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <p className="mt-5 rounded-2xl bg-kahve-900/4 px-4 py-3 text-xs leading-relaxed text-kahve-600">
        <strong className="font-display">{ANKET_SORUSU}</strong> — Müşteri yalnızca yüzdeleri
        görür ve o da ancak oy verdikten sonra; önden görmek tercihini etkiliyordu. Kimin ne oy
        verdiği yalnızca bu sayfada.
      </p>

      {toplam === 0 ? (
        <p className="mt-8 rounded-3xl border border-kahve-900/8 bg-white p-10 text-center text-sm text-kahve-500">
          Henüz oy verilmedi.
        </p>
      ) : (
        <>
          <section className="mt-6 rounded-3xl border border-kahve-900/8 bg-white p-5">
            <h2 className="font-display text-base font-extrabold text-kahve-900">Dağılım</h2>
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
                  {oylar.slice(0, 300).map((o) => (
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
                        {anketSecenegiBul(o.secenek)?.etiket ?? o.secenek}
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
