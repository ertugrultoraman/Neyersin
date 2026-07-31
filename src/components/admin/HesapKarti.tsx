"use client";

import { useActionState, useState } from "react";

import {
  hesapSilAction,
  rolDegistirAction,
  type YonetimDurumu,
} from "@/app/admin/yonetim-actions";
import { Secim, Uyari } from "@/components/hesap/Alan";
import { Rozet } from "@/components/ui/Rozet";
import type { Hesap } from "@/lib/hesaplar";

const BASLANGIC: YonetimDurumu = {};

const ROLLER = [
  { deger: "sef", etiket: "Şef / Ev Hanımı" },
  { deger: "kurye", etiket: "Kurye" },
  { deger: "musteri", etiket: "Müşteri" },
];

const ROL_TONU = { sef: "sari", kurye: "nane", musteri: "kahve", admin: "domates" } as const;

/** Tek hesabın yönetim kartı: rol değiştir veya hesabı sil. */
export function HesapKarti({ hesap, mutfakAdi }: { hesap: Hesap; mutfakAdi?: string }) {
  const [rolDurumu, rolDegistir, rolBekliyor] = useActionState(rolDegistirAction, BASLANGIC);
  const [silDurumu, sil, silBekliyor] = useActionState(hesapSilAction, BASLANGIC);
  const [silOnayi, setSilOnayi] = useState(false);

  const tarih = new Date(hesap.olusturmaTarihi).toLocaleDateString("tr-TR");

  return (
    <article className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-extrabold text-kahve-900">{hesap.ad}</h3>
            <Rozet ton={ROL_TONU[hesap.rol]}>
              {ROLLER.find((r) => r.deger === hesap.rol)?.etiket ?? hesap.rol}
            </Rozet>
          </div>
          <p className="mt-1 truncate text-sm text-kahve-600">{hesap.eposta}</p>
          {hesap.telefon && (
            <a
              href={`tel:${hesap.telefon}`}
              className="tiklanabilir text-sm font-bold text-kahve-700 underline"
            >
              {hesap.telefon}
            </a>
          )}
          <p className="mt-0.5 text-xs text-kahve-400">
            Kayıt: {tarih}
            {mutfakAdi ? ` · Mutfak: ${mutfakAdi}` : ""}
          </p>
        </div>
      </header>

      {rolDurumu.hata && (
        <div className="mt-3">
          <Uyari tur="hata">{rolDurumu.hata}</Uyari>
        </div>
      )}
      {rolDurumu.basari && (
        <div className="mt-3">
          <Uyari tur="basari">{rolDurumu.basari}</Uyari>
        </div>
      )}
      {silDurumu.hata && (
        <div className="mt-3">
          <Uyari tur="hata">{silDurumu.hata}</Uyari>
        </div>
      )}

      <div className="mt-4 space-y-3 border-t border-kahve-900/8 pt-4">
        <form action={rolDegistir} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="eposta" value={hesap.eposta} />
          <label className="flex-1">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
              Rolü değiştir
            </span>
            <Secim name="rol" defaultValue={hesap.rol}>
              {ROLLER.map((r) => (
                <option key={r.deger} value={r.deger}>
                  {r.etiket}
                </option>
              ))}
            </Secim>
          </label>
          <button
            type="submit"
            disabled={rolBekliyor}
            className="tiklanabilir rounded-2xl bg-kahve-900 px-4 py-3 text-sm font-bold text-sari-300
              transition-colors hover:bg-kahve-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rolBekliyor ? "…" : "Kaydet"}
          </button>
        </form>

        {silOnayi ? (
          <form action={sil} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="eposta" value={hesap.eposta} />
            <p className="w-full text-xs font-semibold text-domates-koyu">
              {hesap.restoranSlug
                ? "Hesap ve mutfak sayfası kalıcı olarak silinecek. Emin misin?"
                : "Hesap kalıcı olarak silinecek. Emin misin?"}
            </p>
            <button
              type="submit"
              disabled={silBekliyor}
              className="tiklanabilir rounded-2xl bg-domates px-4 py-2.5 text-sm font-bold text-white
                transition-colors hover:bg-domates-koyu disabled:cursor-not-allowed disabled:opacity-50"
            >
              {silBekliyor ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button
              type="button"
              onClick={() => setSilOnayi(false)}
              className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
                font-bold text-kahve-700"
            >
              Vazgeç
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setSilOnayi(true)}
            className="tiklanabilir rounded-2xl border border-domates/40 px-4 py-2.5 text-sm
              font-bold text-domates-koyu transition-colors hover:bg-domates/10"
          >
            Hesabı sil
          </button>
        )}
      </div>
    </article>
  );
}
