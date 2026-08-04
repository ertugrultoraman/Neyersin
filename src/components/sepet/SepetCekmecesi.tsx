"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { kalemBirimFiyati } from "@/lib/siparis";
import { paraFormatla } from "@/lib/utils";
import { useSepet } from "../saglayici/SepetBaglami";
import { useDil } from "../saglayici/DilBaglami";
import { Buton, OkIkon } from "../ui/Buton";
import { KapatIkon, SepetIkon } from "../ui/Ikonlar";
import { Katman } from "../ui/Katman";

export function SepetCekmecesi() {
  const { c } = useDil();
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
      aciklama={
        restoranAdi ? `${restoranAdi} · ${c("sepet.urunSayisi", { sayi: adetToplam })}` : undefined
      }
      altBolum={
        bos ? undefined : (
          <div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-kahve-600">{c("sepet.araToplam")}</dt>
                <dd className="font-semibold text-kahve-900">
                  {paraFormatla(tutarlar?.araToplam ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kahve-600">{c("sepet.teslimatUcreti")}</dt>
                <dd className="font-semibold text-kahve-900">
                  {tutarlar?.teslimatUcreti === 0 ? (
                    <span className="text-nane-koyu">{c("sepet.ucretsiz")}</span>
                  ) : (
                    paraFormatla(tutarlar?.teslimatUcreti ?? 0)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-kahve-900/10 pt-2">
                <dt className="font-display font-extrabold text-kahve-900">{c("sepet.toplam")}</dt>
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
              {c("sepet.odemeyeGec")}
            </Buton>

            <button
              type="button"
              onClick={temizle}
              className="mt-3 w-full text-center text-xs font-bold text-kahve-500
                underline underline-offset-2 transition-colors duration-300 hover:text-domates"
            >
              {c("sepet.bosalt")}
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
            {c("sepet.henuzBos")}
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-kahve-500">
            {c("sepet.bosGozAt")}
          </p>
          <Buton
            type="button"
            boyut="md"
            className="mt-6"
            onClick={() => setCekmeceAcik(false)}
          >
            {c("sepet.restoranlaraGozAt")}
          </Buton>
        </div>
      ) : (
        <ul className="divide-y divide-kahve-900/8">
          {kalemler.map((k) => (
            <li key={k.satirId} className="flex gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug font-bold text-kahve-900">{k.ad}</p>
                {k.ekstralar && k.ekstralar.length > 0 && (
                  <p className="mt-0.5 text-xs text-kahve-500">
                    {k.ekstralar.map((e) => e.ad).join(", ")}
                  </p>
                )}
                <p className="mt-0.5 text-xs font-medium text-kahve-500">
                  {paraFormatla(kalemBirimFiyati(k))} × {k.adet}
                </p>

                <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-kahve-900/5 p-0.5">
                  <button
                    type="button"
                    onClick={() => adetAyarla(k.satirId, k.adet - 1)}
                    aria-label={c("sepet.adediAzalt", { ad: k.ad })}
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
                    onClick={() => adetAyarla(k.satirId, k.adet + 1)}
                    aria-label={c("sepet.adediArtir", { ad: k.ad })}
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
                  {paraFormatla(kalemBirimFiyati(k) * k.adet)}
                </p>
                <button
                  type="button"
                  onClick={() => kaldir(k.satirId)}
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
                {c("sepet.menuyeDon")}
                <OkIkon className="size-3.5" />
              </Link>
            </li>
          )}
        </ul>
      )}
    </Katman>
  );
}
