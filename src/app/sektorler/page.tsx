import type { Metadata } from "next";
import Link from "next/link";

import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { Bolum } from "@/components/ui/Bolum";
import { AyarIkon, KontrolIkon } from "@/components/ui/Ikonlar";
import { Kademeli, KademeliOge, Reveal } from "@/components/ui/Reveal";
import { Rozet } from "@/components/ui/Rozet";
import { sektorler } from "@/content/sektorler";

export const metadata: Metadata = {
  title: "Sektörlere göre otomasyon çözümleri",
  description:
    "Restoran, market, pastane, eczane, lojistik, perakende, otel ve kurumsal catering için " +
    "sektöre özel sipariş, kurye ve teslimat otomasyonu senaryoları.",
  alternates: { canonical: "/sektorler" },
};

export default function SektorlerSayfasi() {
  const toplamOtomasyon = sektorler.reduce((t, s) => t + s.otomasyonlar.length, 0);

  return (
    <>
      <SayfaBasligi
        ustBaslik="Sektörler"
        baslik={
          <>
            Her sektörün kendi kuralları var —{" "}
            <span className="metin-sari">otomasyon da öyle olmalı</span>
          </>
        }
        aciklama="Aynı sipariş, kurye ve teslimat altyapısı; sektörün gerçek kısıtlarına göre yapılandırılmış hâliyle. Yemek/restoran ile sınırlı değil."
        kirintiYolu={[{ etiket: "Sektörler" }]}
        cocuk={
          <div className="flex flex-wrap gap-3">
            <Rozet ton="kahve">
              <AyarIkon className="size-3.5" />
              {sektorler.length} sektör
            </Rozet>
            <Rozet ton="nane">
              <KontrolIkon className="size-3.5" />
              {toplamOtomasyon} hazır otomasyon senaryosu
            </Rozet>
          </div>
        }
      />

      <Bolum className="pt-4">
        <Kademeli etiket="ul" aralik={0.07} className="grid gap-5 md:grid-cols-2">
          {sektorler.map((s) => (
            <KademeliOge key={s.slug} etiket="li">
              <article
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border
                  border-kahve-900/8 bg-white kart-kalk hover:border-sari-500/45"
              >
                <Link
                  href={`/sektorler/${s.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="block overflow-hidden"
                >
                  <AkilliGorsel
                    anahtar={s.gorsel}
                    oran="16/9"
                    sizes="(min-width: 768px) 34rem, 92vw"
                    gorselClassName="transition-transform duration-700 ease-[var(--ease-yumusak)] group-hover:scale-105"
                  />
                </Link>

                <div className="flex flex-1 flex-col p-6 md:p-7">
                  <span className="font-display text-2xs font-extrabold tracking-[0.16em] text-sari-700 uppercase">
                    {s.kisaAd}
                  </span>
                  <h2 className="mt-2 text-xl leading-tight font-extrabold sm:text-2xl">
                    <Link
                      href={`/sektorler/${s.slug}`}
                      className="transition-colors duration-300 hover:text-sari-700"
                    >
                      {s.ad}
                    </Link>
                  </h2>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-kahve-600">{s.ozet}</p>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {s.otomasyonlar.slice(0, 3).map((o) => (
                      <li
                        key={o.baslik}
                        className="flex gap-2.5 text-sm leading-snug text-kahve-700"
                      >
                        <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-nane/14 text-nane-koyu">
                          <KontrolIkon className="size-3" strokeWidth="3" />
                        </span>
                        {o.baslik}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-kahve-900/8 pt-5">
                    <dl className="flex gap-5">
                      {s.metrikler.slice(0, 2).map((m) => (
                        <div key={m.etiket}>
                          <dt className="sr-only">{m.etiket}</dt>
                          <dd>
                            <span className="block font-display text-lg leading-none font-extrabold text-kahve-900">
                              {m.deger}
                            </span>
                            <span className="mt-1 block max-w-[8rem] text-2xs leading-tight font-medium text-kahve-400">
                              {m.etiket}
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <ButonBaglanti href={`/sektorler/${s.slug}`} tur="hayalet" boyut="sm">
                      Detay
                      <OkIkon />
                    </ButonBaglanti>
                  </div>
                </div>
              </article>
            </KademeliOge>
          ))}
        </Kademeli>

        <Reveal>
          <div className="mt-14 rounded-[2rem] bg-kahve-900 px-7 py-10 text-center md:px-12 md:py-14">
            <h2 className="text-2xl leading-tight font-extrabold text-white sm:text-3xl">
              Sektörün listede yok mu?
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-kahve-200/85">
              Sipariş, görev atama, saha ekibi ve teslimat içeren her operasyon bu altyapıyla
              modellenebilir. Süreçlerini birlikte haritalayıp size özel akışı kuruyoruz.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButonBaglanti href="/#iletisim" boyut="lg">
                Süreçlerini birlikte haritalayalım
                <OkIkon />
              </ButonBaglanti>
              <ButonBaglanti href="/veri-degerlendirme" tur="hayalet" boyut="lg">
                Veri değerlendirme
              </ButonBaglanti>
            </div>
          </div>
        </Reveal>
      </Bolum>
    </>
  );
}
