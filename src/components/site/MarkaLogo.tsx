import { cn } from "@/lib/utils";

/**
 * Başlıkta ve dar alanlarda kullanılan marka kilidi — yalnızca kelime markası.
 * Soru işareti sarı kalıyor; yanında ikon yok.
 */
export function MarkaLogo({
  className,
  boyut = "md",
}: {
  className?: string;
  boyut?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "font-display leading-none font-extrabold tracking-tight whitespace-nowrap text-kahve-900",
        boyut === "sm" ? "text-lg" : "text-[1.375rem]",
        className,
      )}
    >
      Ne Yersin
      <span className="text-sari-600">?</span>
    </span>
  );
}
