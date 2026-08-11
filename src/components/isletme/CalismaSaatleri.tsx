"use client";

import { useActionState } from "react";

import {
  hemenAcAction,
  saatleriKaydetAction,
  simdilikKapatAction,
  type SaatDurumu,
} from "@/app/isletme/saat-actions";
import { Uyari } from "@/components/hesap/Alan";
import {
  GUN_ADLARI,
  KAPATMA_SURELERI,
  type AcikDurumu,
  type HaftaProgrami,
} from "@/lib/calisma-saatleri";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: SaatDurumu = {};

/**
 * Çalışma saatleri ve "şimdilik kapat".
 *
 * İki ayrı karar, iki ayrı form: PROGRAM kalıcı, ELDEN KAPATMA geçici.
 * Program kaydetmek "şimdilik kapalıyım"ı iptal etmiyor.
 */
export function CalismaSaatleri({
  program,
  durum,
}: {
  program: HaftaProgrami;
  durum: AcikDurumu;
}) {
  const { c, dil } = useDil();
  const [kayit, kaydet, kayitBekliyor] = useActionState(saatleriKaydetAction, BASLANGIC);
  const [kapatma, kapat, kapatmaBekliyor] = useActionState(simdilikKapatAction, BASLANGIC);
  const [acma, ac, acmaBekliyor] = useActionState(hemenAcAction, BASLANGIC);

  const elleKapali = !durum.acik && durum.sebep === "elle";
  const bitisSaati =
    elleKapali && durum.bitis
      ? new Date(durum.bitis).toLocaleTimeString(dil === "en" ? "en-GB" : "tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Istanbul",
        })
      : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-kahve-900">
            {c("saat.baslik")}
          </h2>
          <p className="mt-1 text-sm text-kahve-600">{c("saat.aciklama")}</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-extrabold ${
            durum.acik ? "bg-nane/15 text-nane-koyu" : "bg-domates/12 text-domates-koyu"
          }`}
        >
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${durum.acik ? "bg-nane-koyu" : "bg-domates"}`}
          />
          {durum.acik ? c("saat.suAnAcik") : c("saat.suAnKapali")}
        </span>
      </div>

      {/* ── Şimdilik kapat / hemen aç ── */}
      <div className="mt-5 rounded-2xl border border-kahve-900/10 bg-kahve-900/3 p-4">
        {elleKapali ? (
          <form action={ac} className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-sm text-kahve-700">
              {bitisSaati ? c("saat.kapaliBitis", { saat: bitisSaati }) : c("saat.suAnKapali")}
            </p>
            <button
              type="submit"
              disabled={acmaBekliyor}
              className="tiklanabilir rounded-xl bg-nane-koyu px-4 py-2.5 text-sm font-bold
                text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {acmaBekliyor ? c("genel.yukleniyor") : c("saat.hemenAc")}
            </button>
          </form>
        ) : (
          <form action={kapat} className="flex flex-wrap items-center gap-2">
            <p className="w-full text-sm text-kahve-700 sm:w-auto sm:flex-1">
              {c("saat.yogunMusun")}
            </p>
            {KAPATMA_SURELERI.map((sure) => (
              <button
                key={sure}
                type="submit"
                name="saat"
                value={sure}
                disabled={kapatmaBekliyor}
                className="tiklanabilir rounded-xl border border-domates/40 bg-white px-3.5 py-2
                  text-sm font-bold text-domates-koyu transition-colors hover:bg-domates/8
                  disabled:opacity-50"
              >
                {c("saat.saatKapat", { saat: sure })}
              </button>
            ))}
          </form>
        )}
        {kapatma.hata && <p className="mt-2 text-xs font-semibold text-domates-koyu">{kapatma.hata}</p>}
        {acma.hata && <p className="mt-2 text-xs font-semibold text-domates-koyu">{acma.hata}</p>}
      </div>

      {/* ── Haftalık program ── */}
      <form action={kaydet} className="mt-5 space-y-2">
        {kayit.hata && <Uyari tur="hata">{kayit.hata}</Uyari>}
        {kayit.basari && <Uyari tur="basari">{kayit.basari}</Uyari>}

        {program.map((gun, i) => (
          <div
            key={GUN_ADLARI[i]}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-kahve-900/8
              bg-white px-4 py-2.5"
          >
            <span className="w-28 text-sm font-bold text-kahve-900">{c(GUN_ADLARI[i])}</span>

            <label className="flex items-center gap-2 text-xs font-semibold text-kahve-600">
              <input
                type="checkbox"
                name={`kapali-${i}`}
                defaultChecked={gun.kapali}
                className="size-4 accent-domates"
              />
              {c("saat.kapaliGun")}
            </label>

            <span className="ml-auto flex items-center gap-2">
              <input
                type="time"
                name={`acilis-${i}`}
                defaultValue={gun.acilis}
                aria-label={`${c(GUN_ADLARI[i])} — ${c("saat.acilis")}`}
                className="rounded-xl border border-kahve-900/12 px-2.5 py-1.5 text-sm
                  focus:border-sari-500/60 focus:outline-none"
              />
              <span aria-hidden="true" className="text-kahve-400">
                –
              </span>
              <input
                type="time"
                name={`kapanis-${i}`}
                defaultValue={gun.kapanis}
                aria-label={`${c(GUN_ADLARI[i])} — ${c("saat.kapanis")}`}
                className="rounded-xl border border-kahve-900/12 px-2.5 py-1.5 text-sm
                  focus:border-sari-500/60 focus:outline-none"
              />
            </span>
          </div>
        ))}

        <p className="text-xs text-kahve-500">{c("saat.geceNotu")}</p>

        <button
          type="submit"
          disabled={kayitBekliyor}
          className="tiklanabilir mt-2 rounded-xl bg-kahve-900 px-5 py-2.5 text-sm font-bold
            text-sari-300 transition-colors hover:bg-kahve-800 disabled:opacity-50"
        >
          {kayitBekliyor ? c("genel.yukleniyor") : c("saat.programiKaydet")}
        </button>
      </form>
    </div>
  );
}
