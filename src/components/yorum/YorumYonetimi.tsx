"use client";

import { useActionState, useState } from "react";

import {
  yorumSilAction,
  yorumYanitlaAction,
  type YorumYonetimDurumu,
} from "@/app/panel/yorum-yonetim-actions";

const BASLANGIC: YorumYonetimDurumu = {};

/**
 * Yorumun altındaki yönetim satırı.
 *
 * İki ayrı yetki var ve bilerek ayrı tutuldu:
 *  - CEVAP: mutfağın sahibi yazar. Tek yönlü değerlendirme adil değil.
 *  - SİLME: yalnızca yönetici. Mutfak kendi olumsuz yorumunu silebilseydi
 *    puanlar anlamını yitirirdi.
 */
export function YorumYonetimi({
  yorumId,
  mevcutYanit,
  yanitlayabilir,
  silebilir,
}: {
  yorumId: string;
  mevcutYanit?: string;
  yanitlayabilir: boolean;
  silebilir: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const [silOnayi, setSilOnayi] = useState(false);
  const [yanitDurumu, yanitla, yanitBekliyor] = useActionState(yorumYanitlaAction, BASLANGIC);
  const [silDurumu, sil, silBekliyor] = useActionState(yorumSilAction, BASLANGIC);

  if (yanitDurumu.basari && acik) setAcik(false);
  if (!yanitlayabilir && !silebilir) return null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-3">
        {yanitlayabilir && !acik && (
          <button
            type="button"
            onClick={() => setAcik(true)}
            className="tiklanabilir text-xs font-bold text-sari-700 underline underline-offset-2"
          >
            {mevcutYanit ? "Cevabı düzenle" : "Cevapla"}
          </button>
        )}

        {silebilir &&
          (silOnayi ? (
            <form action={sil} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="yorumId" value={yorumId} />
              <span className="text-xs font-semibold text-domates-koyu">
                Yorum kalıcı olarak silinecek.
              </span>
              <button
                type="submit"
                disabled={silBekliyor}
                className="tiklanabilir rounded-xl bg-domates px-3 py-1.5 text-xs font-bold
                  text-white disabled:opacity-50"
              >
                {silBekliyor ? "…" : "Evet, sil"}
              </button>
              <button
                type="button"
                onClick={() => setSilOnayi(false)}
                className="tiklanabilir text-xs font-bold text-kahve-600 underline"
              >
                Vazgeç
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSilOnayi(true)}
              className="tiklanabilir text-xs font-bold text-domates-koyu underline
                underline-offset-2"
            >
              Yorumu sil
            </button>
          ))}
      </div>

      {acik && (
        <form action={yanitla} className="mt-2">
          <input type="hidden" name="yorumId" value={yorumId} />
          <label className="sr-only" htmlFor={`yanit-${yorumId}`}>
            Yoruma cevabın
          </label>
          <textarea
            id={`yanit-${yorumId}`}
            name="yanit"
            rows={3}
            maxLength={600}
            defaultValue={mevcutYanit ?? ""}
            placeholder="Müşteriye cevabın…"
            className="w-full rounded-2xl border border-kahve-900/15 px-3 py-2 text-sm
              text-kahve-900 outline-none focus:border-sari-500"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={yanitBekliyor}
              className="tiklanabilir rounded-xl bg-kahve-900 px-3 py-2 text-xs font-bold
                text-sari-300 disabled:opacity-50"
            >
              {yanitBekliyor ? "Gönderiliyor…" : "Cevabı yayınla"}
            </button>
            <button
              type="button"
              onClick={() => setAcik(false)}
              className="tiklanabilir rounded-xl border border-kahve-900/12 px-3 py-2
                text-xs font-bold text-kahve-700"
            >
              Vazgeç
            </button>
            {mevcutYanit && (
              <span className="text-2xs text-kahve-400">
                Boş bırakıp yayınlarsan cevap kaldırılır.
              </span>
            )}
          </div>
        </form>
      )}

      {yanitDurumu.hata && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-domates-koyu">
          {yanitDurumu.hata}
        </p>
      )}
      {silDurumu.hata && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-domates-koyu">
          {silDurumu.hata}
        </p>
      )}
    </div>
  );
}
