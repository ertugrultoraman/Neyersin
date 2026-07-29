"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { blogKategorileri, type Yazi } from "@/content/blog";
import { YaziKarti } from "./YaziKarti";

export function YaziListesi({ yazilar }: { yazilar: Yazi[] }) {
  const [kategori, setKategori] = useState<string>("Tümü");
  const azalt = useReducedMotion();

  const secenekler = useMemo(() => {
    const kullanilan = blogKategorileri.filter((k) => yazilar.some((y) => y.kategori === k));
    return ["Tümü", ...kullanilan];
  }, [yazilar]);

  const sonuclar = useMemo(
    () => (kategori === "Tümü" ? yazilar : yazilar.filter((y) => y.kategori === kategori)),
    [kategori, yazilar],
  );

  return (
    <div>
      <div
        role="group"
        aria-label="Kategoriye göre filtrele"
        className="flex gap-2 overflow-x-auto pb-2 gizli-scroll"
      >
        {secenekler.map((k) => {
          const secili = k === kategori;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={secili}
              onClick={() => setKategori(k)}
              className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-bold
                transition-colors duration-300
                ${secili ? "text-kahve-900" : "text-kahve-500 hover:text-kahve-800"}`}
            >
              {secili && (
                <motion.span
                  layoutId="blog-kategori"
                  className="absolute inset-0 rounded-full bg-sari-500 shadow-sari"
                  transition={{ duration: azalt ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span className="relative">{k}</span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-6 text-sm font-medium text-kahve-500">
        <strong className="font-extrabold text-kahve-900">{sonuclar.length}</strong> yazı
      </p>

      <ul className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {sonuclar.map((y, i) => (
            <motion.li
              key={y.slug}
              layout={!azalt}
              initial={{ opacity: 0, y: azalt ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: azalt ? 1 : 0.96 }}
              transition={{
                duration: azalt ? 0.2 : 0.45,
                delay: azalt ? 0 : Math.min(i, 6) * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <YaziKarti yazi={y} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
