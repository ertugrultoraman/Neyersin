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
          E-posta veya kullanıcı adı
        </span>
        {/*
          type="text" olmalı: yönetici e-posta yerine kısa kullanıcı adıyla da
          girebiliyor (bkz. lib/oturum.ts → adminKullaniciAdi). type="email" iken
          tarayıcı "admin" girdisini geçersiz sayıp formu hiç göndermiyordu.
        */}
        <input
          type="text"
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

      {/*
        DOĞRULAMA KODU ALANI HER ZAMAN GÖRÜNÜYOR ama zorunlu değil.
        `ADMIN_TOTP_SECRET` tanımlı değilse sunucu kodu hiç sormuyor
        (bkz. lib/ikinci-faktor.ts). Alanı yalnızca açıkken göstermek, ikinci
        faktörün kurulu olup olmadığını giriş ekranından okunabilir hâle
        getirirdi — parolayı deneyen birine "burada ikinci kapı yok" demek.
      */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
          Doğrulama kodu
          <span className="ml-1.5 font-semibold text-kahve-400 normal-case">
            (kuruluysa)
          </span>
        </span>
        <input
          type="text"
          name="kod"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="w-full rounded-2xl border border-kahve-900/12 bg-white px-4 py-3
            text-[0.9375rem] font-medium tracking-[0.3em] text-kahve-900
            transition-[border-color] duration-300 focus:border-sari-500/60
            focus:ring-2 focus:ring-sari-500/40 focus:outline-none"
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
