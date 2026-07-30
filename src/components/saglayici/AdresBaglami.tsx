"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ilceGecerliMi } from "@/content/istanbul";

const DEPO_ANAHTARI = "ny-adres-v1";

type AdresBaglamiTipi = {
  /** Seçili İstanbul ilçesi; null ise henüz seçim yapılmadı. */
  ilce: string | null;
  hazir: boolean;
  modalAcik: boolean;
  setModalAcik: (acik: boolean) => void;
  ilceSec: (ilce: string) => void;
  temizle: () => void;
};

const AdresBaglami = createContext<AdresBaglamiTipi | null>(null);

export function AdresSaglayici({ children }: { children: ReactNode }) {
  const [ilce, setIlce] = useState<string | null>(null);
  const [hazir, setHazir] = useState(false);
  const [modalAcik, setModalAcik] = useState(false);

  useEffect(() => {
    try {
      const kayit = window.localStorage.getItem(DEPO_ANAHTARI);
      if (kayit && ilceGecerliMi(kayit)) setIlce(kayit);
    } catch {
      // erişilemiyorsa seçim oturum içinde tutulur
    }
    setHazir(true);
  }, []);

  const ilceSec = useCallback((yeni: string) => {
    if (!ilceGecerliMi(yeni)) return;
    setIlce(yeni);
    setModalAcik(false);
    try {
      window.localStorage.setItem(DEPO_ANAHTARI, yeni);
    } catch {
      /* yoksay */
    }
  }, []);

  const temizle = useCallback(() => {
    setIlce(null);
    try {
      window.localStorage.removeItem(DEPO_ANAHTARI);
    } catch {
      /* yoksay */
    }
  }, []);

  const deger = useMemo<AdresBaglamiTipi>(
    () => ({ ilce, hazir, modalAcik, setModalAcik, ilceSec, temizle }),
    [ilce, hazir, modalAcik, ilceSec, temizle],
  );

  return <AdresBaglami.Provider value={deger}>{children}</AdresBaglami.Provider>;
}

export function useAdres(): AdresBaglamiTipi {
  const baglam = useContext(AdresBaglami);
  if (!baglam) throw new Error("useAdres, AdresSaglayici içinde kullanılmalı.");
  return baglam;
}
