import { restoranlar, TESLIMAT_SURESI } from "@/content/restoranlar";
import { AkilliGorsel } from "../ui/AkilliGorsel";
import { KontrolIkon, SaatIkon, ScooterIkon, YildizIkon } from "../ui/Ikonlar";
import { Reveal } from "../ui/Reveal";
import { Rozet } from "../ui/Rozet";
import { Sayac } from "../ui/Sayac";
import { AramaKutusu } from "./AramaKutusu";

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
  { hedef: restoranlar.length, sonEk: "", etiket: "mutfak ve mağaza" },
  { hedef: 0, sonEk: " TL", etiket: "teslimat ücreti" },
  { hedef: 1, sonEk: "", etiket: "ilçe: Beylikdüzü" },
  { hedef: 3, sonEk: "", etiket: "puanlama başlığı" },
];

export function Hero() {
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
        {/* grid-cols-1 zorunlu: implicit `auto` kolon, içindeki yatay kaydırmalı
            kategori şeridinin max-content genişliğiyle şişiyor (mobilde 663px). */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Sol kolon — mesaj ve arama */}
          <div>
            <Reveal>
              <Rozet ton="kahve" className="mb-6">
                <ScooterIkon className="size-3.5" />
                {"Yemek ve Kurye Sistemi"}
              </Rozet>
            </Reveal>

            <Reveal gecikme={0.06}>
              <h1 className="text-[2.5rem] leading-[1.02] font-extrabold sm:text-5xl lg:text-[3.75rem]">
                Ne yersin?
                <br />
                <span className="relative inline-block">
                  <span className="metin-sari">Söyle</span>
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
                gerisini biz halledelim.
              </h1>
            </Reveal>

            <Reveal gecikme={0.12}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-kahve-600">
                Sipariş, mutfak, kurye ve teslimat takibi tek sistemde. Sen sadece ne
                yiyeceğine karar ver — sıcak, hızlı ve söz verdiğimiz dakikada kapında.
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
                    <dt className="sr-only">{g.etiket}</dt>
                    <dd>
                      <span className="font-display text-2xl font-extrabold text-kahve-900 md:text-3xl">
                        <Sayac hedef={g.hedef} sonEk={g.sonEk} ondalik={g.ondalik ?? 0} />
                      </span>
                      <span className="mt-1 block text-xs leading-snug font-medium text-kahve-500">
                        {g.etiket}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Sağ kolon — görsel ve yüzen kartlar */}
          <Reveal gecikme={0.1} kaydir={36} className="relative">
            <div className="relative">
              {/* Arka dekor çerçevesi */}
              <div
                aria-hidden="true"
                className="absolute -inset-3 -rotate-2 rounded-[2.5rem] bg-sari-500/20 md:-inset-4"
              />
              <AkilliGorsel
                anahtar="home/hero"
                oran="4/3"
                priority
                sizes="(min-width: 1024px) 44rem, 92vw"
                className="rounded-[2rem] shadow-kalkik ring-1 ring-kahve-900/8"
              />

              {/* Yüzen bilgi kartı — teslimat süresi */}
              <div
                className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-3xl
                  border border-kahve-900/8 bg-white/92 px-4 py-3 shadow-kart backdrop-blur-md
                  animate-yuzer sm:-left-8"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-nane/12 text-nane-koyu">
                  <SaatIkon className="size-5.5" />
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-lg font-extrabold text-kahve-900">
                    {SURE_ARALIGI} dk
                  </span>
                  <span className="block text-2xs font-semibold tracking-wide text-kahve-500 uppercase">
                    tahmini teslimat
                  </span>
                </span>
              </div>

              {/* Yüzen bilgi kartı — değerlendirme başlıkları.
                  Eskiden "186.000+ değerlendirme" yazıyordu; sistemde henüz tek
                  yorum yok, o yüzden sayı yerine NASIL puanlandığı anlatılıyor. */}
              <div
                className="absolute -top-5 -right-3 rounded-3xl border border-kahve-900/8
                  bg-white/92 px-4 py-3 shadow-kart backdrop-blur-md sm:-right-6"
              >
                <span className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <YildizIkon key={i} className="size-3.5 text-sari-500" />
                  ))}
                </span>
                <span className="mt-1.5 block text-2xs font-semibold tracking-wide text-kahve-500 uppercase">
                  Sıcaklık · Hız · Tad
                </span>
              </div>

              {/* Yüzen bilgi kartı — canlı takip */}
              <div
                className="absolute top-1/2 -left-5 hidden -translate-y-1/2 items-center gap-2.5
                  rounded-2xl border border-kahve-900/8 bg-kahve-900 px-3.5 py-2.5
                  text-sari-300 shadow-kalkik lg:flex"
              >
                <span className="relative grid size-2.5 place-items-center">
                  <span className="absolute size-2.5 rounded-full bg-nane animate-nabiz" />
                  <span className="size-1.5 rounded-full bg-nane" />
                </span>
                <span className="text-xs font-bold">Kurye yolda</span>
              </div>
            </div>

            {/* Küçük güven satırı */}
            <ul className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-kahve-600">
              {["Tüm siparişlerde ücretsiz teslimat", "Kapıda nakit veya havale", "Canlı kurye takibi"].map(
                (metin) => (
                  <li key={metin} className="flex items-center gap-1.5">
                    <KontrolIkon className="size-4 text-nane" />
                    {metin}
                  </li>
                ),
              )}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
