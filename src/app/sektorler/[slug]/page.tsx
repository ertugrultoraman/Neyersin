import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { Akordiyon } from "@/components/ui/Akordiyon";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { Bolum, BolumBasligi } from "@/components/ui/Bolum";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { AyarIkon, KontrolIkon, SimsekIkon } from "@/components/ui/Ikonlar";
import { Kademeli, KademeliOge, Reveal } from "@/components/ui/Reveal";
import { Rozet } from "@/components/ui/Rozet";
import { sektorBul, sektorler } from "@/content/sektorler";
import { site } from "@/content/site";
import { gorselCoz } from "@/lib/images";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sektorler.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sektor = sektorBul(slug);
  if (!sektor) return { title: "Sektör bulunamadı" };

  const kapak = gorselCoz(sektor.gorsel);

  return {
    title: `${sektor.ad} otomasyonu`,
    description: sektor.ozet,
    alternates: { canonical: `/sektorler/${sektor.slug}` },
    openGraph: {
      title: `${sektor.ad} için otomasyon çözümleri`,
      description: sektor.ozet,
      url: `${site.url}/sektorler/${sektor.slug}`,
      images: kapak.tur === "uzak" ? [kapak.src] : ["/brand/ne-yersin-logo.jpeg"],
    },
  };
}

