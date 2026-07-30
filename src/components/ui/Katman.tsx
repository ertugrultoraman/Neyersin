"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { KapatIkon } from "./Ikonlar";

const YUMUSAK: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Sepet çekmecesi ve adres modalı için ortak katman: karartma, Escape ile
 * kapanma, arka plan kaydırma kilidi ve giriş/çıkış animasyonu.
 */
export function Katman({
  acik,
  kapat,
  baslik,
  aciklama,
  konum = "sag",
  children,
  altBolum,
  className,
}: {
  acik: boolean;
  kapat: () => void;
  baslik: string;
  aciklama?: string;
  konum?: "sag" | "orta";
  children: ReactNode;
  /** Panelin altına sabitlenen alan (toplam, ana buton vb.). */
  altBolum?: ReactNode;
  className?: string;
}) {
  const azalt = useReducedMotion();

  useEffect(() => {
    if (!acik) return;
    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tusla = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    window.addEventListener("keydown", tusla);
    return () => {
      document.body.style.overflow = oncekiTasma;
      window.removeEventListener("keydown", tusla);
    };
  }, [acik, kapat]);

  const panelHareketi =
    konum === "sag"
      ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
      : {
          initial: { opacity: 0, scale: azalt ? 1 : 0.96, y: azalt ? 0 : 16 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: azalt ? 1 : 0.97, y: azalt ? 0 : 10 },
        };

  return (
    <AnimatePresence>
      {acik && (
        <>
          <motion.div
            className="fixed inset-0 z-70 bg-kahve-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={kapat}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={baslik}
            {...panelHareketi}
            transition={{ duration: azalt ? 0.15 : 0.4, ease: YUMUSAK }}
            className={cn(
              "fixed z-80 flex flex-col bg-krem shadow-kalkik",
              konum === "sag"
                ? "inset-y-0 right-0 w-[min(26rem,92vw)]"
                : "top-1/2 left-1/2 max-h-[85dvh] w-[min(34rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-4xl",
              className,
            )}
          >
            <div
              className={cn(
                "flex items-start justify-between gap-4 border-b border-kahve-900/10 px-5 py-4",
                konum === "orta" && "px-6 pt-5",
              )}
            >
              <div>
                <h2 className="font-display text-lg leading-tight font-extrabold text-kahve-900">
                  {baslik}
                </h2>
                {aciklama && (
                  <p className="mt-1 text-xs leading-snug text-kahve-500">{aciklama}</p>
                )}
              </div>
              <button
                type="button"
                onClick={kapat}
                aria-label="Kapat"
                className="grid size-9 shrink-0 place-items-center rounded-2xl text-kahve-600
                  transition-colors duration-300 hover:bg-kahve-900/6 hover:text-kahve-900"
              >
                <KapatIkon className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

            {altBolum && (
              <div className="border-t border-kahve-900/10 bg-white/70 px-5 py-4">{altBolum}</div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
