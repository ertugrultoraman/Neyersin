"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useSepet } from "../saglayici/SepetBaglami";
import { SepetIkon } from "../ui/Ikonlar";

export function SepetDugmesi({ className }: { className?: string }) {
  const { adetToplam, setCekmeceAcik, hazir } = useSepet();

  return (
    <button
      type="button"
      onClick={() => setCekmeceAcik(true)}
      aria-label={adetToplam > 0 ? `Sepetim, ${adetToplam} ürün` : "Sepetim, boş"}
      className={cn(
        "relative grid size-11 place-items-center rounded-2xl text-kahve-800",
        "transition-colors duration-300 hover:bg-kahve-900/6",
        className,
      )}
    >
      <SepetIkon className="size-5.5" />

      {/* hazır olmadan rozet basılmaz — SSR/istemci uyumsuzluğu olmasın */}
      <AnimatePresence>
        {hazir && adetToplam > 0 && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full
              bg-domates px-1 font-display text-2xs font-extrabold text-white shadow-yumusak"
          >
            {adetToplam > 99 ? "99+" : adetToplam}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
