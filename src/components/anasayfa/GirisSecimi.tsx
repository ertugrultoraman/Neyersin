"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { KapatIkon, KullaniciIkon, DukkanIkon } from "../ui/Ikonlar";

/**
 * Siteye girildiğinde çıkan iki kartlık seçim ekranı.
 *
 * Proje dosyasındaki ayrım: aynı platformda iki farklı alışveriş var —
 * kendi mutfağından satan ev hanımları/şefler ve normal ticari işletmeler.
 * Müşteri hangisini aradığını en başta söylesin, listeye ona göre düşsün.
 *
 * Bir kez seçildikten (veya kapatıldıktan) sonra bir daha rahatsız etmemesi
 * için tercih tarayıcıda saklanıyor.
 */
const HATIRLAMA_ANAHTARI = "ny-giris-secimi";

const SECENEKLER = [
  {
    slug: "sef",
    baslik: "Şeflerin Elinden",
    aciklama:
      "Kendi mutfağından pişiren ev hanımları ve şefler. Dükkân kirası yok, o fark fiyata binmiyor.",
    Ikon: KullaniciIkon,
    href: "/seflerin-elinden",
  },
  {
    slug: "isletme",
    baslik: "İşletmeler",
    aciklama:
      "Burger, pizza, döner, kebap… Canın dışarıdan bir şey çekiyorsa restoranlar da burada.",
    Ikon: DukkanIkon,
    href: "/isletmeler",
  },
];

export function GirisSecimi() {
  const [acik, setAcik] = useState(false);
  const azalt = useReducedMotion();

  useEffect(() => {
    // Sunucuda localStorage yok; ilk boyamadan sonra karar veriliyor.
    try {
      if (!window.localStorage.getItem(HATIRLAMA_ANAHTARI)) setAcik(true);
    } catch {
      // Gizli sekmede localStorage kapalı olabilir — bu durumda hiç gösterme.
    }
  }, []);

  function kapat(secim?: string) {
    try {
      window.localStorage.setItem(HATIRLAMA_ANAHTARI, secim ?? "kapatildi");
    } catch {
      // Saklayamıyorsak da ekranı kapat; ısrar etmenin anlamı yok.
    }
    setAcik(false);
  }

  // Escape ile kapansın, açıkken arka plan kaymasın
  useEffect(() => {
    if (!acik) return;
    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tusla = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    window.addEventListener("keydown", tusla);
    return () => {
      document.body.style.overflow = oncekiTasma;
      window.removeEventListener("keydown", tusla);
    };
  }, [acik]);

  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-kahve-900/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => kapat()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="giris-secimi-baslik"
        >
          <motion.div
            className="w-full max-w-3xl"
            initial={{ opacity: 0, y: azalt ? 0 : 26, scale: azalt ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: azalt ? 0 : 18, scale: azalt ? 1 : 0.98 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-[2rem] bg-krem p-6 shadow-kalkik sm:p-9">
              <button
                type="button"
                onClick={() => kapat()}
                aria-label="Kapat"
                className="absolute top-4 right-4 grid size-10 place-items-center rounded-2xl
                  text-kahve-500 transition-colors duration-300 hover:bg-kahve-900/6
                  hover:text-kahve-900"
              >
                <KapatIkon className="size-5" />
              </button>

              <div className="max-w-lg pr-10">
                <h2
                  id="giris-secimi-baslik"
                  className="font-display text-2xl leading-tight font-extrabold text-kahve-900 sm:text-3xl"
                >
                  Bugün nereden yersin?
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-kahve-600 sm:text-base">
                  İstediğini seç — sonra üstteki sekmelerden diğerine tek tıkla geçebilirsin.
                </p>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {SECENEKLER.map((s) => (
                  <motion.div
                    key={s.slug}
                    whileHover={azalt ? undefined : { scale: 1.04, y: -6 }}
                    whileTap={azalt ? undefined : { scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  >
                    <Link
                      href={s.href}
                      onClick={() => kapat(s.slug)}
                      /* Kare yalnızca sm ve üstünde: telefonda iki kare kart alt alta
                         ekrana sığmıyor, kullanıcı ikinci seçeneği hiç görmüyordu. */
                      className="group relative flex flex-col justify-between gap-8 overflow-hidden
                        rounded-[1.75rem] bg-gradient-to-br from-sari-300 to-sari-500 p-6
                        sm:aspect-square sm:gap-0
                        text-kahve-900 shadow-sari ring-1 ring-kahve-900/8
                        focus-visible:outline-2 focus-visible:outline-offset-4
                        focus-visible:outline-kahve-900 sm:p-7"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-16 -right-12 size-44 rounded-full
                          border-[16px] border-white/20 transition-transform duration-700
                          ease-[var(--ease-yumusak)] group-hover:scale-110"
                      />

                      <span className="relative grid size-14 place-items-center rounded-2xl bg-kahve-900/12">
                        <s.Ikon className="size-7" />
                      </span>

                      <span className="relative">
                        <span className="block font-display text-xl leading-tight font-extrabold sm:text-2xl">
                          {s.baslik}
                        </span>
                        <span className="mt-2 block text-sm leading-snug text-kahve-800/85">
                          {s.aciklama}
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => kapat()}
                className="mt-6 text-sm font-semibold text-kahve-500 underline
                  underline-offset-4 transition-colors duration-300 hover:text-kahve-900"
              >
                Hepsini birlikte göster
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
