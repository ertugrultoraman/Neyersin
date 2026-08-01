"use client";

import { AnimatePresence, motion } from "framer-motion";

import { paraFormatla } from "@/lib/utils";
import { useSepet } from "../saglayici/SepetBaglami";
import { ElSepeti } from "./ElSepeti";
import { SEPET_GOVDE_NITELIGI, SEPET_HEDEF_NITELIGI } from "./SepeteUcus";

/**
 * Sağ altta duran kırmızı el sepeti.
 *
 * Proje dosyasındaki akış: müşteri menüde gezerken sepet hep göz önünde dursun,
 * seçtiği ürün de bu sepetin içine düşsün (bkz. SepeteUcus.ts).
 *
 * Sepet BOŞKEN DE mount kalıyor — sadece soluklaşıyor. Bu görsel bir tercih
 * değil, işlevsel bir zorunluluk: uçuşun hedefi bu düğme; boşken unmount
 * olsaydı hedef bulunamayacağı için ilk eklenen ürün hiç uçmazdı.
 */
export function SepetFab() {
  const { adetToplam, tutarlar, setCekmeceAcik, hazir } = useSepet();
  const dolu = adetToplam > 0 && tutarlar !== null;
  const toplam = tutarlar?.toplam ?? 0;

  if (!hazir) return null;

  return (
    <div
      /* Sabit konumlu, hiç dönüştürülmeyen sarmalayıcı: uçuşun hedef koordinatı
         buradan okunuyor, içerideki animasyonlar ölçümü bozmuyor. */
      {...{ [SEPET_HEDEF_NITELIGI]: "true" }}
      className="fixed right-4 bottom-4 z-40 md:right-6 md:bottom-6"
    >
      <motion.button
        type="button"
        onClick={() => setCekmeceAcik(true)}
        aria-label={dolu ? `Sepetim, ${adetToplam} ürün, ${paraFormatla(toplam)}` : "Sepetim boş"}
        animate={{ opacity: dolu ? 1 : 0.6, scale: dolu ? 1 : 0.9 }}
        transition={{ duration: 0.35, ease: [0.34, 1.4, 0.64, 1] }}
        className="tiklanabilir relative flex items-center gap-1 rounded-full bg-white/92 py-2 pr-2
          pl-2.5 shadow-[0_12px_30px_rgb(59_36_18/0.28)] ring-1 ring-kahve-900/10
          backdrop-blur-sm transition-colors duration-300 hover:bg-white"
      >
        <span className="relative block" {...{ [SEPET_GOVDE_NITELIGI]: "true" }}>
          <ElSepeti className="size-11" />

          <AnimatePresence>
            {dolu && (
              <motion.span
                key="adet"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
                /* Rozet sepetin SOL üstünde: sağ üstte tutar yazısının üzerine biniyordu. */
                className="absolute -top-1 -left-1.5 grid min-w-5 place-items-center rounded-full
                  bg-kahve-900 px-1.5 py-0.5 font-display text-2xs font-extrabold text-sari-300
                  ring-2 ring-white"
              >
                {adetToplam > 99 ? "99+" : adetToplam}
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        <AnimatePresence initial={false}>
          {dolu && (
            <motion.span
              key="tutar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden text-left leading-tight whitespace-nowrap"
            >
              <span className="block pr-2 text-2xs font-bold tracking-wide text-kahve-500 uppercase">
                Sepetim
              </span>
              <span className="block pr-2 font-display text-base font-extrabold text-kahve-900">
                {paraFormatla(toplam)}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
