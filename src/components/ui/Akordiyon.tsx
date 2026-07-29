import { cn } from "@/lib/utils";

/**
 * Native `<details>` üzerine kurulu akordiyon — JavaScript gerekmez, klavye ve
 * ekran okuyucu desteği tarayıcıdan gelir. Ok ikonu CSS ile döner.
 */
export function Akordiyon({
  ogeler,
  className,
}: {
  ogeler: { soru: string; cevap: string }[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-kahve-900/10 overflow-hidden rounded-3xl border border-kahve-900/8 bg-white", className)}>
      {ogeler.map((o) => (
        <details key={o.soru} className="group/ak">
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-4 px-5
              py-5 text-left transition-colors duration-300 hover:bg-sari-500/6
              md:px-6 [&::-webkit-details-marker]:hidden"
          >
            <h3 className="font-display text-base leading-snug font-extrabold text-kahve-900 md:text-lg">
              {o.soru}
            </h3>
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-sari-500/14
                text-sari-700 transition-transform duration-400 ease-[var(--ease-yumusak)]
                group-open/ak:rotate-45 group-open/ak:bg-sari-500 group-open/ak:text-kahve-900"
            >
              <svg viewBox="0 0 20 20" fill="none" className="size-4">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="px-5 pb-5 md:px-6">
            <p className="max-w-3xl text-sm leading-relaxed text-kahve-600 md:text-[0.9375rem]">
              {o.cevap}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
