"use client";

import { useActionState, useState } from "react";

import {
  basvuruOnaylaAction,
  basvuruReddetAction,
  type YonetimDurumu,
} from "@/app/admin/yonetim-actions";
import { Alan, Girdi, Uyari } from "@/components/hesap/Alan";
import { Rozet } from "@/components/ui/Rozet";
import { cn } from "@/lib/utils";
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

export type RolSecenegi = { deger: string; etiket: string; aciklama: string };

/**
 * Tek başvurunun yönetim kartı.
 *
 * Yönetici kişinin rolünü seçer (Şef / Ev Hanımı / Kurye). Şef ve ev hanımı
 * onaylandığında kişinin ADIYLA yeni bir mutfak sayfası açılır ve hesabı
 * anında aktifleşir — parola başvuru sırasında belirlenmiştir.
 */
export function BasvuruKarti({
  basvuru,
  turEtiketi,
  roller,
}: {
  basvuru: Basvuru;
  turEtiketi: string;
  roller: RolSecenegi[];
}) {
  const [onayDurumu, onayla, onayBekliyor] = useActionState(basvuruOnaylaAction, BASLANGIC);
  const [retDurumu, reddet, retBekliyor] = useActionState(basvuruReddetAction, BASLANGIC);
  // Başvuran kendi seçtiği türle gelir; yönetici gerekirse değiştirir.
  const [rol, setRol] = useState<string>(basvuru.tur);

  const tarih = new Date(basvuru.olusturmaTarihi).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const kuryeMi = rol === "kurye";

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
          Mutfak sayfası:{" "}
          <a
            href={`/restoran/${basvuru.atananRestoran}`}
            className="tiklanabilir text-sari-700 underline"
          >
            /restoran/{basvuru.atananRestoran}
          </a>
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

            <fieldset>
              <legend className="mb-2 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
                Rolü
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {roller.map((r) => (
                  <label
                    key={r.deger}
                    className={cn(
                      "tiklanabilir block rounded-2xl border p-3 transition-colors duration-300",
                      rol === r.deger
                        ? "border-sari-500 bg-sari-500/10"
                        : "border-kahve-900/12 hover:border-sari-500/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value={r.deger}
                      checked={rol === r.deger}
                      onChange={() => setRol(r.deger)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-extrabold text-kahve-900">{r.etiket}</span>
                    <span className="mt-0.5 block text-2xs leading-snug text-kahve-600">
                      {r.aciklama}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {!kuryeMi && (
              <>
                <p className="rounded-2xl bg-nane/10 px-3.5 py-2.5 text-xs leading-relaxed text-nane-koyu">
                  Onayladığında <strong>{basvuru.ad}</strong> adına yeni bir mutfak sayfası açılır
                  ve hesabı aktifleşir. Kimse başkasının profiline atanmaz.
                </p>

                <Alan etiket="Semt" ipucu="Boş bırakırsan Beylikdüzü kullanılır.">
                  <Girdi type="text" name="semt" maxLength={40} placeholder="Beylikdüzü" />
                </Alan>
              </>
            )}

            <Alan etiket="Not" ipucu="İsteğe bağlı, kayıtta tutulur.">
              <Girdi type="text" name="not" maxLength={300} />
            </Alan>

            <button
              type="submit"
              disabled={onayBekliyor}
              className="tiklanabilir rounded-2xl bg-nane px-4 py-2.5 text-sm font-bold text-white
                transition-colors hover:bg-nane-koyu disabled:cursor-not-allowed disabled:opacity-50"
            >
              {onayBekliyor ? "Onaylanıyor…" : "Onayla"}
            </button>
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
