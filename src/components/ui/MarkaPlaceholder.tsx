import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * AI görseli henüz üretilmemiş anahtarlar için ana marka logosunu gösterir.
 *
 * Logonun kendi zemini #FDC806 — paletteki `sari-500` ile birebir aynı. Bu yüzden
 * `object-contain` + sarı zemin, oranı ne olursa olsun dikişsiz tek bir yüzey gibi
 * görünür; wordmark hiçbir oranda kırpılmaz.
 */
export function MarkaPlaceholder({
  className,
  priority = false,
  sizes = "100vw",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <span className={cn("block overflow-hidden bg-sari-500", className)}>
      <Image
        src="/brand/ne-yersin-logo.jpeg"
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain"
      />
    </span>
  );
}
