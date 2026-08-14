"use client";

import { useActionState } from "react";

import { parolaDegistirAction, type FormDurumu } from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: FormDurumu = {};

/**
 * Profilde parola değiştirme — müşteri, şef ve kurye için aynı bileşen.
 *
 * Hangi hesabın parolasının değiştiğini FORM BELİRLEMEZ, sunucu oturumdan
 * okur. Mevcut parola sorulur: oturumu açık bırakılmış bir cihaza oturan biri
 * parolayı değiştirip hesabı ele geçiremesin.
 *
 * PAROLASIZ HESAPTA (Google ile açılmış) mevcut parola alanı hiç çizilmiyor —
 * sorulacak bir parola yok ve boş bir alan zorunlu tutulduğu için o kişiler
 * parola belirleyemiyordu. Bu bir görünüm kararı; kararın kendisi sunucuda
 * tekrar veriliyor (bkz. hesap/actions → parolaDegistirAction).
 */
export function ParolaDegistirFormu({ parolasiz = false }: { parolasiz?: boolean }) {
  const { c } = useDil();
  const [durum, gonder, bekliyor] = useActionState(parolaDegistirAction, BASLANGIC);

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-kahve-900">
        {parolasiz ? c("parola.belirle") : c("parola.degistir")}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-kahve-600">
        {parolasiz ? c("parola.belirleAciklama") : c("parola.istediginZaman")}
      </p>

      <form action={gonder} className="mt-5 max-w-md space-y-4">
        {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}
        {durum.basari && <Uyari tur="basari">{durum.basari}</Uyari>}

        {!parolasiz && (
          <Alan etiket={c("parola.mevcut")}>
            <Girdi
              type="password"
              name="mevcutParola"
              required
              autoComplete="current-password"
            />
          </Alan>
        )}

        <Alan etiket={parolasiz ? c("parola.yeni") : c("hesap.yeniParola")} ipucu={c("hesap.enAz8")}>
          <Girdi
            type="password"
            name="yeniParola"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Alan>

        <Alan etiket={parolasiz ? c("parola.yeniTekrar") : c("hesap.yeniParolaTekrar")}>
          <Girdi
            type="password"
            name="yeniParolaTekrar"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Alan>

        <Buton type="submit" disabled={bekliyor} ikon={bekliyor ? undefined : <OkIkon />}>
          {bekliyor
            ? c("form.degistiriliyor")
            : parolasiz
              ? c("parola.belirle")
              : c("parola.degistir")}
        </Buton>
      </form>
    </div>
  );
}