export default async function SektorSayfasi({ params }: Props) {
  const { slug } = await params;
  const sektor = sektorBul(slug);
  if (!sektor) notFound();

  const digerleri = sektorler.filter((s) => s.slug !== sektor.slug).slice(0, 3);

  return (
    <>
      <SayfaBasligi
        ustBaslik={`${sektor.kisaAd} çözümleri`}
        baslik={
          <>
            {sektor.ad} için <span className="metin-sari">uçtan uca otomasyon</span>
          </>
        }
        aciklama={sektor.ozet}
        kirintiYolu={[{ etiket: "Sektörler", href: "/sektorler" }, { etiket: sektor.ad }]}
        cocuk={
          <div className="flex flex-wrap gap-3">
            <Rozet ton="kahve">
              <AyarIkon className="size-3.5" />
              {sektor.otomasyonlar.length} otomasyon
            </Rozet>
            <Rozet ton="nane">
              <KontrolIkon className="size-3.5" />
              {sektor.entegrasyonlar.length} entegrasyon
            </Rozet>
          </div>
        }
      />

      {/* Kapak + giriş */}
      <div className="kap">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <Reveal>
            <p className="text-[1.0625rem] leading-[1.8] text-kahve-700 md:text-lg">
              {sektor.giris}
            </p>
          </Reveal>
          <Reveal gecikme={0.08} kaydir={30}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rotate-2 rounded-[2.5rem] bg-sari-500/18"
              />
              <AkilliGorsel
                anahtar={sektor.gorsel}
                oran="16/9"
                priority
                sizes="(min-width: 1024px) 34rem, 92vw"
                className="rounded-[1.75rem] shadow-kalkik ring-1 ring-kahve-900/8"
              />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Metrikler */}
      <div className="kap mt-14">
        <Reveal>
          <dl className="grid gap-4 rounded-[2rem] bg-kahve-900 px-6 py-8 sm:grid-cols-3 md:px-10">
            {sektor.metrikler.map((m) => (
              <div key={m.etiket} className="text-center">
                <dt className="sr-only">{m.etiket}</dt>
                <dd>
                  <span className="block font-display text-3xl font-extrabold text-sari-400 md:text-4xl">
                    {m.deger}
                  </span>
                  <span className="mt-1.5 block text-xs leading-snug font-medium text-kahve-200/80">
                    {m.etiket}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      {/* Zorluklar */}
      <Bolum>
        <BolumBasligi
          ustBaslik="Mevcut durum"
          baslik="Bu sektörde nerede kayıp oluşuyor?"
          aciklama="Otomasyona karar vermeden önce hangi adımın gerçekten para kaybettirdiğini görmek gerekir."
        />
        <Kademeli etiket="ul" className="mt-10 grid gap-4 md:grid-cols-3">
          {sektor.zorluklar.map((z, i) => (
            <KademeliOge key={z.baslik} etiket="li">
              <article className="flex h-full flex-col rounded-3xl border border-domates/20 bg-domates/5 p-6">
                <span className="grid size-10 place-items-center rounded-2xl bg-domates/14 font-display text-sm font-extrabold text-domates-koyu">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg leading-snug font-extrabold text-kahve-900">
                  {z.baslik}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-kahve-600">{z.metin}</p>
              </article>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Otomasyonlar */}
      <Bolum className="bg-krem-koyu/60">
        <BolumBasligi
          ustBaslik="Otomasyonlar"
          baslik={
            <>
              {sektor.kisaAd} için <span className="metin-sari">hazır senaryolar</span>
            </>
          }
          aciklama="Her senaryo tek başına devreye alınabilir; birlikte kurulduğunda etkisi katlanır."
        />
        <Kademeli etiket="ul" aralik={0.07} className="mt-10 space-y-4">
          {sektor.otomasyonlar.map((o, i) => (
            <KademeliOge key={o.baslik} etiket="li">
              <article
                className="group grid gap-5 rounded-3xl border border-kahve-900/8 bg-white p-6
                  transition-[border-color,box-shadow] duration-400 ease-[var(--ease-yumusak)]
                  hover:border-sari-500/45 hover:shadow-kart md:grid-cols-[auto_1fr_16rem] md:items-center md:p-7"
              >
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sari-500/14
                    text-sari-700 transition-all duration-500 ease-[var(--ease-yayli)]
                    group-hover:-rotate-6 group-hover:bg-sari-500 group-hover:text-kahve-900"
                >
                  <SimsekIkon className="size-6" />
                </span>

                <div>
                  <h3 className="flex flex-wrap items-baseline gap-2.5 text-lg font-extrabold text-kahve-900">
                    <span className="font-mono text-xs font-bold text-kahve-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {o.baslik}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-kahve-600">{o.metin}</p>
                </div>

                <p className="flex items-start gap-2.5 rounded-2xl bg-nane/8 px-4 py-3 text-sm leading-snug font-semibold text-nane-koyu">
                  <KontrolIkon className="mt-0.5 size-4 shrink-0" strokeWidth="2.6" />
                  {o.kazanim}
                </p>
              </article>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Çözüm bileşenleri */}
      <Bolum>
        <BolumBasligi
          ustBaslik="Çözüm bileşenleri"
          baslik="Hangi modüller devreye giriyor?"
        />
        <Kademeli etiket="ul" className="mt-10 grid gap-4 md:grid-cols-3">
          {sektor.cozumler.map((c) => (
            <KademeliOge key={c.baslik} etiket="li">
              <article className="flex h-full flex-col rounded-3xl border border-kahve-900/8 bg-white p-6 kart-kalk">
                <h3 className="font-display text-lg leading-snug font-extrabold text-kahve-900">
                  {c.baslik}
                </h3>
                <span aria-hidden="true" className="mt-3 block h-1 w-10 rounded-full bg-sari-500" />
                <p className="mt-4 text-sm leading-relaxed text-kahve-600">{c.metin}</p>
              </article>
            </KademeliOge>
          ))}
        </Kademeli>

        {/* Entegrasyonlar */}
        <Reveal gecikme={0.1}>
          <div className="mt-10 rounded-3xl border border-kahve-900/8 bg-white/70 p-6 md:p-8">
            <h3 className="font-display text-2xs font-extrabold tracking-[0.18em] text-kahve-400 uppercase">
              Entegrasyonlar
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {sektor.entegrasyonlar.map((e) => (
                <li key={e}>
                  <span className="inline-flex items-center gap-2 rounded-full bg-kahve-900/5 px-3.5 py-2 text-sm font-semibold text-kahve-700">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-sari-600" />
                    {e}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Bolum>

      {/* SSS */}
      <Bolum className="bg-krem-koyu/60">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <BolumBasligi
            ustBaslik="Sıkça sorulanlar"
            baslik={`${sektor.kisaAd} kurulumu hakkında`}
            className="lg:flex-col lg:items-start"
          />
          <Reveal gecikme={0.08}>
            <Akordiyon ogeler={sektor.sss} />
          </Reveal>
        </div>
      </Bolum>

      {/* CTA + diğer sektörler */}
      <Bolum>
        <Reveal>
          <div className="rounded-[2rem] bg-gradient-to-br from-sari-300 to-sari-500 px-7 py-10 md:px-12 md:py-14">
            <h2 className="max-w-2xl text-2xl leading-tight font-extrabold text-kahve-900 sm:text-3xl md:text-4xl">
              {sektor.ad} operasyonunu birlikte kuralım
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-kahve-800/85">
              Mevcut süreçlerinizi haritalayıp hangi otomasyonun en hızlı geri döneceğini
              birlikte belirliyoruz. Kurulum kademeli yapılır; ilk adım her zaman ölçümdür.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButonBaglanti href="/iletisim?konu=kurumsal" tur="ikincil" boyut="lg">
                İletişime geç
                <OkIkon />
              </ButonBaglanti>
              <ButonBaglanti href="/veri-degerlendirme" tur="hayalet" boyut="lg">
                Veri değerlendirme hizmeti
              </ButonBaglanti>
            </div>
          </div>
        </Reveal>

        <div className="mt-14">
          <h2 className="text-xl font-extrabold">Diğer sektörler</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {digerleri.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/sektorler/${s.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-kahve-900/8
                    bg-white p-5 kart-kalk hover:border-sari-500/45"
                >
                  <span className="font-display text-2xs font-extrabold tracking-[0.16em] text-sari-700 uppercase">
                    {s.kisaAd}
                  </span>
                  <span className="mt-2 font-display text-base leading-snug font-extrabold text-kahve-900">
                    {s.ad}
                  </span>
                  <span className="mt-2.5 flex-1 text-sm leading-relaxed text-kahve-500">
                    {s.ozet}
                  </span>
                  <span className="mt-4 flex items-center gap-1.5 text-xs font-bold text-sari-700">
                    Detaya git
                    <OkIkon className="size-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Bolum>
    </>
  );
}
