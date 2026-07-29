import Link from "next/link";

import { sektorler } from "@/content/sektorler";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { Kademeli, KademeliOge } from "../ui/Reveal";

export function SektorOnizleme() {
  return (
    <Bolum id="sektorler" className="bg-krem-koyu/60">
      <BolumBasligi
        ustBaslik="Sektörlere göre otomasyon"
        baslik={
          <>
            Yalnızca restoran değil — <span className="metin-sari">her sektöre</span> özel akış
          </>
        }
        aciklama="Aynı sipariş, kurye ve teslimat altyapısı; sektörün kendi kurallarına göre yapılandırılmış hâliyle."
        yan={
          <ButonBaglanti href="/sektorler" tur="hayalet" boyut="md">
            Tüm sektörler
            <OkIkon />
          </ButonBaglanti>
        }
      />

      <Kademeli
        etiket="ul"
        aralik={0.05}
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {sektorler.map((s) => (
          <KademeliOge key={s.slug} etiket="li">
            <Link
              href={`/sektorler/${s.slug}`}
              className="group flex h-full flex-col rounded-3xl border border-kahve-900/8
                bg-white p-6 kart-kalk hover:border-sari-500/45"
            >
              <span className="font-display text-2xs font-extrabold tracking-[0.16em] text-sari-700 uppercase">
                {s.kisaAd}
              </span>
              <h3 className="mt-2.5 text-lg leading-tight font-extrabold text-kahve-900">
                {s.ad}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-kahve-600">{s.ozet}</p>

              <span className="mt-5 flex items-center justify-between border-t border-kahve-900/8 pt-4">
                <span className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                  {s.otomasyonlar.length} otomasyon
                </span>
                <span
                  className="grid size-8 place-items-center rounded-full bg-sari-500/14 text-sari-700
                    transition-all duration-400 ease-[var(--ease-yumusak)]
                    group-hover:translate-x-0.5 group-hover:bg-sari-500 group-hover:text-kahve-900"
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
                    <path
                      d="M4 10h11m0 0-4.2-4.2M15 10l-4.2 4.2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
            </Link>
          </KademeliOge>
        ))}
      </Kademeli>
    </Bolum>
  );
}
