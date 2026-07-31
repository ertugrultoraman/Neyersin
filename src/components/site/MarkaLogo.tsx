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
    <span className={cn("group/logo inline-flex items-center gap-1", className)}>
      <span
        className={cn(
          "font-display leading-none font-extrabold tracking-tight text-kahve-900",
          boyut === "sm" ? "text-lg" : "text-[1.375rem]",
        )}
      >
        Ne Yersin
        <span className="text-sari-600">?</span>
      </span>
      <ScooterIkon
        className={cn(
          "shrink-0 text-sari-600 transition-transform duration-500 ease-[var(--ease-yayli)]",
          "group-hover/logo:-rotate-6 group-hover/logo:scale-110",
          boyut === "sm" ? "size-[18px]" : "size-[22px]",
        )}
      />
    </span>
  );
}
