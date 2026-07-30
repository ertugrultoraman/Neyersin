"use client";

import { useActionState } from "react";

import { adminGiris, type GirisSonucu } from "@/app/admin/actions";
import { Buton, OkIkon } from "../ui/Buton";

const BASLANGIC: GirisSonucu = {};

export function GirisFormu() {
  const [durum, gonder, bekliyor] = useActionState(adminGiris, BASLANGIC);

  return (
    <form action={gonder} className="mt-6 space-y-4">
      {durum.hata && (
        <p
          role="alert"
          className="rounded-2xl bg-domates/10 px-4 py-3 text-sm font-semibold text-domates-koyu"
        >
          {durum.hata}
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
          E-posta
        </span>
        <input
          type="email"
          name="eposta"
          required
          autoComplete="username"
          className="w-full rounded-2xl border border-kahve-900/12 bg-white px-4 py-3
            text-[0.9375rem] font-medium text-kahve-900 transition-[border-color] duration-300
            focus:border-sari-500/60 focus:ring-2 focus:ring-sari-500/40 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
          Parola
        </span>
        <input
          type="password"
          name="parola"
          required
          autoComplete="current-password"
          className="w-full rounded-2xl border border-kahve-900/12 bg-white px-4 py-3
            text-[0.9375rem] font-medium text-kahve-900 transition-[border-color] duration-300
            focus:border-sari-500/60 focus:ring-2 focus:ring-sari-500/40 focus:outline-none"
        />
      </label>

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
