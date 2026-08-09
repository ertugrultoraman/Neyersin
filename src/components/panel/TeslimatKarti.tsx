"use client";

import { useActionState } from "react";

import {
  alimAdresiBildirAction,
  type AdresBildirDurumu,
} from "@/app/panel/adres-bildir-actions";
import {
  teslimAldimAction,
  teslimEttimAction,
  type TeslimatDurumu,
} from "@/app/panel/teslimat-actions";
import { Uyari } from "@/components/hesap/Alan";
import { DurumRozeti } from "@/components/admin/DurumRozeti";
import type { SiparisDurumu } from "@/lib/siparis";
import type { SiparisMesaji } from "@/lib/siparis-mesajlari";
import { useDil } from "../saglayici/DilBaglami";
import { SiparisMesajlari } from "./SiparisMesajlari";

const BASLANGIC: TeslimatDurumu = {};
const BILDIR_BASLANGIC: AdresBildirDurumu = {};

/**
 * Kuryenin tek teslimat kartı.
 *
 * İki adres var ve ikisi de yalnızca bu kuryeye görünüyor:
 *  - ALIM: mutfağın adresi. Ev hanımları kendi evinden pişirdiği için bu
 *    adres müşteriye HİÇ gösterilmiyor.
 *  - TESLİM: müşterinin adresi.
 *
 * Harita bağlantısı adresi arama sorgusu olarak açıyor; koordinat
 * toplamıyoruz, kurye kendi uygulamasında yol tarifini başlatıyor.
 */
