"use client";

import { useActionState } from "react";

import { vardiyaOlusturAction, type YonetimDurumu } from "@/app/admin/yonetim-actions";

const BASLANGIC: YonetimDurumu = {};

const ALAN =
  "mt-1.5 w-full rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm " +
  "font-semibold text-kahve-900 outline-none transition-colors duration-300 focus:border-sari-500";

const ETIKET = "text-2xs font-bold tracking-wide text-kahve-500 uppercase";

/**
 * YENİ VARDİYA DİLİMİ.
 *
 * TEK TARİH + İKİ SAAT: yöneticinin kafasındaki şey "salı akşam vardiyası".
 * İki ayrı tarih-saat kutusu istenseydi, gece yarısını geçen vardiyalarda
 * bitiş gününü yanlış yazmak en sık yapılan hata olurdu — sunucu bitişi
 * başlangıçtan küçükse ertesi güne alıyor (bkz. vardiyaOlusturAction).
 *
 * SAATLER TÜRKİYE SAATİ. Kutular saat dilimi taşımıyor ve sunucu UTC'de
 * çalışıyor; dönüşüm sunucu eyleminde yapılıyor, burada yazan saat ile
 * kuryenin telefonunda görünen saat aynı.
 */
export function VardiyaFormu() {
  const [durum, gonder, bekliyor] = useActionState(vardiyaOlusturAction, BASLANGIC);

  return (
    <section className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak md:p-7">
      <h2 className="font-display text-base font-extrabold text-kahve-900">Yeni vardiya aç</h2>
      <p className="mt-1 text-xs leading-relaxed text-kahve-500">
        Açtığın dilim kuryelerin uygulamasında görünür ve kontenjan dolana kadar yer ayırabilirler.
        Rezervasyon çalışmanın şartı değil — kurye yer ayırmadan da çevrimiçi olup teklif alabilir;
        buradaki liste, o saatte sahada kaç kişi olacağını önceden bilmeni sağlıyor.
      </p>

      <form action={gonder} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="vardiya-tarih" className={ETIKET}>
              Tarih
            </label>
            <input id="vardiya-tarih" name="tarih" type="date" required className={ALAN} />
          </div>
          <div>
            <label htmlFor="vardiya-bas" className={ETIKET}>
              Başlangıç
            </label>
            <input
              id="vardiya-bas"
              name="baslangicSaati"
              type="time"
              required
              className={ALAN}
            />
          </div>
          <div>
            <label htmlFor="vardiya-bitis" className={ETIKET}>
              Bitiş
            </label>
            <input id="vardiya-bitis" name="bitisSaati" type="time" required className={ALAN} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="vardiya-kontenjan" className={ETIKET}>
              Kontenjan
            </label>
            <input
              id="vardiya-kontenjan"
              name="kontenjan"
              type="number"
              min={1}
              max={200}
              defaultValue={5}
              required
              className={ALAN}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="vardiya-bolge" className={ETIKET}>
              Bölge (isteğe bağlı)
            </label>
            <input
              id="vardiya-bolge"
              name="bolge"
              maxLength={60}
              placeholder="Kadıköy"
              className={ALAN}
            />
          </div>
        </div>

        <div>
          <label htmlFor="vardiya-not" className={ETIKET}>
            Not (isteğe bağlı)
          </label>
          <input
            id="vardiya-not"
            name="not"
            maxLength={140}
            placeholder="Maç günü, yoğun geçmesi bekleniyor"
            className={ALAN}
          />
        </div>

        <button
          type="submit"
          disabled={bekliyor}
          className="tiklanabilir rounded-full bg-sari-500 px-6 py-2.5 text-sm font-extrabold
            text-kahve-900 shadow-sari transition-transform duration-300 hover:-translate-y-0.5
            disabled:opacity-50"
        >
          {bekliyor ? "Açılıyor…" : "Vardiyayı aç"}
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
