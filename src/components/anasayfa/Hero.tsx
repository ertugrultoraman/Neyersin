import { restoranlar, TESLIMAT_SURESI } from "@/content/restoranlar";
import { KontrolIkon, SaatIkon, ScooterIkon, YildizIkon } from "../ui/Ikonlar";
import { Reveal } from "../ui/Reveal";
import { Rozet } from "../ui/Rozet";
import { Sayac } from "../ui/Sayac";
import { AramaKutusu } from "./AramaKutusu";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Güven satırı — hepsi bugün DOĞRULANABİLİR sayılar.
 *
 * Buradan "4,8 kullanıcı puanı" ve "24 dk ortalama teslimat" kaldırıldı:
 * platformun henüz tamamlanmış siparişi ve puan veren kullanıcısı yok,
 * dolayısıyla ikisi de ölçülmüş değil uydurulmuş rakamlardı.
 */
/** Teslimat aralığı — elle yazılmış bir süre değil, tek sabitten geliyor. */
const SURE_ARALIGI = `${TESLIMAT_SURESI[0]}–${TESLIMAT_SURESI[1]}`;

const GUVEN: { hedef: number; sonEk: string; etiket: string; ondalik?: number }[] = [
  { hedef: restoranlar.length, sonEk: "", etiket: "hero.guvenMutfak" },
  { hedef: 0, sonEk: " TL", etiket: "hero.guvenTeslimat" },
  { hedef: 1, sonEk: "", etiket: "hero.guvenIlce" },
  { hedef: 3, sonEk: "", etiket: "hero.guvenPuanlama" },
];

export async function Hero() {
  const c = ceviri(await aktifDil());

  return (
    <section className="relative overflow-hidden pt-10 pb-10 md:pt-16 md:pb-14">
      {/* Zemin katmanları */}
      <div aria-hidden="true" className="absolute inset-0 isik" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[34rem] doku opacity-40
          [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-24 size-72 rounded-full
          bg-sari-400/25 blur-3xl md:size-96"
      />

      <div className="kap relative">
        {/*
          TEK KOLON. Sağda duran çizim kaldırıldı: ürünün kendisinden değil, üretilmiş
          bir illüstrasyondan geliyordu ve üstündeki "kurye yolda", "19:24 varış" gibi
          rozetler gerçek bir siparişi değil kurgusal bir sahneyi gösteriyordu.

          grid-cols-1 zorunlu: implicit `auto` kolon, içindeki yatay kaydırmalı
          kategori şeridinin max-content genişliğiyle şişiyor (mobilde 663px).
        */}
        <div className="grid grid-cols-1 gap-12">
          <div className="max-w-3xl">
            <Reveal>
              <Rozet ton="kahve" className="mb-6">
                <ScooterIkon className="size-3.5" />
                {c("hero.rozet")}
              </Rozet>
            </Reveal>

            <Reveal gecikme={0.06}>
              <h1 className="text-[2.5rem] leading-[1.02] font-extrabold sm:text-5xl lg:text-[3.75rem]">
                {/* Marka adı geçtiği için "Yersin" büyük harfle — logoyla aynı. */}
                Ne Yersin?
                <br />
                <span className="relative inline-block">
                  <span className="metin-sari">{c("hero.vurgu")}</span>
                  <svg
                    viewBox="0 0 200 12"
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-2.5 w-full text-sari-500"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 8c40-5 90-7 196-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                {c("hero.baslikSonu")}
              </h1>
            </Reveal>

            <Reveal gecikme={0.12}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-kahve-600">
                {c("hero.aciklama")}
              </p>
            </Reveal>

            <Reveal gecikme={0.18} className="mt-9">
              <AramaKutusu />
            </Reveal>

            {/* Güven göstergeleri */}
            <Reveal gecikme={0.26}>
              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                {GUVEN.map((g) => (
                  <div key={g.etiket}>
                    <dt className="sr-only">{c(g.etiket)}</dt>
                    <dd>
                      <span className="font-display text-2xl font-extrabold text-kahve-900 md:text-3xl">
                        <Sayac hedef={g.hedef} sonEk={g.sonEk} ondalik={g.ondalik ?? 0} />
                      </span>
                      <span className="mt-1 block text-xs leading-snug font-medium text-kahve-500">
                        {c(g.etiket)}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/*
              Çizim kalkınca üstündeki iki gerçek bilgi — tahmini süre ve puanlama
              başlıkları — kaybolmasın diye bu satıra taşındı. "Kurye yolda" rozeti
              taşınmadı: canlı takip zaten aşağıdaki maddede yazıyor, o rozet
              yalnızca çizimdeki sahneyi süslüyordu.
            */}
            <Reveal gecikme={0.32}>
              <ul className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-kahve-600">
                <li className="flex items-center gap-1.5">
                  <SaatIkon className="size-4 text-nane" />
                  {c("hero.tahminiSure", { sure: SURE_ARALIGI })}
                </li>
                {["hero.ucretsizTeslimat", "hero.kapidaOdeme", "hero.canliTakip"].map((anahtar) => (
                  <li key={anahtar} className="flex items-center gap-1.5">
                    <KontrolIkon className="size-4 text-nane" />
                    {c(anahtar)}
                  </li>
                ))}
                <li className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <YildizIkon key={i} className="size-3.5 text-sari-500" />
                    ))}
                  </span>
                  {c("hero.sicaklikHizTad")}
                </li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
