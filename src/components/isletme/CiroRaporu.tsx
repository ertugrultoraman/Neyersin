import type { IsletmeRaporu } from "@/lib/isletme-rapor";
import { paraFormatla } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * CİRO VE RAPOR.
 *
 * Şef panelinde yalnızca sipariş sayısı vardı; işletme "bugün ne kazandım,
 * neyi çok satıyorum" sorusunu soruyor.
 *
 * TESLİM EDİLEN ile YOLDAKİ bilerek ayrı kutularda: parası alınmış ama hâlâ
 * mutfakta duran siparişi kazanılmış ciroya katmak, işletmeye elinde olmayan
 * parayı göstermek olurdu (bkz. lib/isletme-rapor.ts).
 */
export async function CiroRaporu({ rapor }: { rapor: IsletmeRaporu }) {
  const c = ceviri(await aktifDil());

  const donemler = [
    { etiket: c("rapor.bugun"), veri: rapor.bugun },
    { etiket: c("rapor.sonYediGun"), veri: rapor.sonYediGun },
    { etiket: c("rapor.sonOtuzGun"), veri: rapor.sonOtuzGun },
  ];

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-kahve-900">{c("rapor.baslik")}</h2>
      <p className="mt-1 text-sm text-kahve-600">{c("rapor.aciklama")}</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        {donemler.map((d) => (
          <div
            key={d.etiket}
            className="rounded-2xl border border-kahve-900/8 bg-white px-4 py-3.5"
          >
            <dt className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
              {d.etiket}
            </dt>
            <dd className="mt-1 font-display text-xl font-extrabold text-kahve-900">
              {paraFormatla(d.veri.ciro)}
            </dd>
            <dd className="mt-0.5 text-xs text-kahve-500">
              {c("rapor.siparisVeOrtalama", {
                sayi: d.veri.siparis,
                ortalama: paraFormatla(d.veri.ortalama),
              })}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-sari-500/30 bg-sari-500/8 px-4 py-3.5">
          <p className="text-2xs font-bold tracking-wide text-kahve-600 uppercase">
            {c("rapor.yoldaki")}
          </p>
          <p className="mt-1 font-display text-lg font-extrabold text-kahve-900">
            {paraFormatla(rapor.yoldakiCiro)}
          </p>
          <p className="mt-0.5 text-xs text-kahve-600">
            {c("rapor.yoldakiAciklama", { sayi: rapor.yoldakiSiparis })}
          </p>
        </div>

        <div className="rounded-2xl border border-kahve-900/8 bg-white px-4 py-3.5">
          <p className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
            {c("rapor.iptal")}
          </p>
          <p className="mt-1 font-display text-lg font-extrabold text-kahve-900">
            %{rapor.iptalOrani}
          </p>
          <p className="mt-0.5 text-xs text-kahve-500">
            {c("rapor.iptalAciklama", { sayi: rapor.iptal })}
          </p>
        </div>
      </div>

      <h3 className="mt-6 font-display text-base font-extrabold text-kahve-900">
        {c("rapor.enCokSatan")}
      </h3>
      {rapor.enCokSatan.length === 0 ? (
        <p className="mt-2 text-sm text-kahve-500">{c("rapor.satisYok")}</p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {rapor.enCokSatan.map((u, i) => (
            <li
              key={u.ad}
              className="flex items-center gap-3 rounded-2xl border border-kahve-900/8
                bg-white px-4 py-2.5"
            >
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center rounded-full bg-kahve-900/6
                  text-xs font-extrabold text-kahve-700"
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-kahve-900">
                {u.ad}
              </span>
              <span className="shrink-0 text-xs font-semibold text-kahve-500">
                {c("rapor.adet", { sayi: u.adet })}
              </span>
              <span className="shrink-0 font-display text-sm font-extrabold text-kahve-900">
                {paraFormatla(u.ciro)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
