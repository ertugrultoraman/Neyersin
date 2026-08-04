"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { destekTalebiOlustur, type DestekDurumuSonuc } from "@/app/destek/actions";
import {
  destekAdimiBul,
  DESTEK_BASLANGIC,
  type DestekAdimi,
  type DestekSecenek,
} from "@/content/destek";
import { useOturum } from "../hesap/useOturum";
import { OkIkon } from "../ui/Buton";
import { DestekIkon, KapatIkon, KontrolIkon } from "../ui/Ikonlar";
import { useDil } from "../saglayici/DilBaglami";

/**
 * Canlı destek asistanı — sağ altta sepetin üstünde duran konuşma düğmesi.
 *
 * Adımlı ilerler (bkz. content/destek.ts): asistan bir şey söyler, kullanıcı
 * seçeneklerden birine basar, sohbet aşağı doğru büyür. Asistanın çözemediği
 * yerde gerçek bir destek talebi açılır ve yönetici paneline düşer.
 *
 * Sipariş kartındaki "Destek" düğmesi bu bileşeni `ny-destek-ac` olayıyla
 * açıp sipariş numarasını önden dolduruyor.
 */
export const DESTEK_OLAYI = "ny-destek-ac";

export type DestekAcDetay = { adim?: string; siparisNo?: string };

type Balon =
  | { kim: "asistan"; adim: DestekAdimi }
  | { kim: "kullanici"; metin: string };

const BASLANGIC_DURUM: DestekDurumuSonuc = {};

