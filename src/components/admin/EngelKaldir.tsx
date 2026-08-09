"use client";

import { useActionState } from "react";

import { engelKaldirAction, type YonetimDurumu } from "@/app/admin/yonetim-actions";

const BASLANGIC: YonetimDurumu = {};

/** Yanlışlıkla engellenen bir IP'yi listeden çıkarır. */
export function EngelKaldir({ ip }: { ip: string }) {
  const [durum, kaldir, bekliyor] = useActionState(engelKaldirAction, BASLANGIC);

  if (durum.basari) {
    return <span className="text-xs font-semibold text-nane-koyu">Kaldırıldı</span>;
  }

  return (
    <form action={kaldir}>
      <input type="hidden" name="ip" value={ip} />
      <button
        type="submit"
        disabled={bekliyor}
        className="tiklanabilir rounded-xl border border-kahve-900/12 px-3 py-1.5 text-xs
          font-bold text-kahve-700 transition-colors duration-300 hover:bg-kahve-900/5
          disabled:cursor-not-allowed disabled:opacity-50"
      >
        {bekliyor ? "…" : "Engeli kaldır"}
      </button>
      {durum.hata && <span className="ml-2 text-xs text-domates-koyu">{durum.hata}</span>}
    </form>
  );
}
