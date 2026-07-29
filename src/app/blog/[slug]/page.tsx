import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icindekiler } from "@/components/blog/Icindekiler";
import { OkumaCubugu } from "@/components/blog/OkumaCubugu";
import { YaziGovdesi } from "@/components/blog/YaziGovdesi";
import { YaziKarti } from "@/components/blog/YaziKarti";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { KullaniciIkon, SaatIkon } from "@/components/ui/Ikonlar";
import { Reveal } from "@/components/ui/Reveal";
import { Rozet } from "@/components/ui/Rozet";
import { icindekiler, ilgiliYazilar, yaziBul, yazilar } from "@/content/blog";
import { site } from "@/content/site";
import { gorselCoz } from "@/lib/images";
import { tarihFormatla } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return yazilar.map((y) => ({ slug: y.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const yazi = yaziBul(slug);
  if (!yazi) return { title: "Yazı bulunamadı" };

  const kapak = gorselCoz(yazi.kapak);
  const gorseller = kapak.tur === "uzak" ? [kapak.src] : ["/brand/ne-yersin-logo.jpeg"];

  return {
    title: yazi.baslik,
    description: yazi.ozet,
    alternates: { canonical: `/blog/${yazi.slug}` },
    openGraph: {
      type: "article",
      title: yazi.baslik,
      description: yazi.ozet,
      url: `${site.url}/blog/${yazi.slug}`,
      publishedTime: yazi.tarih,
      modifiedTime: yazi.guncelleme ?? yazi.tarih,
      authors: [yazi.yazar.ad],
      tags: yazi.etiketler,
      images: gorseller,
    },
    twitter: {
      card: "summary_large_image",
      title: yazi.baslik,
      description: yazi.ozet,
      images: gorseller,
    },
  };
}

export default async function YaziSayfasi({ params }: Props) {
  const { slug } = await params;
  const yazi = yaziBul(slug);
  if (!yazi) notFound();

  const baslikListesi = icindekiler(yazi);
  const ilgili = ilgiliYazilar(yazi, 2);
  const kapak = gorselCoz(yazi.kapak);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: yazi.baslik,
    description: yazi.ozet,
    datePublished: yazi.tarih,
    dateModified: yazi.guncelleme ?? yazi.tarih,
    author: { "@type": "Organization", name: yazi.yazar.ad },
    publisher: { "@type": "Organization", name: site.ad },
    mainEntityOfPage: `${site.url}/blog/${yazi.slug}`,
    keywords: yazi.etiketler.join(", "),
    ...(kapak.tur === "uzak" ? { image: kapak.src } : {}),
  };

  return (
    <>
      <OkumaCubugu />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Üst blok */}
      <section className="relative overflow-hidden pt-10 pb-10 md:pt-14">
        <div aria-hidden="true" className="absolute inset-0 isik" />
        <div className="kap relative">
          <nav aria-label="Kırıntı yolu" className="mb-7">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-kahve-500">
              <li>
                <Link href="/" className="transition-colors duration-300 hover:text-kahve-900">
                  Ana Sayfa
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-kahve-300">/</span>
                <Link href="/blog" className="transition-colors duration-300 hover:text-kahve-900">
                  Blog
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-kahve-300">/</span>
                <span className="max-w-[16rem] truncate text-kahve-800">{yazi.kategori}</span>
              </li>
            </ol>
          </nav>

          <Reveal>
            <div className="max-w-3xl">
              <Rozet ton="sari">{yazi.kategori}</Rozet>
              <h1 className="mt-5 text-[2.125rem] leading-[1.06] font-extrabold sm:text-[2.75rem] md:text-[3.25rem]">
                {yazi.baslik}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-kahve-600">{yazi.ozet}</p>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-kahve-500">
                <span className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-sari-500/16 text-sari-700">
                    <KullaniciIkon className="size-4" />
                  </span>
                  {yazi.yazar.ad}
                </span>
                <time dateTime={yazi.tarih}>{tarihFormatla(yazi.tarih)}</time>
                <span className="flex items-center gap-1.5">
                  <SaatIkon className="size-4" />
                  {yazi.okumaDk} dk okuma
                </span>
                {yazi.guncelleme && (
                  <span className="text-kahve-400">
                    Güncellendi: {tarihFormatla(yazi.guncelleme)}
                  </span>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Kapak görseli */}
      <div className="kap">
        <Reveal kaydir={30}>
          <AkilliGorsel
            anahtar={yazi.kapak}
            oran="21/9"
            priority
            sizes="(min-width: 1280px) 76rem, 94vw"
            className="rounded-[2rem] shadow-kalkik ring-1 ring-kahve-900/8"
          />
        </Reveal>
      </div>

      {/* Gövde + içindekiler */}
      <div className="kap py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Icindekiler ogeler={baslikListesi} />

            <div className="mt-8 rounded-3xl bg-kahve-900 p-5 text-sari-100">
              <p className="font-display text-base font-extrabold text-sari-400">
                Bu konuda destek mi lazım?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-kahve-200/85">
                Mevcut verinizi kullanılabilir hâle getirme ve operasyon otomasyonu için
                birlikte çalışabiliriz.
              </p>
              <ButonBaglanti
                href="/veri-degerlendirme"
                boyut="sm"
                className="mt-4 w-full"
              >
                Veri değerlendirme
                <OkIkon />
              </ButonBaglanti>
            </div>

            <ul className="mt-8 flex flex-wrap gap-1.5">
              {yazi.etiketler.map((e) => (
                <li key={e}>
                  <span className="inline-block rounded-full bg-kahve-900/6 px-2.5 py-1 text-2xs font-bold text-kahve-600">
                    #{e}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          <article className="max-w-3xl">
            <YaziGovdesi bloklar={yazi.bloklar} />

            <div className="mt-14 rounded-[2rem] bg-gradient-to-br from-sari-300 to-sari-500 p-7 md:p-10">
              <p className="font-display text-2xl leading-tight font-extrabold text-kahve-900 md:text-3xl">
                Kendi operasyonunda uygulamak ister misin?
              </p>
              <p className="mt-3 max-w-xl leading-relaxed text-kahve-800/85">
                Sektörüne özel otomasyon senaryolarını inceleyebilir veya mevcut verinizin
                nasıl kullanılabilir hâle getirileceğini birlikte planlayabiliriz.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButonBaglanti href="/sektorler" tur="ikincil" boyut="lg">
                  Sektörünü seç
                  <OkIkon />
                </ButonBaglanti>
                <ButonBaglanti href="/veri-degerlendirme" tur="hayalet" boyut="lg">
                  Veri değerlendirme
                </ButonBaglanti>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* İlgili yazılar */}
      {ilgili.length > 0 && (
        <section className="border-t border-kahve-900/8 py-14 md:py-20">
          <div className="kap">
            <h2 className="text-2xl font-extrabold sm:text-3xl">İlgili yazılar</h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {ilgili.map((y) => (
                <li key={y.slug}>
                  <YaziKarti yazi={y} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
