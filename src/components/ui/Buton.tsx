import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tur = "birincil" | "ikincil" | "hayalet" | "sade";
type Boyut = "sm" | "md" | "lg";

const TEMEL =
  "group/btn relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden " +
  "rounded-full font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color] " +
  "duration-300 ease-[var(--ease-yumusak)] active:scale-[0.96] active:translate-y-px " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

const TURLER: Record<Tur, string> = {
  birincil:
    "bg-sari-500 text-kahve-900 shadow-sari hover:bg-sari-400 hover:-translate-y-0.5 " +
    "hover:shadow-[0_12px_32px_-8px_rgb(224_172_0/0.6)]",
  ikincil:
    "bg-kahve-900 text-sari-300 hover:bg-kahve-800 hover:-translate-y-0.5 " +
    "hover:shadow-[0_12px_32px_-10px_rgb(36_22_8/0.5)]",
  hayalet:
    "border-2 border-kahve-900/15 bg-white/70 text-kahve-900 backdrop-blur " +
    "hover:border-kahve-900/30 hover:bg-white hover:-translate-y-0.5",
  sade: "text-kahve-700 hover:text-kahve-900 hover:bg-kahve-900/5",
};

const BOYUTLAR: Record<Boyut, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
};

/** Buton yüzeyinde hover'da soldan sağa geçen ince parlama. */
function Parlama() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r
        from-transparent via-white/35 to-transparent transition-transform duration-700
        ease-[var(--ease-yumusak)] group-hover/btn:translate-x-full motion-reduce:hidden"
    />
  );
}

type OrtakProp = {
  children: ReactNode;
  tur?: Tur;
  boyut?: Boyut;
  className?: string;
  ikon?: ReactNode;
};

export function Buton({
  children,
  tur = "birincil",
  boyut = "md",
  className,
  ikon,
  ...kalan
}: OrtakProp & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button className={cn(TEMEL, TURLER[tur], BOYUTLAR[boyut], className)} {...kalan}>
      {tur !== "sade" && <Parlama />}
      <span className="relative flex items-center gap-2">
        {children}
        {ikon}
      </span>
    </button>
  );
}

export function ButonBaglanti({
  children,
  tur = "birincil",
  boyut = "md",
  className,
  ikon,
  href,
  ...kalan
}: OrtakProp & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn(TEMEL, TURLER[tur], BOYUTLAR[boyut], className)} {...kalan}>
      {tur !== "sade" && <Parlama />}
      <span className="relative flex items-center gap-2">
        {children}
        {ikon}
      </span>
    </Link>
  );
}

/** Butonların içinde kullanılan küçük sağ ok — hover'da ileri kayar. */
export function OkIkon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={cn(
        "size-4 shrink-0 transition-transform duration-300 ease-[var(--ease-yumusak)] group-hover/btn:translate-x-1",
        className,
      )}
    >
      <path
        d="M4 10h11m0 0-4.2-4.2M15 10l-4.2 4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
