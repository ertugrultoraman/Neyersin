"use client";

import { AnimatePresence, motion } from "framer-motion";

import { paraFormatla } from "@/lib/utils";
import { useSepet } from "../saglayici/SepetBaglami";
import { SepetIkon } from "../ui/Ikonlar";
import { SEPET_HEDEF_NITELIGI } from "./SepeteUcus";

/**
 * Sağ altta duran sepet düğmesi.
 *
 * Proje dosyasındaki akışın karşılığı: müşteri menüde gezerken sepet hep
 * göz önünde ve elinin altında dursun. Sepete eklenen ürün buraya doğru uçar
 * (bkz. SepeteUcus.ts) ve düğme "yakaladım" tepkisi verir.
 *
 * Sepet boşken hiç görünmez — boş bir düğme ekranı meşgul etmesin.
 */
export function SepetFab() {
  const { adetToplam, tutarlar, setCekmeceAcik, hazir } = useSepet();
  const gorunur = hazir && adetToplam > 0 && tutarlar !== null;
  const toplam = tutarlar?.toplam ?? 0;

  return (
    <AnimatePresence>
      {gorunur && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.34, 1.4, 0.64, 1] }}
          className="fixed right-4 bottom-4 z-40 md:right-6 md:bottom-6"
        >
          <button
            type="button"
            {...{ [SEPET_HEDEF_NITELIGI]: "true" }}
            onClick={() => setCekmeceAcik(true)}
            aria-label={`Sepetim, ${adetToplam} ürün, ${paraFormatla(toplam)}`}
            className="tiklanabilir flex items-center gap-3 rounded-full bg-domates py-3 pr-5 pl-3.5
              text-white shadow-[0_12px_30px_rgb(59_36_18/0.35)] transition-colors duration-300
              hover:bg-domates-koyu"
          >
            <span className="relative grid size-9 place-items-center rounded-full bg-white/18">
              <SepetIkon className="size-5" />
              <span
                className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full
                  bg-white px-1 font-display text-2xs font-extrabold text-domates-koyu"
              >
                {adetToplam > 99 ? "99+" : adetToplam}
              </span>
            </span>
            <span className="text-left leading-tight">
              <span className="block text-2xs font-bold tracking-wide uppercase opacity-85">
                Sepetim
              </span>
              <span className="block font-display text-base font-extrabold">
                {paraFormatla(toplam)}
              </span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
