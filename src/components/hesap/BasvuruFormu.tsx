"use client";

import { useActionState, useState } from "react";

import { basvuruAction, type FormDurumu } from "@/app/hesap/actions";
import { cn } from "@/lib/utils";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, MetinAlani, Uyari } from "./Alan";

const BASLANGIC: FormDurumu = {};

export type BasvuruTuruSecenegi = { deger: string; etiket: string; aciklama: string };

/**
 * Şef / ev hanımı / kurye başvurusu.
 *
 * Buradan hesap AÇILMAZ — talep yöneticiye düşer. Böylece kimse kendini şef
 * ilan edip sisteme giremiyor.
 */
export function BasvuruFormu({ turler }: { turler: BasvuruTuruSecenegi[] }) {
  const [durum, gonder, bekliyor] = useActionState(basvuruAction, BASLANGIC);
  const [tur, setTur] = useState(turler[0]?.deger ?? "");

  if (durum.basari) {
    return (
      <div className="mt-6">
        <Uyari tur="basari">{durum.basari}</Uyari>
      </div>
    );
  }

  return (
    <form action={gonder} className="mt-6 space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

      <fieldset>
        <legend className="mb-2 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
          Ne olarak başvuruyorsun?
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {turler.map((t) => (
            <label
              key={t.deger}
              className={cn(
                "tiklanabilir block rounded-2xl border p-3.5 transition-colors duration-300",
                tur === t.deger
                  ? "border-sari-500 bg-sari-500/10"
                  : "border-kahve-900/12 hover:border-sari-500/50",
              )}
            >
              <input
                type="radio"
                name="tur"
                value={t.deger}
                checked={tur === t.deger}
                onChange={() => setTur(t.deger)}
                className="sr-only"
              />
              <span className="block text-sm font-extrabold text-kahve-900">{t.etiket}</span>
              <span className="mt-1 block text-xs leading-relaxed text-kahve-600">
                {t.aciklama}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Alan etiket="Ad ve soyad">
        <Girdi type="text" name="ad" required autoComplete="name" minLength={3} />
      </Alan>

      <Alan etiket="Telefon" ipucu="Seninle bu numaradan iletişime geçeceğiz.">
        <Girdi
          type="tel"
          name="telefon"
          required
          autoComplete="tel"
          placeholder="5XXXXXXXXX"
          inputMode="numeric"
        />
      </Alan>

      <Alan etiket="E-posta" ipucu="Onaylanırsa hesabını bu adresle açacaksın.">
        <Girdi type="email" name="eposta" required autoComplete="email" />
      </Alan>

      <Alan etiket="Kendinden bahset" ipucu="İsteğe bağlı. Deneyimin, neler yaptığın…">
        <MetinAlani name="mesaj" maxLength={1000} />
      </Alan>

      <Buton
        type="submit"
        boyut="lg"
        className="w-full"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? "Gönderiliyor…" : "Başvuruyu gönder"}
      </Buton>

      <p className="text-xs leading-relaxed text-kahve-500">
        Başvurun yöneticiye iletilir. Onaylandığında bu e-posta ile kayıt sayfasından parolanı
        belirleyip hesabını açabilirsin.
      </p>
    </form>
  );
}
