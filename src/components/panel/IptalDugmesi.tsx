"use client";

import { useActionState, useState } from "react";

import { siparisIptalAction, type IptalDurumu } from "@/app/hesabim/actions";
import { Uyari } from "../hesap/Alan";

const BASLANGIC: IptalDurumu = {};

/** Müşterinin kendi siparişini iptal etmesi — iki adımlı onay ister. */
export function IptalDugmesi({ siparisNo }: { siparisNo: string }) {
  const [durum, iptal, bekliyor] = useActionState(siparisIptalAction, BASLANGIC);
  const [onay, setOnay] = useState(false);

  if (durum.basari) return <Uyari tur="basari">{durum.basari}</Uyari>;

  return (
    <div className="space-y-2">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

      {onay ? (
        <form action={iptal} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="siparisNo" value={siparisNo} />
          <p className="w-full text-xs font-semibold text-domates-koyu">
            Siparişi iptal etmek istediğine emin misin?
          </p>
          <button
            type="submit"
            disabled={bekliyor}
            className="tiklanabilir rounded-2xl bg-domates px-4 py-2.5 text-sm font-bold text-white
              transition-colors hover:bg-domates-koyu disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bekliyor ? "İptal ediliyor…" : "Evet, iptal et"}
          </button>
          <button
            type="button"
            onClick={() => setOnay(false)}
            className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
              font-bold text-kahve-700"
          >
            Vazgeç
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOnay(true)}
          className="tiklanabilir rounded-2xl border border-domates/40 px-4 py-2.5 text-sm
            font-bold text-domates-koyu transition-colors hover:bg-domates/10"
        >
          Siparişi iptal et
        </button>
      )}
    </div>
  );
}
