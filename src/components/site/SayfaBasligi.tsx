import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal } from "../ui/Reveal";
import { UstBaslik } from "../ui/Rozet";

/** İç sayfaların ortak üst bloğu: kırıntı yolu, üst başlık, başlık ve açıklama. */
export function SayfaBasligi({
  ustBaslik,
  baslik,
  aciklama,
  kirintiYolu,
  cocuk,
}: {
  ustBaslik?: string;
  baslik: ReactNode;
  aciklama?: ReactNode;
  kirintiYolu?: { etiket: string; href?: string }[];
  cocuk?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-10 pb-12 md:pt-14 md:pb-16">
      <div aria-hidden="true" className="absolute inset-0 isik" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-72 doku opacity-35
          [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="kap relative">
        {kirintiYolu && kirintiYolu.length > 0 && (
          <nav aria-label="Kırıntı yolu" className="mb-7">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-kahve-500">
              <li>
                <Link href="/" className="transition-colors duration-300 hover:text-kahve-900">
                  Ana Sayfa
                </Link>
              </li>
              {kirintiYolu.map((k) => (
                <li key={k.etiket} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-kahve-300">
                    /
                  </span>
                  {k.href ? (
                    <Link href={k.href} className="transition-colors duration-300 hover:text-kahve-900">
                      {k.etiket}
                    </Link>
                  ) : (
                    <span className="text-kahve-800">{k.etiket}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <Reveal>
          <div className="max-w-3xl">
            {ustBaslik && <UstBaslik className="mb-4">{ustBaslik}</UstBaslik>}
            <h1 className="text-[2.25rem] leading-[1.05] font-extrabold sm:text-5xl md:text-[3.25rem]">
              {baslik}
            </h1>
            {aciklama && (
              <p className="mt-5 text-lg leading-relaxed text-kahve-600">{aciklama}</p>
            )}
          </div>
        </Reveal>

        {cocuk && <div className="mt-9">{cocuk}</div>}
      </div>
    </section>
  );
}
