"use client";

import { useActionState } from "react";

import { musteriKayitAction, type FormDurumu } from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";

const BASLANGIC: FormDurumu = {};

/**
 * Müşteri kaydı — herkese açık, onay gerekmez.
 *
 * Şef / ev hanımı / kurye hesapları buradan AÇILMAZ: onlar başvuru formunu
 * doldurur (parolalarını orada belirler) ve yönetici onayladığı anda hesapları
 * açılır. Bu yüzden burada ayrı bir "onaylanmış başvuru" adımı yok.
 */
export function KayitFormu({ donus }: { donus?: string }) {
  const [durum, gonder, bekliyor] = useActionState(musteriKayitAction, BASLANGIC);

  return (
    <form action={gonder} className="mt-6 space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}
      {donus && <input type="hidden" name="donus" value={donus} />}

      <Alan etiket="Ad ve soyad">
        <Girdi type="text" name="ad" required autoComplete="name" minLength={3} />
      </Alan>

      <Alan etiket="E-posta">
        <Girdi type="email" name="eposta" required autoComplete="email" />
      </Alan>

      <Alan etiket="Telefon" ipucu="İsteğe bağlı — sipariş formunda hazır gelir.">
        <Girdi type="tel" name="telefon" autoComplete="tel" placeholder="5XXXXXXXXX" />
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
        {bekliyor ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
      </Buton>
    </form>
  );
}
