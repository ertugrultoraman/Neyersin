"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AramaBaglamiTipi = {
  sorgu: string;
  setSorgu: (deger: string) => void;
  /** Hero'daki aramadan restoran listesine geçiş. */
  listeyeGit: (deger: string) => void;
};

const AramaBaglami = createContext<AramaBaglamiTipi | null>(null);

/**
 * Hero'daki arama kutusu ile aşağıdaki restoran listesini bağlar.
 * URL yerine bağlam kullanıyoruz — arama tek sayfa içi bir filtre, kalıcı bir rota değil.
 */
export function AramaSaglayici({ children }: { children: ReactNode }) {
  const [sorgu, setSorgu] = useState("");

  const listeyeGit = useCallback((deger: string) => {
    setSorgu(deger);
    const hedef = document.getElementById("restoranlar");
    hedef?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const deger = useMemo(() => ({ sorgu, setSorgu, listeyeGit }), [sorgu, listeyeGit]);

  return <AramaBaglami.Provider value={deger}>{children}</AramaBaglami.Provider>;
}

export function useArama(): AramaBaglamiTipi {
  const baglam = useContext(AramaBaglami);
  if (!baglam) {
    throw new Error("useArama, AramaSaglayici içinde kullanılmalı.");
  }
  return baglam;
}
