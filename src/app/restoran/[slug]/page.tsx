import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FiyatDuzenle } from "@/components/restoran/FiyatDuzenle";
import { RestoranKapak } from "@/components/restoran/RestoranKapak";
import { TeslimatUyarisi } from "@/components/restoran/TeslimatUyarisi";
import { SepeteEkle } from "@/components/sepet/SepeteEkle";
import { SepetOzeti } from "@/components/sepet/SepetOzeti";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { OkIkon } from "@/components/ui/Buton";
import { SaatIkon, ScooterIkon, SepetIkon, SimsekIkon, YildizIkon } from "@/components/ui/Ikonlar";
import { Rozet } from "@/components/ui/Rozet";
import { YorumBolumu } from "@/components/yorum/YorumBolumu";
import { restoranlar } from "@/content/restoranlar";
import { site } from "@/content/site";
import { sefProfiliCoz } from "@/lib/hesaplar";
import { gorselCoz } from "@/lib/images";
import { mutfakMenusu, mutfakUrunleri } from "@/lib/mutfak-menusu";
import { duzenleyebilirMi, oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";
import { paraFormatla } from "@/lib/utils";
import { restoranYorumlari } from "@/lib/yorum-ozeti";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

type Props = { params: Promise<{ slug: string }> };

/** Sepete uçan öğede gösterilecek ürün görseli; yoksa marka rengi kullanılır. */
function urunGorseli(anahtar: string): string | undefined {
  const gorsel = gorselCoz(anahtar);
  return gorsel.tur === "uzak" ? gorsel.src : undefined;
}

/** Sabit restoranlar build'de üretilir; onayla açılan mutfaklar istek anında. */
export function generateStaticParams() {
  return restoranlar.map((r) => ({ slug: r.slug }));
}
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const restoran = await restoranCoz(slug);
  if (!restoran) return { title: "Restoran bulunamadı" };

  return {
    title: `${restoran.ad} — ${restoran.semt} / İstanbul`,
    description:
      `${restoran.ad} menüsü ve fiyatları. ${restoran.mutfaklar.join(", ")}. ` +
      `${restoran.sureDk[0]}–${restoran.sureDk[1]} dk teslimat, minimum sepet ` +
      `${restoran.minSepet} TL. ${restoran.semt} ve çevresine teslimat.`,
    alternates: { canonical: `/restoran/${restoran.slug}` },
    openGraph: {
      title: `${restoran.ad} — Ne Yersin?`,
      description: restoran.mutfaklar.join(", "),
      url: `${site.url}/restoran/${restoran.slug}`,
    },
  };
}

