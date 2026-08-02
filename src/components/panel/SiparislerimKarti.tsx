import Link from "next/link";

import { OkIkon } from "@/components/ui/Buton";
import { SepetIkon } from "@/components/ui/Ikonlar";

/**
 * Profildeki "Siparişlerim" girişi.
 *
 * Siparişler artık profilin içinde upuzun bir liste olarak durmuyor; profil
 * kimlik ve ayar ekranı, siparişler ise tıklanıp girilen kendi ekranı oldu.
 * Şef ve kuryede burada iki sayı yan yana duruyor (gelen / verilen) — hangi
 * listeye gireceğini karta bakarak anlıyor.
 */
export function SiparislerimKarti({
  sayilar,
}: {
  sayilar: { etiket: string; deger: number; sekme?: string }[];
}) {
  return (
    <Link
      href="/siparislerim"
      className="tiklanabilir group flex flex-wrap items-center justify-between gap-x-8 gap-y-4
        rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart
        transition-[border-color,transform] duration-300 ease-[var(--ease-yumusak)]
        hover:-translate-y-0.5 hover:border-sari-500/50 md:p-8"
    >
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sari-500 text-kahve-900">
          <SepetIkon className="size-6" />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-kahve-900">Siparişlerim</h2>
          <p className="mt-0.5 text-sm text-kahve-600">
            Geçmiş siparişlerin, durumları ve destek.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <dl className="flex gap-6">
          {sayilar.map((s) => (
            <div key={s.etiket}>
              <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                {s.etiket}
              </dt>
              <dd className="mt-0.5 font-display text-2xl font-extrabold text-kahve-900">
                {s.deger}
              </dd>
            </div>
          ))}
        </dl>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-kahve-900/5
            text-kahve-600 transition-colors duration-300 group-hover:bg-sari-500
            group-hover:text-kahve-900"
        >
          <OkIkon className="size-4" />
        </span>
      </div>
    </Link>
  );
}
