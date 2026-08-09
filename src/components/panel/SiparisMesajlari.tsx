"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { mesajGonderAction, type MesajDurumu } from "@/app/panel/mesaj-actions";
import type { MesajTarafi, SiparisMesaji } from "@/lib/siparis-mesajlari";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: MesajDurumu = {};

/**
 * Sipariş yazışması — kurye ile müşteri arasında, numara paylaşmadan.
 *
 * İki taraf da aynı bileşeni kullanıyor; `ben` hangi tarafta olduğumuzu
 * söylüyor ve balonların hizası ona göre değişiyor.
 *
 * Yazışma teslimattan iki saat sonra kapanıyor (bkz. lib/siparis-mesajlari.ts).
 * Kapalıyken geçmiş okunabiliyor ama yeni mesaj yazılamıyor: kişi konuşmanın
 * ne olduğunu görebilmeli, ama kalıcı bir kanal açık kalmamalı.
 */
export function SiparisMesajlari({
  siparisNo,
  ben,
  mesajlar,
  acik,
}: {
  siparisNo: string;
  ben: MesajTarafi;
  mesajlar: SiparisMesaji[];
  acik: boolean;
}) {
  const { c } = useDil();
  const [durum, gonder, bekliyor] = useActionState(mesajGonderAction, BASLANGIC);
  const [metin, setMetin] = useState("");
  const kaydirRef = useRef<HTMLDivElement>(null);

  /* Gönderim başarılıysa kutuyu boşalt — aynı mesaj ikinci kez gitmesin. */
  useEffect(() => {
    if (durum.gonderildi) setMetin("");
  }, [durum.gonderildi]);

  useEffect(() => {
    kaydirRef.current?.scrollTo({ top: kaydirRef.current.scrollHeight });
  }, [mesajlar.length]);

  return (
    <section className="mt-3 rounded-2xl border border-kahve-900/8 bg-white p-3">
      <p className="text-2xs font-bold tracking-wide text-kahve-700 uppercase">
        {c("mesaj.baslik")}
      </p>
      <p className="mt-0.5 text-2xs text-kahve-500">{c("mesaj.gizlilikNotu")}</p>

      {mesajlar.length > 0 && (
        <div ref={kaydirRef} className="mt-2.5 max-h-44 space-y-1.5 overflow-y-auto">
          {mesajlar.map((m) => {
            const benimki = m.gonderen === ben;
            return (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-1.5 ${
                  benimki
                    ? "ml-auto rounded-br-md bg-sari-500 text-kahve-900"
                    : "rounded-bl-md bg-kahve-900/6 text-kahve-800"
                }`}
              >
                {!benimki && (
                  <span className="block text-2xs font-bold text-kahve-500">
                    {m.gonderen === "admin" ? c("mesaj.yonetici") : m.gonderenAdi}
                  </span>
                )}
                <span className="block text-sm leading-relaxed break-words">{m.metin}</span>
              </div>
            );
          })}
        </div>
      )}

      {acik ? (
        <form action={gonder} className="mt-2.5 flex items-end gap-2">
          <input type="hidden" name="siparisNo" value={siparisNo} />
          <textarea
            name="metin"
            required
            rows={1}
            maxLength={1000}
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            placeholder={c("mesaj.yerTutucu")}
            className="min-h-10 flex-1 resize-none rounded-xl border border-kahve-900/12 px-3 py-2
              text-sm focus:border-sari-500/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={bekliyor || !metin.trim()}
            className="tiklanabilir shrink-0 rounded-xl bg-kahve-900 px-3.5 py-2.5 text-xs
              font-bold text-sari-300 transition-colors hover:bg-kahve-800 disabled:opacity-40"
          >
            {bekliyor ? c("mesaj.gonderiliyor") : c("mesaj.gonder")}
          </button>
        </form>
      ) : (
        <p className="mt-2.5 text-xs text-kahve-500">{c("mesaj.kapali")}</p>
      )}

      {durum.hata && (
        <p role="alert" className="mt-2 text-xs font-semibold text-domates-koyu">
          {durum.hata}
        </p>
      )}
    </section>
  );
}
