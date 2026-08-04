"use client";

import { useActionState } from "react";

import { oturumEpostaDogrulaAction, type KodDurumu } from "@/app/hesap/actions";
import { Buton } from "../ui/Buton";
import { Alan, Uyari } from "./Alan";
import { KodGirdisi, KoduTekrarGonder } from "./KodAlani";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: KodDurumu = {};

/**
 * Kayıt sırasında doğrulamayı yarıda bırakanlar için profildeki hatırlatma.
 *
 * Doğrulanmamış hesap giriş YAPABİLİYOR — kişiyi kapıda bırakmıyoruz — ama
 * profilinde bu kart duruyor ve doğrulama tek ekranda tamamlanıyor.
 */
export function EpostaDogrulaKarti({ eposta }: { eposta: string }) {
  const { c } = useDil();
  const [durum, dogrula, bekliyor] = useActionState(oturumEpostaDogrulaAction, BASLANGIC);

  if (durum.basari) {
    return <Uyari tur="basari">{durum.basari}</Uyari>;
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-kahve-900">
        E-posta adresini doğrula
      </h2>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-kahve-700">
        <strong>{eposta}</strong> adresi henüz doğrulanmadı. Doğrulamadan da sipariş
        verebilirsin; ama parolanı unutursan sıfırlama postası bu adrese gideceği için
        doğrulaman iyi olur.
      </p>

      <form action={dogrula} className="mt-5 max-w-xs space-y-4">
        {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

        <Alan etiket="E-postana gelen kod">
          <KodGirdisi hazir={false} />
        </Alan>

        <Buton type="submit" disabled={bekliyor}>
          {bekliyor ? c("form.dogrulaniyor") : c("form.dogrula")}
        </Buton>
      </form>

      <div className="max-w-xs">
        <KoduTekrarGonder eposta={eposta} amac="kayit" />
      </div>
    </div>
  );
}
