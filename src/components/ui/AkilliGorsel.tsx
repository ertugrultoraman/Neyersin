import Image from "next/image";

import { gorselCoz, type Oran } from "@/lib/images";
import { cn } from "@/lib/utils";
import { MarkaPlaceholder } from "./MarkaPlaceholder";

/**
 * Tek görsel bileşeni: manifestte Blob URL'i varsa `next/image` ile CDN'den
 * servis eder, yoksa marka placeholder'ına düşer. Çağrı yerleri hangi durumda
 * olduğunu bilmek zorunda değil.
 */
export function AkilliGorsel({
  anahtar,
  oran,
  alt,
  sizes = "100vw",
  priority = false,
  className,
  gorselClassName,
}: {
  anahtar: string;
  oran?: Oran;
  alt?: string;
  /** next/image için responsive `sizes` — layout'a göre mutlaka geçilmeli. */
  sizes?: string;
  priority?: boolean;
  className?: string;
  gorselClassName?: string;
}) {
  const gorsel = gorselCoz(anahtar, { alt, oran });

  return (
    <span
      className={cn("relative block overflow-hidden", className)}
      style={{ aspectRatio: gorsel.oran.replace("/", " / ") }}
    >
      {gorsel.tur === "uzak" ? (
        <Image
          src={gorsel.src}
          alt={gorsel.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", gorselClassName)}
        />
      ) : (
        <MarkaPlaceholder
          anahtar={anahtar}
          oran={gorsel.oran}
          className={cn("absolute inset-0 h-full w-full", gorselClassName)}
        />
      )}
    </span>
  );
}
