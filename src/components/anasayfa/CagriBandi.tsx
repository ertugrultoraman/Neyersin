import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { DukkanIkon, KontrolIkon, ScooterIkon } from "../ui/Ikonlar";
import { Reveal } from "../ui/Reveal";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

const KARTLAR = [
  {
    id: "restoran-ekle",
    href: "/iletisim?konu=restoran",
    Ikon: DukkanIkon,
    ustBaslik: "cagri.isletmelerIcin",
    baslik: "cagri.isletmeBaslik",
    metin:
      "cagri.isletmeOzet",
    maddeler: ["cagri.isletmeMadde1", "cagri.isletmeMadde2", "cagri.isletmeMadde3"],
    buton: "cagri.basvuruYap",
    ton: "sari" as const,
  },
  {
    id: "kurye-ol",
    href: "/iletisim?konu=kurye",
    Ikon: ScooterIkon,
    ustBaslik: "cagri.kuryelerIcin",
    baslik: "cagri.kuryeBaslik",
    metin:
      "cagri.kuryeOzet",
    maddeler: ["cagri.kuryeMadde1", "cagri.kuryeMadde2", "cagri.kuryeMadde3"],
    buton: "cagri.kuryeBasvurusu",
    ton: "kahve" as const,
  },
];

const TONLAR = {
  sari: {
    kart: "bg-gradient-to-br from-sari-300 via-sari-400 to-sari-500 text-kahve-900",
    ikon: "bg-kahve-900/12 text-kahve-900",
    ust: "text-kahve-700",
    metin: "text-kahve-800/85",
    tik: "text-kahve-900",
    buton: "ikincil" as const,
  },
  kahve: {
    kart: "bg-gradient-to-br from-kahve-700 via-kahve-800 to-kahve-900 text-white",
    ikon: "bg-sari-500/18 text-sari-400",
    ust: "text-sari-400",
    metin: "text-kahve-200/85",
    tik: "text-sari-400",
    buton: "birincil" as const,
  },
};

export async function CagriBandi() {
  const c = ceviri(await aktifDil());

  return (
    <section id="iletisim" className="scroll-mt-28 py-14 md:py-20">
      <div className="kap grid grid-cols-1 gap-5 lg:grid-cols-2">
        {KARTLAR.map((k, i) => {
          const ton = TONLAR[k.ton];
          return (
            <Reveal key={k.id} gecikme={i * 0.1}>
              <article
                id={k.id}
                className={`group relative flex h-full scroll-mt-28 flex-col overflow-hidden
                  rounded-[2rem] p-8 kart-kalk md:p-10 ${ton.kart}`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full
                    border-[18px] border-white/10 transition-transform duration-700
                    ease-[var(--ease-yumusak)] group-hover:scale-110"
                />

                <span className={`relative grid size-12 place-items-center rounded-2xl ${ton.ikon}`}>
                  <k.Ikon className="size-6" />
                </span>

                <p
                  className={`relative mt-6 text-2xs font-extrabold tracking-[0.18em] uppercase ${ton.ust}`}
                >
                  {c(k.ustBaslik)}
                </p>
                <h2 className="relative mt-2 text-2xl leading-tight font-extrabold sm:text-3xl">
                  {c(k.baslik)}
                </h2>
                <p className={`relative mt-3.5 max-w-md leading-relaxed ${ton.metin}`}>{c(k.metin)}</p>

                <ul className="relative mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                  {k.maddeler.map((m) => (
                    <li key={m} className="flex items-center gap-1.5">
                      <KontrolIkon className={`size-4 ${ton.tik}`} strokeWidth="2.6" />
                      {c(m)}
                    </li>
                  ))}
                </ul>

                <div className="relative mt-8">
                  <ButonBaglanti href={k.href} tur={ton.buton} boyut="lg">
                    {c(k.buton)}
                    <OkIkon />
                  </ButonBaglanti>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
