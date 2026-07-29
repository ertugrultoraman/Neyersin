import { basligaId, type Blok } from "@/content/blog";
import { AkilliGorsel } from "../ui/AkilliGorsel";
import { KontrolIkon } from "../ui/Ikonlar";
import { Reveal } from "../ui/Reveal";

/** Blog yazılarının blok tabanlı içeriğini render eder. */
export function YaziGovdesi({ bloklar }: { bloklar: Blok[] }) {
  return (
    <div className="space-y-6">
      {bloklar.map((blok, i) => (
        <BlokRender key={i} blok={blok} />
      ))}
    </div>
  );
}

function BlokRender({ blok }: { blok: Blok }) {
  switch (blok.tur) {
    case "p":
      return (
        <p className="text-[1.0625rem] leading-[1.75] text-kahve-700 md:text-lg md:leading-[1.8]">
          {blok.metin}
        </p>
      );

    case "h2":
      return (
        <h2
          id={basligaId(blok.metin)}
          className="scroll-mt-32 pt-8 text-2xl leading-tight font-extrabold sm:text-3xl"
        >
          <span
            aria-hidden="true"
            className="mb-3 block h-1 w-12 rounded-full bg-sari-500"
          />
          {blok.metin}
        </h2>
      );

    case "h3":
      return (
        <h3 className="scroll-mt-32 pt-4 text-xl leading-snug font-extrabold sm:text-2xl">
          {blok.metin}
        </h3>
      );

    case "liste":
      return blok.sirali ? (
        <ol className="space-y-3 pl-1">
          {blok.maddeler.map((m, i) => (
            <li key={m} className="flex gap-3.5 text-[1.0625rem] leading-relaxed text-kahve-700">
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full
                  bg-kahve-900 font-display text-xs font-extrabold text-sari-300"
              >
                {i + 1}
              </span>
              {m}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="space-y-3">
          {blok.maddeler.map((m) => (
            <li key={m} className="flex gap-3.5 text-[1.0625rem] leading-relaxed text-kahve-700">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-sari-500/18 text-sari-700">
                <KontrolIkon className="size-3.5" strokeWidth="2.8" />
              </span>
              {m}
            </li>
          ))}
        </ul>
      );

    case "alinti":
      return (
        <Reveal>
          <blockquote
            className="relative rounded-3xl bg-gradient-to-br from-sari-200/70 to-sari-400/45
              px-6 py-7 md:px-9 md:py-9"
          >
            <span
              aria-hidden="true"
              className="absolute top-3 left-5 font-display text-6xl leading-none text-kahve-900/15"
            >
              &ldquo;
            </span>
            <p className="relative font-display text-xl leading-snug font-extrabold text-kahve-900 md:text-2xl">
              {blok.metin}
            </p>
            {blok.kaynak && (
              <footer className="relative mt-3 text-sm font-semibold text-kahve-700">
                — {blok.kaynak}
              </footer>
            )}
          </blockquote>
        </Reveal>
      );

    case "bilgi":
      return (
        <Reveal>
          <aside
            className="rounded-3xl border-l-4 border-nane bg-nane/8 px-5 py-5 md:px-7 md:py-6"
          >
            <p className="font-display text-base font-extrabold text-nane-koyu">{blok.baslik}</p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-kahve-700">{blok.metin}</p>
          </aside>
        </Reveal>
      );

    case "tablo":
      return (
        <Reveal>
          <div className="overflow-x-auto rounded-3xl border border-kahve-900/10">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-kahve-900 text-sari-200">
                  {blok.basliklar.map((b) => (
                    <th key={b} className="px-4 py-3.5 font-display text-xs font-extrabold tracking-wide uppercase">
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-kahve-900/8 bg-white">
                {blok.satirlar.map((satir, i) => (
                  <tr key={i} className="transition-colors duration-300 hover:bg-sari-500/6">
                    {satir.map((hucre, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3.5 align-top leading-relaxed ${
                          j === 0 ? "font-bold text-kahve-900" : "text-kahve-600"
                        }`}
                      >
                        {hucre}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      );

    case "gorsel":
      return (
        <Reveal>
          <figure className="my-2">
            <AkilliGorsel
              anahtar={blok.anahtar}
              oran="16/9"
              sizes="(min-width: 1024px) 46rem, 92vw"
              className="rounded-3xl shadow-kart ring-1 ring-kahve-900/8"
            />
            {blok.altyazi && (
              <figcaption className="mt-3 text-center text-sm leading-relaxed text-kahve-500">
                {blok.altyazi}
              </figcaption>
            )}
          </figure>
        </Reveal>
      );

    case "sayilar":
      return (
        <Reveal>
          <dl className="grid gap-4 rounded-3xl bg-kahve-900 px-6 py-7 sm:grid-cols-3 md:px-8">
            {blok.ogeler.map((o) => (
              <div key={o.etiket} className="text-center">
                <dt className="sr-only">{o.etiket}</dt>
                <dd>
                  <span className="block font-display text-3xl font-extrabold text-sari-400 md:text-4xl">
                    {o.deger}
                  </span>
                  <span className="mt-1.5 block text-xs leading-snug font-medium text-kahve-200/80">
                    {o.etiket}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      );

    case "adimlar":
      return (
        <Reveal>
          <ol className="grid gap-4 sm:grid-cols-2">
            {blok.ogeler.map((o, i) => (
              <li
                key={o.baslik}
                className="rounded-3xl border border-kahve-900/8 bg-white p-5 kart-kalk"
              >
                <span className="grid size-9 place-items-center rounded-2xl bg-sari-500 font-display text-sm font-extrabold text-kahve-900">
                  {i + 1}
                </span>
                <p className="mt-3.5 font-display text-base font-extrabold text-kahve-900">
                  {o.baslik}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-kahve-600">{o.metin}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      );
  }
}
