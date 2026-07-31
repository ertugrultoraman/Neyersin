"use client";

import { useActionState, useState } from "react";

import { yorumEkleAction, type YorumDurumu } from "@/app/hesabim/yorum-actions";
import { Uyari } from "../hesap/Alan";
import { YildizIkon } from "../ui/Ikonlar";
import { cn } from "@/lib/utils";
import { EKSENLER } from "./Yildizlar";

const BASLANGIC: YorumDurumu = {};

/** Tıklanabilir yıldız satırı — tek eksenin puanı. */
function YildizSecici({
  ad,
  etiket,
  deger,
  setDeger,
}: {
  ad: string;
  etiket: string;
  deger: number;
  setDeger: (d: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-bold text-kahve-800">{etiket}</span>
      <input type="hidden" name={ad} value={deger || ""} />
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setDeger(i)}
            aria-label={`${etiket}: ${i} yıldız`}
            aria-pressed={deger === i}
            className="tiklanabilir p-0.5"
          >
            <YildizIkon
              className={cn(
                "size-6 transition-colors duration-200",
                i <= deger ? "text-sari-500" : "text-kahve-900/18 hover:text-sari-300",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Sipariş değerlendirme formu.
 * Üç eksen de puanlanmadan gönderilemez — sunucu da aynı kuralı uyguluyor.
 */
export function YorumFormu({ siparisNo }: { siparisNo: string }) {
  const [durum, gonder, bekliyor] = useActionState(yorumEkleAction, BASLANGIC);
  const [puanlar, setPuanlar] = useState<Record<string, number>>({
    sicaklik: 0,
    teslimatHizi: 0,
    tad: 0,
  });
  const [acik, setAcik] = useState(false);

  if (durum.basari) return <Uyari tur="basari">{durum.basari}</Uyari>;

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="tiklanabilir rounded-2xl border border-sari-500/50 bg-sari-500/10 px-4 py-2.5
          text-sm font-bold text-kahve-900 transition-colors hover:bg-sari-500/20"
      >
        Siparişi değerlendir
      </button>
    );
  }

  const eksik = EKSENLER.some((e) => !puanlar[e.alan]);

  return (
    <form action={gonder} className="space-y-3">
      <input type="hidden" name="siparisNo" value={siparisNo} />
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

      <div className="space-y-2 rounded-2xl bg-kahve-900/4 px-4 py-3">
        {EKSENLER.map((e) => (
          <YildizSecici
            key={e.alan}
            ad={e.alan}
            etiket={e.etiket}
            deger={puanlar[e.alan]}
            setDeger={(d) => setPuanlar((o) => ({ ...o, [e.alan]: d }))}
          />
        ))}
      </div>

      <textarea
        name="metin"
        maxLength={1000}
        placeholder="Yorumun (isteğe bağlı)…"
        className="w-full rounded-2xl border border-kahve-900/12 bg-white px-4 py-3 text-sm
          text-kahve-900 focus:border-sari-500/60 focus:ring-2 focus:ring-sari-500/40
          focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={bekliyor || eksik}
          className="tiklanabilir rounded-2xl bg-kahve-900 px-4 py-2.5 text-sm font-bold text-sari-300
            transition-colors hover:bg-kahve-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bekliyor ? "Gönderiliyor…" : "Değerlendirmeyi gönder"}
        </button>
        <button
          type="button"
          onClick={() => setAcik(false)}
          className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
            font-bold text-kahve-700"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
