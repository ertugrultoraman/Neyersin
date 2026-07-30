import type { Restoran } from "@/content/restoranlar";
import { cn, tohum } from "@/lib/utils";
import { ScooterIkon } from "../ui/Ikonlar";

/**
 * Restoran fotoğrafı yerine isimden türeyen kararlı marka kapağı.
 * Kart ve detay sayfası aynı kompozisyonu paylaşır — geçiş tutarlı görünür.
 */
const ZEMINLER = [
  "from-sari-300 via-sari-400 to-sari-600",
  "from-kahve-400 via-kahve-600 to-kahve-800",
  "from-domates via-domates to-domates-koyu",
  "from-nane via-nane to-nane-koyu",
  "from-sari-500 via-sari-600 to-kahve-600",
  "from-kahve-600 via-kahve-700 to-kahve-900",
];

export function RestoranKapak({
  restoran,
  className,
  buyuk = false,
}: {
  restoran: Restoran;
  className?: string;
  buyuk?: boolean;
}) {
  const t = tohum(restoran.slug);
  const zemin = ZEMINLER[t % ZEMINLER.length];
  const donme = (t % 16) - 8;

  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden bg-gradient-to-br", zemin, className)}
    >
      <span
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.55) 1px, transparent 0)",
          backgroundSize: buyuk ? "26px 26px" : "18px 18px",
        }}
      />
      <span
        className={cn(
          "absolute font-display leading-none font-extrabold text-white/22",
          "transition-transform duration-700 ease-[var(--ease-yumusak)] group-hover:scale-105",
          buyuk ? "-right-6 -bottom-16 text-[16rem]" : "-right-3 -bottom-9 text-[7.5rem]",
        )}
        style={{ transform: `rotate(${donme / 3}deg)` }}
      >
        {restoran.ad.charAt(0)}
      </span>
      <ScooterIkon
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-white/25",
          "transition-transform duration-700 ease-[var(--ease-yumusak)] group-hover:-translate-x-1 group-hover:scale-105",
          buyuk ? "left-10 size-32" : "left-5 size-16",
        )}
      />
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/30 to-transparent",
          buyuk ? "h-28" : "h-16",
        )}
      />
    </div>
  );
}
