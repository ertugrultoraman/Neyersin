import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { UstBaslik } from "./Rozet";

export function Bolum({
  children,
  id,
  className,
  kapClassName,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  kapClassName?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-28 py-16 md:py-24", className)}>
      <div className={cn("kap", kapClassName)}>{children}</div>
    </section>
  );
}

export function BolumBasligi({
  ustBaslik,
  baslik,
  aciklama,
  ortala = false,
  className,
  yan,
}: {
  ustBaslik?: string;
  baslik: ReactNode;
  aciklama?: ReactNode;
  ortala?: boolean;
  className?: string;
  /** Başlığın sağında duran ek içerik (buton, bağlantı vb.). */
  yan?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        ortala && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", ortala && "mx-auto text-center")}>
        {ustBaslik && <UstBaslik className="mb-4">{ustBaslik}</UstBaslik>}
        <h2 className="text-3xl leading-[1.06] font-extrabold sm:text-4xl md:text-[2.75rem]">
          {baslik}
        </h2>
        {aciklama && (
          <p className="mt-4 text-base leading-relaxed text-kahve-600 md:text-lg">{aciklama}</p>
        )}
      </div>
      {yan && <div className="shrink-0">{yan}</div>}
    </Reveal>
  );
}
