"use client";

import { useActionState } from "react";

import { parolaDegistirAction, type FormDurumu } from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";

const BASLANGIC: FormDurumu = {};

/**
 * Profilde parola değiştirme — müşteri, şef ve kurye için aynı bileşen.
 *
 * Hangi hesabın parolasının değiştiğini FORM BELİRLEMEZ, sunucu oturumdan
 * okur. Mevcut parola sorulur: oturumu açık bırakılmış bir cihaza oturan biri
 * parolayı değiştirip hesabı ele geçiremesin.
 */
export function ParolaDegistirFormu() {
  const [durum, gonder, bekliyor] = useActionState(parolaDegistirAction, BASLANGIC);

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-kahve-900">Parolamı değiştir</h2>
      <p className="mt-1 text-sm text-kahve-600">
        Parolanı istediğin zaman buradan değiştirebilirsin.
      </p>

      <form action={gonder} className="mt-5 max-w-md space-y-4">
        {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}
        {durum.basari && <Uyari tur="basari">{durum.basari}</Uyari>}

        <Alan etiket="Mevcut parolan">
          <Girdi
            type="password"
            name="mevcutParola"
            required
            autoComplete="current-password"
          />
        </Alan>

        <Alan etiket="Yeni parola" ipucu="En az 8 karakter.">
          <Girdi
            type="password"
            name="yeniParola"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Alan>

        <Alan etiket="Yeni parola (tekrar)">
          <Girdi
            type="password"
            name="yeniParolaTekrar"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Alan>

        <Buton type="submit" disabled={bekliyor} ikon={bekliyor ? undefined : <OkIkon />}>
          {bekliyor ? "Değiştiriliyor…" : "Parolamı değiştir"}
        </Buton>
      </form>
    </div>
  );
}
