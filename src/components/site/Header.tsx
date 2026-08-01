"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { site } from "@/content/site";
import { cn } from "@/lib/utils";
import { AdresDugmesi } from "../adres/AdresSecici";
import { HesapDugmesi } from "../hesap/HesapDugmesi";
import { useOturum } from "../hesap/useOturum";
import { SepetDugmesi } from "../sepet/SepetDugmesi";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { KapatIkon, UcNoktaIkon } from "../ui/Ikonlar";
import { MarkaLogo } from "./MarkaLogo";

export function Header() {
  const [kaydirildi, setKaydirildi] = useState(false);
  const [menuAcik, setMenuAcik] = useState(false);
  const pathname = usePathname();
  const oturum = useOturum();

  /**
   * "Restoranını Ekle" bir iş ortağı çağrısı: yalnızca giriş yapmamış
   * ziyaretçiye gösterilir. Müşteri, şef, kurye ve yönetici hesaplarında
   * anlamsız olduğu için gizlenir.
   */
  const isOrtakligiGoster = oturum.yuklendi && !oturum.girisli;

  // Kaydırma durumuna göre başlığın zeminini yumuşakça yoğunlaştır
  useEffect(() => {
    const kontrol = () => setKaydirildi(window.scrollY > 8);
    kontrol();
    window.addEventListener("scroll", kontrol, { passive: true });
    return () => window.removeEventListener("scroll", kontrol);
  }, []);

  // Sayfa değişince menü kapanmalı
  useEffect(() => {
    setMenuAcik(false);
  }, [pathname]);

  // Menü açıkken arka planı kilitle ve Escape ile kapat
  useEffect(() => {
    if (!menuAcik) return;
    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tusla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAcik(false);
    };
    window.addEventListener("keydown", tusla);
    return () => {
      document.body.style.overflow = oncekiTasma;
      window.removeEventListener("keydown", tusla);
    };
  }, [menuAcik]);

  const aktifMi = (href: string) => {
    const temiz = href.split("#")[0];
    if (!temiz || temiz === "/") return false;
    return pathname === temiz || pathname.startsWith(`${temiz}/`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-yumusak)]",
        // Mobilde zemin TAM OPAK: yarı saydam başlıkta altından geçen içerik
        // menü yazılarının üstüne biniyordu. Geniş ekranda cam etkisi kalıyor.
        "bg-krem",
        kaydirildi
          ? "shadow-yumusak lg:bg-krem/85 lg:backdrop-blur-lg"
          : "lg:bg-krem/40 lg:backdrop-blur-sm",
      )}
    >
      <div className="kap flex h-18 items-center justify-between gap-4">
        <Link
          href="/"
          className="shrink-0 rounded-2xl"
          aria-label={`${site.ad} ana sayfa`}
        >
          <MarkaLogo />
        </Link>

        <nav aria-label="Ana menü" className="hidden items-center gap-1 lg:flex">
          {site.navigasyon.map((oge) => (
            <Link
              key={oge.href}
              href={oge.href}
              className={cn(
                // whitespace-nowrap: "Nasıl Çalışır" gibi iki kelimelik başlıklar
                // alt satıra sarkmasın, hepsi tek satırda yan yana dursun.
                "group relative rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-300",
                aktifMi(oge.href)
                  ? "text-kahve-900"
                  : "text-kahve-600 hover:text-kahve-900",
              )}
            >
              {oge.etiket}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3.5 -bottom-0.5 h-[3px] origin-left rounded-full bg-sari-500",
                  "transition-transform duration-400 ease-[var(--ease-yumusak)]",
                  aktifMi(oge.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Aynı sebeple sarmalayıcıda gizleniyor (bkz. aşağıdaki hesap düğmesi notu). */}
          <div className="hidden md:block">
            <AdresDugmesi />
          </div>

          <SepetDugmesi />

          {/* Görünürlük sarmalayıcıda: `cn` sınıfları yalnızca birleştiriyor, bu yüzden
              doğrudan verilen `hidden`'ı bileşenin kendi `inline-flex`'i eziyor ve düğme
              mobilde gizlenmiyordu. Etiket uzayınca (Giriş Yap / Hesap Oluştur) bu, 390px
              ekranda başlığı 563px'e taşırıyordu. */}
          <div className="hidden sm:block">
            <HesapDugmesi />
          </div>

          {/* Görünürlük sarmalayıcıda: Buton'un temel `inline-flex` sınıfı, doğrudan
              verilen `hidden`'ı Tailwind'in çıktı sırasında ezdiği için burada gizlenmez. */}
          {isOrtakligiGoster && (
            <div className="hidden lg:block">
              <ButonBaglanti href="/iletisim?konu=restoran" boyut="sm">
                Restoranını Ekle
                <OkIkon />
              </ButonBaglanti>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuAcik(true)}
            className="grid size-11 place-items-center rounded-2xl text-kahve-800
              transition-colors duration-300 hover:bg-kahve-900/6 lg:hidden"
            aria-label="Menüyü aç"
            aria-expanded={menuAcik}
          >
            <UcNoktaIkon className="size-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuAcik && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-kahve-900/70 backdrop-blur-md lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuAcik(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,88vw)] flex-col
                bg-krem shadow-kalkik lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Mobil menü"
            >
              <div className="flex h-18 items-center justify-between px-5">
                <MarkaLogo boyut="sm" />
                <button
                  type="button"
                  onClick={() => setMenuAcik(false)}
                  className="grid size-10 place-items-center rounded-2xl text-kahve-800
                    transition-colors duration-300 hover:bg-kahve-900/6"
                  aria-label="Menüyü kapat"
                >
                  <KapatIkon className="size-5" />
                </button>
              </div>

              <nav aria-label="Mobil ana menü" className="flex flex-col gap-1 px-4 py-2">
                {site.navigasyon.map((oge, i) => (
                  <motion.div
                    key={oge.href}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.4 }}
                  >
                    <Link
                      href={oge.href}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold",
                        "transition-colors duration-300",
                        aktifMi(oge.href)
                          ? "bg-sari-500/18 text-kahve-900"
                          : "text-kahve-700 hover:bg-kahve-900/5 hover:text-kahve-900",
                      )}
                    >
                      {oge.etiket}
                      <OkIkon className="text-sari-600" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-3 border-t border-kahve-900/10 p-5">
                <HesapDugmesi className="w-full justify-center rounded-2xl bg-kahve-900/5 py-3" />
                <AdresDugmesi className="w-full justify-center rounded-2xl bg-kahve-900/5 py-3" />
                {isOrtakligiGoster && (
                  <>
                    <ButonBaglanti href="/iletisim?konu=restoran" boyut="md" className="w-full">
                      Restoranını Ekle
                      <OkIkon />
                    </ButonBaglanti>
                    <ButonBaglanti
                      href="/hesap/basvuru"
                      tur="hayalet"
                      boyut="md"
                      className="w-full"
                    >
                      Kurye Ol
                    </ButonBaglanti>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
