"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

import { insanDogrulaAction, type InsanDurumu } from "@/app/insan-actions";
import { useDil } from "../saglayici/DilBaglami";
import { DilDegistirici } from "./DilDegistirici";
import { MarkaLogo } from "./MarkaLogo";

const BASLANGIC: InsanDurumu = {};

/**
 * Siteye girerken çıkan "Ben robot değilim" ekranı.
 *
 * Sunucu, geçerli bir bilet çerezi yoksa bu bileşeni basıyor; doğrulanan
 * ziyaretçi bilet süresince (bkz. `GECERLILIK_GUN`) bir daha görmüyor.
 * Süre ekranda YAZMIYOR: değiştiğinde metni güncellemek unutuluyor ve
 * ziyaretçiye yanlış bilgi veriyordu. Ekran bilerek sade: tek cümle,
 * tek kutu. Marka sarısı çerçevede duruyor ama içerik beyaz — sitenin geri
 * kalanıyla aynı ferah dil.
 *
 * Doğrulama SUNUCUDA yapılıyor; buradaki kutu yalnızca arayüz.
 */
export function InsanKapisi() {
  const { c } = useDil();
  const [durum, gonder, bekliyor] = useActionState(insanDogrulaAction, BASLANGIC);
  const [acilis, setAcilis] = useState("");
  const [isaretli, setIsaretli] = useState(false);

  /*
   * Açılış damgası istemcide üretiliyor: sunucuda üretilseydi sayfa
   * önbelleğe alındığında damga eskir ve gerçek ziyaretçiler takılırdı.
   */
  useEffect(() => setAcilis(String(Date.now())), []);

  // Doğrulama geçtiyse sayfayı tazele; sunucu artık kapıyı göstermeyecek.
  useEffect(() => {
    if (durum.gecti) window.location.reload();
  }, [durum.gecti]);

  return (
    <div className="fixed inset-0 z-100 grid place-items-center bg-white px-5">
      <div className="w-full max-w-md text-center">
        <MarkaLogo className="text-2xl" />

        {/*
          Dil düğmesi BURADA da olmalı: kapı tüm sayfayı kaplıyor, başlıktaki
          düğme arkada kalıyor. Siteye ilk gelen yabancı ziyaretçinin henüz dil
          çerezi yok — kapıyı Türkçe görüp ne yapacağını anlamıyordu.
        */}
        <div className="mt-5 flex justify-center">
          <DilDegistirici />
        </div>

        <h1 className="mt-6 font-display text-xl font-extrabold text-kahve-900">
          {c("insanKapisi.baslik")}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-kahve-600">
          {c("insanKapisi.aciklama")}
        </p>

        <form
          action={gonder}
          className="mt-7 rounded-[1.75rem] border-2 border-sari-500/45 bg-white p-6 text-left shadow-kart"
        >
          {durum.hata && (
            <p
              role="alert"
              className="mb-4 rounded-2xl bg-domates/10 px-4 py-3 text-sm font-semibold text-domates-koyu"
            >
              {durum.hata}
            </p>
          )}

          <input type="hidden" name="acilis" value={acilis} />

          {/*
            Bal küpü: ekranda YOK ama DOM'da var. Formu otomatik dolduran bot
            burayı da doldurur ve yakalanır. Ekran okuyucudan da gizli.
          */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] opacity-0">
            <label htmlFor="eposta_tekrari">{c("insanKapisi.balKupuEtiketi")}</label>
            <input id="eposta_tekrari" name="eposta_tekrari" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <label className="flex cursor-pointer items-center gap-3.5">
            <input
              type="checkbox"
              name="insan"
              checked={isaretli}
              onChange={(e) => setIsaretli(e.target.checked)}
              className="size-6 shrink-0 accent-sari-500"
            />
            <span className="font-display text-base font-extrabold text-kahve-900">
              {c("insanKapisi.benRobotDegilim")}
            </span>
          </label>

          <button
            type="submit"
            disabled={bekliyor || !isaretli || !acilis}
            className="tiklanabilir mt-5 h-12 w-full rounded-full bg-sari-500 font-display
              text-base font-extrabold text-murekkep shadow-sari transition-[background-color,transform]
              duration-300 ease-[var(--ease-yumusak)] hover:bg-sari-400 hover:-translate-y-0.5
              disabled:pointer-events-none disabled:opacity-45"
          >
            {bekliyor ? c("insanKapisi.dogrulaniyor") : c("insanKapisi.devamEt")}
          </button>
        </form>

        <p className="mt-4 text-xs text-kahve-400">
          {c("insanKapisi.dipnot")}
        </p>
      </div>
    </div>
  );
}
