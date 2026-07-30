"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { paraFormatla } from "@/lib/utils";
import { useSepet } from "../saglayici/SepetBaglami";
import { Buton, OkIkon } from "../ui/Buton";
import { KapatIkon, SepetIkon } from "../ui/Ikonlar";
import { Katman } from "../ui/Katman";

export function SepetCekmecesi() {
  const {
    kalemler,
    restoranSlug,
    restoranAdi,
    tutarlar,
    adetToplam,
    cekmeceAcik,
    setCekmeceAcik,
    adetAyarla,
    kaldir,
    temizle,
  } = useSepet();
  const router = useRouter();

  const bos = kalemler.length === 0;

  return (
    <Katman
      acik={cekmeceAcik}
      kapat={() => setCekmeceAcik(false)}
      baslik="Sepetim"
      aciklama={restoranAdi ? `${restoranAdi} · ${adetToplam} ürün` : undefined}
      altBolum={
        bos ? undefined : (
          <div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-kahve-600">Ara toplam</dt>
                <dd className="font-semibold text-kahve-900">
                  {paraFormatla(tutarlar?.araToplam ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kahve-600">Teslimat ücreti</dt>
                <dd className="font-semibold text-kahve-900">
                  {tutarlar?.teslimatUcreti === 0 ? (
                    <span className="text-nane-koyu">Ücretsiz</span>
                  ) : (
                    paraFormatla(tutarlar?.teslimatUcreti ?? 0)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-kahve-900/10 pt-2">
                <dt className="font-display font-extrabold text-kahve-900">Toplam</dt>
                <dd className="font-display text-lg font-extrabold text-kahve-900">
                  {paraFormatla(tutarlar?.toplam ?? 0)}
                </dd>
              </div>
            </dl>

            {tutarlar && !tutarlar.minSepetKarsilandi && (
              <p className="mt-3 rounded-xl bg-domates/10 px-3 py-2.5 text-xs leading-snug font-semibold text-domates-koyu">
                Minimum sepet tutarı {paraFormatla(tutarlar.minSepet)}. Ödemeye geçmek için{" "}
                {paraFormatla(tutarlar.minSepet - tutarlar.araToplam)} daha ekle.
              </p>
            )}

            <Buton
              type="button"
              boyut="lg"
              className="mt-4 w-full"
              disabled={!tutarlar?.minSepetKarsilandi}
              onClick={() => {
                setCekmeceAcik(false);
                router.push("/odeme");
              }}
              ikon={<OkIkon />}
            >
              Ödemeye geç
            </Buton>

            <button
              type="button"
              onClick={temizle}
              className="mt-3 w-full text-center text-xs font-bold text-kahve-500
                underline underline-offset-2 transition-colors duration-300 hover:text-domates"
            >
              Sepeti boşalt
            </button>
          </div>
        )
      }
    >
      {bos ? (
        <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
          <span className="grid size-16 place-items-center rounded-4xl bg-sari-500/16 text-sari-700">
            <SepetIkon className="size-8" />
          </span>
          <p className="mt-5 font-display text-lg font-extrabold text-kahve-900">
            Sepetin henüz boş
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-kahve-500">
            Bölgendeki restoranlara göz at, beğendiğin ürünleri sepete ekle.
          </p>
          <Buton
            type="button"
            boyut="md"
            className="mt-6"
            onClick={() => setCekmeceAcik(false)}
          >
            Restoranlara göz at
          </Buton>
        </div>
      ) : (
        <ul className="divide-y divide-kahve-900/8">
          {kalemler.map((k) => (
            <li key={k.urunId} className="flex gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug font-bold text-kahve-900">{k.ad}</p>
                <p className="mt-0.5 text-xs font-medium text-kahve-500">
                  {paraFormatla(k.fiyat)} × {k.adet}
                </p>

                <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-kahve-900/5 p-0.5">
                  <button
                    type="button"
                    onClick={() => adetAyarla(k.urunId, k.adet - 1)}
                    aria-label={`${k.ad} adedini azalt`}
                    className="grid size-7 place-items-center rounded-full text-kahve-700
                      transition-colors duration-300 hover:bg-white hover:text-kahve-900"
                  >
                    <svg viewBox="0 0 20 20" className="size-3.5" fill="none" aria-hidden="true">
                      <path
                        d="M5 10h10"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <span className="min-w-5 text-center text-xs font-extrabold text-kahve-900">
                    {k.adet}
                  </span>
                  <button
                    type="button"
                    onClick={() => adetAyarla(k.urunId, k.adet + 1)}
                    aria-label={`${k.ad} adedini artır`}
                    className="grid size-7 place-items-center rounded-full text-kahve-700
                      transition-colors duration-300 hover:bg-white hover:text-kahve-900"
                  >
                    <svg viewBox="0 0 20 20" className="size-3.5" fill="none" aria-hidden="true">
                      <path
                        d="M10 5v10M5 10h10"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <p className="font-display text-sm font-extrabold text-kahve-900">
                  {paraFormatla(k.fiyat * k.adet)}
                </p>
                <button
                  type="button"
                  onClick={() => kaldir(k.urunId)}
                  aria-label={`${k.ad} ürününü sepetten çıkar`}
                  className="grid size-7 place-items-center rounded-full text-kahve-400
                    transition-colors duration-300 hover:bg-domates/10 hover:text-domates"
                >
                  <KapatIkon className="size-3.5" />
                </button>
              </div>
            </li>
          ))}

          {restoranSlug && (
            <li className="px-5 py-4">
              <Link
                href={`/restoran/${restoranSlug}`}
                onClick={() => setCekmeceAcik(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sari-700
                  transition-colors duration-300 hover:text-kahve-900"
              >
                Menüye dön, ürün ekle
                <OkIkon className="size-3.5" />
              </Link>
            </li>
          )}
        </ul>
      )}
    </Katman>
  );
}
