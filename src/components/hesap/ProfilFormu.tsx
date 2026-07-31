"use client";

import { useActionState } from "react";

import { profilKaydetAction, type FormDurumu } from "@/app/hesap/actions";
import type { SefProfili } from "@/lib/hesaplar";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, MetinAlani, Uyari } from "./Alan";

const BASLANGIC: FormDurumu = {};

export function ProfilFormu({
  profil,
  restoranSlug,
  adminMi = false,
}: {
  profil: SefProfili | null;
  restoranSlug: string;
  adminMi?: boolean;
}) {
  const [durum, gonder, bekliyor] = useActionState(profilKaydetAction, BASLANGIC);

  return (
    <form action={gonder} className="space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}
      {durum.basari && <Uyari tur="basari">{durum.basari}</Uyari>}

      {/* Yönetici başka bir profili düzenleyebilir; şefte bu alan yok sayılır. */}
      {adminMi && <input type="hidden" name="restoranSlug" value={restoranSlug} />}

      <Alan etiket="Slogan" ipucu="Profilinin en üstünde görünen tek cümle.">
        <Girdi
          type="text"
          name="slogan"
          maxLength={120}
          defaultValue={profil?.slogan ?? ""}
          placeholder="Örn. Annemin tarifleriyle, her gün taze"
        />
      </Alan>

      <Alan etiket="Uzmanlık" ipucu="Neyi en iyi yapıyorsun?">
        <Girdi
          type="text"
          name="uzmanlik"
          maxLength={160}
          defaultValue={profil?.uzmanlik ?? ""}
          placeholder="Örn. El açması mantı, içli köfte ve ev usulü tatlılar"
        />
      </Alan>

      <Alan etiket="Özgeçmiş" ipucu="Hikayeni anlat: nerede öğrendin, kaç yıldır yapıyorsun?">
        <MetinAlani
          name="biyografi"
          maxLength={4000}
          defaultValue={profil?.biyografi ?? ""}
          placeholder="Kendini müşterilere tanıt…"
        />
      </Alan>

      <Alan etiket="Sertifikalar ve belgeler" ipucu="Her satıra bir tane yaz.">
        <MetinAlani
          name="sertifikalar"
          maxLength={2000}
          defaultValue={profil?.sertifikalar ?? ""}
          placeholder={"Hijyen Belgesi (2024)\nAşçılık Kursu Sertifikası — Halk Eğitim"}
        />
      </Alan>

      <p className="rounded-2xl bg-kahve-900/4 px-4 py-3 text-xs leading-relaxed text-kahve-600">
        Doğrudan iletişim bilgisi paylaşılmaz. Müşteriler sana yalnızca sipariş üzerinden
        ulaşır; teslimat ve iletişim platform üzerinden yürür.
      </p>

      <Buton
        type="submit"
        boyut="lg"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? "Kaydediliyor…" : "Profilimi kaydet"}
      </Buton>
    </form>
  );
}
