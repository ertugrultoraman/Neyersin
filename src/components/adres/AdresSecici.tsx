"use client";

import { useMemo, useState } from "react";

import { ilcelerYakaya } from "@/content/istanbul";
import { teslimatYapilanIlceler } from "@/content/restoranlar";
import { cn } from "@/lib/utils";
import { useAdres } from "../saglayici/AdresBaglami";
import { AraIkon, KonumIkon, KontrolIkon } from "../ui/Ikonlar";
import { Katman } from "../ui/Katman";
import { useDil } from "../saglayici/DilBaglami";

/** Header'daki adres düğmesi — seçili ilçeyi gösterir, modalı açar. */
export function AdresDugmesi({ className }: { className?: string }) {
  const { c } = useDil();
  const { ilce, setModalAcik } = useAdres();

  return (
    <button
      type="button"
      onClick={() => setModalAcik(true)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold",
        "transition-colors duration-300",
        // Sari serit uzerinde: siyah yazi.
        ilce ? "text-murekkep hover:bg-murekkep/10" : "text-murekkep/70 hover:text-murekkep",
        className,
      )}
    >
      <KonumIkon className="size-4 shrink-0 text-murekkep" />
      <span className="max-w-[9rem] truncate">
        {ilce ? c("arama.istanbulIlce", { ilce }) : c("adres.sec")}
      </span>
    </button>
  );
}

/** İlçe seçim modalı. Hizmet alanı yalnızca İstanbul olduğu için il seçimi yok. */
export function AdresModali() {
  const { c } = useDil();
  const { ilce, modalAcik, setModalAcik, ilceSec, temizle } = useAdres();
  const [arama, setArama] = useState("");

  /**
   * Bütün İstanbul ilçeleri listelenir; teslimat yapılmayanlar tıklanamaz ve
   * yanlarında "henüz hizmet yok" yazar. Gizlemek yerine göstermek, müşterinin
   * "benim ilçeme ne zaman geliyorsunuz?" sorusunu da yanıtlıyor.
   */
  const acikIlceler = useMemo(() => new Set(teslimatYapilanIlceler()), []);

  const gruplar = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");
    return ilcelerYakaya()
      .map((g) => ({
        ...g,
        ilceler: g.ilceler.filter((i) => i.toLocaleLowerCase("tr-TR").includes(aranan)),
      }))
      .filter((g) => g.ilceler.length > 0);
  }, [arama]);

  return (
    <Katman
      acik={modalAcik}
      kapat={() => setModalAcik(false)}
      konum="orta"
      baslik="Teslimat adresin nerede?"
      aciklama={c("adres.aciklama")}
      altBolum={
        ilce ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-kahve-700">
              Seçili: <span className="text-kahve-900">İstanbul, {ilce}</span>
            </p>
            <button
              type="button"
              onClick={temizle}
              className="text-xs font-bold text-kahve-500 underline underline-offset-2
                transition-colors duration-300 hover:text-domates"
            >
              Seçimi kaldır
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="sticky top-0 z-10 bg-krem px-5 pt-4 pb-3">
        <label
          className="flex items-center gap-3 rounded-2xl border border-kahve-900/10 bg-white
            px-4 py-2.5 transition-[border-color] duration-300 focus-within:border-sari-500/60"
        >
          <AraIkon className="size-4 shrink-0 text-kahve-400" />
          <span className="sr-only">İlçe ara</span>
          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder={c("adres.ilceAra")}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-kahve-900
              placeholder:text-kahve-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="px-5 pb-5">
        {gruplar.length === 0 ? (
          <p className="py-10 text-center text-sm text-kahve-500">
            “{arama}” ile eşleşen ilçe yok.
          </p>
        ) : (
          gruplar.map((grup) => (
            <section key={grup.yaka} className="mt-4 first:mt-0">
              <h3 className="text-2xs font-extrabold tracking-[0.16em] text-kahve-400 uppercase">
                {grup.yaka} Yakası
              </h3>
              <ul className="mt-2 grid grid-cols-2 gap-1.5">
                {grup.ilceler.map((i) => {
                  const secili = i === ilce;
                  const acik = acikIlceler.has(i);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => acik && ilceSec(i)}
                        disabled={!acik}
                        aria-pressed={secili}
                        title={acik ? undefined : c("adres.teslimatYok")}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5",
                          "text-left text-sm font-semibold transition-colors duration-300",
                          !acik
                            ? "cursor-not-allowed text-kahve-400"
                            : secili
                              ? "bg-sari-500 text-kahve-900"
                              : "text-kahve-700 hover:bg-kahve-900/5 hover:text-kahve-900",
                        )}
                      >
                        <span className="truncate">{i}</span>
                        {secili && <KontrolIkon className="size-4 shrink-0" strokeWidth="2.8" />}
                        {!acik && (
                          <span className="shrink-0 text-2xs font-bold whitespace-nowrap text-kahve-400">
                            henüz hizmet yok
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </Katman>
  );
}
