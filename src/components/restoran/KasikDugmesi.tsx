"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";

import { kasikAtAction, type KasikDurumu } from "@/app/kasik-actions";
import { KASIK_GORSELI } from "@/lib/sef-kasigi";
import type { KasikVeren } from "@/lib/sef-siralamasi";
import { cn } from "@/lib/utils";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: KasikDurumu = {};

/**
 * ŞEF KAŞIĞI kutusu — sayaç, verenler listesi ve (yetkiliyse) atma düğmesi.
 *
 * Düğme YALNIZCA Altın Şefe basılıyor; yetkisi olmayan onu hiç görmüyor
 * (gizlenmiyor, sunucu hiç göndermiyor). Yetki denetimi ayrıca sunucu
 * eyleminde de tekrar çalışıyor — form elle gönderilebilir.
 *
 * VERENLER HERKESE AÇIK: müşteri de şef de kimin kimi takdir ettiğini
 * görebiliyor. `<details>` kullanıldı — JavaScript olmadan da açılıyor.
 */
export function KasikDugmesi({
  hedefSlug,
  adet,
  attimMi,
  atabilirMi,
  verenler,
}: {
  hedefSlug: string;
  adet: number;
  attimMi: boolean;
  /** Bakan kişi Altın Şef mi (ve bu profile atabiliyor mu)? */
  atabilirMi: boolean;
  verenler: KasikVeren[];
}) {
  const { c, dil } = useDil();
  const [durum, gonder, bekliyor] = useActionState(kasikAtAction, BASLANGIC);
  const tarihDili = dil === "en" ? "en-GB" : "tr-TR";

  return (
    <div className="rounded-2xl border border-sari-500/25 bg-sari-500/6 p-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/*
          Sayaç tıklanınca verenler açılıyor. Kaşığı olmayan profilde
          açılacak bir şey yok; orada düz metin kalıyor.
        */}
        {adet > 0 ? (
          <details className="group">
            <summary
              className="tiklanabilir flex cursor-pointer list-none items-center gap-2
                font-display text-base font-extrabold text-kahve-900"
            >
              <Image
                src={KASIK_GORSELI}
                alt=""
                width={320}
                height={323}
                aria-hidden="true"
                className="size-8 shrink-0 object-contain"
              />
              {c(adet === 1 ? "kasik.adetTek" : "kasik.adet", { sayi: adet })}
              <span className="text-xs font-semibold text-sari-700 underline underline-offset-4">
                {c("kasik.kimlerAtti")}
              </span>
            </summary>

            <ul className="mt-3 space-y-1.5 border-t border-sari-500/25 pt-3">
              {verenler.map((v) => (
                <li key={v.slug} className="flex items-center gap-2 text-sm">
                  <Image
                    src={KASIK_GORSELI}
                    alt=""
                    width={320}
                    height={323}
                    aria-hidden="true"
                    className="size-4 shrink-0 object-contain"
                  />
                  <Link
                    href={`/restoran/${v.slug}`}
                    className="font-bold text-kahve-900 underline underline-offset-4
                      transition-colors duration-300 hover:text-sari-700"
                  >
                    {v.ad}
                  </Link>
                  <span className="text-xs text-kahve-500">
                    {new Date(v.tarih).toLocaleDateString(tarihDili, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : (
          <span className="flex items-center gap-2 font-display text-base font-extrabold text-kahve-500">
            <Image
              src={KASIK_GORSELI}
              alt=""
              width={320}
              height={323}
              aria-hidden="true"
              className="size-8 shrink-0 object-contain opacity-45"
            />
            {c("kasik.adet", { sayi: 0 })}
          </span>
        )}

        {atabilirMi && (
          <form action={gonder} className="flex flex-wrap items-center gap-2">
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
          </form>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-kahve-500">{c("kasik.nedir")}</p>

      {durum.hata && (
        <p role="alert" className="mt-2 text-xs font-semibold text-domates-koyu">
          {durum.hata}
        </p>
      )}
      {durum.basari && (
        <p role="status" className="mt-2 text-xs font-semibold text-nane-koyu">
          {c(durum.basari)}
        </p>
      )}
    </div>
  );
}
