"use client";

import { useActionState } from "react";

import { vardiyaSilAction, type YonetimDurumu } from "@/app/admin/yonetim-actions";

const BASLANGIC: YonetimDurumu = {};

/**
 * Yanlış açılmış bir vardiyayı kaldırır.
 *
 * YALNIZCA BAŞLAMAMIŞ dilimlerde görünüyor; sunucu da aynı kuralı ayrıca
 * uyguluyor (bkz. lib/kurye-vardiya → dilimSil). Başlamış vardiyayı silmek,
 * o an sahada olan kuryenin planını altından çekmek olurdu.
 *
 * REZERVASYONLU DİLİMDE UYARIYOR: yer ayırmış kurye, dilim kaybolduğunda
 * bunu yalnızca uygulamasında bir şeyin eksildiğini fark ederek anlar.
 */
export function VardiyaSil({ id, rezerveSayisi }: { id: string; rezerveSayisi: number }) {
  const [durum, sil, bekliyor] = useActionState(vardiyaSilAction, BASLANGIC);

  if (durum.basari) {
    return <span className="text-xs font-semibold text-nane-koyu">Kaldırıldı</span>;
  }

  return (
    <form
      action={sil}
      onSubmit={(olay) => {
        if (rezerveSayisi === 0) return;
        const onay = window.confirm(
          `Bu vardiyada ${rezerveSayisi} kurye yer ayırmış. Silersen rezervasyonları da düşer. Devam edilsin mi?`,
        );
        if (!onay) olay.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={bekliyor}
        className="tiklanabilir rounded-xl border border-kahve-900/12 px-3 py-1.5 text-xs
          font-bold text-kahve-700 transition-colors duration-300 hover:border-domates/60
          hover:bg-domates/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {bekliyor ? "…" : "Kaldır"}
      </button>
      {durum.hata && <span className="text-xs text-domates-koyu">{durum.hata}</span>}
    </form>
  );
}
