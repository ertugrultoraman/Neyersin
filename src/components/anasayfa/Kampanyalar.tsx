import { kampanyalar, type Kampanya } from "@/content/kampanyalar";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { SimsekIkon } from "../ui/Ikonlar";
import { Kademeli, KademeliOge } from "../ui/Reveal";

/** Tailwind sınıfları statik kalmalı — tonlar sabit eşlemeyle veriliyor. */
const TONLAR: Record<Kampanya["ton"], { kart: string; vurgu: string; ikon: string }> = {
  sari: {
    kart: "bg-gradient-to-br from-sari-300 to-sari-500 text-kahve-900",
    vurgu: "text-kahve-900",
    ikon: "bg-kahve-900/12 text-kahve-900",
  },
  kahve: {
    kart: "bg-gradient-to-br from-kahve-700 to-kahve-900 text-sari-100",
    vurgu: "text-sari-400",
    ikon: "bg-white/12 text-sari-400",
  },
  domates: {
    kart: "bg-gradient-to-br from-domates to-domates-koyu text-white",
    vurgu: "text-white",
    ikon: "bg-white/18 text-white",
  },
  nane: {
    kart: "bg-gradient-to-br from-nane to-nane-koyu text-white",
    vurgu: "text-white",
    ikon: "bg-white/18 text-white",
  },
};

export function Kampanyalar() {
  return (
    <Bolum id="kampanyalar">
      <BolumBasligi
        ustBaslik="Fırsatlar"
        baslik="Bu haftanın kampanyaları"
        aciklama="Kodları sipariş sırasında gir, indirim sepette otomatik uygulanır."
        yan={
          <ButonBaglanti href="#restoranlar" tur="hayalet" boyut="md">
            Tümünü gör
            <OkIkon />
          </ButonBaglanti>
        }
      />

      <Kademeli
        etiket="ul"
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {kampanyalar.map((k, i) => {
          const ton = TONLAR[k.ton];
          const genis = i === 0;

          return (
            <KademeliOge
              key={k.slug}
              etiket="li"
              className={genis ? "sm:col-span-2" : undefined}
            >
              <article
                className={`group relative flex h-full flex-col overflow-hidden rounded-4xl
                  p-6 kart-kalk md:p-7 ${ton.kart}`}
              >
                {/* Dekoratif halkalar */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 -right-12 size-44 rounded-full
                    border-[14px] border-white/10 transition-transform duration-700
                    ease-[var(--ease-yumusak)] group-hover:scale-110"
                />

                <span
                  className={`relative grid size-11 place-items-center rounded-2xl ${ton.ikon}`}
                >
                  <SimsekIkon className="size-5.5" />
                </span>

                <p
                  className={`relative mt-5 font-display leading-none font-extrabold ${ton.vurgu}
                    ${genis ? "text-6xl md:text-7xl" : "text-4xl"}`}
                >
                  {k.vurgu}
                </p>

                <h3
                  className={`relative mt-4 font-extrabold ${genis ? "text-2xl md:text-3xl" : "text-lg"}
                    ${k.ton === "sari" ? "text-kahve-900" : "text-inherit"}`}
                >
                  {k.baslik}
                </h3>

                <p className="relative mt-2.5 flex-1 text-sm leading-relaxed opacity-85">
                  {k.aciklama}
                </p>

                {k.kod && (
                  <p className="relative mt-5">
                    <span
                      className="inline-flex items-center gap-2 rounded-xl border border-current/25
                        border-dashed px-3 py-2 font-mono text-sm font-bold tracking-wider"
                    >
                      {k.kod}
                    </span>
                  </p>
                )}
              </article>
            </KademeliOge>
          );
        })}
      </Kademeli>
    </Bolum>
  );
}
