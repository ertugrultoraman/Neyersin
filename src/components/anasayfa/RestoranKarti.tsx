"use client";

import Link from "next/link";

import type { Restoran } from "@/content/restoranlar";
import { terimler } from "@/lib/sozluk";
import { paraFormatla } from "@/lib/utils";
import { useDil } from "../saglayici/DilBaglami";
import { RestoranKapak } from "../restoran/RestoranKapak";
import { KullaniciIkon, SaatIkon, ScooterIkon, SepetIkon, SimsekIkon, YildizIkon } from "../ui/Ikonlar";
import { Rozet } from "../ui/Rozet";

export function RestoranKarti({ restoran }: { restoran: Restoran }) {
  const { dil, c } = useDil();
  const sayiDili = dil === "en" ? "en-US" : "tr-TR";
  const ucretsiz = restoran.teslimatUcreti === 0;
  // "Süper hızlı" rozeti kaldırıldı: tüm mutfaklarda süre aynı (25–45 dk),
  // bazılarına hızlı demek gerçeğe dayanmıyordu.
  const evMutfagi = Boolean(restoran.evSefi || restoran.sefTuru);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-3xl border
        border-kahve-900/8 bg-white kart-kalk hover:border-sari-500/45"
    >
      <div className="relative">
        <Link
          href={`/restoran/${restoran.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block"
        >
          <RestoranKapak restoran={restoran} className="aspect-[16/10]" />
        </Link>

        {restoran.kampanya && (
          <p
            className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center gap-1.5
              rounded-xl bg-white/94 px-2.5 py-1.5 text-xs font-bold text-kahve-900
              shadow-yumusak backdrop-blur-sm"
          >
            <SimsekIkon className="size-3.5 shrink-0 text-sari-700" />
            <span className="truncate">{restoran.kampanya}</span>
          </p>
        )}

        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
          {evMutfagi && (
            <Rozet ton="kahve">
              <KullaniciIkon className="size-3" />
              {c("kart.sefMutfagi")}
            </Rozet>
          )}
          {restoran.etiketler.includes("Yeni") && <Rozet ton="sari">{c("kart.yeni")}</Rozet>}
        </div>

        {/* Puan rozeti yalnızca gerçek değerlendirme varsa — "0,0" göstermek yanıltıcı. */}
        {restoran.yorum > 0 && (
          <p
            className="pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-full
              bg-white/94 px-2.5 py-1 text-xs font-extrabold text-kahve-900 shadow-yumusak
              backdrop-blur-sm"
          >
            <YildizIkon className="size-3.5 text-sari-500" />
            {restoran.puan.toLocaleString(sayiDili, { minimumFractionDigits: 1 })}
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg leading-tight font-extrabold text-kahve-900">
          <Link
            href={`/restoran/${restoran.slug}`}
            className="transition-colors duration-300 hover:text-sari-700"
          >
            {restoran.ad}
          </Link>
        </h3>
        <p className="mt-1 truncate text-xs font-medium text-kahve-500">
          {terimler(dil, restoran.mutfaklar).join(" • ")}
        </p>
        <p className="mt-0.5 text-2xs font-medium text-kahve-400">
          {c("kart.semt", { semt: restoran.semt })} ·{" "}
          {restoran.yorum > 0
            ? c("kart.degerlendirme", { sayi: restoran.yorum.toLocaleString(sayiDili) })
            : c("kart.degerlendirilmedi")}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-kahve-900/8 pt-3.5 text-center">
          <div>
            <dt className="sr-only">{c("kart.teslimatSuresi")}</dt>
            <dd>
              <SaatIkon className="mx-auto size-4 text-kahve-400" />
              <span className="mt-1 block text-xs font-bold text-kahve-800">
                {c("kart.dakika", { bas: restoran.sureDk[0], son: restoran.sureDk[1] })}
              </span>
            </dd>
          </div>
          <div className="border-x border-kahve-900/8">
            <dt className="sr-only">{c("kart.minimumSepet")}</dt>
            <dd>
              <SepetIkon className="mx-auto size-4 text-kahve-400" />
              <span className="mt-1 block text-xs font-bold text-kahve-800">
                {c("kart.min", { tutar: paraFormatla(restoran.minSepet) })}
              </span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">{c("kart.teslimatUcreti")}</dt>
            <dd>
              <ScooterIkon
                className={`mx-auto size-4 ${ucretsiz ? "text-nane" : "text-kahve-400"}`}
              />
              <span
                className={`mt-1 block text-xs font-bold ${
                  ucretsiz ? "text-nane-koyu" : "text-kahve-800"
                }`}
              >
                {ucretsiz ? c("sepet.ucretsiz") : paraFormatla(restoran.teslimatUcreti)}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
