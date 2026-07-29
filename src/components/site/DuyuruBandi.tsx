import { duyurular } from "@/content/kampanyalar";
import { SimsekIkon } from "../ui/Ikonlar";

/**
 * Sayfanın en üstündeki kayan duyuru bandı.
 * Kesintisiz döngü için içerik iki kez basılır; ikinci kopya ekran okuyuculardan gizlenir.
 */
export function DuyuruBandi() {
  return (
    <div className="relative overflow-hidden bg-kahve-900 py-2.5 text-sari-200">
      <div className="flex w-max animate-kayar gap-10 whitespace-nowrap will-change-transform motion-reduce:animate-none">
        {[0, 1].map((kopya) => (
          <div
            key={kopya}
            className="flex shrink-0 items-center gap-10"
            aria-hidden={kopya === 1 ? "true" : undefined}
          >
            {duyurular.map((duyuru) => (
              <span
                key={duyuru}
                className="flex items-center gap-2 text-xs font-semibold tracking-wide"
              >
                <SimsekIkon className="size-3.5 shrink-0 text-sari-500" />
                {duyuru}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Kenarlarda yumuşak solma — metin ekran kenarında kesilmiş görünmesin */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-kahve-900 to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-kahve-900 to-transparent"
      />
    </div>
  );
}
