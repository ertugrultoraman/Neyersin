import type { Anket, AnketOyu } from "@/lib/hesaplar";

/** Oy verenler tablosunda gösterilecek en çok satır — sayfa şişmesin. */
const AZAMI_SATIR = 200;

/**
 * Yayındaki BİR anketin yönetim özeti: dağılım + kimin ne oy verdiği.
 *
 * Ana sayfada aynı anda birden fazla anket durabildiği için bu kart anket
 * başına çiziliyor. Müşteri yalnızca yüzdeleri görüyor, o da ancak oy
 * verdikten sonra; kim ne demiş bilgisi yalnızca burada.
 */
export function AnketSonucKarti({ anket, oylar }: { anket: Anket; oylar: AnketOyu[] }) {
  const sayim = new Map<string, number>();
  for (const o of oylar) sayim.set(o.secenek, (sayim.get(o.secenek) ?? 0) + 1);

  const toplam = oylar.length;
  const dagilim = anket.secenekler
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

  const girisliSayisi = oylar.filter((o) => o.girisli).length;
  const etiketBul = (id: string) => anket.secenekler.find((s) => s.id === id)?.etiket ?? id;

  return (
    <section className="mt-6 rounded-3xl border border-kahve-900/8 bg-white p-5">
      <h2 className="font-display text-base font-extrabold text-kahve-900">{anket.soru}</h2>
      <p className="mt-0.5 text-xs text-kahve-500">
        {toplam} oy ({girisliSayisi} üye, {toplam - girisliSayisi} misafir)
      </p>

      {toplam === 0 ? (
        <p className="mt-4 text-sm text-kahve-500">Bu ankete henüz oy verilmedi.</p>
      ) : (
        <>
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

          <h3 className="mt-6 text-2xs font-bold tracking-wide text-kahve-500 uppercase">
            Oy verenler
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-2xs tracking-wide text-kahve-500 uppercase">
                  <th className="pb-2 pr-4 font-bold">Kişi</th>
                  <th className="pb-2 pr-4 font-bold">Seçimi</th>
                  <th className="pb-2 font-bold">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {oylar.slice(0, AZAMI_SATIR).map((o) => (
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
            {oylar.length > AZAMI_SATIR && (
              <p className="mt-2 text-xs text-kahve-500">
                İlk {AZAMI_SATIR} oy gösteriliyor; toplam {oylar.length}.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
