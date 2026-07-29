import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type RozetTonu = "sari" | "kahve" | "nane" | "domates" | "acik";

const TONLAR: Record<RozetTonu, string> = {
  sari: "bg-sari-500 text-kahve-900",
  kahve: "bg-kahve-900 text-sari-300",
  nane: "bg-nane/12 text-nane-koyu ring-1 ring-nane/25",
  domates: "bg-domates/12 text-domates-koyu ring-1 ring-domates/25",
  acik: "bg-kahve-900/6 text-kahve-700 ring-1 ring-kahve-900/10",
};

export function Rozet({
  children,
  ton = "acik",
  className,
}: {
  children: ReactNode;
  ton?: RozetTonu;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-bold tracking-wide uppercase",
        TONLAR[ton],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Bölüm başlıklarının üstündeki küçük etiket. */
export function UstBaslik({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.18em] text-sari-700 uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-sari-600/60" />
      {children}
    </span>
  );
}