export default async function RestoranSayfasi({ params }: Props) {
  const c = ceviri(await aktifDil());
  const { slug } = await params;
  // Sabit içerikte yoksa yönetici onayıyla açılmış bir mutfak olabilir.
  const restoran = await restoranCoz(slug);
  if (!restoran) notFound();

  /**
   * Üç sorgu da PARALEL. Önceden art arda bekleniyordu (menü → profil →
   * yorumlar); hiçbiri diğerinin sonucunu kullanmadığı hâlde her biri bir
   * öncekinin bitmesini bekliyor, veritabanı gidiş-dönüşü üç kez üst üste
   * ödeniyordu. Sayfa süresinin büyük kısmı buradan geliyordu.
   *
   *  - menü: sabit içerik + şefin panelinden eklediği ürünler, aynı bölümlerde
   *  - şef profili: panelden girilen bilgiler sabit içeriğin üzerine biner;
   *    depo erişilemezse `sefProfiliCoz` sessizce statik içeriğe düşer
   *  - yorumlar: puan ve yorum sayısı GERÇEK yorumlardan gelir; `restoran.puan`
   *    sabit içerikte 0 ve öyle kalır
   */
  const [menu, sefProfili, { yorumlar, ozet }, oturum] = await Promise.all([
    mutfakMenusu(slug),
    restoran.evSefi
      ? sefProfiliCoz(slug)
      : Promise.resolve({} as Awaited<ReturnType<typeof sefProfiliCoz>>),
    restoranYorumlari(slug),
    oturumAl(),
  ]);

  /**
   * Sahibi kendi profiline bakıyorsa ürünlerin yanında fiyat düzenleme çıkar.
   * Yetki SUNUCUDA belirleniyor; misafire ve başka şeflere düğme hiç
   * basılmıyor, gizlenmiyor.
   */
  const duzenleyebilir = duzenleyebilirMi(oturum, slug);

  /** Bekleyen fiyat talepleri — yalnızca sahibi için, rozet gösterilecek. */
  const bekleyenler = new Map<string, number>();
  if (duzenleyebilir) {
    for (const u of await mutfakUrunleri(slug)) {
      if (typeof u.bekleyenFiyat === "number") bekleyenler.set(u.id, u.bekleyenFiyat);
    }
  }

  const ucretsiz = restoran.teslimatUcreti === 0;
  const sertifikaSatirlari = (sefProfili.sertifikalar ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restoran.ad,
    servesCuisine: restoran.mutfaklar,
    address: {
      "@type": "PostalAddress",
      addressLocality: restoran.semt,
      addressRegion: "İstanbul",
      addressCountry: "TR",
    },
    // AggregateRating YALNIZCA gerçek değerlendirme varsa gönderilir. Sıfır
    // yorumla puan bildirmek arama motorlarına sahte veri göndermek olur ve
    // yapılandırılmış veri politikalarını ihlal eder.
    ...(ozet.adet > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ozet.ortalama,
            reviewCount: ozet.adet,
            bestRating: 5,
          },
        }
      : {}),
    url: `${site.url}/restoran/${restoran.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Kapak */}
      <div className="relative">
        <RestoranKapak restoran={restoran} className="h-44 w-full md:h-60" buyuk />
      </div>

      <div className="kap">
        {/* Kimlik kartı — kapağın üzerine binen panel */}
        <div className="relative -mt-14 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:-mt-16 md:p-8">
          <nav aria-label="Kırıntı yolu" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-kahve-500">
              <li>
                <Link href="/" className="transition-colors duration-300 hover:text-kahve-900">
                  Ana Sayfa
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-kahve-300">/</span>
                <Link
                  href="/restoranlar"
                  className="transition-colors duration-300 hover:text-kahve-900"
                >
                  {c("menu.restoranlar")}
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-kahve-300">/</span>
                <span className="text-kahve-800">{restoran.ad}</span>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            <div>
              <h1 className="text-3xl leading-tight font-extrabold sm:text-4xl">{restoran.ad}</h1>
              <p className="mt-2 text-sm font-medium text-kahve-500">
                {restoran.mutfaklar.join(" • ")} · {restoran.semt} / İstanbul
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {restoran.etiketler.map((e) => (
                <Rozet key={e} ton="acik">
                  {e}
                </Rozet>
              ))}
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-kahve-900/8 pt-5 sm:grid-cols-4">
            <div>
              <dt className="flex items-center gap-1.5 text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                <YildizIkon className="size-3.5 text-sari-500" />
                Puan
              </dt>
              <dd className="mt-1 font-display text-lg font-extrabold text-kahve-900">
                {ozet.adet > 0 ? (
                  <a href="#degerlendirmeler" className="hover:text-sari-700">
                    {ozet.ortalama.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
                    <span className="text-sm font-semibold text-kahve-400"> / 5</span>
                    <span className="ml-1.5 text-xs font-medium text-kahve-400">
                      ({ozet.adet.toLocaleString("tr-TR")} yorum)
                    </span>
                  </a>
                ) : (
                  <span className="text-sm font-semibold text-kahve-400">Henüz yok</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                <SaatIkon className="size-3.5" />
                {c("restoranSayfa.teslimat")}
              </dt>
              <dd className="mt-1 font-display text-lg font-extrabold text-kahve-900">
                {restoran.sureDk[0]}–{restoran.sureDk[1]} dk
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                <SepetIkon className="size-3.5" />
                {c("restoranSayfa.minSepet")}
              </dt>
              <dd className="mt-1 font-display text-lg font-extrabold text-kahve-900">
                {paraFormatla(restoran.minSepet)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                <ScooterIkon className="size-3.5" />
                Kurye
              </dt>
              <dd
                className={`mt-1 font-display text-lg font-extrabold ${
                  ucretsiz ? "text-nane-koyu" : "text-kahve-900"
                }`}
              >
                {ucretsiz ? c("sepet.ucretsiz") : paraFormatla(restoran.teslimatUcreti)}
              </dd>
            </div>
          </dl>

          {restoran.kampanya && (
            <p className="mt-5 flex items-center gap-2 rounded-2xl bg-sari-500/16 px-4 py-3 text-sm font-bold text-kahve-900">
              <SimsekIkon className="size-4 shrink-0 text-sari-700" />
              {restoran.kampanya}
            </p>
          )}

          <div className="mt-4">
            <TeslimatUyarisi restoran={restoran} />
          </div>

          {restoran.evSefi && (
            <div className="mt-6 rounded-[1.75rem] border border-sari-500/25 bg-sari-500/6 p-6 md:p-7">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-kahve-900">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-sari-500 text-kahve-900">
                  <YildizIkon className="size-4" />
                </span>
                Şef Profili
              </h2>
              {sefProfili.slogan && (
                <p className="mt-3 text-base font-semibold text-kahve-800">{sefProfili.slogan}</p>
              )}

              {sefProfili.biyografi ? (
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-kahve-700">
                  {sefProfili.biyografi}
                </p>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-kahve-500 italic">
                  {restoran.ad}, kendi hikayesini ve sertifikalarını henüz eklemedi — yakında burada
                  olacak.
                </p>
              )}

              {sefProfili.uzmanlik && (
                <p className="mt-3 text-sm leading-relaxed text-kahve-700">
                  <span className="font-bold">Uzmanlık:</span> {sefProfili.uzmanlik}
                </p>
              )}

              {sertifikaSatirlari.length > 0 && (
                <>
                  <h3 className="mt-5 text-xs font-bold tracking-wide text-kahve-700 uppercase">
                    {c("restoranSayfa.sertifikalar")}
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {sertifikaSatirlari.map((s) => (
                      <li key={s} className="flex gap-2 text-sm leading-relaxed text-kahve-700">
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-sari-500"
                        />
                        {s}
                      </li>
                    ))}
                  </ul>
                </>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Menü + sepet */}
      <div className="kap py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <div>
            {menu.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-12 text-center text-sm text-kahve-500">
                {c("restoranSayfa.menuYok")}
              </p>
            ) : (
              <>
                {/* Kategori kısayolları */}
                <nav
                  aria-label={c("restoranSayfa.menuKategorileri")}
                  className="sticky top-20 z-20 -mx-1 mb-8 flex gap-2 overflow-x-auto
                    bg-krem/85 px-1 py-3 backdrop-blur-md gizli-scroll"
                >
                  {menu.map((k) => (
                    <a
                      key={k.ad}
                      href={`#menu-${encodeURIComponent(k.ad)}`}
                      className="shrink-0 rounded-full bg-kahve-900/5 px-4 py-2 text-sm font-bold
                        text-kahve-700 transition-all duration-300 ease-[var(--ease-yumusak)]
                        hover:-translate-y-0.5 hover:bg-sari-500 hover:text-kahve-900"
                    >
                      {k.ad}
                    </a>
                  ))}
                </nav>

                <div className="space-y-12">
                  {menu.map((kategori) => (
                    <section
                      key={kategori.ad}
                      id={`menu-${encodeURIComponent(kategori.ad)}`}
                      className="scroll-mt-36"
                    >
                      <h2 className="text-2xl font-extrabold sm:text-3xl">
                        <span
                          aria-hidden="true"
                          className="mb-3 block h-1 w-10 rounded-full bg-sari-500"
                        />
                        {kategori.ad}
                      </h2>
                      {kategori.aciklama && (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-kahve-500">
                          {kategori.aciklama}
                        </p>
                      )}

                      <ul className="mt-6 space-y-3">
                        {kategori.urunler.map((urun) => (
                          <li
                            key={urun.id}
                            className="flex flex-wrap items-center gap-4
                              rounded-3xl border border-kahve-900/8 bg-white p-5
                              transition-[border-color,box-shadow] duration-400
                              ease-[var(--ease-yumusak)] hover:border-sari-500/45 hover:shadow-kart"
                          >
                            {/* Şefin yüklediği gerçek fotoğraf varsa o, yoksa yer tutucu. */}
                            {urun.gorselUrl ? (
                              <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl">
                                <Image
                                  src={urun.gorselUrl}
                                  alt={urun.ad}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              </span>
                            ) : (
                              <AkilliGorsel
                                anahtar={`menu/${restoran.slug}/${urun.id}`}
                                alt={urun.ad}
                                oran="1/1"
                                sizes="80px"
                                className="size-20 shrink-0 rounded-2xl"
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display text-base font-extrabold text-kahve-900">
                                  {urun.ad}
                                </h3>
                                {urun.populer && <Rozet ton="sari">{c("restoranSayfa.populer")}</Rozet>}
                                {urun.taslak && <Rozet ton="domates">{c("urun.fiyatYakinda")}</Rozet>}
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-kahve-600">
                                {urun.aciklama}
                              </p>
                              <p className="mt-2 font-display text-base font-extrabold text-kahve-900">
                                {urun.taslak ? "—" : paraFormatla(urun.fiyat)}
                                {urun.birim && (
                                  <span className="ml-1.5 text-xs font-semibold text-kahve-500">
                                    / {urun.birim}
                                  </span>
                                )}
                              </p>

                              {duzenleyebilir && (
                                <FiyatDuzenle
                                  restoranSlug={restoran.slug}
                                  urunId={urun.id}
                                  mevcutFiyat={urun.fiyat ?? 0}
                                  bekleyenFiyat={bekleyenler.get(urun.id)}
                                />
                              )}
                            </div>

                            {urun.taslak ? (
                              <p className="shrink-0 text-xs font-semibold text-kahve-400">
                                {c("restoranSayfa.siparisYakinda")}
                              </p>
                            ) : (
                              <SepeteEkle
                                restoranSlug={restoran.slug}
                                restoranAdi={restoran.ad}
                                urun={urun}
                                gorselUrl={urunGorseli(`menu/${restoran.slug}/${urun.id}`)}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Yapışkan sepet */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SepetOzeti restoranSlug={restoran.slug} />

            <div className="mt-4 rounded-3xl border border-kahve-900/8 bg-white/70 p-5">
              <h2 className="text-2xs font-extrabold tracking-[0.16em] text-kahve-400 uppercase">
                {c("restoranSayfa.teslimatBolgeleri")}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {restoran.teslimat.map((i) => (
                  <li key={i}>
                    <span className="inline-block rounded-full bg-kahve-900/5 px-2.5 py-1 text-2xs font-bold text-kahve-600">
                      {i}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-kahve-500">
                Ödeme <strong className="text-kahve-700">kapıda</strong>: kurye geldiğinde nakit
                veya IBAN&apos;a havale ile ödersin.
              </p>
            </div>

            <Link
              href="/restoranlar"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sari-700
                transition-colors duration-300 hover:text-kahve-900"
            >
              {c("restoranSayfa.digerRestoranlar")}
              <OkIkon className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/*
        Değerlendirmeler profilin EN SONUNDA — restoran, market ya da şef
        mutfağı fark etmiyor, her profilde aynı yerde duruyor. Menünün üstünde
        dururken müşteri önce puanlara takılıyor, sipariş akışı bölünüyordu.
      */}
      <div className="kap pb-14 md:pb-20">
        <YorumBolumu restoranSlug={slug} yorumlar={yorumlar} ozet={ozet} />
      </div>
    </>
  );
}
