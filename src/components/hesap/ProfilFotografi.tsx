"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  profilFotografiSilAction,
  profilFotografiYukleAction,
  type FotografDurumu,
} from "@/app/hesap/fotograf-actions";
import { Uyari } from "@/components/hesap/Alan";
import { useDil } from "@/components/saglayici/DilBaglami";
import { cn } from "@/lib/utils";

const BASLANGIC: FotografDurumu = {};

/**
 * Adın baş harfleri — fotoğrafı olmayan hesabın yer tutucusu.
 *
 * Boş gri bir daire yerine harf konuyor: listede kimin kim olduğu fotoğraf
 * yüklenmemişken de bir bakışta ayırt edilebilsin.
 */
function basHarfler(ad: string): string {
  const parcalar = ad.trim().split(/\s+/).filter(Boolean);
  if (parcalar.length === 0) return "?";
  const harfler = parcalar.length === 1 ? parcalar[0].slice(0, 2) : parcalar[0][0] + parcalar[1][0];
  return harfler.toLocaleUpperCase("tr-TR");
}

/**
 * Hesabın yuvarlak profil görseli. Fotoğraf yoksa baş harfler.
 *
 * `alt` bilerek boş: görselin hemen yanında kişinin adı yazıyor, ekran
 * okuyucu aynı ismi iki kez okumasın.
 */
export function ProfilAvatari({
  ad,
  url,
  className = "size-14 text-sm",
}: {
  ad: string;
  url?: string;
  /** Boyut ve yazı ölçüsü — çağıran yer belirliyor. */
  className?: string;
}) {
  if (url) {
    return (
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border border-kahve-900/8 bg-kahve-900/6",
          className,
        )}
      >
        <Image src={url} alt="" fill sizes="128px" className="object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        `grid shrink-0 place-items-center rounded-full border border-sari-500/30
         bg-sari-500/18 font-display font-extrabold text-kahve-700`,
        className,
      )}
      aria-hidden="true"
    >
      {basHarfler(ad)}
    </span>
  );
}

/**
 * Profil fotoğrafı alanı: önizleme, yükleme ve kaldırma.
 *
 * `eposta` verilirse o hesabın fotoğrafı düzenlenir; verilmezse oturumun
 * kendi hesabı. Hangi hesabın düzenlendiğine karar veren yer SUNUCU
 * (bkz. app/hesap/fotograf-actions.ts) — buradaki alan tek başına yetki
 * taşımıyor.
 */
export function ProfilFotografiAlani({
  ad,
  url,
  eposta,
  kimlik,
}: {
  ad: string;
  url?: string;
  eposta?: string;
  /** Dosya seçici etiketini eşleştirmek için benzersiz ek — listede tekrarlıyor. */
  kimlik: string;
}) {
  const { c } = useDil();
  const [yukleDurumu, yukle, yukleBekliyor] = useActionState(
    profilFotografiYukleAction,
    BASLANGIC,
  );
  const [silDurumu, sil, silBekliyor] = useActionState(profilFotografiSilAction, BASLANGIC);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <ProfilAvatari ad={ad} url={url} className="size-20 text-lg" />

        <form action={yukle} className="min-w-[13rem] flex-1 space-y-2">
          {eposta && <input type="hidden" name="eposta" value={eposta} />}
          <label className="sr-only" htmlFor={`fotograf-${kimlik}`}>
            {c("fotograf.dosyaSec")}
          </label>
          <input
            id={`fotograf-${kimlik}`}
            type="file"
            name="fotograf"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
            className="block w-full text-xs text-kahve-600
              file:mr-2 file:rounded-xl file:border-0 file:bg-kahve-900/6 file:px-3 file:py-2
              file:text-xs file:font-bold file:text-kahve-800 hover:file:bg-kahve-900/10"
          />
          <p className="text-xs text-kahve-500">{c("fotograf.kural")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={yukleBekliyor}
              className="tiklanabilir rounded-xl bg-kahve-900 px-3.5 py-2 text-xs font-bold
                text-sari-300 transition-colors hover:bg-kahve-800
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              {yukleBekliyor
                ? c("fotograf.yukleniyor")
                : url
                  ? c("fotograf.degistir")
                  : c("fotograf.yukle")}
            </button>
          </div>
        </form>
      </div>

      {url && (
        <form action={sil} className="mt-2">
          {eposta && <input type="hidden" name="eposta" value={eposta} />}
          <button
            type="submit"
            disabled={silBekliyor}
            className="tiklanabilir text-xs font-bold text-domates-koyu underline
              underline-offset-2 disabled:opacity-50"
          >
            {silBekliyor ? "…" : c("fotograf.kaldir")}
          </button>
        </form>
      )}

      {yukleDurumu.hata && (
        <div className="mt-2">
          <Uyari tur="hata">{yukleDurumu.hata}</Uyari>
        </div>
      )}
      {yukleDurumu.basari && (
        <div className="mt-2">
          <Uyari tur="basari">{yukleDurumu.basari}</Uyari>
        </div>
      )}
      {silDurumu.hata && (
        <div className="mt-2">
          <Uyari tur="hata">{silDurumu.hata}</Uyari>
        </div>
      )}
      {silDurumu.basari && (
        <div className="mt-2">
          <Uyari tur="basari">{silDurumu.basari}</Uyari>
        </div>
      )}
    </div>
  );
}