export function DestekWidget() {
  const { dil, c, s: secDil } = useDil();
  const [acik, setAcik] = useState(false);
  const [gecmis, setGecmis] = useState<Balon[]>([]);
  const [siparisNo, setSiparisNo] = useState("");
  const azalt = useReducedMotion();
  const oturum = useOturum();
  const kaydirRef = useRef<HTMLDivElement>(null);

  const [durum, gonder, bekliyor] = useActionState(destekTalebiOlustur, BASLANGIC_DURUM);

  const sonAdim = [...gecmis].reverse().find((b) => b.kim === "asistan");
  const aktifAdim = sonAdim?.kim === "asistan" ? sonAdim.adim : undefined;

  function adimaGit(id: string) {
    const adim = destekAdimiBul(id);
    if (!adim) return;
    setGecmis((o) => [...o, { kim: "asistan", adim }]);
  }

  function sec(secenek: DestekSecenek) {
    setGecmis((o) => [...o, { kim: "kullanici", metin: secDil(secenek.etiket, secenek.etiketEn) }]);
    // Kısa bir gecikme sohbeti "cevap yazılıyor" gibi hissettiriyor.
    window.setTimeout(() => adimaGit(secenek.hedef), 260);
  }

  function baslat(detay?: DestekAcDetay) {
    const baslangic = detay?.adim ?? DESTEK_BASLANGIC;
    const adim = destekAdimiBul(baslangic) ?? destekAdimiBul(DESTEK_BASLANGIC);
    setGecmis(adim ? [{ kim: "asistan", adim }] : []);
    setSiparisNo(detay?.siparisNo ?? "");
    setAcik(true);
  }

  // Sipariş kartından açılış
  useEffect(() => {
    const dinle = (o: Event) => baslat((o as CustomEvent<DestekAcDetay>).detail);
    window.addEventListener(DESTEK_OLAYI, dinle);
    return () => window.removeEventListener(DESTEK_OLAYI, dinle);
  }, []);

  /**
   * "#destek" bağlantısıyla açılış — alt menüdeki Canlı Destek bağlantısı
   * buradan çalışıyor. Sayfa değiştirmeden, bulunduğun yerde açılıyor.
   * Adres çubuğundaki çıpa hemen siliniyor ki aynı bağlantı ikinci kez
   * tıklandığında da açılsın (aksi hâlde hashchange olayı hiç oluşmuyor).
   */
  useEffect(() => {
    const cipayaBak = () => {
      if (window.location.hash !== "#destek") return;
      history.replaceState(null, "", window.location.pathname + window.location.search);
      baslat();
    };
    cipayaBak();
    window.addEventListener("hashchange", cipayaBak);
    return () => window.removeEventListener("hashchange", cipayaBak);
  }, []);

  // Yeni balon geldiğinde en alta kaydır
  useEffect(() => {
    kaydirRef.current?.scrollTo({ top: kaydirRef.current.scrollHeight, behavior: "smooth" });
  }, [gecmis, durum.talepNo]);

  // Escape ile kapansın
  useEffect(() => {
    if (!acik) return;
    const tusla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", tusla);
    return () => window.removeEventListener("keydown", tusla);
  }, [acik]);

  return (
    <>
      {/* Açma düğmesi — sepetin üstünde, onunla çakışmasın diye yukarıda */}
      <button
        type="button"
        onClick={() => (acik ? setAcik(false) : baslat())}
        aria-label={acik ? c("destek.sohbetiKapat") : c("destek.canliDestek")}
        aria-expanded={acik}
        className="tiklanabilir fixed right-4 bottom-24 z-40 flex items-center gap-2 rounded-full
          bg-kahve-900 py-3 pr-4 pl-3.5 text-sari-300 shadow-[0_12px_30px_rgb(59_36_18/0.35)]
          transition-colors duration-300 hover:bg-kahve-800 md:right-6 md:bottom-28"
      >
        {acik ? <KapatIkon className="size-5" /> : <DestekIkon className="size-5" />}
        <span className="text-sm font-bold whitespace-nowrap">{c("destek.kisa")}</span>
      </button>

      <AnimatePresence>
        {acik && (
          <motion.div
            initial={{ opacity: 0, y: azalt ? 0 : 20, scale: azalt ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: azalt ? 0 : 12, scale: azalt ? 1 : 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label={c("destek.canliDestek")}
            className="fixed right-3 bottom-40 z-40 flex max-h-[min(32rem,70dvh)] w-[min(24rem,calc(100vw-1.5rem))]
              flex-col overflow-hidden rounded-[1.75rem] border border-kahve-900/10 bg-krem
              shadow-kalkik md:right-6 md:bottom-44"
          >
            <header className="flex items-center gap-3 border-b border-kahve-900/10 bg-white px-5 py-3.5">
              <span className="grid size-9 place-items-center rounded-full bg-kahve-900 text-sari-300">
                <DestekIkon className="size-4.5" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-sm font-extrabold text-kahve-900">
                  {c("destek.asistan")}
                </span>
                <span className="block text-2xs font-semibold text-nane-koyu">
                  {c("destek.yanitSuresi")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setAcik(false)}
                aria-label={c("genel.kapat")}
                className="ml-auto grid size-8 place-items-center rounded-xl text-kahve-500
                  transition-colors duration-300 hover:bg-kahve-900/6 hover:text-kahve-900"
              >
                <KapatIkon className="size-4.5" />
              </button>
            </header>

            <div ref={kaydirRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {gecmis.map((b, i) =>
                b.kim === "kullanici" ? (
                  <p
                    key={`k-${i}`}
                    className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-sari-500 px-3.5 py-2
                      text-sm font-semibold text-kahve-900"
                  >
                    {b.metin}
                  </p>
                ) : (
                  <div key={`a-${i}`} className="space-y-2">
                    {(dil === "en" && b.adim.mesajEn ? b.adim.mesajEn : b.adim.mesaj).map((m) => (
                      <p
                        key={m}
                        className="max-w-[88%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2
                          text-sm leading-relaxed text-kahve-800 ring-1 ring-kahve-900/8"
                      >
                        {m}
                      </p>
                    ))}
                    {b.adim.baglanti && (
                      <Link
                        href={b.adim.baglanti.href}
                        onClick={() => setAcik(false)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-kahve-900/5 px-3 py-1.5
                          text-xs font-bold text-sari-700 transition-colors duration-300
                          hover:bg-kahve-900/10"
                      >
                        {secDil(b.adim.baglanti.etiket, b.adim.baglanti.etiketEn)}
                        <OkIkon className="size-3.5" />
                      </Link>
                    )}
                  </div>
                ),
              )}

              {/* Talep başarıyla açıldıysa numara gösterilir */}
              {durum.talepNo && (
                <div className="rounded-2xl bg-nane/12 px-4 py-3 ring-1 ring-nane/25">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-nane-koyu">
                    <KontrolIkon className="size-4" strokeWidth="3" />
                    Talebin alındı
                  </p>
                  <p className="mt-1 text-sm text-kahve-700">
                    Talep numaran <strong className="font-mono">{durum.talepNo}</strong>. E-posta ile
                    dönüş yapacağız.
                  </p>
                </div>
              )}
            </div>

            {/* Seçenekler ya da talep formu */}
            {!durum.talepNo && aktifAdim && (
              <div className="border-t border-kahve-900/10 bg-white px-4 py-3">
                {aktifAdim.talepAc ? (
                  <form action={gonder} className="space-y-2">
                    <input type="hidden" name="konu" value={aktifAdim.konu ?? "Genel destek"} />
                    {durum.hata && (
                      <p role="alert" className="rounded-xl bg-domates/10 px-3 py-2 text-xs font-semibold text-domates-koyu">
                        {durum.hata}
                      </p>
                    )}

                    {/* Girişliyse ad/e-posta oturumdan alınıyor, tekrar sorulmuyor. */}
                    {!(oturum.yuklendi && oturum.girisli) && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="ad"
                          required
                          placeholder={c("destek.adin")}
                          className="rounded-xl border border-kahve-900/12 px-3 py-2 text-sm
                            focus:border-sari-500/60 focus:outline-none"
                        />
                        <input
                          name="eposta"
                          type="email"
                          required
                          placeholder="E-posta"
                          className="rounded-xl border border-kahve-900/12 px-3 py-2 text-sm
                            focus:border-sari-500/60 focus:outline-none"
                        />
                      </div>
                    )}

                    <input
                      name="siparisNo"
                      value={siparisNo}
                      onChange={(e) => setSiparisNo(e.target.value)}
                      placeholder={c("destek.siparisNo")}
                      className="w-full rounded-xl border border-kahve-900/12 px-3 py-2 text-sm
                        focus:border-sari-500/60 focus:outline-none"
                    />

                    <textarea
                      name="mesaj"
                      required
                      rows={3}
                      maxLength={2000}
                      placeholder={c("destek.neOldu")}
                      className="w-full rounded-xl border border-kahve-900/12 px-3 py-2 text-sm
                        focus:border-sari-500/60 focus:outline-none"
                    />

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={bekliyor}
                        className="tiklanabilir flex-1 rounded-xl bg-kahve-900 px-3 py-2.5 text-sm
                          font-bold text-sari-300 transition-colors hover:bg-kahve-800
                          disabled:opacity-50"
                      >
                        {bekliyor ? c("yorum.gonderiliyor") : c("destek.talebiGonder")}
                      </button>
                      <button
                        type="button"
                        onClick={() => adimaGit(DESTEK_BASLANGIC)}
                        className="tiklanabilir rounded-xl border border-kahve-900/12 px-3 py-2.5
                          text-sm font-bold text-kahve-700"
                      >
                        Başa dön
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {aktifAdim.secenekler?.map((s) => (
                      <button
                        key={s.hedef + s.etiket}
                        type="button"
                        onClick={() => sec(s)}
                        className="tiklanabilir rounded-full border border-kahve-900/12 bg-white
                          px-3 py-1.5 text-xs font-bold text-kahve-800 transition-all duration-300
                          hover:-translate-y-0.5 hover:border-sari-500/60 hover:bg-sari-500/10"
                      >
                        {secDil(s.etiket, s.etiketEn)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
