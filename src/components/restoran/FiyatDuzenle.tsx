"use client";

import { useActionState, useState } from "react";

import {
  fiyatTalepAction,
  fiyatTalepIptalAction,
  type FiyatDurumu,
} from "@/app/panel/fiyat-actions";

const BASLANGIC: FiyatDurumu = {};

/**
 * Mutfağın SAHİBİ kendi profilinde gezerken ürünün yanında çıkan kalem.
 *
 * Panele gidip gelmeye gerek kalmıyor: şef müşterinin gördüğü ekranda,
 * ürünün tam yanında fiyatı düzenliyor.
 *
 * Fiyat DOĞRUDAN değişmiyor. Talep yöneticiye düşüyor; onaylanana kadar
 * müşteri eski fiyatı görüyor ve siparişler eski fiyattan hesaplanıyor.
 * Sebep: fahiş fiyat hem müşteriyi kaçırır hem şef/kurye/sistem arasındaki
 * pay dengesini bozar.
 */
export function FiyatDuzenle({
  restoranSlug,
  urunId,
  mevcutFiyat,
  bekleyenFiyat,
}: {
  restoranSlug: string;
  urunId: string;
  mevcutFiyat: number;
  bekleyenFiyat?: number;
}) {
  const [acik, setAcik] = useState(false);
  const [durum, gonder, bekliyor] = useActionState(fiyatTalepAction, BASLANGIC);
  const [iptalDurumu, iptalEt, iptalBekliyor] = useActionState(
    fiyatTalepIptalAction,
    BASLANGIC,
  );

  // Talep gönderildikten sonra kutuyu kapat; rozet zaten durumu anlatıyor.
  if (durum.basari && acik) setAcik(false);

  return (
    <div className="mt-2 w-full">
      {typeof bekleyenFiyat === "number" && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-sari-500/12 px-3 py-2">
          <span className="text-xs font-bold text-kahve-800">
            Onay bekliyor: {bekleyenFiyat} TL
          </span>
          <form action={iptalEt}>
            <input type="hidden" name="restoranSlug" value={restoranSlug} />
            <input type="hidden" name="urunId" value={urunId} />
            <button
              type="submit"
              disabled={iptalBekliyor}
              className="tiklanabilir text-xs font-bold text-kahve-600 underline
                disabled:opacity-50"
            >
              {iptalBekliyor ? "…" : "geri çek"}
            </button>
          </form>
        </div>
      )}

      {acik ? (
        <form action={gonder} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="restoranSlug" value={restoranSlug} />
          <input type="hidden" name="urunId" value={urunId} />
          <label className="sr-only" htmlFor={`fiyat-${urunId}`}>
            Yeni fiyat
          </label>
          <input
            id={`fiyat-${urunId}`}
            name="fiyat"
            type="number"
            min={1}
            max={5000}
            step={1}
            defaultValue={mevcutFiyat > 0 ? mevcutFiyat : undefined}
            placeholder="Yeni fiyat"
            autoFocus
            className="w-28 rounded-xl border border-kahve-900/15 px-3 py-2 text-sm
              font-semibold text-kahve-900 outline-none focus:border-sari-500"
          />
          <button
            type="submit"
            disabled={bekliyor}
            className="tiklanabilir rounded-xl bg-kahve-900 px-3 py-2 text-xs font-bold
              text-sari-300 transition-colors hover:bg-kahve-800 disabled:opacity-50"
          >
            {bekliyor ? "Gönderiliyor…" : "Onaya gönder"}
          </button>
          <button
            type="button"
            onClick={() => setAcik(false)}
            className="tiklanabilir rounded-xl border border-kahve-900/12 px-3 py-2
              text-xs font-bold text-kahve-700"
          >
            Vazgeç
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAcik(true)}
          className="tiklanabilir mt-1 inline-flex items-center gap-1.5 rounded-xl
            border border-kahve-900/12 px-2.5 py-1.5 text-xs font-bold text-kahve-700
            transition-colors hover:border-sari-500/50 hover:text-kahve-900"
        >
          <KalemIkon />
          Fiyatı düzenle
        </button>
      )}

      {durum.hata && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-domates-koyu">
          {durum.hata}
        </p>
      )}
      {durum.basari && (
        <p role="status" className="mt-1.5 text-xs font-semibold text-kahve-700">
          {durum.basari}
        </p>
      )}
      {iptalDurumu.hata && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-domates-koyu">
          {iptalDurumu.hata}
        </p>
      )}
    </div>
  );
}

function KalemIkon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none">
      <path
        d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
