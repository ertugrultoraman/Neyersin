"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { hizliFiltreler, restoranlar, siralamalar } from "@/content/restoranlar";
import { Buton } from "../ui/Buton";
import { BolumBasligi } from "../ui/Bolum";
import { AraIkon, KapatIkon } from "../ui/Ikonlar";
import { useArama } from "./AramaBaglami";
import { RestoranKarti } from "./RestoranKarti";

const SAYFA = 8;

export function Restoranlar() {
  const { sorgu, setSorgu } = useArama();
  const [filtre, setFiltre] = useState(0);
  const [sirala, setSirala] = useState(0);
  const [gosterilen, setGosterilen] = useState(SAYFA);
  const azalt = useReducedMotion();

  const sonuclar = useMemo(() => {
    const aranan = sorgu.trim().toLocaleLowerCase("tr-TR");

    return restoranlar
      .filter((r) => hizliFiltreler[filtre].test(r))
      .filter((r) => {
        if (!aranan) return true;
        const havuz = [r.ad, ...r.mutfaklar, r.semt, r.sehir, ...r.etiketler]
          .join(" ")
          .toLocaleLowerCase("tr-TR");
        return havuz.includes(aranan);
      })
      .sort(siralamalar[sirala].uygula);
  }, [sorgu, filtre, sirala]);

  const gorunen = sonuclar.slice(0, gosterilen);

  return (
    <section id="restoranlar" className="scroll-mt-28 py-14 md:py-20">
      <div className="kap">
        <BolumBasligi
          ustBaslik="Tüm restoranlar"
          baslik="Bölgendeki tüm restoranlar"
          aciklama="Puan, teslimat süresi, minimum sepet ve kampanyaya göre filtrele."
        />

        {/* Arama + sıralama */}
        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
          <label
            className="flex flex-1 items-center gap-3 rounded-2xl border border-kahve-900/10
              bg-white px-4 py-3 shadow-yumusak transition-[border-color,box-shadow]
              duration-300 focus-within:border-sari-500/60 focus-within:shadow-kart"
          >
            <AraIkon className="size-5 shrink-0 text-kahve-400" />
            <span className="sr-only">Restoran, mutfak veya semt ara</span>
            <input
              value={sorgu}
              onChange={(e) => {
                setSorgu(e.target.value);
                setGosterilen(SAYFA);
              }}
              placeholder="Restoran, mutfak veya semt ara…"
              className="w-full bg-transparent text-[0.9375rem] font-medium text-kahve-900
                placeholder:text-kahve-400 focus:outline-none"
            />
            {sorgu && (
              <button
                type="button"
                onClick={() => setSorgu("")}
                aria-label="Aramayı temizle"
                className="grid size-7 shrink-0 place-items-center rounded-full text-kahve-400
                  transition-colors duration-300 hover:bg-kahve-900/6 hover:text-kahve-800"
              >
                <KapatIkon className="size-4" />
              </button>
            )}
          </label>

          <label className="flex shrink-0 items-center gap-2.5 rounded-2xl border
            border-kahve-900/10 bg-white px-4 py-3 shadow-yumusak">
            <span className="text-xs font-bold tracking-wide text-kahve-500 uppercase">
              Sırala
            </span>
            <select
              value={sirala}
              onChange={(e) => setSirala(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-kahve-900 focus:outline-none"
            >
              {siralamalar.map((s, i) => (
                <option key={s.etiket} value={i}>
                  {s.etiket}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Hızlı filtreler */}
        <div
          role="group"
          aria-label="Hızlı filtreler"
          className="mt-4 flex gap-2 overflow-x-auto pb-2 gizli-scroll"
        >
          {hizliFiltreler.map((f, i) => {
            const secili = i === filtre;
            return (
              <button
                key={f.etiket}
                type="button"
                aria-pressed={secili}
                onClick={() => {
                  setFiltre(i);
                  setGosterilen(SAYFA);
                }}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-bold
                  transition-colors duration-300
                  ${secili ? "text-kahve-900" : "text-kahve-500 hover:text-kahve-800"}`}
              >
                {secili && (
                  <motion.span
                    layoutId="restoran-filtre"
                    className="absolute inset-0 rounded-full bg-sari-500 shadow-sari"
                    transition={{ duration: azalt ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="relative">{f.etiket}</span>
              </button>
            );
          })}
        </div>

        {/* Sonuç sayısı */}
        <p aria-live="polite" className="mt-6 text-sm font-medium text-kahve-500">
          <strong className="font-extrabold text-kahve-900">{sonuclar.length}</strong> restoran
          bulundu
          {sorgu.trim() && (
            <>
              {" — "}
              <span className="text-kahve-700">“{sorgu.trim()}”</span> aramasıyla
            </>
          )}
        </p>

        {/* Kart ızgarası */}
        {sonuclar.length > 0 ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {gorunen.map((r, i) => (
                <motion.li
                  key={r.slug}
                  layout={!azalt}
                  initial={{ opacity: 0, y: azalt ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: azalt ? 1 : 0.96 }}
                  transition={{
                    duration: azalt ? 0.2 : 0.45,
                    delay: azalt ? 0 : Math.min(i, 7) * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <RestoranKarti restoran={r} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div
            className="mt-8 rounded-3xl border border-dashed border-kahve-900/15
              bg-white/60 px-6 py-14 text-center"
          >
            <p className="font-display text-xl font-extrabold text-kahve-900">
              Aramanla eşleşen restoran yok
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-kahve-500">
              Farklı bir mutfak deneyebilir veya filtreleri sıfırlayabilirsin.
            </p>
            <Buton
              tur="hayalet"
              boyut="md"
              className="mt-6"
              onClick={() => {
                setSorgu("");
                setFiltre(0);
              }}
            >
              Filtreleri sıfırla
            </Buton>
          </div>
        )}

        {gosterilen < sonuclar.length && (
          <div className="mt-10 flex justify-center">
            <Buton tur="ikincil" boyut="lg" onClick={() => setGosterilen((g) => g + SAYFA)}>
              {sonuclar.length - gosterilen} restoran daha göster
            </Buton>
          </div>
        )}
      </div>
    </section>
  );
}
