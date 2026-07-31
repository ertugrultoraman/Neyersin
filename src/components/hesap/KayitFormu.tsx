"use client";

import { useActionState } from "react";

import { kayitAction, type FormDurumu } from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Secim, Uyari } from "./Alan";

const BASLANGIC: FormDurumu = {};

export function KayitFormu({ profiller }: { profiller: { slug: string; ad: string }[] }) {
  const [durum, gonder, bekliyor] = useActionState(kayitAction, BASLANGIC);

  if (profiller.length === 0) {
    return (
      <div className="mt-6">
        <Uyari tur="hata">
          Şu anda sahiplenilmemiş şef profili yok. Yeni bir şef profili açılması için bizimle
          iletişime geç.
        </Uyari>
      </div>
    );
  }

  return (
    <form action={gonder} className="mt-6 space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

      <Alan etiket="Ad ve soyad">
        <Girdi type="text" name="ad" required autoComplete="name" minLength={3} />
      </Alan>

      <Alan
        etiket="Şef profilin"
        ipucu="Yalnızca burada seçtiğin profili düzenleyebilirsin. Diğer şeflerin profillerini yalnızca görüntülersin."
      >
        <Secim name="restoranSlug" required defaultValue="">
          <option value="" disabled>
            Profil seç…
          </option>
          {profiller.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.ad}
            </option>
          ))}
        </Secim>
      </Alan>

      <Alan etiket="E-posta" ipucu="Giriş yaparken bu adresi kullanacaksın.">
        <Girdi type="email" name="eposta" required autoComplete="email" />
      </Alan>

      <Alan etiket="Parola" ipucu="En az 8 karakter.">
        <Girdi type="password" name="parola" required autoComplete="new-password" minLength={8} />
      </Alan>

      <Buton
        type="submit"
        boyut="lg"
        className="w-full"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? "Hesap oluşturuluyor…" : "Kayıt ol"}
      </Buton>
    </form>
  );
}
