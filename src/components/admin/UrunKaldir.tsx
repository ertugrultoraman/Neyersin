"use client";

import { useActionState, useState } from "react";

import { urunKaldirAction, type UrunDurumu } from "@/app/panel/urun-actions";

const BASLANGIC: UrunDurumu = {};

/**
 * Yönetici tablosundan ürünü menüden kaldırma.
 *
 * İki kaynak var ve davranış farklı:
 *  - ŞEFİN GİRDİĞİ ürün gerçekten silinir.
 *  - SİTE İÇERİĞİNDEKİ ürün koddan geliyor, silinemez; onun yerine aynı
 *    kimlikle "yayında değil" kaydı yazılıp menüden gizleniyor. Kod dosyasına
 *    dokunmadan geri açılabiliyor.
 *
 * Fark kullanıcıya da söyleniyor; "sildim" deyip geri gelen ürün kafa
 * karıştırırdı.
 */
export function UrunKaldir({
  urunId,
  mutfakSlug,
  ad,
  sefGirdisi,
}: {
  urunId: string;
  mutfakSlug: string;
  ad: string;
  sefGirdisi: boolean;
}) {
  const [durum, kaldir, bekliyor] = useActionState(urunKaldirAction, BASLANGIC);
  const [onay, setOnay] = useState(false);

  if (durum.basari) {
    return <span className="text-xs font-bold text-nane-koyu">Kaldırıldı</span>;
  }

  if (!onay) {
    return (
      <button
        type="button"
        onClick={() => setOnay(true)}
        className="text-xs font-bold text-domates-koyu underline underline-offset-4
          transition-colors duration-300 hover:text-domates"
      >
        Kaldır
      </button>
    );
  }

  return (
    <form action={kaldir} className="flex flex-col gap-1.5">
      <input type="hidden" name="id" value={urunId} />
      <input type="hidden" name="restoranSlug" value={mutfakSlug} />
      <span className="text-2xs leading-snug font-semibold text-domates-koyu">
        {sefGirdisi ? `"${ad}" silinecek.` : `"${ad}" menüden gizlenecek.`}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={bekliyor}
          className="rounded-lg bg-domates px-2.5 py-1 text-2xs font-bold text-white
            disabled:opacity-50"
        >
          {bekliyor ? "…" : "Evet"}
        </button>
        <button
          type="button"
          onClick={() => setOnay(false)}
          className="text-2xs font-bold text-kahve-600 underline"
        >
          Vazgeç
        </button>
      </div>
      {durum.hata && (
        <span role="alert" className="text-2xs font-semibold text-domates-koyu">
          {durum.hata}
        </span>
      )}
    </form>
  );
}
