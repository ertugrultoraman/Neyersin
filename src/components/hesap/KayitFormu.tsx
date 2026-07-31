"use client";

import { useActionState, useState } from "react";

import { musteriKayitAction, onayliKayitAction, type FormDurumu } from "@/app/hesap/actions";
import { cn } from "@/lib/utils";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";

const BASLANGIC: FormDurumu = {};

/**
 * Kayıt ekranı iki farklı yolu barındırır:
 *  - Müşteri: herkese açık, anında hesap.
 *  - Onaylanmış başvuru: şef / ev hanımı / kurye, yalnızca yönetici onayından
 *    sonra parolasını belirleyip hesabını açabilir.
 */
export function KayitFormu({ donus }: { donus?: string }) {
  const [sekme, setSekme] = useState<"musteri" | "onayli">("musteri");

  return (
    <div className="mt-6">
      <div role="tablist" className="grid grid-cols-2 gap-2 rounded-2xl bg-kahve-900/5 p-1">
        {(
          [
            { deger: "musteri", etiket: "Müşteri" },
            { deger: "onayli", etiket: "Onaylanmış başvuru" },
          ] as const
        ).map((s) => (
          <button
            key={s.deger}
            type="button"
            role="tab"
            aria-selected={sekme === s.deger}
            onClick={() => setSekme(s.deger)}
            className={cn(
              "tiklanabilir rounded-xl px-3 py-2.5 text-sm font-bold transition-colors duration-300",
              sekme === s.deger
                ? "bg-white text-kahve-900 shadow-yumusak"
                : "text-kahve-600 hover:text-kahve-900",
            )}
          >
            {s.etiket}
          </button>
        ))}
      </div>

      {sekme === "musteri" ? <MusteriKayit donus={donus} /> : <OnayliKayit />}
    </div>
  );
}

function MusteriKayit({ donus }: { donus?: string }) {
  const [durum, gonder, bekliyor] = useActionState(musteriKayitAction, BASLANGIC);

  return (
    <form action={gonder} className="mt-5 space-y-4">
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

function OnayliKayit() {
  const [durum, gonder, bekliyor] = useActionState(onayliKayitAction, BASLANGIC);

  return (
    <form action={gonder} className="mt-5 space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

      <p className="rounded-2xl bg-kahve-900/4 px-4 py-3 text-xs leading-relaxed text-kahve-600">
        Şef, ev hanımı veya kurye hesabı yalnızca onaylanmış başvurular için açılır. Başvurun
        onaylandıysa aşağıya başvuruda kullandığın e-postayı yazıp parolanı belirle.
      </p>

      <Alan etiket="Başvurudaki e-posta">
        <Girdi type="email" name="eposta" required autoComplete="email" />
      </Alan>

      <Alan etiket="Parola belirle" ipucu="En az 8 karakter.">
        <Girdi type="password" name="parola" required autoComplete="new-password" minLength={8} />
      </Alan>

      <Buton
        type="submit"
        boyut="lg"
        className="w-full"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? "Hesap açılıyor…" : "Hesabımı aç"}
      </Buton>
    </form>
  );
}
