import { Bolum, BolumBasligi } from "../ui/Bolum";
import { AraIkon, MutfakIkon, UcTekerIkon, KontrolIkon } from "../ui/Ikonlar";
import { Kademeli, KademeliOge } from "../ui/Reveal";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

const ADIMLAR = [
  {
    Ikon: AraIkon,
    baslik: "nasil.adim1",
    metin: "nasil.adim1Metin",
  },
  {
    Ikon: MutfakIkon,
    baslik: "nasil.adim2",
    metin: "nasil.adim2Metin",
  },
  {
    Ikon: UcTekerIkon,
    baslik: "nasil.adim3",
    metin: "nasil.adim3Metin",
  },
  {
    Ikon: KontrolIkon,
    baslik: "nasil.adim4",
    metin: "nasil.adim4Metin",
  },
];

export async function NasilCalisir() {
  const c = ceviri(await aktifDil());

  return (
    <Bolum id="nasil-calisir" className="relative overflow-hidden">
      <BolumBasligi
        ortala
        ustBaslik={c("nasil.ustBaslik")}
        baslik={
          <>
            {c("nasil.baslik1")} <span className="metin-sari">{c("nasil.baslik2")}</span>
          </>
        }
        aciklama={c("nasil.aciklama")}
      />

      <div className="relative mt-14">
        {/* Adımları birleştiren kesikli çizgi */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1000 8"
          preserveAspectRatio="none"
          className="absolute top-7 right-[12%] left-[12%] hidden h-2 text-sari-500/45 lg:block"
        >
          <path
            d="M0 4h1000"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="10 12"
            strokeLinecap="round"
          />
        </svg>

        <Kademeli
          etiket="ol"
          aralik={0.12}
          className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {ADIMLAR.map((adim, i) => (
            <KademeliOge key={c(adim.baslik)} etiket="li" className="text-center">
              <span
                className="relative mx-auto grid size-14 place-items-center rounded-3xl
                  bg-sari-500 text-kahve-900 shadow-sari"
              >
                <adim.Ikon className="size-6.5" />
                <span
                  className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full
                    bg-kahve-900 font-display text-xs font-extrabold text-sari-300"
                >
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-xl font-extrabold">{c(adim.baslik)}</h3>
              <p className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed text-kahve-600">
                {c(adim.metin)}
              </p>
            </KademeliOge>
          ))}
        </Kademeli>
      </div>
    </Bolum>
  );
}
