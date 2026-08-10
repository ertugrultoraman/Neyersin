"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** `lib/hesaplar/tipler.ts` içindeki `Rol` ile aynı kalmalı. */
export type Rol = "admin" | "sef" | "isletme" | "kurye" | "musteri";

export type OturumDurumu =
  | { yuklendi: false }
  | { yuklendi: true; girisli: false }
  | { yuklendi: true; girisli: true; ad: string; rol: Rol };

/**
 * Başlıktaki hesap düğmesi ve role göre gizlenen bağlantılar için hafif oturum
 * bilgisi. `/api/oturum` üzerinden okunur; kök layout'ta çerez okumak bütün
 * sayfaları dinamik hâle getireceği için bilinçli olarak istemci tarafında
 * yapılıyor — böylece ana sayfa statik kalıyor.
 */
export function useOturum(): OturumDurumu {
  const [durum, setDurum] = useState<OturumDurumu>({ yuklendi: false });
  const pathname = usePathname();

  useEffect(() => {
    let iptal = false;
    fetch("/api/oturum")
      .then((c) => (c.ok ? c.json() : { girisli: false }))
      .then((v) => {
        if (iptal) return;
        setDurum(
          v?.girisli
            ? { yuklendi: true, girisli: true, ad: String(v.ad ?? ""), rol: v.rol as Rol }
            : { yuklendi: true, girisli: false },
        );
      })
      .catch(() => {
        if (!iptal) setDurum({ yuklendi: true, girisli: false });
      });
    return () => {
      iptal = true;
    };
  }, [pathname]);

  return durum;
}
