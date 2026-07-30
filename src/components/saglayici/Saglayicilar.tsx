"use client";

import type { ReactNode } from "react";

import { AdresModali } from "../adres/AdresSecici";
import { SepetCekmecesi } from "../sepet/SepetCekmecesi";
import { AdresSaglayici } from "./AdresBaglami";
import { SepetSaglayici } from "./SepetBaglami";

/**
 * Uygulama genelinde paylaşılan durum: teslimat adresi (İstanbul ilçesi) ve sepet.
 * Çekmece/modal katmanları da burada, tek yerde mount ediliyor.
 */
export function Saglayicilar({ children }: { children: ReactNode }) {
  return (
    <AdresSaglayici>
      <SepetSaglayici>
        {children}
        <SepetCekmecesi />
        <AdresModali />
      </SepetSaglayici>
    </AdresSaglayici>
  );
}
