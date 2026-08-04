"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { hizliFiltreler, restoranlar, siralamalar, type Restoran } from "@/content/restoranlar";
import { aramaEslesiyorMu } from "@/lib/utils";
import { Buton } from "../ui/Buton";
import { BolumBasligi } from "../ui/Bolum";
import { AraIkon, KapatIkon, KonumIkon } from "../ui/Ikonlar";
import { useAdres } from "../saglayici/AdresBaglami";
import { useArama } from "./AramaBaglami";
import { RestoranKarti } from "./RestoranKarti";
import { useDil } from "../saglayici/DilBaglami";

const SAYFA = 8;

/**
 * `liste` verilmezse içerik dosyasındaki sabit restoranlar kullanılır.
 * Sunucu tarafındaki sayfalar, otomatik açılan şef mutfaklarını da içeren
 * birleşik listeyi prop olarak geçer (bkz. lib/restoran-listesi.ts).
 */
export function Restoranlar({ liste }: { liste?: Restoran[] } = {}) {
  const { c } = useDil();
  const { sorgu, setSorgu } = useArama();
  const { ilce, setModalAcik } = useAdres();
  const [filtre, setFiltre] = useState(0);
  const [sirala, setSirala] = useState(0);
  const [gosterilen, setGosterilen] = useState(SAYFA);
  const azalt = useReducedMotion();

  const sonuclar = useMemo(() => {
    const aranan = sorgu.trim().toLocaleLowerCase("tr-TR");

    // Adres seçildiyse yalnızca o ilçeye teslimat yapanlar listelenir
    const kaynak = liste ?? restoranlar;
    return (ilce ? kaynak.filter((r) => r.teslimat.includes(ilce)) : kaynak)
      .filter((r) => hizliFiltreler[filtre].test(r))
      .filter((r) => {
        if (!aranan) return true;
        // Teslimat ilçeleri de aranabilir: "Kadıköy" araması oraya gelenleri bulur
        const havuz = [r.ad, ...r.mutfaklar, r.semt, ...r.teslimat, ...r.etiketler].join(" ");
        /*
         * Türkçe harf ve kelime sırası toleranslı eşleşme: "makbule sef" de
         * "makbule mantı" da sonuç veriyor (bkz. lib/utils → aramaEslesiyorMu).
         */
        return aramaEslesiyorMu(havuz, aranan);
      })
      .sort(siralamalar[sirala].uygula);
  }, [sorgu, filtre, sirala, ilce, liste]);

  const gorunen = sonuclar.slice(0, gosterilen);

  return (
    <section id="restoranlar" className="scroll-mt-28 py-14 md:py-20">
      <div className="kap">
        <BolumBasligi
          ustBaslik={c("restoran.tumRestoranlar")}
          baslik={ilce ? c("restoran.bolgeyeTeslimat", { ilce }) : c("restoran.bolgendeki")}
          aciklama={c("restoran.filtreAciklama")}
          yan={
            <button
              type="button"
              onClick={() => setModalAcik(true)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-kahve-900/12
                bg-white/70 px-4 py-2.5 text-sm font-bold text-kahve-900 backdrop-blur
                transition-all duration-300 ease-[var(--ease-yumusak)] hover:-translate-y-0.5
                hover:border-sari-500/60 hover:bg-white"
            >
              <KonumIkon className="size-4 text-sari-600" />
              {ilce ? `İstanbul, ${ilce}` : "Adresini seç"}
            </button>
          }
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
              {c("restoran.sirala")}
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
              {ilce ? `${ilce} için sonuç bulunamadı` : "Aramanla eşleşen restoran yok"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-kahve-500">
              {ilce
                ? "Bu ilçeye teslimat yapan ve filtrelerine uyan restoran yok. Filtreleri sıfırlayabilir veya başka bir ilçe seçebilirsin."
                : "Farklı bir mutfak deneyebilir veya filtreleri sıfırlayabilirsin."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Buton
                tur="hayalet"
                boyut="md"
                onClick={() => {
                  setSorgu("");
                  setFiltre(0);
                }}
              >
                {c("restoran.filtreleriSifirla")}
              </Buton>
              {ilce && (
                <Buton boyut="md" onClick={() => setModalAcik(true)}>
                  {c("restoran.baskaIlce")}
                </Buton>
              )}
            </div>
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
