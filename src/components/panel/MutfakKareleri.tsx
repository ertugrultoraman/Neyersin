"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  mutfakKaresiSilAction,
  mutfakKaresiYukleAction,
  type GaleriDurumu,
} from "@/app/panel/galeri-actions";
import { AZAMI_KARE } from "@/lib/mutfak-kare";
import { Uyari } from "../hesap/Alan";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: GaleriDurumu = {};

/**
 * MUTFAKTAN KARELER — şefin kendi fotoğraflarını yönettiği alan.
 *
 * PROFİL FORMUNDAN AYRI: burası dosya yüklüyor, o form metin kaydediyor.
 * Aynı forma konsaydı şef tek bir kare eklemek için bütün profili yeniden
 * göndermek zorunda kalırdı (bkz. panel/galeri-actions).
 *
 * YÜZ FOTOĞRAFININ YERİNE GEÇMİYOR: yüzünü koymak istemeyen ev hanımı için
 * de bir yol. Tencerenin başındaki bir kare de "bunu kim, nerede pişiriyor"
 * sorusuna cevap veriyor.
 */
export function MutfakKareleri({
  kareler,
  restoranSlug,
  adminMi = false,
}: {
  kareler: string[];
  restoranSlug: string;
  adminMi?: boolean;
}) {
  const { c } = useDil();
  const [yukleDurumu, yukle, yukleniyor] = useActionState(mutfakKaresiYukleAction, BASLANGIC);
  const [silDurumu, sil, siliniyor] = useActionState(mutfakKaresiSilAction, BASLANGIC);

  const hata = yukleDurumu.hata ?? silDurumu.hata;
  const basari = yukleDurumu.basari ?? silDurumu.basari;
  const doldu = kareler.length >= AZAMI_KARE;

  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-base font-extrabold text-kahve-900">
          {c("profil.mutfagindan")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-kahve-500">
          {c("profil.kareAciklama", { adet: AZAMI_KARE })}
        </p>
      </div>

      {hata && <Uyari tur="hata">{hata}</Uyari>}
      {basari && <Uyari tur="basari">{basari}</Uyari>}

      {kareler.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {kareler.map((url) => (
            <li key={url} className="relative">
              <span className="relative block aspect-square overflow-hidden rounded-2xl border border-kahve-900/8">
                <Image src={url} alt="" fill sizes="160px" className="object-cover" />
              </span>
              <form action={sil}>
                {adminMi && <input type="hidden" name="restoranSlug" value={restoranSlug} />}
                <input type="hidden" name="url" value={url} />
                <button
                  type="submit"
                  disabled={siliniyor}
                  className="tiklanabilir mt-1.5 w-full rounded-full border border-domates/30 py-1
                    text-2xs font-bold text-domates-koyu transition-colors hover:bg-domates/8
                    disabled:opacity-50"
                >
                  {c("profil.kareKaldir")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/*
        Kutu DOLUYSA yükleme alanı hiç çizilmiyor: gri bir "seç" düğmesi
        bırakmak, dokununca bir şey olacakmış izlenimi verirdi.
      */}
      {doldu ? (
        <p className="text-xs font-semibold text-kahve-500">
          {c("profil.kareDolu", { adet: AZAMI_KARE })}
        </p>
      ) : (
        <form action={yukle} className="flex flex-wrap items-center gap-3">
          {adminMi && <input type="hidden" name="restoranSlug" value={restoranSlug} />}
          <input
            type="file"
            name="kare"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
            className="max-w-full text-xs text-kahve-600 file:mr-3 file:rounded-full
              file:border-0 file:bg-kahve-900/8 file:px-3 file:py-1.5 file:text-xs
              file:font-bold file:text-kahve-800"
          />
          <button
            type="submit"
            disabled={yukleniyor}
            className="tiklanabilir rounded-full bg-kahve-900 px-4 py-2 text-xs font-bold
              text-sari-300 transition-colors hover:bg-kahve-800 disabled:opacity-50"
          >
            {yukleniyor ? c("profil.kareYukleniyor") : c("profil.kareEkle")}
          </button>
        </form>
      )}
    </div>
  );
}
