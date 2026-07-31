"use client";

import { useActionState } from "react";

import {
  basvuruOnaylaAction,
  basvuruReddetAction,
  type YonetimDurumu,
} from "@/app/admin/yonetim-actions";
import { Alan, Girdi, Secim, Uyari } from "@/components/hesap/Alan";
import { Rozet } from "@/components/ui/Rozet";
import type { Basvuru } from "@/lib/hesaplar";

const BASLANGIC: YonetimDurumu = {};

const DURUM_TONU = {
  bekliyor: "sari",
  onaylandi: "nane",
  reddedildi: "domates",
} as const;

const DURUM_ETIKET = {
  bekliyor: "Bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
} as const;

/**
 * Tek başvurunun yönetim kartı. Şef/ev hanımı başvurusunda onay için profil
 * seçimi zorunlu; kurye başvurusunda profil yok.
 */
export function BasvuruKarti({
  basvuru,
  turEtiketi,
  sahipsizProfiller,
}: {
  basvuru: Basvuru;
  turEtiketi: string;
  sahipsizProfiller: { slug: string; ad: string; tur: string }[];
}) {
  const [onayDurumu, onayla, onayBekliyor] = useActionState(basvuruOnaylaAction, BASLANGIC);
  const [retDurumu, reddet, retBekliyor] = useActionState(basvuruReddetAction, BASLANGIC);

  const tarih = new Date(basvuru.olusturmaTarihi).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const kuryeMi = basvuru.tur === "kurye";
  const uygunProfiller = sahipsizProfiller.filter((p) => p.tur === basvuru.tur);

  return (
    <article className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-extrabold text-kahve-900">{basvuru.ad}</h3>
            <Rozet ton="kahve">{turEtiketi}</Rozet>
            <Rozet ton={DURUM_TONU[basvuru.durum]}>{DURUM_ETIKET[basvuru.durum]}</Rozet>
          </div>
          <p className="mt-1 text-sm text-kahve-600">
            <a href={`tel:${basvuru.telefon}`} className="tiklanabilir font-bold underline">
              {basvuru.telefon}
            </a>
            {" · "}
            {basvuru.eposta}
          </p>
          <p className="mt-0.5 text-xs text-kahve-400">{tarih}</p>
        </div>
      </header>

      {basvuru.mesaj && (
        <p className="mt-3 rounded-2xl bg-kahve-900/4 px-3.5 py-2.5 text-sm leading-relaxed text-kahve-700">
          {basvuru.mesaj}
        </p>
      )}

      {basvuru.atananRestoran && (
        <p className="mt-3 text-sm font-semibold text-kahve-700">
          Atanan profil: {basvuru.atananRestoran}
        </p>
      )}

      {onayDurumu.hata && (
        <div className="mt-3">
          <Uyari tur="hata">{onayDurumu.hata}</Uyari>
        </div>
      )}
      {onayDurumu.basari && (
        <div className="mt-3">
          <Uyari tur="basari">{onayDurumu.basari}</Uyari>
        </div>
      )}
      {retDurumu.basari && (
        <div className="mt-3">
          <Uyari tur="basari">{retDurumu.basari}</Uyari>
        </div>
      )}

      {basvuru.durum === "bekliyor" && (
        <div className="mt-4 space-y-3 border-t border-kahve-900/8 pt-4">
          <form action={onayla} className="space-y-3">
            <input type="hidden" name="id" value={basvuru.id} />

            {!kuryeMi &&
              (uygunProfiller.length > 0 ? (
                <Alan etiket="Atanacak profil" ipucu="Onay için profil seçimi zorunlu.">
                  <Secim name="restoranSlug" required defaultValue="">
                    <option value="" disabled>
                      Profil seç…
                    </option>
                    {uygunProfiller.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.ad}
                      </option>
                    ))}
                  </Secim>
                </Alan>
              ) : (
                <Uyari tur="hata">
                  Bu tür için sahipsiz profil kalmadı. Yeni profil eklenmeden onaylanamaz.
                </Uyari>
              ))}

            <Alan etiket="Not" ipucu="İsteğe bağlı, kayıtta tutulur.">
              <Girdi type="text" name="not" maxLength={300} />
            </Alan>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={onayBekliyor || (!kuryeMi && uygunProfiller.length === 0)}
                className="tiklanabilir rounded-2xl bg-nane px-4 py-2.5 text-sm font-bold text-white
                  transition-colors hover:bg-nane-koyu disabled:cursor-not-allowed disabled:opacity-50"
              >
                {onayBekliyor ? "Onaylanıyor…" : "Onayla"}
              </button>
            </div>
          </form>

          <form action={reddet}>
            <input type="hidden" name="id" value={basvuru.id} />
            <button
              type="submit"
              disabled={retBekliyor}
              className="tiklanabilir rounded-2xl border border-domates/40 px-4 py-2.5 text-sm
                font-bold text-domates-koyu transition-colors hover:bg-domates/10
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              {retBekliyor ? "Reddediliyor…" : "Reddet"}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
