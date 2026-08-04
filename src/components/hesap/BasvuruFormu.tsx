"use client";

import { useActionState, useState } from "react";

import { basvuruAction, type FormDurumu } from "@/app/hesap/actions";
import { cn } from "@/lib/utils";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, MetinAlani, Uyari } from "./Alan";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: FormDurumu = {};

export type BasvuruTuruSecenegi = { deger: string; etiket: string; aciklama: string };

/**
 * Şef / ev hanımı / kurye başvurusu.
 *
 * Buradan hesap AÇILMAZ — talep yöneticiye düşer. Böylece kimse kendini şef
 * ilan edip sisteme giremiyor.
 */
export function BasvuruFormu({ turler }: { turler: BasvuruTuruSecenegi[] }) {
  const { c } = useDil();
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

      <Alan etiket={c("hesap.telefon")} ipucu={c("basvuru.telefonIpucu")}>
        <Girdi
          type="tel"
          name="telefon"
          required
          autoComplete="tel"
          placeholder="5XXXXXXXXX"
          inputMode="numeric"
        />
      </Alan>

      <Alan etiket={c("hesap.eposta")} ipucu={c("basvuru.epostaIpucu")}>
        <Girdi type="email" name="eposta" required autoComplete="email" />
      </Alan>

      <Alan
        etiket="Parola belirle"
        ipucu={c("basvuru.parolaIpucu")}
      >
        <Girdi type="password" name="parola" required autoComplete="new-password" minLength={8} />
      </Alan>

      {/*
        Bu alan artık ZORUNLU. Şef, ev hanımı ve kurye başvuruları yöneticinin
        elle onayladığı kayıtlar; boş bir başvuruya bakarak karar verilemiyordu.
        En az 30 karakter isteniyor ki "olur" gibi tek kelimelik yanıtlar
        onaylanacak bir başvuru sayılmasın.
      */}
      <Alan
        etiket="Kendinden bahset"
        ipucu={c("basvuru.aciklamaIpucu")}
      >
        <MetinAlani name="mesaj" required minLength={30} maxLength={1000} />
      </Alan>

      <Buton
        type="submit"
        boyut="lg"
        className="w-full"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? c("form.gonderiliyor") : c("basvuru.basvuruyuGonder")}
      </Buton>

      <p className="text-xs leading-relaxed text-kahve-500">
        Başvurun yöneticiye iletilir. Onaylandığı anda hesabın açılır ve buradaki e-posta +
        parolayla doğrudan giriş yapabilirsin — ayrıca kayıt olman gerekmez.
      </p>
    </form>
  );
}
