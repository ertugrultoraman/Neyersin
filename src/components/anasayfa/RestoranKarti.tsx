import Link from "next/link";

import type { Restoran } from "@/content/restoranlar";
import { paraFormatla } from "@/lib/utils";
import { RestoranKapak } from "../restoran/RestoranKapak";
import { SaatIkon, ScooterIkon, SepetIkon, SimsekIkon, YildizIkon } from "../ui/Ikonlar";
import { Rozet } from "../ui/Rozet";

export function RestoranKarti({ restoran }: { restoran: Restoran }) {
  const ucretsiz = restoran.teslimatUcreti === 0;
  const hizli = restoran.sureDk[0] <= 20;

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
          {hizli && (
            <Rozet ton="kahve">
              <SimsekIkon className="size-3" />
              Süper hızlı
            </Rozet>
          )}
          {restoran.etiketler.includes("Yeni") && <Rozet ton="sari">Yeni</Rozet>}
        </div>

        {/* Puan rozeti yalnızca gerçek değerlendirme varsa — "0,0" göstermek yanıltıcı. */}
        {restoran.yorum > 0 && (
          <p
            className="pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-full
              bg-white/94 px-2.5 py-1 text-xs font-extrabold text-kahve-900 shadow-yumusak
              backdrop-blur-sm"
          >
            <YildizIkon className="size-3.5 text-sari-500" />
            {restoran.puan.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
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
          {restoran.mutfaklar.join(" • ")}
        </p>
        <p className="mt-0.5 text-2xs font-medium text-kahve-400">
          {restoran.semt} / İstanbul ·{" "}
          {restoran.yorum > 0
            ? `${restoran.yorum.toLocaleString("tr-TR")} değerlendirme`
            : "henüz değerlendirilmedi"}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-kahve-900/8 pt-3.5 text-center">
          <div>
            <dt className="sr-only">Teslimat süresi</dt>
            <dd>
              <SaatIkon className="mx-auto size-4 text-kahve-400" />
              <span className="mt-1 block text-xs font-bold text-kahve-800">
                {restoran.sureDk[0]}–{restoran.sureDk[1]} dk
              </span>
            </dd>
          </div>
          <div className="border-x border-kahve-900/8">
            <dt className="sr-only">Minimum sepet</dt>
            <dd>
              <SepetIkon className="mx-auto size-4 text-kahve-400" />
              <span className="mt-1 block text-xs font-bold text-kahve-800">
                min {paraFormatla(restoran.minSepet)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Teslimat ücreti</dt>
            <dd>
              <ScooterIkon
                className={`mx-auto size-4 ${ucretsiz ? "text-nane" : "text-kahve-400"}`}
              />
              <span
                className={`mt-1 block text-xs font-bold ${
                  ucretsiz ? "text-nane-koyu" : "text-kahve-800"
                }`}
              >
                {ucretsiz ? "Ücretsiz" : paraFormatla(restoran.teslimatUcreti)}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
