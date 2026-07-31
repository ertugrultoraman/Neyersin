"use client";

import { useActionState } from "react";

import { girisAction, type FormDurumu } from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";

const BASLANGIC: FormDurumu = {};

export function GirisFormu() {
  const [durum, gonder, bekliyor] = useActionState(girisAction, BASLANGIC);

  return (
    <form action={gonder} className="mt-6 space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

      <Alan etiket="E-posta">
        <Girdi type="email" name="eposta" required autoComplete="username" />
      </Alan>

      <Alan etiket="Parola">
        <Girdi type="password" name="parola" required autoComplete="current-password" />
      </Alan>

      <Buton
        type="submit"
        boyut="lg"
        className="w-full"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? "Giriş yapılıyor…" : "Giriş yap"}
      </Buton>
    </form>
  );
}
