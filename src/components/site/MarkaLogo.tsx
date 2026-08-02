import { cn } from "@/lib/utils";

/**
 * Başlıkta ve dar alanlarda kullanılan marka kilidi — yalnızca kelime markası.
 * Yanında ikon yok.
 *
 * `sariZemin`: logo artık sarı şeridin üstünde duruyor. Soru işareti eskiden
 * sarıydı ve sarı zeminde tamamen kayboluyordu; sarı zeminde her şey siyah
 * yazılıyor, beyaz zeminde (alt bilgi, açılır menü) eski görünüm korunuyor.
 */
export function MarkaLogo({
  className,
  boyut = "md",
  sariZemin = false,
}: {
  className?: string;
  boyut?: "sm" | "md";
  sariZemin?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-display leading-none font-extrabold tracking-tight whitespace-nowrap",
        sariZemin ? "text-murekkep" : "text-kahve-900",
        boyut === "sm" ? "text-lg" : "text-[1.375rem]",
        className,
      )}
    >
      Ne Yersin
      <span className={sariZemin ? "text-murekkep" : "text-sari-600"}>?</span>
    </span>
  );
}
