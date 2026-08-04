"use client";

import { useActionState, useState } from "react";

import { anketSilAction, anketYayinAction, type AnketDurumu } from "@/app/anket-actions";

const BASLANGIC: AnketDurumu = {};

type Ozet = {
  id: string;
  soru: string;
  secenekSayisi: number;
  oySayisi: number;
  yayinda: boolean;
  tarih: string;
};

/**
 * Tek anket satırı — yayına al/indir ve sil.
 *
 * Silme İKİ ADIMLI: oylar da gidiyor ve geri getirilemiyor, tek tıkla
 * kaybedilmesin. Yayından kaldırma yıkıcı değil, o tek tık.
 */
export function AnketSatiri({ anket }: { anket: Ozet }) {
  const [yayinDurumu, yayinDegistir, yayinBekliyor] = useActionState(anketYayinAction, BASLANGIC);
  const [silmeDurumu, sil, silBekliyor] = useActionState(anketSilAction, BASLANGIC);
  const [onayIstendi, setOnayIstendi] = useState(false);

  const hata = yayinDurumu.hata ?? silmeDurumu.hata;

  return (
    <li className="rounded-2xl border border-kahve-900/8 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold text-kahve-900">{anket.soru}</p>
          <p className="mt-0.5 text-xs text-kahve-500">
            {anket.secenekSayisi} seçenek · {anket.oySayisi} oy ·{" "}
            {new Date(anket.tarih).toLocaleDateString("tr-TR")}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-2xs font-bold tracking-wide uppercase ${
            anket.yayinda ? "bg-nane/15 text-nane-koyu" : "bg-kahve-900/8 text-kahve-500"
          }`}
        >
          {anket.yayinda ? "Yayında" : "Yayında değil"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={yayinDegistir}>
          <input type="hidden" name="id" value={anket.id} />
          <button
            type="submit"
            disabled={yayinBekliyor}
            className="tiklanabilir rounded-full border border-kahve-900/12 px-3.5 py-1.5 text-xs
              font-bold text-kahve-700 transition-colors duration-300 hover:border-sari-500/60
              hover:bg-sari-500/10 disabled:opacity-50"
          >
            {anket.yayinda ? "Yayından kaldır" : "Yayına al"}
          </button>
        </form>

        {onayIstendi ? (
          <form action={sil} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={anket.id} />
            <span className="text-xs font-semibold text-domates-koyu">
              {anket.oySayisi} oyla birlikte silinecek, geri alınamaz.
            </span>
            <button
              type="submit"
              disabled={silBekliyor}
              className="tiklanabilir rounded-full bg-domates px-3.5 py-1.5 text-xs font-bold
                text-white transition-transform duration-300 hover:-translate-y-0.5
                disabled:opacity-50"
            >
              {silBekliyor ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button
              type="button"
              onClick={() => setOnayIstendi(false)}
              className="tiklanabilir text-xs font-bold text-kahve-500 hover:text-kahve-900"
            >
              Vazgeç
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOnayIstendi(true)}
            className="tiklanabilir rounded-full border border-domates/30 px-3.5 py-1.5 text-xs
              font-bold text-domates-koyu transition-colors duration-300 hover:bg-domates/8"
          >
            Sil
          </button>
        )}
      </div>

      {hata && (
        <p role="alert" className="mt-2 text-xs font-bold text-domates-koyu">
          {hata}
        </p>
      )}
    </li>
  );
}
