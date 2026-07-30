import type { SiparisDurumu } from "@/lib/siparis";
import { cn } from "@/lib/utils";

const TANIMLAR: Record<SiparisDurumu, { etiket: string; sinif: string }> = {
  "odeme-bekliyor": {
    etiket: "Ödeme bekliyor",
    sinif: "bg-sari-500/18 text-kahve-800 ring-1 ring-sari-600/30",
  },
  odendi: {
    etiket: "Ödendi",
    sinif: "bg-nane/14 text-nane-koyu ring-1 ring-nane/30",
  },
  "odeme-basarisiz": {
    etiket: "Ödeme başarısız",
    sinif: "bg-domates/12 text-domates-koyu ring-1 ring-domates/30",
  },
};

export function DurumRozeti({
  durum,
  className,
}: {
  durum: SiparisDurumu;
  className?: string;
}) {
  const tanim = TANIMLAR[durum];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-bold tracking-wide uppercase",
        tanim.sinif,
        className,
      )}
    >
      {tanim.etiket}
    </span>
  );
}

export const durumEtiketi = (durum: SiparisDurumu) => TANIMLAR[durum].etiket;
