"use client";

import { useActionState } from "react";

import {
  fiyatOnaylaAction,
  fiyatReddetAction,
  type YonetimDurumu,
} from "@/app/admin/yonetim-actions";
import { Uyari } from "@/components/hesap/Alan";
import { Rozet } from "@/components/ui/Rozet";

const BASLANGIC: YonetimDurumu = {};

/** Tek fiyat talebi: eski → yeni, yüzde farkı ve onay/ret. */
export function FiyatKarti({
  urunId,
  ad,
  mutfakAdi,
  restoranSlug,
  eskiFiyat,
  yeniFiyat,
  tarih,
}: {
  urunId: string;
  ad: string;
  mutfakAdi: string;
  restoranSlug: string;
  eskiFiyat: number;
  yeniFiyat: number;
  tarih?: string;
}) {
  const [onayDurumu, onayla, onayBekliyor] = useActionState(fiyatOnaylaAction, BASLANGIC);
  const [retDurumu, reddet, retBekliyor] = useActionState(fiyatReddetAction, BASLANGIC);

  /*
   * Yüzde fark, fahiş zammı ilk bakışta görünür kılıyor: yönetici tek tek
   * hesap yapmak zorunda kalmasın. Eski fiyat 0 ise (fiyat ilk kez giriliyor)
   * oran anlamsız, gösterilmiyor.
   */
  const oran = eskiFiyat > 0 ? Math.round(((yeniFiyat - eskiFiyat) / eskiFiyat) * 100) : null;
  const zam = oran !== null && oran > 0;
  const dikkat = oran !== null && oran >= 25;

  return (
    <article className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-extrabold text-kahve-900">{ad}</h3>
            {dikkat && <Rozet ton="domates">%{oran} zam</Rozet>}
          </div>
          <p className="mt-1 text-sm text-kahve-600">{mutfakAdi}</p>
          {tarih && (
            <p className="mt-0.5 text-xs text-kahve-400">
              Talep: {new Date(tarih).toLocaleString("tr-TR")}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="font-display text-lg font-extrabold text-kahve-900 tabular-nums">
            <span className="text-kahve-400 line-through">
              {eskiFiyat > 0 ? `${eskiFiyat} TL` : "—"}
            </span>{" "}
            → {yeniFiyat} TL
          </p>
          {oran !== null && (
            <p
              className={`text-xs font-bold ${zam ? "text-domates-koyu" : "text-nane-koyu"}`}
            >
              {zam ? "+" : ""}
              {oran}%
            </p>
          )}
        </div>
      </header>

      {onayDurumu.hata && (
        <div className="mt-3">
          <Uyari tur="hata">{onayDurumu.hata}</Uyari>
        </div>
      )}
      {onayDurumu.basari && (
        <div className="mt-3">
          <Uyari tur="basari">{onayDurumu.basari}</Uyari>
        </div>
      )}
      {retDurumu.basari && (
        <div className="mt-3">
          <Uyari tur="basari">{retDurumu.basari}</Uyari>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-kahve-900/8 pt-4">
        <a
          href={`/restoran/${restoranSlug}`}
          className="tiklanabilir mr-auto text-xs font-bold text-kahve-600 underline"
        >
          Mutfağı gör
        </a>

        <form action={reddet}>
          <input type="hidden" name="urunId" value={urunId} />
          <button
            type="submit"
            disabled={retBekliyor}
            className="tiklanabilir rounded-2xl border border-domates/40 px-4 py-2.5 text-sm
              font-bold text-domates-koyu transition-colors hover:bg-domates/10
              disabled:opacity-50"
          >
            {retBekliyor ? "…" : "Reddet"}
          </button>
        </form>

        <form action={onayla}>
          <input type="hidden" name="urunId" value={urunId} />
          <button
            type="submit"
            disabled={onayBekliyor}
            className="tiklanabilir rounded-2xl bg-kahve-900 px-4 py-2.5 text-sm font-bold
              text-sari-300 transition-colors hover:bg-kahve-800 disabled:opacity-50"
          >
            {onayBekliyor ? "…" : "Onayla"}
          </button>
        </form>
      </div>
    </article>
  );
}
