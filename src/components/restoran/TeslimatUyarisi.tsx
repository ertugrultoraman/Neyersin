"use client";

import type { Restoran } from "@/content/restoranlar";
import { useAdres } from "../saglayici/AdresBaglami";
import { KonumIkon, KontrolIkon } from "../ui/Ikonlar";
import { useDil } from "../saglayici/DilBaglami";

/** Seçili ilçeye göre bu restoranın teslimat yapıp yapmadığını söyler. */
export function TeslimatUyarisi({ restoran }: { restoran: Restoran }) {
  const { c } = useDil();
  const { ilce, hazir, setModalAcik } = useAdres();

  if (!hazir) return null;

  if (!ilce) {
    return (
      <button
        type="button"
        onClick={() => setModalAcik(true)}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed
          border-kahve-900/20 bg-white/60 px-4 py-3 text-left text-sm font-semibold
          text-kahve-700 transition-colors duration-300 hover:border-sari-500/60 hover:bg-white"
      >
        <KonumIkon className="size-4 shrink-0 text-sari-600" />
        {c("restoranSayfa.teslimatUyarisi")}
      </button>
    );
  }

  const geliyor = restoran.teslimat.includes(ilce);

  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold ${
        geliyor ? "bg-nane/10 text-nane-koyu" : "bg-domates/10 text-domates-koyu"
      }`}
    >
      {geliyor ? (
        <>
          <KontrolIkon className="mt-0.5 size-4 shrink-0" strokeWidth="2.8" />
          <span>
            <strong>İstanbul, {ilce}</strong> adresine teslimat yapıyor.
          </span>
        </>
      ) : (
        <>
          <KonumIkon className="mt-0.5 size-4 shrink-0" />
          <span>
            Bu restoran <strong>{ilce}</strong> ilçesine teslimat yapmıyor. Sipariş
            oluşturmak için{" "}
            <button
              type="button"
              onClick={() => setModalAcik(true)}
              className="underline underline-offset-2"
            >
              adresini değiştir
            </button>
            .
          </span>
        </>
      )}
    </div>
  );
}
