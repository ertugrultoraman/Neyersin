"use client";

import { DESTEK_OLAYI, type DestekAcDetay } from "./DestekWidget";
import { DestekIkon } from "../ui/Ikonlar";

/**
 * Sipariş kartının yanındaki "Destek" düğmesi.
 *
 * Asistanı sipariş dalından açar ve sipariş numarasını önden doldurur —
 * müşteri numarayı elle yazmak zorunda kalmasın. İletişim, bileşenler
 * arasında prop geçirmek yerine tek bir pencere olayıyla kuruluyor; sipariş
 * kartlarının asistanın konumunu bilmesi gerekmiyor.
 */
export function SiparisDestekDugmesi({
  siparisNo,
  adim = "siparis-nerede",
  className,
}: {
  siparisNo: string;
  adim?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const detay: DestekAcDetay = { adim, siparisNo };
        window.dispatchEvent(new CustomEvent(DESTEK_OLAYI, { detail: detay }));
      }}
      className={
        className ??
        `tiklanabilir inline-flex items-center gap-1.5 rounded-2xl border border-kahve-900/12
         bg-white px-3.5 py-2 text-sm font-bold text-kahve-800 transition-colors
         duration-300 hover:border-sari-500/60 hover:bg-sari-500/10`
      }
    >
      <DestekIkon className="size-4" />
      Destek
    </button>
  );
}
