"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { KullaniciIkon } from "../ui/Ikonlar";
import { useOturum, type Rol } from "./useOturum";

const ROL_HEDEFI: Record<Rol, string> = {
  admin: "/admin",
  sef: "/panel",
  kurye: "/panel",
  musteri: "/hesabim",
};

/**
 * Başlıktaki hesap düğmesi. Oturum bilgisi gelene kadar hiçbir şey çizilmez —
 * "Giriş yap" yazıp sonra "Panelim"e dönmek göz zıplatıyordu.
 */
export function HesapDugmesi({ className }: { className?: string }) {
  const durum = useOturum();
  if (!durum.yuklendi) return null;

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
