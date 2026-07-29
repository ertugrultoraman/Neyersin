"use client";

import { useEffect, useState } from "react";

/** Kaydırmayı izleyen, aktif başlığı vurgulayan içindekiler listesi. */
export function Icindekiler({ ogeler }: { ogeler: { id: string; metin: string }[] }) {
  const [aktif, setAktif] = useState(ogeler[0]?.id ?? "");

  useEffect(() => {
    const basliklar = ogeler
      .map((o) => document.getElementById(o.id))
      .filter((e): e is HTMLElement => e !== null);

    if (basliklar.length === 0) return;

    const gozlemci = new IntersectionObserver(
      (girisler) => {
        const gorunur = girisler
          .filter((g) => g.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (gorunur[0]?.target.id) setAktif(gorunur[0].target.id);
      },
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 },
    );

    basliklar.forEach((b) => gozlemci.observe(b));
    return () => gozlemci.disconnect();
  }, [ogeler]);

  if (ogeler.length === 0) return null;

  return (
    <nav aria-label="İçindekiler" className="text-sm">
      <p className="font-display text-2xs font-extrabold tracking-[0.18em] text-kahve-400 uppercase">
        İçindekiler
      </p>
      <ul className="mt-4 space-y-1 border-l-2 border-kahve-900/10">
        {ogeler.map((o) => {
          const secili = o.id === aktif;
          return (
            <li key={o.id} className="relative">
              {secili && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 -left-0.5 h-full w-0.5 rounded-full bg-sari-500"
                />
              )}
              <a
                href={`#${o.id}`}
                aria-current={secili ? "location" : undefined}
                className={`block py-2 pl-4 leading-snug transition-colors duration-300 ${
                  secili
                    ? "font-bold text-kahve-900"
                    : "font-medium text-kahve-500 hover:text-kahve-800"
                }`}
              >
                {o.metin}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
