"use client";

import { useActionState } from "react";

import { siparisHazirAction, type TeslimatDurumu } from "@/app/panel/teslimat-actions";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: TeslimatDurumu = {};

/**
 * Mutfağın "hazır" düğmesi — kurye ancak bundan sonra teslim alabiliyor.
 *
 * Akışın eksik halkasıydı: kurye mutfağa gidince yemek hazır mı bilmiyordu.
 * Şef bitirince buraya basıyor, sipariş kuryenin ekranında "Teslim aldım"
 * düğmesiyle beliriyor.
 */
export function HazirDugmesi({ siparisNo }: { siparisNo: string }) {
  const { c } = useDil();
  const [durum, hazirla, bekliyor] = useActionState(siparisHazirAction, BASLANGIC);

  if (durum.basari) {
    return <span className="text-xs font-bold text-nane-koyu">{c("panel.kuryeBekliyor")}</span>;
  }

  return (
    <form action={hazirla} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="siparisNo" value={siparisNo} />
      <button
        type="submit"
        disabled={bekliyor}
        className="tiklanabilir rounded-2xl bg-sari-500 px-4 py-2.5 text-sm font-bold
          text-kahve-900 shadow-sari transition-colors hover:bg-sari-400 disabled:opacity-50"
      >
        {bekliyor ? "…" : c("panel.hazirKuryeAlabilir")}
      </button>
      {durum.hata && (
        <span role="alert" className="text-xs font-semibold text-domates-koyu">
          {durum.hata}
        </span>
      )}
    </form>
  );
}
