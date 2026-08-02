"use client";

import { useActionState } from "react";

import {
  parolaSifirlaAction,
  sifreKoduIsteAction,
  type KodDurumu,
} from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";
import { KodGirdisi, KoduTekrarGonder, PostaGitmediUyarisi } from "./KodAlani";

const BASLANGIC: KodDurumu = {};

/**
 * "Parolamı unuttum" — iki adım.
 *
 *  1. E-posta yazılır; adrese kod gider.
 *  2. Kod + yeni parola girilir; doğruysa parola değişir ve oturum açılır.
 *
 * Birinci adım, adresin kayıtlı olup olmadığını SÖYLEMEZ. Söyleseydi bu form,
 * hangi e-postaların sitede kayıtlı olduğunu tarayarak öğrenmek için
 * kullanılabilirdi.
 */
export function SifremiUnuttumFormu() {
  const [durum, kodIste, bekliyor] = useActionState(sifreKoduIsteAction, BASLANGIC);

  if (durum.adim === "kod" && durum.eposta) {
    return <YeniParolaAdimi durum={durum} />;
  }

  return (
    <form action={kodIste} className="mt-6 space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

      <Alan etiket="E-posta" ipucu="Hesabını açarken kullandığın adres.">
        <Girdi type="email" name="eposta" required autoComplete="email" autoFocus />
      </Alan>

      <Buton
        type="submit"
        boyut="lg"
        className="w-full"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? "Gönderiliyor…" : "Kod gönder"}
      </Buton>
    </form>
  );
}

function YeniParolaAdimi({ durum }: { durum: KodDurumu }) {
  const [sonDurum, sifirla, bekliyor] = useActionState(parolaSifirlaAction, durum);
  const eposta = sonDurum.eposta ?? durum.eposta ?? "";

  return (
    <div className="mt-6">
      {sonDurum.basari && !sonDurum.hata && <Uyari tur="basari">{sonDurum.basari}</Uyari>}

      <form action={sifirla} className="mt-4 space-y-4">
        {sonDurum.hata && <Uyari tur="hata">{sonDurum.hata}</Uyari>}
        {sonDurum.postaGitmedi && <PostaGitmediUyarisi />}

        <input type="hidden" name="eposta" value={eposta} />

        <Alan etiket="Doğrulama kodu" ipucu={`${eposta} adresine gönderildi.`}>
          <KodGirdisi />
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

        <Buton
          type="submit"
          boyut="lg"
          className="w-full"
          disabled={bekliyor}
          ikon={bekliyor ? undefined : <OkIkon />}
        >
          {bekliyor ? "Değiştiriliyor…" : "Parolamı değiştir"}
        </Buton>
      </form>

      <KoduTekrarGonder eposta={eposta} amac="sifre" />
    </div>
  );
}
