import { cn } from "@/lib/utils";
import { ScooterIkon } from "../ui/Ikonlar";

/**
 * Başlıkta ve dar alanlarda kullanılan marka kilidi.
 * Logonun raster hâli (sarı zeminli) koyu yüzeylerde kullanılıyor — bkz. Footer.
 */
export function MarkaLogo({
  className,
  boyut = "md",
}: {
  className?: string;
  boyut?: "sm" | "md";
}) {
  return (
    <span className={cn("group/logo inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-2xl bg-sari-500 text-kahve-900",
          "shadow-sari transition-transform duration-500 ease-[var(--ease-yayli)]",
          "group-hover/logo:-rotate-6 group-hover/logo:scale-105",
          boyut === "sm" ? "size-8" : "size-10",
        )}
      >
        <ScooterIkon className={boyut === "sm" ? "size-[18px]" : "size-[22px]"} />
      </span>
      <span
        className={cn(
          "font-display leading-none font-extrabold tracking-tight text-kahve-900",
          boyut === "sm" ? "text-lg" : "text-[1.375rem]",
        )}
      >
        Ne Yersin
        <span className="text-sari-600">?</span>
      </span>
    </span>
  );
}
