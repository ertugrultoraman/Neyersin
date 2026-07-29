import Link from "next/link";

import type { Yazi } from "@/content/blog";
import { tarihFormatla } from "@/lib/utils";
import { AkilliGorsel } from "../ui/AkilliGorsel";
import { SaatIkon } from "../ui/Ikonlar";
import { Rozet } from "../ui/Rozet";

export function YaziKarti({
  yazi,
  genis = false,
  priority = false,
}: {
  yazi: Yazi;
  /** Öne çıkan yazı için iki kolonlu, daha büyük yerleşim. */
  genis?: boolean;
  priority?: boolean;
}) {
  return (
    <article
      className={`group h-full overflow-hidden rounded-3xl border border-kahve-900/8
        bg-white kart-kalk hover:border-sari-500/45 ${genis ? "sm:grid sm:grid-cols-2" : "flex flex-col"}`}
    >
      <Link
        href={`/blog/${yazi.slug}`}
        className="relative block overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        <AkilliGorsel
          anahtar={yazi.kapak}
          oran={genis ? "4/3" : "16/9"}
          priority={priority}
          sizes={genis ? "(min-width: 640px) 34rem, 92vw" : "(min-width: 1024px) 22rem, 92vw"}
          className="h-full w-full"
          gorselClassName="transition-transform duration-700 ease-[var(--ease-yumusak)] group-hover:scale-105"
        />
      </Link>

      <div className={`flex flex-1 flex-col p-5 ${genis ? "sm:p-7" : ""}`}>
        <Rozet ton="acik" className="w-fit">
          {yazi.kategori}
        </Rozet>

        <h3
          className={`mt-3.5 leading-snug font-extrabold text-kahve-900 ${
            genis ? "text-xl sm:text-2xl" : "text-lg"
          }`}
        >
          <Link
            href={`/blog/${yazi.slug}`}
            className="transition-colors duration-300 hover:text-sari-700"
          >
            {yazi.baslik}
          </Link>
        </h3>

        <p
          className={`mt-2.5 flex-1 leading-relaxed text-kahve-600 ${
            genis ? "text-[0.9375rem]" : "line-clamp-3 text-sm"
          }`}
        >
          {yazi.ozet}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-kahve-900/8 pt-4 text-2xs font-semibold text-kahve-400">
          <time dateTime={yazi.tarih}>{tarihFormatla(yazi.tarih)}</time>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <SaatIkon className="size-3.5" />
            {yazi.okumaDk} dk okuma
          </span>
          {yazi.guncelleme && (
            <>
              <span aria-hidden="true">·</span>
              <span>güncellendi</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
