"use client";

import { useActionState, useState } from "react";

import {
  anketDuzenleAction,
  anketSilAction,
  anketYayinAction,
  type AnketDurumu,
} from "@/app/anket-actions";

const BASLANGIC: AnketDurumu = {};

type SecenekOzeti = { id: string; etiket: string; etiketEn?: string };

type Ozet = {
  id: string;
  soru: string;
  soruEn?: string;
  secenekler: SecenekOzeti[];
  oySayisi: number;
  yayinda: boolean;
  tarih: string;
};

/**
 * Tek anket satırı — düzenle, yayına al/indir ve sil.
 *
 * Silme İKİ ADIMLI: oylar da gidiyor ve geri getirilemiyor, tek tıkla
 * kaybedilmesin. Yayından kaldırma yıkıcı değil, o tek tık.
 *
 * DÜZENLEME AÇILIR KAPANIR: bu liste "hangi anket yayında" sorusuna bakılan
 * yer; her satırda açık duran bir form o bakışı imkânsız kılardı.
 */
export function AnketSatiri({ anket }: { anket: Ozet }) {
  const [yayinDurumu, yayinDegistir, yayinBekliyor] = useActionState(anketYayinAction, BASLANGIC);
  const [silmeDurumu, sil, silBekliyor] = useActionState(anketSilAction, BASLANGIC);
  const [duzenleDurumu, duzenle, duzenleBekliyor] = useActionState(anketDuzenleAction, BASLANGIC);
  const [onayIstendi, setOnayIstendi] = useState(false);
  const [duzenleAcik, setDuzenleAcik] = useState(false);

  const hata = yayinDurumu.hata ?? silmeDurumu.hata ?? duzenleDurumu.hata;

  return (
    <li className="rounded-2xl border border-kahve-900/8 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold text-kahve-900">{anket.soru}</p>
          <p className="mt-0.5 text-xs text-kahve-500">
            {anket.secenekler.length} seçenek · {anket.oySayisi} oy ·{" "}
            {new Date(anket.tarih).toLocaleDateString("tr-TR")}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-2xs font-bold tracking-wide uppercase ${
            anket.yayinda ? "bg-nane/15 text-nane-koyu" : "bg-kahve-900/8 text-kahve-500"
          }`}
        >
          {anket.yayinda ? "Yayında" : "Yayında değil"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDuzenleAcik((a) => !a)}
          aria-expanded={duzenleAcik}
          className="tiklanabilir rounded-full border border-kahve-900/12 px-3.5 py-1.5 text-xs
            font-bold text-kahve-700 transition-colors duration-300 hover:border-sari-500/60
            hover:bg-sari-500/10"
        >
          {duzenleAcik ? "Düzenlemeyi kapat" : "Düzenle"}
        </button>

        <form action={yayinDegistir}>
          <input type="hidden" name="id" value={anket.id} />
          <button
            type="submit"
            disabled={yayinBekliyor}
            className="tiklanabilir rounded-full border border-kahve-900/12 px-3.5 py-1.5 text-xs
              font-bold text-kahve-700 transition-colors duration-300 hover:border-sari-500/60
              hover:bg-sari-500/10 disabled:opacity-50"
          >
            {anket.yayinda ? "Yayından kaldır" : "Yayına al"}
          </button>
        </form>

        {onayIstendi ? (
          <form action={sil} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={anket.id} />
            <span className="text-xs font-semibold text-domates-koyu">
              {anket.oySayisi} oyla birlikte silinecek, geri alınamaz.
            </span>
            <button
              type="submit"
              disabled={silBekliyor}
              className="tiklanabilir rounded-full bg-domates px-3.5 py-1.5 text-xs font-bold
                text-white transition-transform duration-300 hover:-translate-y-0.5
                disabled:opacity-50"
            >
              {silBekliyor ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button
              type="button"
              onClick={() => setOnayIstendi(false)}
              className="tiklanabilir text-xs font-bold text-kahve-500 hover:text-kahve-900"
            >
              Vazgeç
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOnayIstendi(true)}
            className="tiklanabilir rounded-full border border-domates/30 px-3.5 py-1.5 text-xs
              font-bold text-domates-koyu transition-colors duration-300 hover:bg-domates/8"
          >
            Sil
          </button>
        )}
      </div>

      {/*
        DÜZENLEME FORMU. Seçenek kutuları mevcut seçeneğin KİMLİĞİYLE
        adlandırılıyor (`etiket-<id>`): sunucu yeni yazıyı o kimliğin üstüne
        yazıyor ve oyların bağlı olduğu kimlik değişmiyor
        (bkz. app/anket-actions → anketDuzenleAction).

        Seçenek eklenip çıkarılamıyor: silinen seçeneğin oyları sahipsiz
        kalırdı. Ekranda da yazıyor ki yönetici boşuna aramasın.
      */}
      {duzenleAcik && (
        <form action={duzenle} className="mt-4 space-y-3 rounded-2xl bg-kahve-900/3 p-4">
          <input type="hidden" name="id" value={anket.id} />

          <div>
            <label
              htmlFor={`soru-${anket.id}`}
              className="text-2xs font-bold tracking-wide text-kahve-500 uppercase"
            >
              Soru
            </label>
            <input
              id={`soru-${anket.id}`}
              name="soru"
              defaultValue={anket.soru}
              maxLength={140}
              required
              className="mt-1 w-full rounded-xl border border-kahve-900/12 bg-white px-3 py-2
                text-sm text-kahve-900 focus:border-sari-500/60 focus:ring-2
                focus:ring-sari-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`soruEn-${anket.id}`}
              className="text-2xs font-bold tracking-wide text-kahve-500 uppercase"
            >
              Soru (İngilizce)
            </label>
            <input
              id={`soruEn-${anket.id}`}
              name="soruEn"
              defaultValue={anket.soruEn ?? ""}
              maxLength={140}
              placeholder="Boş bırakılırsa Türkçesi gösterilir"
              className="mt-1 w-full rounded-xl border border-kahve-900/12 bg-white px-3 py-2
                text-sm text-kahve-900 focus:border-sari-500/60 focus:ring-2
                focus:ring-sari-500/40 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <p className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">Seçenekler</p>
            {anket.secenekler.map((s, i) => (
              <div key={s.id} className="grid gap-2 sm:grid-cols-2">
                <input
                  name={`etiket-${s.id}`}
                  defaultValue={s.etiket}
                  maxLength={60}
                  required
                  aria-label={`${i + 1}. seçenek`}
                  className="rounded-xl border border-kahve-900/12 bg-white px-3 py-2 text-sm
                    text-kahve-900 focus:border-sari-500/60 focus:ring-2 focus:ring-sari-500/40
                    focus:outline-none"
                />
                <input
                  name={`etiketEn-${s.id}`}
                  defaultValue={s.etiketEn ?? ""}
                  maxLength={60}
                  placeholder="İngilizcesi (isteğe bağlı)"
                  aria-label={`${i + 1}. seçenek — İngilizce`}
                  className="rounded-xl border border-kahve-900/12 bg-white px-3 py-2 text-sm
                    text-kahve-900 focus:border-sari-500/60 focus:ring-2 focus:ring-sari-500/40
                    focus:outline-none"
                />
              </div>
            ))}
            <p className="text-2xs leading-relaxed text-kahve-500">
              Yazıları değiştirebilirsin; verilmiş oylar olduğu gibi kalır. Seçenek eklemek ya da
              çıkarmak için yeni anket aç — silinen seçeneğin oyları sahipsiz kalırdı.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={duzenleBekliyor}
              className="tiklanabilir rounded-full bg-kahve-900 px-4 py-2 text-xs font-bold
                text-sari-300 transition-colors duration-300 hover:bg-kahve-800 disabled:opacity-50"
            >
              {duzenleBekliyor ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {duzenleDurumu.basari && (
              <span className="text-xs font-bold text-nane-koyu">{duzenleDurumu.basari}</span>
            )}
          </div>
        </form>
      )}

      {hata && (
        <p role="alert" className="mt-2 text-xs font-bold text-domates-koyu">
          {hata}
        </p>
      )}
    </li>
  );
}
