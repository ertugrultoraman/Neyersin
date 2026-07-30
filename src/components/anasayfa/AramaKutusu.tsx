"use client";

import { useState } from "react";

import { kategoriler } from "@/content/kategoriler";
import { Buton } from "../ui/Buton";
import { AraIkon, KonumIkon } from "../ui/Ikonlar";
import { KategoriIkon } from "../ui/KategoriIkon";
import { useAdres } from "../saglayici/AdresBaglami";
import { useArama } from "./AramaBaglami";

/** Hero içindeki adres + arama bloğu. Mockup'taki "Kullanıcı Ekranı" kartının web karşılığı. */
export function AramaKutusu() {
  const { listeyeGit } = useArama();
  const { ilce, setModalAcik } = useAdres();
  const [metin, setMetin] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ilce) {
          setModalAcik(true);
          return;
        }
        listeyeGit(metin);
      }}
      className="rounded-4xl border border-kahve-900/8 bg-white/85 p-3 shadow-kart backdrop-blur-xl"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {/* Adres: serbest metin değil, ilçe seçimi — hizmet alanı yalnızca İstanbul */}
        <button
          type="button"
          onClick={() => setModalAcik(true)}
          className="flex flex-1 items-center gap-3 rounded-3xl px-4 py-3 text-left
            transition-colors duration-300 hover:bg-sari-500/8 md:py-3.5"
        >
          <KonumIkon className="size-5 shrink-0 text-sari-600" />
          <span className="min-w-0">
            <span className="block text-2xs font-bold tracking-wide text-kahve-400 uppercase">
              Teslimat adresi
            </span>
            <span
              className={`block truncate text-[0.9375rem] font-semibold ${
                ilce ? "text-kahve-900" : "text-kahve-400"
              }`}
            >
              {ilce ? `İstanbul, ${ilce}` : "İlçe seç"}
            </span>
          </span>
        </button>

        <span aria-hidden="true" className="hidden h-8 w-px bg-kahve-900/10 md:block" />

        <label
          className="flex flex-1 items-center gap-3 rounded-3xl px-4 py-3
            transition-colors duration-300 focus-within:bg-sari-500/8 md:py-3.5"
        >
          <AraIkon className="size-5 shrink-0 text-kahve-400" />
          <span className="sr-only">Restoran veya yemek ara</span>
          <input
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            placeholder="Restoran veya yemek ara…"
            className="w-full bg-transparent text-[0.9375rem] font-medium text-kahve-900
              placeholder:text-kahve-400 focus:outline-none"
          />
        </label>

        <Buton type="submit" boyut="lg" className="w-full md:w-auto">
          Restoranları Bul
        </Buton>
      </div>

      {/* Kategori kısayolları — dar ekranda yatay kaydırılır, sağ kenar yumuşak solar */}
      <div
        className="mt-1 flex gap-2 overflow-x-auto px-1 pt-2 pb-1 gizli-scroll
          [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]"
      >
        {kategoriler.slice(0, 6).map((k) => (
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
