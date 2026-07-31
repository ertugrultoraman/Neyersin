"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { KullaniciIkon } from "../ui/Ikonlar";

type Rol = "admin" | "sef" | "kurye" | "musteri";
type Durum = { girisli: true; ad: string; rol: Rol } | { girisli: false } | null;

const ROL_HEDEFI: Record<Rol, string> = {
  admin: "/admin",
  sef: "/panel",
  kurye: "/panel",
  musteri: "/hesabim",
};

/**
 * Başlıktaki hesap düğmesi. Oturum bilgisi `/api/oturum`dan gelir; böylece
 * sayfaların statik üretimi bozulmaz. Bilgi gelene kadar hiçbir şey çizilmez —
 * "Giriş yap" yazıp sonra "Panelim"e dönmek göz zıplatıyordu.
 */
export function HesapDugmesi({ className }: { className?: string }) {
  const [durum, setDurum] = useState<Durum>(null);
  const pathname = usePathname();

  useEffect(() => {
    let iptal = false;
    fetch("/api/oturum")
      .then((c) => (c.ok ? c.json() : { girisli: false }))
      .then((v) => {
        if (!iptal) setDurum(v);
      })
      .catch(() => {
        if (!iptal) setDurum({ girisli: false });
      });
    return () => {
      iptal = true;
    };
  }, [pathname]);

  if (durum === null) return null;

  const temel = cn(
    "tiklanabilir inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-bold",
    "text-kahve-800 transition-colors duration-300 hover:bg-kahve-900/6",
    className,
  );

  if (durum.girisli) {
    return (
      <Link href={ROL_HEDEFI[durum.rol] ?? "/panel"} className={temel}>
        <KullaniciIkon className="size-4.5" />
        <span className="max-w-24 truncate">{durum.ad.split(" ")[0]}</span>
      </Link>
    );
  }

  return (
    <Link href="/hesap/giris" className={temel}>
      <KullaniciIkon className="size-4.5" />
      <span>Giriş yap</span>
    </Link>
  );
}
