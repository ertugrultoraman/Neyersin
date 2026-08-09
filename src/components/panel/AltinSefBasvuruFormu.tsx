"use client";

import { useActionState } from "react";

import { altinSefBasvuruAction, type AltinSefDurumu } from "@/app/altin-sef-actions";
import { Alan, MetinAlani, Uyari } from "@/components/hesap/Alan";
import { BelgeYukle } from "@/components/hesap/BelgeYukle";
import { Buton, OkIkon } from "@/components/ui/Buton";
import { useDil } from "@/components/saglayici/DilBaglami";

const BASLANGIC: AltinSefDurumu = {};

/**
 * Altın Şef unvanı için talep formu.
 *
 * Unvanı buradan KİMSE kendine veremiyor; talep yöneticiye düşüyor. Belgeler
 * formun kendi `FormData`sıyla gidiyor (bkz. BelgeYukle).
 */
export function AltinSefBasvuruFormu() {
  const { c } = useDil();
  const [durum, gonder, bekliyor] = useActionState(altinSefBasvuruAction, BASLANGIC);

  if (durum.basari) {
    return <Uyari tur="basari">{c(durum.basari)}</Uyari>;
  }

  return (
    <form action={gonder} className="space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

      <Alan etiket={c("altinSef.anlat")} ipucu={c("altinSef.anlatIpucu")}>
        <MetinAlani name="mesaj" required minLength={40} maxLength={1500} />
      </Alan>

      <BelgeYukle ipucu={c("belge.ipucuAltinSef")} />

      <Buton
        type="submit"
        boyut="lg"
        className="w-full"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? c("form.gonderiliyor") : c("altinSef.gonder")}
      </Buton>

      <p className="text-xs leading-relaxed text-kahve-500">{c("altinSef.dipnot")}</p>
    </form>
  );
}
