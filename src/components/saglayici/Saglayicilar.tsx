"use client";

import type { ReactNode } from "react";

import type { Dil } from "@/lib/dil";

import { AdresModali } from "../adres/AdresSecici";
import { DestekWidget } from "../destek/DestekWidget";
import { SepetCekmecesi } from "../sepet/SepetCekmecesi";
import { SepetFab } from "../sepet/SepetFab";
import { AdresSaglayici } from "./AdresBaglami";
import { DilSaglayici } from "./DilBaglami";
import { SepetSaglayici } from "./SepetBaglami";

/**
 * Uygulama genelinde paylaşılan durum: dil, teslimat adresi (İstanbul ilçesi)
 * ve sepet. Çekmece/modal katmanları da burada, tek yerde mount ediliyor.
 *
 * Dil EN DIŞTA: içerideki her şey (sepet çekmecesi, destek widgetı, adres
 * modalı) çeviriye erişebilsin.
 */
export function Saglayicilar({ dil, children }: { dil: Dil; children: ReactNode }) {
  return (
    <DilSaglayici dil={dil}>
      <AdresSaglayici>
      <SepetSaglayici>
        {children}
        {/* Sağ altta sabit sepet — sepet doluyken görünür, uçan ürünün hedefi. */}
        <SepetFab />
        {/* Canlı destek asistanı — sepetin üstünde, her sayfada erişilebilir. */}
        <DestekWidget />
        <SepetCekmecesi />
        <AdresModali />
        </SepetSaglayici>
      </AdresSaglayici>
    </DilSaglayici>
  );
}
