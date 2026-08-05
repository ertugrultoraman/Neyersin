"use client";

import { useRef, useState } from "react";

import { AZAMI_ADET, AZAMI_BOYUT, belgeyiDenetle, boyutYaz, DOSYA_KABUL } from "@/lib/belge";
import { useDil } from "../saglayici/DilBaglami";

/**
 * BELGE YÜKLEME — başvuru formlarında resmî evrak eklemek için.
 *
 * Seçilen dosyalar formun kendi `FormData`sıyla gidiyor; ayrı bir yükleme
 * isteği yok. Böylece başvuru ile belgeler AYNI anda kaydediliyor, yarım
 * kalmış yükleme diye bir durum oluşmuyor.
 *
 * Buradaki denetim yalnızca kolaylık — kişi yanlış dosyayı göndermeden
 * uyarılsın diye. Asıl denetim sunucuda tekrar yapılıyor (bkz. belge-sunucu.ts).
 */
export function BelgeYukle({
  ipucu,
  onDegisti,
}: {
  ipucu?: string;
  /**
   * Formunu `FormData` ile göndermeyen ekranlar için (iletişim formu düz
   * nesne gönderiyor) seçilen dosyaları dışarı verir. Verilmezse dosyalar
   * formun kendi `belge` alanıyla gider.
   */
  onDegisti?: (dosyalar: File[]) => void;
}) {
  const { c, dil } = useDil();
  const girdiRef = useRef<HTMLInputElement>(null);
  const [secilenler, setSecilenler] = useState<File[]>([]);
  const [uyari, setUyari] = useState<string | null>(null);

  function degisti(dosyalar: FileList | null) {
    const liste = [...(dosyalar ?? [])];
    if (liste.length > AZAMI_ADET) {
      setUyari(c("belge.cokFazla", { adet: AZAMI_ADET }));
      return;
    }
    for (const d of liste) {
      const sonuc = belgeyiDenetle({ type: d.type, size: d.size, name: d.name });
      if (!sonuc.gecerli) {
        setUyari(c(sonuc.sebep, { ad: d.name }));
        return;
      }
    }
    setUyari(null);
    setSecilenler(liste);
    onDegisti?.(liste);
  }

  return (
    <div className="rounded-2xl border border-dashed border-kahve-900/20 bg-white/60 p-4">
      <p className="text-xs font-bold tracking-wide text-kahve-700 uppercase">
        {c("belge.baslik")}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-kahve-500">
        {ipucu ?? c("belge.ipucu")}
      </p>

      {/*
        Gerçek `input` görünmüyor ama DOM'da duruyor — dosyalar formla birlikte
        gitmeli. Görsel olarak yerine düğme basılıyor; tarayıcının varsayılan
        dosya seçicisi sitenin diliyle uyuşmuyordu.
      */}
      <input
        ref={girdiRef}
        type="file"
        name="belge"
        multiple
        accept={DOSYA_KABUL}
        onChange={(e) => degisti(e.target.files)}
        className="sr-only"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => girdiRef.current?.click()}
          className="tiklanabilir rounded-2xl bg-kahve-900 px-4 py-2.5 text-sm font-bold text-sari-300
            transition-colors duration-300 hover:bg-kahve-800"
        >
          {c("belge.sec")}
        </button>
        <span className="text-xs font-semibold text-kahve-500">
          {c("belge.sinir", { adet: AZAMI_ADET, boyut: boyutYaz(AZAMI_BOYUT, dil) })}
        </span>
      </div>

      {secilenler.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {secilenler.map((d) => (
            <li
              key={`${d.name}-${d.size}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-kahve-900/4 px-3 py-2 text-xs"
            >
              <span className="truncate font-semibold text-kahve-800">{d.name}</span>
              <span className="shrink-0 text-kahve-500">{boyutYaz(d.size, dil)}</span>
            </li>
          ))}
        </ul>
      )}

      {uyari && (
        <p role="alert" className="mt-3 text-xs font-semibold text-domates-koyu">
          {uyari}
        </p>
      )}
    </div>
  );
}
