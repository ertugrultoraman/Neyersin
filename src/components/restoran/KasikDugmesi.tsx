"use client";

import Image from "next/image";
import { useActionState } from "react";

import { kasikAtAction, type KasikDurumu } from "@/app/kasik-actions";
import { KASIK_GORSELI } from "@/lib/sef-kasigi";
import { cn } from "@/lib/utils";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: KasikDurumu = {};

/**
 * ŞEF KAŞIĞI düğmesi — şeften şefe takdir.
 *
 * Düğme YALNIZCA kaşık atmaya yetkili şefe basılıyor; yetkisi olmayan bunu
 * hiç görmüyor (gizlenmiyor, sunucu hiç göndermiyor). Yetki denetimi ayrıca
 * sunucu eyleminde de tekrar çalışıyor — form elle gönderilebilir.
 *
 * Sayaç herkese görünür: kaç meslektaşının takdir ettiği profilin bilgisi.
 */
export function KasikDugmesi({
  hedefSlug,
  adet,
  attimMi,
  atabilirMi,
}: {
  hedefSlug: string;
  adet: number;
  attimMi: boolean;
  /** Bakan kişi kaşık atma yetkisine sahip mi? */
  atabilirMi: boolean;
}) {
  const { c } = useDil();
  const [durum, gonder, bekliyor] = useActionState(kasikAtAction, BASLANGIC);

  const sayac = (
    <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-kahve-900">
      <Image
        src={KASIK_GORSELI}
        alt=""
        width={320}
        height={323}
        aria-hidden="true"
        className="size-5 shrink-0 object-contain"
      />
      {c(adet === 1 ? "kasik.adetTek" : "kasik.adet", { sayi: adet })}
    </span>
  );

  if (!atabilirMi) {
    return (
      <div className="flex items-center gap-3">
        {sayac}
        <span className="text-xs text-kahve-400">{c("kasik.nedir")}</span>
      </div>
    );
  }

  return (
    <form action={gonder} className="flex flex-wrap items-center gap-3">
      {sayac}
      <input type="hidden" name="hedef" value={hedefSlug} />
      {/* Aynı düğme hem atıyor hem geri alıyor — durum sunucudan geliyor. */}
      <input type="hidden" name="geriAl" value={attimMi ? "1" : "0"} />
      <button
        type="submit"
        disabled={bekliyor}
        className={cn(
          "tiklanabilir inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold",
          "transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50",
          attimMi
            ? "bg-kahve-900/6 text-kahve-600 hover:bg-kahve-900/10"
            : "bg-sari-500 text-kahve-900 shadow-sari hover:bg-sari-400",
        )}
      >
        {attimMi ? c("kasik.geriAl") : c("kasik.at")}
      </button>

      {durum.hata && (
        <p role="alert" className="text-xs font-semibold text-domates-koyu">
          {durum.hata}
        </p>
      )}
      {durum.basari && (
        <p role="status" className="text-xs font-semibold text-nane-koyu">
          {c(durum.basari)}
        </p>
      )}
    </form>
  );
}
