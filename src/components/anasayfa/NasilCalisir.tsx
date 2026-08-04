import { Bolum, BolumBasligi } from "../ui/Bolum";
import { AraIkon, MutfakIkon, UcTekerIkon, KontrolIkon } from "../ui/Ikonlar";
import { Kademeli, KademeliOge } from "../ui/Reveal";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

const ADIMLAR = [
  {
    Ikon: AraIkon,
    baslik: "Seç",
    metin:
      "Adresini gir, bölgendeki restoranları puan, süre ve kampanyaya göre filtrele. " +
      "Sepetini oluştur.",
  },
  {
    Ikon: MutfakIkon,
    baslik: "Mutfak hazırlar",
    metin:
      "Sipariş tek kuyruğa düşer, mutfak ekranında sıraya girer. Hazırlık süresi anlık " +
      "yoğunluğa göre hesaplanır.",
  },
  {
    Ikon: UcTekerIkon,
    baslik: "Kurye yola çıkar",
    metin:
      "Kurye, yemeğin tahmini bitiş saatine göre atanır. Mutfağa yemekle aynı anda ulaşır.",
  },
  {
    Ikon: KontrolIkon,
    baslik: "Kapında",
    metin:
      "Yol boyunca canlı takip. Söz verilen dakikada, sıcaklığını koruyarak teslim edilir.",
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
            Dört adım, <span className="metin-sari">tek sistem</span>
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
            <KademeliOge key={adim.baslik} etiket="li" className="text-center">
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
              <h3 className="mt-5 text-xl font-extrabold">{adim.baslik}</h3>
              <p className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed text-kahve-600">
                {adim.metin}
              </p>
            </KademeliOge>
          ))}
        </Kademeli>
      </div>
    </Bolum>
  );
}
