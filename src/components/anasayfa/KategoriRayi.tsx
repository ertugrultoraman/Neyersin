import Image from "next/image";
import Link from "next/link";

import { kategoriGorselleri } from "@/app/admin/kategori-actions";
import { kategoriler, kategoriNotu } from "@/content/kategoriler";
import { KategoriIkon } from "../ui/KategoriIkon";
import { Kademeli, KademeliOge } from "../ui/Reveal";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Kategori şeridi — bilerek KOMPAKT.
 *
 * Önceden iki sıra büyük kart ve tam boy bölüm başlığı vardı; ekranın yarısını
 * kaplayıp asıl iş olan restoran/şef listesini aşağı itiyordu. Artık tek sıra,
 * yatayda kayan küçük kartlar: dar ekranda parmakla sürülüyor, geniş ekranda
 * on iki kategori tek satıra sığıyor.
 *
 * `Bolum` bilerek KULLANILMIYOR: onun `py-14 md:py-20` dolgusu buradaki küçük
 * değeri eziyordu (cn sınıfları yalnızca birleştiriyor), kartlar küçülse de
 * bölüm yine ekranın yarısını kaplıyordu.
 */
export async function KategoriRayi() {
  const c = ceviri(await aktifDil());

  /*
   * Yöneticinin panelden yüklediği fotoğraflar. Yüklenmemiş kategori eskisi
   * gibi ikonla görünüyor — fotoğraf zorunlu değil, eksikse sayfa bozulmuyor.
   */
  const gorseller = await kategoriGorselleri();

  return (
    <section id="kategoriler" className="scroll-mt-28 py-5 md:py-7">
      <div className="kap">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-base font-extrabold text-kahve-900 md:text-lg">
            {c("kategori.baslik")}
          </h2>
          <Link
            href="/restoranlar"
            className="text-xs font-bold whitespace-nowrap text-kahve-500 transition-colors
              duration-300 hover:text-kahve-900"
          >
            {c("genel.tumunuGor")}
          </Link>
        </div>

        <Kademeli
          etiket="ul"
          aralik={0.03}
          className="mt-3 flex gap-2 overflow-x-auto pb-1.5 gizli-scroll"
        >
          {kategoriler.map((k) => (
            <KademeliOge key={k.slug} etiket="li" className="shrink-0">
              <Link
                /* Tıklayınca doğrudan o kategorinin listesine gidiyor. */
                href={`/restoranlar?kategori=${k.slug}`}
                title={`${k.ad} — ${kategoriNotu(k)}`}
                className="group flex w-[5.25rem] flex-col items-center gap-1.5 rounded-2xl border
                  border-kahve-900/6 bg-white/70 px-2 py-2.5 text-center transition-all
                  duration-300 ease-[var(--ease-yumusak)] hover:-translate-y-0.5
                  hover:border-sari-500/50 hover:bg-white md:w-[5.75rem]"
              >
                {gorseller.get(k.slug) ? (
                  <span className="relative size-9 overflow-hidden rounded-xl">
                    <Image
                      src={gorseller.get(k.slug) as string}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover transition-transform duration-500
                        ease-[var(--ease-yayli)] group-hover:scale-110"
                    />
                  </span>
                ) : (
                  <span
                    className="grid size-9 place-items-center rounded-xl bg-sari-500/14
                      text-sari-700 transition-all duration-500 ease-[var(--ease-yayli)]
                      group-hover:-rotate-6 group-hover:bg-sari-500 group-hover:text-kahve-900"
                  >
                    <KategoriIkon ad={k.ikon} className="size-5" />
                  </span>
                )}
                <span className="text-2xs leading-tight font-bold text-kahve-900">{k.ad}</span>
                <span className="text-[0.625rem] leading-none font-medium text-kahve-400">
                  {kategoriNotu(k)}
                </span>
              </Link>
            </KademeliOge>
          ))}
        </Kademeli>
      </div>
    </section>
  );
}
