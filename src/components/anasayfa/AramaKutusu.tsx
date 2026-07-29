"use client";

import { useState } from "react";

import { kategoriler } from "@/content/kategoriler";
import { Buton } from "../ui/Buton";
import { AraIkon, KonumIkon, MikrofonIkon } from "../ui/Ikonlar";
import { KategoriIkon } from "../ui/KategoriIkon";
import { useArama } from "./AramaBaglami";

/** Hero içindeki adres + arama bloğu. Mockup'taki "Kullanıcı Ekranı" kartının web karşılığı. */
export function AramaKutusu() {
  const { listeyeGit } = useArama();
  const [adres, setAdres] = useState("");
  const [metin, setMetin] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        listeyeGit(metin);
      }}
      className="rounded-4xl border border-kahve-900/8 bg-white/85 p-3 shadow-kart backdrop-blur-xl"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <label className="group flex flex-1 items-center gap-3 rounded-3xl px-4 py-3
          transition-colors duration-300 focus-within:bg-sari-500/8 md:py-3.5">
          <KonumIkon className="size-5 shrink-0 text-sari-600" />
          <span className="sr-only">Teslimat adresi</span>
          <input
            value={adres}
            onChange={(e) => setAdres(e.target.value)}
            placeholder="Mahalle veya adres gir"
            autoComplete="street-address"
            className="w-full bg-transparent text-[0.9375rem] font-medium text-kahve-900
              placeholder:text-kahve-400 focus:outline-none"
          />
        </label>

        <span aria-hidden="true" className="hidden h-8 w-px bg-kahve-900/10 md:block" />

        <label className="group flex flex-1 items-center gap-3 rounded-3xl px-4 py-3
          transition-colors duration-300 focus-within:bg-sari-500/8 md:py-3.5">
          <AraIkon className="size-5 shrink-0 text-kahve-400" />
          <span className="sr-only">Restoran veya yemek ara</span>
          <input
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            placeholder="Restoran veya yemek ara…"
            className="w-full bg-transparent text-[0.9375rem] font-medium text-kahve-900
              placeholder:text-kahve-400 focus:outline-none"
          />
          <button
            type="button"
            aria-label="Sesle ara"
            className="grid size-9 shrink-0 place-items-center rounded-full text-kahve-400
              transition-all duration-300 hover:bg-sari-500/15 hover:text-kahve-800"
          >
            <MikrofonIkon className="size-4.5" />
          </button>
        </label>

        <Buton type="submit" boyut="lg" className="w-full md:w-auto">
          Restoranları Bul
        </Buton>
      </div>

      {/* Kategori kısayolları */}
      <div className="mt-1 flex gap-2 overflow-x-auto px-1 pt-2 pb-1 gizli-scroll">
        {kategoriler.slice(0, 7).map((k) => (
          <button
            key={k.slug}
            type="button"
            onClick={() => listeyeGit(k.ad)}
            className="group flex shrink-0 items-center gap-2 rounded-full bg-kahve-900/4 px-3.5 py-2
              text-sm font-semibold text-kahve-700 transition-all duration-300
              ease-[var(--ease-yumusak)] hover:-translate-y-0.5 hover:bg-sari-500
              hover:text-kahve-900"
          >
            <KategoriIkon
              ad={k.ikon}
              className="size-4.5 text-sari-700 transition-colors duration-300 group-hover:text-kahve-900"
            />
            {k.ad}
          </button>
        ))}
      </div>
    </form>
  );
}
