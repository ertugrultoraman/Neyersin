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

      {/*
        Alım adresi MÜŞTERİYE GÖSTERİLMİYOR. Ev hanımları kendi evinden
        pişiriyor; ev adresinin herkese açık olması güvenlik sorunu olurdu.
        Yalnızca o siparişi taşıyan kurye ve yönetici görüyor.
      */}
      <div className="rounded-2xl border border-sari-500/30 bg-sari-500/8 p-4">
        <p className="text-2xs font-bold tracking-wide text-kahve-700 uppercase">
          Kurye bilgileri · müşteriye gösterilmez
        </p>
        <p className="mt-1 mb-3 text-xs leading-relaxed text-kahve-600">
          Kurye siparişi buradan alacak. Yalnızca o teslimatı yapan kuryeye ve yöneticiye
          görünür; müşteri bu bilgileri hiçbir yerde görmez.
        </p>

        <Alan etiket="Alım adresi" ipucu="Kurye kapına gelecek — mahalle, sokak, bina ve daire.">
          <MetinAlani
            name="alimAdresi"
            maxLength={300}
            rows={3}
            defaultValue={profil?.alimAdresi ?? ""}
            placeholder="Örn. Adnan Kahveci Mah. Yavuz Sultan Selim Cad. No: 12 Daire: 5, Beylikdüzü"
          />
        </Alan>

        <Alan etiket="Kurye telefonu" ipucu="Kurye kapıya gelince arayabilsin.">
          <Girdi
            type="tel"
            name="alimTelefonu"
            maxLength={20}
            defaultValue={profil?.alimTelefonu ?? ""}
            placeholder="05XX XXX XX XX"
          />
        </Alan>
      </div>

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
