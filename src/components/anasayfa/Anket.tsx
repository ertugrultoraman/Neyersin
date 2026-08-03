"use client";

import { useActionState } from "react";

import { anketOyVerAction, type AnketDurumu, type AnketSonucu } from "@/app/anket-actions";

const BASLANGIC: AnketDurumu = {};

/**
 * "Genelde ne yemeyi tercih ediyorsunuz?"
 *
 * Yüzdeler yalnızca OY VERDİKTEN SONRA açılıyor: önden görmek insanın
 * tercihini etkiliyor (sürü etkisi) ve sonuç anlamını yitiriyor.
 *
 * Anketin bitiş tarihi yok — sürekli açık, sonuç güncel eğilimi gösteriyor.
 */
export function Anket({ sonuc, baslik }: { sonuc: AnketSonucu; baslik: string }) {
  const [durum, oyVer, bekliyor] = useActionState(anketOyVerAction, BASLANGIC);

  const oyVerdi = Boolean(sonuc.benimOyum) || Boolean(durum.basari);
  const enYuksek = Math.max(...sonuc.dagilim.map((d) => d.yuzde), 0);

  return (
    <aside
      aria-labelledby="anket-basligi"
      className="rounded-[1.75rem] border border-kahve-900/8 bg-white p-5 shadow-yumusak"
    >
      <p className="text-2xs font-bold tracking-wide text-sari-700 uppercase">Kısa anket</p>
      <h2 id="anket-basligi" className="mt-1 font-display text-base font-extrabold text-kahve-900">
        {baslik}
      </h2>

      {/* Kaç kişinin oy verdiği her zaman görünüyor — anketin ağırlığını gösterir. */}
      <p className="mt-1 text-xs font-semibold text-kahve-500">
        {sonuc.toplam === 0
          ? "İlk oyu sen ver"
          : `${sonuc.toplam.toLocaleString("tr-TR")} kişi oy verdi`}
      </p>

      {oyVerdi ? (
        <ul className="mt-4 space-y-2.5">
          {sonuc.dagilim.map((d) => {
            const benim = d.id === sonuc.benimOyum;
            const onde = d.yuzde === enYuksek && d.yuzde > 0;
            return (
              <li key={d.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm ${benim ? "font-extrabold text-kahve-900" : "font-semibold text-kahve-700"}`}
                  >
                    {d.etiket}
                    {benim && <span className="ml-1.5 text-2xs text-sari-700">senin oyun</span>}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-kahve-600">%{d.yuzde}</span>
                </div>
                {/* Oran çubuğu: sayıyı okumadan da sıralama görünsün. */}
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-kahve-900/8">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700
                      ease-[var(--ease-yumusak)] ${onde ? "bg-sari-500" : "bg-kahve-900/25"}`}
                    style={{ width: `${d.yuzde}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <form action={oyVer} className="mt-4 space-y-2">
          {sonuc.dagilim.map((d) => (
            <button
              key={d.id}
              type="submit"
              name="secenek"
              value={d.id}
              disabled={bekliyor}
              className="tiklanabilir block w-full rounded-2xl border border-kahve-900/12 px-4 py-2.5
                text-left text-sm font-bold text-kahve-800 transition-colors duration-300
                hover:border-sari-500/60 hover:bg-sari-500/10 disabled:opacity-50"
            >
              {d.etiket}
            </button>
          ))}
        </form>
      )}

      {durum.hata && (
        <p role="alert" className="mt-2 text-xs font-semibold text-domates-koyu">
          {durum.hata}
        </p>
      )}
    </aside>
  );
}
