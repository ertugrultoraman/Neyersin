"use client";

import { useActionState } from "react";

import { profilKaydetAction, type FormDurumu } from "@/app/hesap/actions";
import type { SefProfili } from "@/lib/hesaplar";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, MetinAlani, Uyari } from "./Alan";
import { useDil } from "../saglayici/DilBaglami";

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
  const { c } = useDil();
  const [durum, gonder, bekliyor] = useActionState(profilKaydetAction, BASLANGIC);

  return (
    <form action={gonder} className="space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}
      {durum.basari && <Uyari tur="basari">{durum.basari}</Uyari>}

      {/* Yönetici başka bir profili düzenleyebilir; şefte bu alan yok sayılır. */}
      {adminMi && <input type="hidden" name="restoranSlug" value={restoranSlug} />}

      <Alan etiket={c("profil.slogan")} ipucu={c("profil.sloganIpucu")}>
        <Girdi
          type="text"
          name="slogan"
          maxLength={120}
          defaultValue={profil?.slogan ?? ""}
          placeholder={c("profil.sloganYer")}
        />
      </Alan>

      <Alan etiket={c("profil.uzmanlik")} ipucu={c("profil.uzmanlikIpucu")}>
        <Girdi
          type="text"
          name="uzmanlik"
          maxLength={160}
          defaultValue={profil?.uzmanlik ?? ""}
          placeholder={c("profil.uzmanlikYer")}
        />
      </Alan>

      {/*
        KİŞİSEL ÜÇLÜ: kaç yıldır, nereli, imza yemeği.
        Müşterinin "bunu kim pişiriyor" sorusuna en kısa yoldan cevap veren
        alanlar bunlar — biyografi kutusu uzun ve çoğu şef boş bırakıyor.
        Üçü de tek satır: doldurması on saniye sürsün diye.
      */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Alan etiket={c("profil.deneyim")} ipucu={c("profil.deneyimIpucu")}>
          <Girdi
            type="number"
            name="deneyimYili"
            min={1}
            max={70}
            defaultValue={profil?.deneyimYili ?? ""}
            placeholder="32"
          />
        </Alan>

        <Alan etiket={c("profil.memleket")} ipucu={c("profil.memleketIpucu")}>
          <Girdi
            type="text"
            name="memleket"
            maxLength={80}
            defaultValue={profil?.memleket ?? ""}
            placeholder={c("profil.memleketYer")}
          />
        </Alan>
      </div>

      <Alan etiket={c("profil.imzaYemegi")} ipucu={c("profil.imzaYemegiIpucu")}>
        <Girdi
          type="text"
          name="imzaYemegi"
          maxLength={80}
          defaultValue={profil?.imzaYemegi ?? ""}
          placeholder={c("profil.imzaYemegiYer")}
        />
      </Alan>

      {/*
        Alım adresi MÜŞTERİYE GÖSTERİLMİYOR. Ev hanımları kendi evinden
        pişiriyor; ev adresinin herkese açık olması güvenlik sorunu olurdu.
        Yalnızca o siparişi taşıyan kurye ve yönetici görüyor.
      */}
      <div className="rounded-2xl border border-sari-500/30 bg-sari-500/8 p-4">
        <p className="text-2xs font-bold tracking-wide text-kahve-700 uppercase">
          {c("profil.kuryeBilgileri")}
        </p>
        <p className="mt-1 mb-3 text-xs leading-relaxed text-kahve-600">
          {c("profil.kuryeBilgileriAciklama")}
        </p>

        {/* Panelin üstündeki "adresin eksik" uyarısı buraya çıpalanıyor. */}
        <Alan
          id="alim-adresi"
          etiket={c("profil.alimAdresi")}
          ipucu={c("profil.alimAdresiIpucu")}
        >
          <MetinAlani
            name="alimAdresi"
            maxLength={300}
            rows={3}
            defaultValue={profil?.alimAdresi ?? ""}
            placeholder={c("profil.alimAdresiYer")}
          />
        </Alan>

        <Alan etiket={c("profil.kuryeTelefonu")} ipucu={c("profil.kuryeTelefonuIpucu")}>
          <Girdi
            type="tel"
            name="alimTelefonu"
            maxLength={20}
            defaultValue={profil?.alimTelefonu ?? ""}
            placeholder="05XX XXX XX XX"
          />
        </Alan>
      </div>

      <Alan etiket={c("profil.ozgecmis")} ipucu={c("profil.ozgecmisIpucu")}>
        <MetinAlani
          name="biyografi"
          maxLength={4000}
          defaultValue={profil?.biyografi ?? ""}
          placeholder={c("profil.ozgecmisYer")}
        />
      </Alan>

      <Alan etiket={c("profil.sertifikalar")} ipucu={c("profil.sertifikaIpucu")}>
        <MetinAlani
          name="sertifikalar"
          maxLength={2000}
          defaultValue={profil?.sertifikalar ?? ""}
          placeholder={c("profil.sertifikaYer")}
        />
      </Alan>

      <p className="rounded-2xl bg-kahve-900/4 px-4 py-3 text-xs leading-relaxed text-kahve-600">
        {c("profil.iletisimNotu")}
      </p>

      <Buton
        type="submit"
        boyut="lg"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? c("panel.kaydediliyor") : c("profil.kaydet")}
      </Buton>
    </form>
  );
}
