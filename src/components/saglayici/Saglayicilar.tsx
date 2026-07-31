"use client";

import type { ReactNode } from "react";

import { AdresModali } from "../adres/AdresSecici";
import { SepetCekmecesi } from "../sepet/SepetCekmecesi";
import { SepetFab } from "../sepet/SepetFab";
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
        {/* Sağ altta sabit sepet — sepet doluyken görünür, uçan ürünün hedefi. */}
        <SepetFab />
        <SepetCekmecesi />
        <AdresModali />
      </SepetSaglayici>
    </AdresSaglayici>
  );
}
