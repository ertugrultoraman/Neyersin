"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  kategoriGorseliSilAction,
  kategoriGorseliYukleAction,
  type KategoriDurumu,
} from "@/app/admin/kategori-actions";
import { Uyari } from "@/components/hesap/Alan";

const BASLANGIC: KategoriDurumu = {};

/** Tek kategorinin fotoğraf kartı: önizleme, yükleme ve kaldırma. */
export function KategoriGorselKarti({
  slug,
  ad,
  not,
  mevcutUrl,
}: {
  slug: string;
  ad: string;
  not: string;
  mevcutUrl?: string;
}) {
  const [yukleDurumu, yukle, yukleBekliyor] = useActionState(
    kategoriGorseliYukleAction,
    BASLANGIC,
  );
  const [silDurumu, sil, silBekliyor] = useActionState(kategoriGorseliSilAction, BASLANGIC);

  return (
    <article className="rounded-3xl border border-kahve-900/8 bg-white p-4 shadow-yumusak">
      <div className="flex items-center gap-3">
        {mevcutUrl ? (
          <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
            <Image src={mevcutUrl} alt="" fill sizes="56px" className="object-cover" />
          </span>
        ) : (
          <span
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-kahve-900/6
              text-2xs font-bold text-kahve-400"
          >
            yok
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-display text-base font-extrabold text-kahve-900">{ad}</h3>
          <p className="text-xs text-kahve-500">{not}</p>
        </div>
      </div>

      <form action={yukle} className="mt-3 space-y-2">
        <input type="hidden" name="slug" value={slug} />
        <label className="sr-only" htmlFor={`gorsel-${slug}`}>
          {ad} fotoğrafı
        </label>
        <input
          id={`gorsel-${slug}`}
          type="file"
          name="gorsel"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
          className="block w-full text-xs text-kahve-600
            file:mr-2 file:rounded-xl file:border-0 file:bg-kahve-900/6 file:px-3 file:py-2
            file:text-xs file:font-bold file:text-kahve-800 hover:file:bg-kahve-900/10"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={yukleBekliyor}
            className="tiklanabilir rounded-xl bg-kahve-900 px-3 py-2 text-xs font-bold
              text-sari-300 transition-colors hover:bg-kahve-800 disabled:opacity-50"
          >
            {yukleBekliyor ? "Yükleniyor…" : mevcutUrl ? "Değiştir" : "Yükle"}
          </button>
        </div>
      </form>

      {mevcutUrl && (
        <form action={sil} className="mt-2">
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            disabled={silBekliyor}
            className="tiklanabilir text-xs font-bold text-domates-koyu underline
              underline-offset-2 disabled:opacity-50"
          >
            {silBekliyor ? "…" : "Fotoğrafı kaldır"}
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
      {silDurumu.basari && (
        <div className="mt-2">
          <Uyari tur="basari">{silDurumu.basari}</Uyari>
        </div>
      )}
    </article>
  );
}
