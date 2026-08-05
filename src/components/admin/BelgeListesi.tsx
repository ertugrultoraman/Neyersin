import { boyutYaz } from "@/lib/belge";
import type { Belge } from "@/lib/hesaplar";

/**
 * Bir başvuruya eklenen belgeler — yönetici görünümü.
 *
 * Dosyalar herkese açık bir adreste durmuyor; her satır oturum denetiminden
 * geçen `/admin/belge/[id]` yoluna gidiyor (bkz. o dosyadaki not).
 */
export function BelgeListesi({ belgeler }: { belgeler: Belge[] }) {
  if (belgeler.length === 0) {
    return (
      <p className="mt-3 rounded-2xl bg-domates/8 px-3.5 py-2.5 text-xs font-semibold text-domates-koyu">
        Belge eklenmemiş — evrak istemen gerekebilir.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
        Belgeler ({belgeler.length})
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {belgeler.map((b) => (
          <li key={b.id}>
            <a
              href={`/admin/belge/${b.id}`}
              target="_blank"
              rel="noreferrer"
              className="tiklanabilir flex items-center justify-between gap-3 rounded-xl
                border border-kahve-900/10 bg-white px-3 py-2 text-xs transition-colors
                duration-300 hover:border-sari-500/50 hover:bg-sari-500/6"
            >
              <span className="truncate font-semibold text-kahve-900">{b.ad}</span>
              <span className="shrink-0 font-medium text-kahve-500">
                {b.mime === "application/pdf" ? "PDF" : "Görsel"} · {boyutYaz(b.boyut)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
