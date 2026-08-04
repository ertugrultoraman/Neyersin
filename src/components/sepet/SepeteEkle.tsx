"use client";

import { useState } from "react";

import type { Urun } from "@/content/menuler";
import type { SecilenEkstra } from "@/lib/siparis";
import { cn, paraFormatla } from "@/lib/utils";
import { useSepet } from "../saglayici/SepetBaglami";
import { useDil } from "../saglayici/DilBaglami";
import { Buton } from "../ui/Buton";
import { AyarIkon, SepetIkon } from "../ui/Ikonlar";
import { Katman } from "../ui/Katman";
import { sepeteUcur } from "./SepeteUcus";

/**
 * Ürün kartındaki sepete ekleme kontrolü.
 * Sepette adet yoksa buton, varsa adet ayarlayıcı gösterir.
 */
export function SepeteEkle({
  restoranSlug,
  restoranAdi,
  urun,
  tamGenislik = false,
  gorselUrl,
}: {
  restoranSlug: string;
  /** Mutfağın adı sepete yazılır — şef mutfakları sabit içerikte aranamıyor. */
  restoranAdi: string;
  urun: Urun;
  tamGenislik?: boolean;
  /** Sepete uçan öğede gösterilecek ürün görseli (varsa). */
  gorselUrl?: string;
}) {
  const { ekle, sifirlaVeEkle, adetAyarla, urunAdedi, setCekmeceAcik } = useSepet();
  const { c, s: secDil } = useDil();
  const mutfak = { slug: restoranSlug, ad: restoranAdi };
  const [catisma, setCatisma] = useState<string | null>(null);
  const [ozellestirAcik, setOzellestirAcik] = useState(false);
  const [secili, setSecili] = useState<string[]>([]);
  const adet = urunAdedi(urun.id);

  const ekstralar = urun.ekstralar ?? [];
  const malzemeler = ekstralar.filter((e) => e.tur !== "icecek");
  const icecekler = ekstralar.filter((e) => e.tur === "icecek");

  function secimiDegistir(id: string) {
    setSecili((o) => (o.includes(id) ? o.filter((s) => s !== id) : [...o, id]));
  }

  function eklemeyiDene(secilenEkstralar?: SecilenEkstra[], kaynak?: HTMLElement | null) {
    const sonuc = ekle(mutfak, urun, 1, secilenEkstralar);
    if (sonuc.durum === "farkli-restoran") {
      setCatisma(sonuc.mevcutRestoran);
    } else {
      setOzellestirAcik(false);
      setSecili([]);
      // Ürün, basılan düğmeden sağ alttaki sepete doğru uçar.
      void sepeteUcur(kaynak ?? null, gorselUrl);
    }
  }

  function ozellestirilmisEkle(olay: React.MouseEvent<HTMLButtonElement>) {
    const secilenler: SecilenEkstra[] = ekstralar
      .filter((e) => secili.includes(e.id))
      .map((e) => ({ id: e.id, ad: e.ad, fiyat: e.fiyat }));
    eklemeyiDene(secilenler, olay.currentTarget);
  }

  if (ekstralar.length > 0) {
    return (
      <>
        <Buton
          type="button"
          boyut="sm"
          tur="hayalet"
          onClick={() => setOzellestirAcik(true)}
          className={tamGenislik ? "w-full" : undefined}
          ikon={<AyarIkon className="size-4" />}
        >
          {c("sepet.ozellestir")}
        </Buton>

        <Katman
          acik={ozellestirAcik}
          kapat={() => setOzellestirAcik(false)}
          konum="orta"
          baslik={secDil(urun.ad, urun.adEn)}
          aciklama={secDil(urun.aciklama, urun.aciklamaEn)}
          altBolum={
            <Buton type="button" boyut="lg" className="w-full" onClick={ozellestirilmisEkle}>
              {c("sepet.ekle")} —{" "}
              {paraFormatla(
                urun.fiyat +
                  secili.reduce(
                    (t, id) => t + (ekstralar.find((e) => e.id === id)?.fiyat ?? 0),
                    0,
                  ),
              )}
            </Buton>
          }
        >
          <div className="space-y-6 px-6 py-5">
            {malzemeler.length > 0 && (
              <fieldset>
                <legend className="text-xs font-bold tracking-wide text-kahve-500 uppercase">
                  {c("sepet.ekstraMalzeme")}
                </legend>
                <div className="mt-3 space-y-2">
                  {malzemeler.map((e) => (
                    <EkstraSatiri
                      key={e.id}
                      ekstra={e}
                      secili={secili.includes(e.id)}
                      onDegis={() => secimiDegistir(e.id)}
                    />
                  ))}
                </div>
              </fieldset>
            )}

            {icecekler.length > 0 && (
              <fieldset>
                <legend className="text-xs font-bold tracking-wide text-kahve-500 uppercase">
                  {c("sepet.icecekEkle")}
                </legend>
                <div className="mt-3 space-y-2">
                  {icecekler.map((e) => (
                    <EkstraSatiri
                      key={e.id}
                      ekstra={e}
                      secili={secili.includes(e.id)}
                      onDegis={() => secimiDegistir(e.id)}
                    />
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </Katman>

        <CatismaKatmani
          catisma={catisma}
          kapat={() => setCatisma(null)}
          urunAdi={secDil(urun.ad, urun.adEn)}
          onDegistir={() => {
            sifirlaVeEkle(mutfak, urun);
            setCatisma(null);
            setCekmeceAcik(true);
          }}
        />
      </>
    );
  }

  if (adet > 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-sari-500 p-1 shadow-sari",
          tamGenislik && "w-full justify-between",
        )}
      >
        <button
          type="button"
          onClick={() => adetAyarla(urun.id, adet - 1)}
          aria-label={c("sepet.adediAzalt", { ad: secDil(urun.ad, urun.adEn) })}
          className="grid size-8 place-items-center rounded-full text-kahve-900
            transition-colors duration-300 hover:bg-kahve-900/12"
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
            <path d="M5 10h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <span
          aria-live="polite"
          className="min-w-6 text-center font-display text-sm font-extrabold text-kahve-900"
        >
          {adet}
        </span>
        <button
          type="button"
          onClick={(olay) => {
            adetAyarla(urun.id, adet + 1);
            void sepeteUcur(olay.currentTarget, gorselUrl);
          }}
          aria-label={c("sepet.adediArtir", { ad: secDil(urun.ad, urun.adEn) })}
          className="grid size-8 place-items-center rounded-full text-kahve-900
            transition-colors duration-300 hover:bg-kahve-900/12"
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
            <path
              d="M10 5v10M5 10h10"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <Buton
        type="button"
        boyut="sm"
        onClick={(olay) => eklemeyiDene(undefined, olay.currentTarget)}
        className={tamGenislik ? "w-full" : undefined}
        ikon={<SepetIkon className="size-4" />}
      >
        {c("sepet.ekle")}
      </Buton>

      <CatismaKatmani
        catisma={catisma}
        kapat={() => setCatisma(null)}
        urunAdi={secDil(urun.ad, urun.adEn)}
        onDegistir={() => {
          sifirlaVeEkle(mutfak, urun);
          setCatisma(null);
          setCekmeceAcik(true);
        }}
      />
    </>
  );
}

function EkstraSatiri({
  ekstra,
  secili,
  onDegis,
}: {
  ekstra: { id: string; ad: string; fiyat: number };
  secili: boolean;
  onDegis: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 transition-colors duration-300",
        secili ? "border-sari-500 bg-sari-500/8" : "border-kahve-900/10 hover:border-kahve-900/25",
      )}
    >
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={secili}
          onChange={onDegis}
          className="size-4 accent-sari-600"
        />
        <span className="text-sm font-semibold text-kahve-900">{ekstra.ad}</span>
      </span>
      <span className="text-sm font-bold text-kahve-600">+{paraFormatla(ekstra.fiyat)}</span>
    </label>
  );
}

function CatismaKatmani({
  catisma,
  kapat,
  urunAdi,
  onDegistir,
}: {
  catisma: string | null;
  kapat: () => void;
  urunAdi: string;
  onDegistir: () => void;
}) {
  const { c } = useDil();

  return (
    <Katman
      acik={catisma !== null}
      kapat={kapat}
      konum="orta"
      baslik={c("sepet.catismaBaslik")}
      aciklama={c("sepet.catismaAciklama")}
    >
      <div className="px-6 py-5">
        <p className="text-sm leading-relaxed text-kahve-700">
          {c("sepet.catismaMetin", { mutfak: catisma ?? "", urun: urunAdi })}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Buton type="button" boyut="md" className="flex-1" onClick={onDegistir}>
            {c("sepet.sepetiDegistir")}
          </Buton>
          <Buton type="button" tur="hayalet" boyut="md" className="flex-1" onClick={kapat}>
            {c("genel.vazgec")}
          </Buton>
        </div>
      </div>
    </Katman>
  );
}
