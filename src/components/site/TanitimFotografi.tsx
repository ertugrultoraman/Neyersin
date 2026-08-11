"use client";

import { useActionState } from "react";

import {
  tanitimGorseliSilAction,
  tanitimGorseliYukleAction,
  type TanitimDurumu,
} from "@/app/hakkimizda/tanitim-actions";
import { Uyari } from "@/components/hesap/Alan";
import { useDil } from "@/components/saglayici/DilBaglami";

const BASLANGIC: TanitimDurumu = {};

/**
 * Hakkımızda fotoğrafının yükleme alanı — YALNIZCA yöneticiye basılıyor.
 *
 * Panelde ayrı bir ekran açılmadı: düzenleme, sonucun göründüğü yerde duruyor
 * (mutfak sayfasındaki fiyat düzenleme gibi). Görünürlük tek başına yetki
 * değil; eylemin kendisi de yöneticiliği sunucuda doğruluyor
 * (bkz. app/hakkimizda/tanitim-actions.ts).
 */
export function TanitimFotografi({ varMi }: { varMi: boolean }) {
  const { c } = useDil();
  const [yukleDurumu, yukle, yukleBekliyor] = useActionState(
    tanitimGorseliYukleAction,
    BASLANGIC,
  );
  const [silDurumu, sil, silBekliyor] = useActionState(tanitimGorseliSilAction, BASLANGIC);

  return (
    <div className="mt-5 w-full rounded-2xl border border-dashed border-kahve-900/20 p-4">
      <form action={yukle} className="space-y-2">
        <label className="sr-only" htmlFor="tanitim-fotografi">
          {c("fotograf.dosyaSec")}
        </label>
        <input
          id="tanitim-fotografi"
          type="file"
          name="fotograf"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
          className="block w-full text-xs text-kahve-600
            file:mr-2 file:rounded-xl file:border-0 file:bg-kahve-900/6 file:px-3 file:py-2
            file:text-xs file:font-bold file:text-kahve-800 hover:file:bg-kahve-900/10"
        />
        <p className="text-xs text-kahve-500">{c("fotograf.kural")}</p>
        <button
          type="submit"
          disabled={yukleBekliyor}
          className="tiklanabilir rounded-xl bg-kahve-900 px-3.5 py-2 text-xs font-bold
            text-sari-300 transition-colors hover:bg-kahve-800
            disabled:cursor-not-allowed disabled:opacity-50"
        >
          {yukleBekliyor
            ? c("fotograf.yukleniyor")
            : varMi
              ? c("fotograf.degistir")
              : c("fotograf.yukle")}
        </button>
      </form>

      {varMi && (
        <form action={sil} className="mt-2">
          <button
            type="submit"
            disabled={silBekliyor}
            className="tiklanabilir text-xs font-bold text-domates-koyu underline
              underline-offset-2 disabled:opacity-50"
          >
            {silBekliyor ? "…" : c("fotograf.kaldir")}
          </button>
        </form>
      )}

      {yukleDurumu.hata && (
        <div className="mt-2">
          <Uyari tur="hata">{yukleDurumu.hata}</Uyari>
        </div>
      )}
      {yukleDurumu.basari && (
        <div className="mt-2">
          <Uyari tur="basari">{yukleDurumu.basari}</Uyari>
        </div>
      )}
      {silDurumu.hata && (
        <div className="mt-2">
          <Uyari tur="hata">{silDurumu.hata}</Uyari>
        </div>
      )}
      {silDurumu.basari && (
        <div className="mt-2">
          <Uyari tur="basari">{silDurumu.basari}</Uyari>
        </div>
      )}
    </div>
  );
}
