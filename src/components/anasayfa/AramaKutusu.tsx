"use client";

import { useState } from "react";

import { kategoriler } from "@/content/kategoriler";
import { Buton } from "../ui/Buton";
import { AraIkon, KonumIkon } from "../ui/Ikonlar";
import { KategoriIkon } from "../ui/KategoriIkon";
import { useAdres } from "../saglayici/AdresBaglami";
import { useArama } from "./AramaBaglami";
import { useDil } from "../saglayici/DilBaglami";
import { terim } from "@/lib/sozluk";

/** Hero içindeki adres + arama bloğu. Mockup'taki "Kullanıcı Ekranı" kartının web karşılığı. */
export function AramaKutusu() {
  const { dil, c } = useDil();
  const { listeyeGit } = useArama();
  const { ilce, setModalAcik } = useAdres();
  const [metin, setMetin] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        /*
         * ARAMA İLÇEYE BAĞLI DEĞİL.
         *
         * Önceden ilçe seçili değilse Enter'a basmak aramayı yapmıyor, ilçe
         * penceresini açıyordu: "makbule şef" yazan kişi karşısında ilçe
         * listesi buluyordu. Şef aramak teslimat adresi gerektirmiyor —
         * adres ancak sipariş verirken lazım.
         *
         * İlçe yalnızca hiçbir şey yazılmadan "Bul" denince soruluyor;
         * o durumda gösterilecek anlamlı bir sonuç yok.
         */
        const aranan = metin.trim();
        if (!aranan && !ilce) {
          setModalAcik(true);
          return;
        }
        listeyeGit(aranan);
      }}
      className="rounded-4xl border border-kahve-900/8 bg-white/85 p-3 shadow-kart backdrop-blur-xl"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {/* Adres: serbest metin değil, ilçe seçimi — hizmet alanı yalnızca İstanbul */}
        {/*
          Adres alanı DARALTILDI, arama alanı genişletildi (aşağıda flex-[2]):
          asıl iş arama; adres yalnızca sipariş verirken gerekiyor.
        */}
        <button
          type="button"
          onClick={() => setModalAcik(true)}
          className="flex shrink-0 items-center gap-3 rounded-3xl px-4 py-3 text-left
            transition-colors duration-300 hover:bg-sari-500/8 md:w-52 md:py-3.5"
        >
          <KonumIkon className="size-5 shrink-0 text-sari-600" />
          <span className="min-w-0">
            <span className="block text-2xs font-bold tracking-wide text-kahve-400 uppercase">
              {c("arama.teslimatAdresi")}
            </span>
            <span
              className={`block truncate text-[0.9375rem] font-semibold ${
                ilce ? "text-kahve-900" : "text-kahve-400"
              }`}
            >
              {ilce ? c("arama.istanbulIlce", { ilce }) : c("arama.ilceSec")}
            </span>
          </span>
        </button>

        <span aria-hidden="true" className="hidden h-8 w-px bg-kahve-900/10 md:block" />

        {/* Arama alanı: kutunun en geniş parçası — sayfanın asıl işi bu. */}
        <label
          className="flex flex-[2] items-center gap-3 rounded-3xl bg-kahve-900/3 px-4 py-3.5
            ring-1 ring-kahve-900/6 transition-all duration-300
            focus-within:bg-sari-500/10 focus-within:ring-sari-500/45 md:py-4"
        >
          <AraIkon className="size-5 shrink-0 text-sari-600" />
          <span className="sr-only">{c("arama.yerTutucu")}</span>
          <input
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            placeholder={c("arama.buyukYerTutucu")}
            className="w-full bg-transparent text-base font-medium text-kahve-900
              placeholder:text-kahve-400 focus:outline-none"
          />
        </label>

        <Buton type="submit" boyut="lg" className="w-full md:w-auto">
          {c("arama.restoranlariBul")}
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
            {terim(dil, k.ad)}
          </button>
        ))}
      </div>
    </form>
  );
}
