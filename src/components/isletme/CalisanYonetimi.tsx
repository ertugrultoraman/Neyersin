"use client";

import { useActionState } from "react";

import {
  calisanCikarAction,
  calisanEkleAction,
  type CalisanDurumu,
} from "@/app/isletme/calisan-actions";
import { Alan, Girdi, Uyari } from "@/components/hesap/Alan";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: CalisanDurumu = {};

export type CalisanOzeti = { eposta: string; ad: string };

/**
 * Çalışan girişlerinin yönetimi — yalnızca işletme SAHİBİNE gösteriliyor.
 *
 * Görünürlük tek başına yeterli değil; eylemler de sahip olup olmadığını
 * kendi başlarına denetliyor (bkz. app/isletme/calisan-actions.ts).
 */
export function CalisanYonetimi({ calisanlar }: { calisanlar: CalisanOzeti[] }) {
  const { c } = useDil();
  const [ekleme, ekle, eklemeBekliyor] = useActionState(calisanEkleAction, BASLANGIC);
  const [cikarma, cikar, cikarmaBekliyor] = useActionState(calisanCikarAction, BASLANGIC);

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-kahve-900">{c("calisan.baslik")}</h2>
      <p className="mt-1 text-sm leading-relaxed text-kahve-600">{c("calisan.aciklama")}</p>

      {calisanlar.length === 0 ? (
        <p className="mt-5 text-sm text-kahve-500">{c("calisan.yok")}</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {calisanlar.map((k) => (
            <li
              key={k.eposta}
              className="flex flex-wrap items-center gap-3 rounded-2xl border
                border-kahve-900/8 bg-white px-4 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-kahve-900">{k.ad}</span>
                <span className="block truncate text-xs text-kahve-500">{k.eposta}</span>
              </span>
              <form action={cikar}>
                <input type="hidden" name="eposta" value={k.eposta} />
                <button
                  type="submit"
                  disabled={cikarmaBekliyor}
                  className="tiklanabilir rounded-xl border border-domates/40 px-3 py-1.5
                    text-xs font-bold text-domates-koyu transition-colors hover:bg-domates/8
                    disabled:opacity-50"
                >
                  {c("calisan.cikar")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {cikarma.hata && (
        <div className="mt-3">
          <Uyari tur="hata">{cikarma.hata}</Uyari>
        </div>
      )}
      {cikarma.basari && (
        <div className="mt-3">
          <Uyari tur="basari">{cikarma.basari}</Uyari>
        </div>
      )}

      <form action={ekle} className="mt-6 space-y-3 border-t border-kahve-900/8 pt-5">
        {ekleme.hata && <Uyari tur="hata">{ekleme.hata}</Uyari>}
        {ekleme.basari && <Uyari tur="basari">{ekleme.basari}</Uyari>}

        <div className="grid gap-3 sm:grid-cols-3">
          <Alan etiket={c("calisan.ad")}>
            <Girdi name="ad" required maxLength={80} autoComplete="off" />
          </Alan>
          <Alan etiket="E-posta">
            <Girdi name="eposta" type="email" required autoComplete="off" />
          </Alan>
          <Alan etiket={c("calisan.parola")}>
            <Girdi name="parola" type="password" required minLength={8} autoComplete="new-password" />
          </Alan>
        </div>

        <button
          type="submit"
          disabled={eklemeBekliyor}
          className="tiklanabilir rounded-xl bg-kahve-900 px-5 py-2.5 text-sm font-bold
            text-sari-300 transition-colors hover:bg-kahve-800 disabled:opacity-50"
        >
          {eklemeBekliyor ? c("genel.yukleniyor") : c("calisan.ekle")}
        </button>
      </form>
    </div>
  );
}