export function TeslimatKarti({
  siparisNo,
  durum,
  restoranAdi,
  alimAdresi,
  alimTelefonu,
  musteriAdi,
  maskeliNumara,
  teslimatAdresi,
  tutar,
  mesajlar,
  mesajlasmaAcik,
}: {
  siparisNo: string;
  durum: SiparisDurumu;
  restoranAdi: string;
  alimAdresi?: string;
  alimTelefonu?: string;
  musteriAdi: string;
  /** Operatör hattı bağlıysa ara numara; yoksa numara HİÇ gösterilmiyor. */
  maskeliNumara?: string;
  teslimatAdresi: string;
  tutar: string;
  mesajlar: SiparisMesaji[];
  mesajlasmaAcik: boolean;
}) {
  const { c } = useDil();
  const [aldimDurumu, teslimAl, alBekliyor] = useActionState(teslimAldimAction, BASLANGIC);
  const [ettimDurumu, teslimEt, etBekliyor] = useActionState(teslimEttimAction, BASLANGIC);
  const [bildirDurumu, bildir, bildirBekliyor] = useActionState(
    alimAdresiBildirAction,
    BILDIR_BASLANGIC,
  );

  const haritaAdresi = (adres: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adres)}`;

  return (
    <article className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold text-kahve-500">{siparisNo}</p>
          <h3 className="mt-0.5 font-display text-base font-extrabold text-kahve-900">
            {restoranAdi}
          </h3>
        </div>
        <div className="text-right">
          <DurumRozeti durum={durum} />
          <p className="mt-1 font-display text-sm font-extrabold text-kahve-900">{tutar}</p>
        </div>
      </header>

      {/* 1. Adım: mutfaktan al */}
      <section className="mt-4 rounded-2xl bg-sari-500/8 p-3">
        <p className="text-2xs font-bold tracking-wide text-kahve-700 uppercase">
          {c("teslimat.nereden")}
        </p>
        {alimAdresi ? (
          <>
            <p className="mt-1 text-sm leading-relaxed text-kahve-800">{alimAdresi}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href={haritaAdresi(alimAdresi)}
                target="_blank"
                rel="noopener noreferrer"
                className="tiklanabilir inline-flex items-center gap-1.5 rounded-xl bg-kahve-900
                  px-3 py-2 text-xs font-bold text-sari-300 transition-colors hover:bg-kahve-800"
              >
                <KonumIkon />
                {c("teslimat.haritadaAc")}
              </a>
              {alimTelefonu && (
                <a
                  href={`tel:${alimTelefonu}`}
                  className="tiklanabilir text-xs font-bold text-kahve-700 underline"
                >
                  {alimTelefonu}
                </a>
              )}
            </div>
          </>
        ) : (
          /*
           * Adres yoksa kurye ÇIKMAZDA. Eskiden burada yalnızca "Yöneticiye
           * bildir" yazıyordu ama basılacak bir şey yoktu; kurye ya kendi
           * telefonundan arıyor ya da siparişi öylece bırakıyordu.
           */
          <div className="mt-1">
            <p className="text-sm text-domates-koyu">{c("teslimat.alimAdresiYok")}</p>
            {bildirDurumu.basari ? (
              <p className="mt-2 rounded-xl bg-nane/12 px-3 py-2 text-xs font-bold text-nane-koyu">
                {bildirDurumu.basari}
              </p>
            ) : (
              <form action={bildir} className="mt-2">
                <input type="hidden" name="siparisNo" value={siparisNo} />
                <button
                  type="submit"
                  disabled={bildirBekliyor}
                  className="tiklanabilir inline-flex items-center gap-1.5 rounded-xl
                    bg-domates px-3 py-2 text-xs font-bold text-white transition-colors
                    hover:bg-domates-koyu disabled:opacity-50"
                >
                  <ZilIkon />
                  {bildirBekliyor ? c("teslimat.bildiriliyor") : c("teslimat.adresiBildir")}
                </button>
              </form>
            )}
            {bildirDurumu.hata && (
              <p className="mt-2 text-xs font-semibold text-domates-koyu">{bildirDurumu.hata}</p>
            )}
          </div>
        )}
      </section>

      {/* 2. Adım: müşteriye götür */}
      <section className="mt-3 rounded-2xl bg-kahve-900/4 p-3">
        <p className="text-2xs font-bold tracking-wide text-kahve-700 uppercase">
          {c("teslimat.nereye")}
        </p>
        <p className="mt-1 text-sm font-bold text-kahve-900">{musteriAdi}</p>
        <p className="text-sm leading-relaxed text-kahve-800">{teslimatAdresi}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a
            href={haritaAdresi(teslimatAdresi)}
            target="_blank"
            rel="noopener noreferrer"
            className="tiklanabilir inline-flex items-center gap-1.5 rounded-xl border
              border-kahve-900/15 px-3 py-2 text-xs font-bold text-kahve-800
              transition-colors hover:border-sari-500/60"
          >
            <KonumIkon />
            {c("teslimat.haritadaAc")}
          </a>
          {/*
            MÜŞTERİNİN GERÇEK NUMARASI ARTIK GÖSTERİLMİYOR.

            Eskiden burada cep numarası yazıyordu ve teslimat bittikten sonra
            da kuryenin telefonunda kalıyordu — bir teslimatın gerektirdiğinden
            fazlası. İletişim sipariş yazışmasından yürüyor.

            `maskeliNumara` bir gün operatör hattı bağlanırsa doluyor; o zaman
            iki taraf da kimseye ait olmayan bir ara numarayı görüyor
            (bkz. lib/telefon-maskeleme.ts). Boşken hiçbir numara gösterilmiyor
            — gerçek numaraya düşmektense arama seçeneğinin hiç olmaması doğru.
          */}
          {maskeliNumara ? (
            <a
              href={`tel:${maskeliNumara}`}
              className="tiklanabilir text-xs font-bold text-kahve-700 underline"
            >
              {maskeliNumara}
            </a>
          ) : (
            <span className="text-2xs text-kahve-500">{c("teslimat.numaraGizli")}</span>
          )}
        </div>
      </section>

      <SiparisMesajlari
        siparisNo={siparisNo}
        ben="kurye"
        mesajlar={mesajlar}
        acik={mesajlasmaAcik}
      />

      {/* Eylem — siparişin hangi aşamada olduğuna göre */}
      <div className="mt-4 border-t border-kahve-900/8 pt-4">
        {durum === "odendi" && (
          <p className="text-xs font-semibold text-kahve-500">
            {c("teslimat.mutfakHazirliyor")}
          </p>
        )}

        {durum === "hazir" && (
          <form action={teslimAl}>
            <input type="hidden" name="siparisNo" value={siparisNo} />
            <button
              type="submit"
              disabled={alBekliyor}
              className="tiklanabilir w-full rounded-2xl bg-sari-500 px-4 py-3 font-display
                text-sm font-extrabold text-kahve-900 shadow-sari transition-colors
                hover:bg-sari-400 disabled:opacity-50"
            >
              {alBekliyor ? c("teslimat.isleniyor") : c("teslimat.teslimAldim")}
            </button>
          </form>
        )}

        {durum === "yolda" && (
          <form action={teslimEt}>
            <input type="hidden" name="siparisNo" value={siparisNo} />
            <button
              type="submit"
              disabled={etBekliyor}
              className="tiklanabilir w-full rounded-2xl bg-kahve-900 px-4 py-3 font-display
                text-sm font-extrabold text-sari-300 transition-colors hover:bg-kahve-800
                disabled:opacity-50"
            >
              {etBekliyor ? c("teslimat.isleniyor") : c("teslimat.musteriyeTeslimEttim")}
            </button>
          </form>
        )}

        {durum === "teslim-edildi" && (
          <p className="text-xs font-bold text-nane-koyu">{c("teslimat.tamamlandi")}</p>
        )}

        {aldimDurumu.hata && (
          <div className="mt-2">
            <Uyari tur="hata">{aldimDurumu.hata}</Uyari>
          </div>
        )}
        {ettimDurumu.hata && (
          <div className="mt-2">
            <Uyari tur="hata">{ettimDurumu.hata}</Uyari>
          </div>
        )}
      </div>
    </article>
  );
}

function ZilIkon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M13.7 19a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function KonumIkon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none">
      <path
        d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
