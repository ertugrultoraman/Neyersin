"use client";

import Link from "next/link";
import { useActionState } from "react";

import { girisAction, type FormDurumu } from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";

const BASLANGIC: FormDurumu = {};

export function GirisFormu({ donus }: { donus?: string }) {
  const [durum, gonder, bekliyor] = useActionState(girisAction, BASLANGIC);

  return (
    <form action={gonder} className="mt-6 space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}
      {donus && <input type="hidden" name="donus" value={donus} />}

      <Alan etiket="E-posta veya kullanıcı adı">
        <Girdi type="text" name="kimlik" required autoComplete="username" />
      </Alan>

      <Alan etiket="Parola">
        <Girdi type="password" name="parola" required autoComplete="current-password" />
      </Alan>

      <p className="text-right">
        <Link
          href="/hesap/sifremi-unuttum"
          className="tiklanabilir text-sm font-bold text-sari-700 underline underline-offset-4
            transition-colors duration-300 hover:text-kahve-900"
        >
          Parolamı unuttum
        </Link>
      </p>

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
