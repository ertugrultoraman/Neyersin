"use client";

import Image from "next/image";
import Link from "next/link";

import { KASIK_GORSELI } from "@/lib/sef-kasigi";
import { useDil } from "../saglayici/DilBaglami";

/**
 * ŞEF KAŞIĞI tanıtım kartı — kampanya ızgarasının içinde duruyor.
 *
 * Ayrı bir şerit AÇILMADI: ızgarada zaten anketin yanında yer var ve rozet
 * sistemi ana sayfada ikinci bir tam genişlikte bölüm daha açacak kadar uzun
 * değil. Anket gibi bu kutu da yönetici girişliyken sürüklenebiliyor
 * (bkz. Kampanyalar).
 *
 * Kaşık görseli BÜYÜK: kartın konusu o, küçük bir ikon olarak kalınca ne
 * anlatıldığı görünmüyordu.
 */
export function SefKasigiKarti({ toplam }: { toplam: number }) {
  const { c } = useDil();

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-4xl
        bg-gradient-to-br from-kahve-800 to-kahve-900 p-6 text-sari-100"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-12 size-44 rounded-full
          border-[14px] border-white/8"
      />

      <div className="relative flex items-start gap-4">
        <Image
          src={KASIK_GORSELI}
          alt=""
          width={320}
          height={323}
          aria-hidden="true"
          className="size-16 shrink-0 object-contain drop-shadow-md sm:size-20"
        />
        <div className="min-w-0">
          <p className="text-2xs font-extrabold tracking-[0.16em] text-sari-400 uppercase">
            {c("kasik.altinSef")}
          </p>
          <h3 className="mt-1 font-display text-lg font-extrabold text-sari-100">
            {c("kasik.ad")}
          </h3>
        </div>
      </div>

      <p className="relative mt-4 text-sm leading-relaxed text-sari-100/85">{c("kasik.nedir")}</p>

      <div className="relative mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
        {/* Toplam kaşık sayısı — sistemin gerçekten işlediğinin kanıtı. */}
        <span className="font-display text-2xl font-extrabold text-sari-300">
          {c(toplam === 1 ? "kasik.adetTek" : "kasik.adet", { sayi: toplam })}
        </span>
        <Link
          href="/sef-siralamasi?olcut=kasik"
          className="tiklanabilir text-xs font-extrabold text-sari-300 underline
            underline-offset-4 transition-colors duration-300 hover:text-white"
        >
          {c("kasik.siralamayiGor")}
        </Link>
      </div>
    </article>
  );
}
