"use client";

import { useRouter } from "next/navigation";
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
  /** Aramadan restoran listesine geçiş. */
  listeyeGit: (deger: string) => void;
};

const AramaBaglami = createContext<AramaBaglamiTipi | null>(null);

/**
 * Arama kutusu ile restoran listesini bağlar.
 *
 * Arama, sayfa içi kaydırma yerine `/restoranlar` sayfasına gider: her menü
 * öğesi kendi sayfası olsun istendiği için aşağı kayan tek sayfa davranışı
 * kaldırıldı. Sorgu URL'de taşınır (`?q=`), böylece bağlantı paylaşılabilir ve
 * sayfa yenilendiğinde arama kaybolmaz.
 */
export function AramaSaglayici({
  children,
  baslangicSorgu = "",
}: {
  children: ReactNode;
  baslangicSorgu?: string;
}) {
  const [sorgu, setSorgu] = useState(baslangicSorgu);
  const yonlendirici = useRouter();

  const listeyeGit = useCallback(
    (deger: string) => {
      setSorgu(deger);
      const temiz = deger.trim();
      yonlendirici.push(temiz ? `/restoranlar?q=${encodeURIComponent(temiz)}` : "/restoranlar");
    },
    [yonlendirici],
  );

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
