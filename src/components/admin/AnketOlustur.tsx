"use client";

import { useActionState, useState } from "react";

import { anketOlusturAction, type AnketDurumu } from "@/app/anket-actions";
import { ASGARI_SECENEK, AZAMI_SECENEK } from "@/content/anket";

const BASLANGIC: AnketDurumu = {};

/**
 * YENİ ANKET OLUŞTURMA — WhatsApp anketi gibi.
 *
 * Soru yazılır, seçenek kutuları eklenir/çıkarılır, "Yayınla" denir. Kaç
 * seçenek olacağı burada belirleniyor: başlangıçta 3 kutu var, "Seçenek ekle"
 * ile 12'ye kadar çıkıyor.
 *
 * İngilizce karşılıklar isteğe bağlı: girilmezse turist ziyaretçiye Türkçesi
 * gösteriliyor — anketin hiç görünmemesindense okunabilir olması yeğ.
 */
export function AnketOlustur() {
  const [durum, gonder, bekliyor] = useActionState(anketOlusturAction, BASLANGIC);
  const [kutuSayisi, setKutuSayisi] = useState(3);
  const [ingilizceAcik, setIngilizceAcik] = useState(false);

  const kutular = Array.from({ length: kutuSayisi }, (_, i) => i);

  return (
    <section className="mt-6 rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak">
      <h2 className="font-display text-base font-extrabold text-kahve-900">Yeni anket</h2>
      <p className="mt-1 text-xs leading-relaxed text-kahve-500">
        Soruyu yaz, seçenekleri ekle, yayınla. Yayınlanan anket ana sayfada görünür ve varsa
        önceki anket kendiliğinden yayından iner — oyları silinmez, duruyor.
      </p>

      <form action={gonder} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="anket-soru"
            className="text-2xs font-bold tracking-wide text-kahve-500 uppercase"
          >
            Soru
          </label>
          <input
            id="anket-soru"
            name="soru"
            required
            maxLength={140}
            placeholder="Genelde ne yemeyi tercih ediyorsunuz?"
            className="mt-1.5 w-full rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
              font-semibold text-kahve-900 outline-none transition-colors duration-300
              focus:border-sari-500"
          />
        </div>

        {ingilizceAcik && (
          <div>
            <label
              htmlFor="anket-soru-en"
              className="text-2xs font-bold tracking-wide text-kahve-500 uppercase"
            >
              Soru (İngilizce)
            </label>
            <input
              id="anket-soru-en"
              name="soruEn"
              maxLength={140}
              placeholder="What do you usually prefer to eat?"
              className="mt-1.5 w-full rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
                font-semibold text-kahve-900 outline-none transition-colors duration-300
                focus:border-sari-500"
            />
          </div>
        )}

        <div>
          <p className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
            Seçenekler ({kutuSayisi})
          </p>
          <ul className="mt-1.5 space-y-2">
            {kutular.map((i) => (
              <li key={i} className={ingilizceAcik ? "grid gap-2 sm:grid-cols-2" : undefined}>
                <input
                  name={`secenek${i}`}
                  maxLength={60}
                  required={i < ASGARI_SECENEK}
                  placeholder={`${i + 1}. seçenek`}
                  aria-label={`${i + 1}. seçenek`}
                  className="w-full rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
                    text-kahve-900 outline-none transition-colors duration-300 focus:border-sari-500"
                />
                {ingilizceAcik && (
                  <input
                    name={`secenekEn${i}`}
                    maxLength={60}
                    placeholder={`${i + 1}. seçenek (İngilizce)`}
                    aria-label={`${i + 1}. seçeneğin İngilizcesi`}
                    className="w-full rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
                      text-kahve-900 outline-none transition-colors duration-300
                      focus:border-sari-500"
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setKutuSayisi((s) => Math.min(s + 1, AZAMI_SECENEK))}
              disabled={kutuSayisi >= AZAMI_SECENEK}
              className="tiklanabilir rounded-full border border-kahve-900/12 px-3.5 py-1.5 text-xs
                font-bold text-kahve-700 transition-colors duration-300 hover:border-sari-500/60
                hover:bg-sari-500/10 disabled:opacity-40"
            >
              + Seçenek ekle
            </button>
            <button
              type="button"
              onClick={() => setKutuSayisi((s) => Math.max(s - 1, ASGARI_SECENEK))}
              disabled={kutuSayisi <= ASGARI_SECENEK}
              className="tiklanabilir rounded-full border border-kahve-900/12 px-3.5 py-1.5 text-xs
                font-bold text-kahve-700 transition-colors duration-300 hover:border-domates/60
                disabled:opacity-40"
            >
              − Son kutuyu kaldır
            </button>
            <button
              type="button"
              onClick={() => setIngilizceAcik((a) => !a)}
              aria-pressed={ingilizceAcik}
              className="tiklanabilir rounded-full border border-kahve-900/12 px-3.5 py-1.5 text-xs
                font-bold text-kahve-700 transition-colors duration-300 hover:border-sari-500/60"
            >
              {ingilizceAcik ? "İngilizceyi gizle" : "İngilizcesini de yaz"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={bekliyor}
          className="tiklanabilir rounded-full bg-sari-500 px-6 py-2.5 text-sm font-extrabold
            text-kahve-900 shadow-sari transition-transform duration-300 hover:-translate-y-0.5
            disabled:opacity-50"
        >
          {bekliyor ? "Yayınlanıyor…" : "Yayınla"}
        </button>

        {durum.hata && (
          <p role="alert" className="text-xs font-bold text-domates-koyu">
            {durum.hata}
          </p>
        )}
        {durum.basari && (
          <p role="status" className="text-xs font-bold text-nane-koyu">
            {durum.basari}
          </p>
        )}
      </form>
    </section>
  );
}
