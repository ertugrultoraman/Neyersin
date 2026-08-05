import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { YildizIkon } from "@/components/ui/Ikonlar";
import { SefRozetiIsareti } from "@/components/ui/SefRozetiIsareti";
import { aktifDil } from "@/lib/dil-sunucu";
import { gorselCoz } from "@/lib/images";
import { KASIK_GORSELI, OLCUT_BILGISI, OLCUTLER, olcutCoz } from "@/lib/sef-kasigi";
import { BASAMAKLAR } from "@/lib/sef-rozetleri";
import { olcutSayilari, sefSiralamasi } from "@/lib/sef-siralamasi";
import { ceviri } from "@/lib/sozluk";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const c = ceviri(await aktifDil());
  return { title: c("siralama.metaBaslik"), description: c("siralama.aciklama") };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ŞEF SIRALAMASI — ana sayfadaki podyumun tam hâli.
 *
 * Podyum üç kişi ve tek ölçü gösteriyor; buraya podyumdaki isme basınca
 * geliniyor ve ilk 20 üç ayrı ölçütle görülüyor.
 *
 * Ölçüt `?olcut=` ile seçiliyor — sekmeler düz bağlantı, JavaScript gerekmiyor.
 */
export default async function SefSiralamasiSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ olcut?: string }>;
}) {
  const dil = await aktifDil();
  const c = ceviri(dil);
  const sayiDili = dil === "en" ? "en-GB" : "tr-TR";
  const olcut = olcutCoz((await searchParams).olcut);

  const [satirlar, sayilar] = await Promise.all([sefSiralamasi(olcut), olcutSayilari()]);

  /** Satırdaki değerin okunur hâli — ölçüte göre biçim değişiyor. */
  const degerMetni = (s: (typeof satirlar)[number]) => {
    if (olcut === "begeni") {
      return c("siralama.puanDeger", {
        sayi: s.puan.toLocaleString(sayiDili, { minimumFractionDigits: 1 }),
      });
    }
    const bilgi = OLCUT_BILGISI[olcut];
    return c(s.deger === 1 ? bilgi.birimTek : bilgi.birim, {
      sayi: s.deger.toLocaleString(sayiDili),
    });
  };

  return (
    <>
      <SayfaBasligi
        ustBaslik={c("siralama.ustBaslik")}
        baslik={c("siralama.baslik")}
        aciklama={c("siralama.aciklama")}
      />

      <div className="kap pb-16 md:pb-24">
        {/* Ölçüt sekmeleri — düz bağlantı, sunucuda çözülüyor */}
        <nav
          aria-label={c("siralama.baslik")}
          className="flex flex-wrap gap-2 border-b border-kahve-900/10 pb-4"
        >
          {OLCUTLER.map((o) => {
            const secili = o === olcut;
            return (
              <Link
                key={o}
                href={`/sef-siralamasi?olcut=${o}`}
                aria-current={secili ? "page" : undefined}
                className={cn(
                  "tiklanabilir inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold",
                  "transition-colors duration-300",
                  secili
                    ? "bg-sari-500 text-kahve-900 shadow-sari"
                    : "text-kahve-500 hover:bg-kahve-900/5 hover:text-kahve-900",
                )}
              >
                {c(OLCUT_BILGISI[o].sekme)}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-2xs font-extrabold",
                    secili ? "bg-kahve-900/12 text-kahve-900" : "bg-kahve-900/6 text-kahve-500",
                  )}
                >
                  {sayilar[o]}
                </span>
              </Link>
            );
          })}
        </nav>

        {satirlar.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-dashed border-kahve-900/15 bg-white/60 px-6 py-16 text-center">
            <p className="font-display text-xl font-extrabold text-kahve-900">
              {c("siralama.bos")}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-kahve-600">
              {c("siralama.bosAciklama")}
            </p>
          </div>
        ) : (
          <ol className="mt-8 space-y-2.5">
            {satirlar.map((s) => {
              const gorselVar = gorselCoz(`sef/${s.slug}`).tur === "uzak";
              return (
                <li key={s.slug}>
                  <Link
                    href={`/restoran/${s.slug}`}
                    className="tiklanabilir flex items-center gap-4 rounded-3xl border border-kahve-900/8
                      bg-white p-3.5 shadow-yumusak transition-all duration-300
                      hover:-translate-y-0.5 hover:border-sari-500/45 sm:p-4"
                  >
                    {/*
                      Sıra numarası ilk üçte rozet rengiyle vurgulanıyor —
                      podyumdaki üç isim listede de aynı anda tanınsın.
                    */}
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-2xl font-display text-sm font-extrabold",
                        s.basamak
                          ? cn(BASAMAKLAR[s.basamak].kutu, BASAMAKLAR[s.basamak].numara)
                          : "bg-kahve-900/5 text-kahve-500",
                      )}
                    >
                      {s.sira}
                    </span>

                    {gorselVar ? (
                      <AkilliGorsel
                        anahtar={`sef/${s.slug}`}
                        alt={s.ad}
                        oran="1/1"
                        sizes="56px"
                        className="size-12 shrink-0 rounded-full ring-2 ring-white sm:size-14"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="grid size-12 shrink-0 place-items-center rounded-full
                          bg-gradient-to-br from-sari-300 to-sari-500 font-display text-lg
                          font-extrabold text-kahve-900 ring-2 ring-white sm:size-14"
                      >
                        {s.ad.trim().charAt(0).toLocaleUpperCase(dil === "en" ? "en-GB" : "tr-TR")}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-display text-base font-extrabold text-kahve-900">
                          {s.ad}
                        </span>
                        {s.basamak && (
                          <SefRozetiIsareti
                            rozet={{ basamak: s.basamak, slug: s.slug, ad: s.ad, adet: s.siparis }}
                          />
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-medium text-kahve-500">
                        {s.semt} / İstanbul
                      </p>
                    </div>

                    {/* Seçili ölçütün değeri — sağda, büyük ve tek başına */}
                    <span className="flex shrink-0 items-center gap-1.5 text-right">
                      {olcut === "begeni" && <YildizIkon className="size-4 text-sari-500" />}
                      {olcut === "kasik" && (
                        <Image
                          src={KASIK_GORSELI}
                          alt=""
                          width={320}
                          height={323}
                          aria-hidden="true"
                          className="size-5 object-contain"
                        />
                      )}
                      <span className="font-display text-sm font-extrabold whitespace-nowrap text-kahve-900 sm:text-base">
                        {degerMetni(s)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        <p className="mt-8 flex items-center gap-2 rounded-2xl bg-sari-500/8 px-4 py-3.5 text-sm leading-relaxed text-kahve-700">
          <Image
            src={KASIK_GORSELI}
            alt=""
            width={320}
            height={323}
            aria-hidden="true"
            className="size-6 shrink-0 object-contain"
          />
          {c("kasik.nedir")}
        </p>
      </div>
    </>
  );
}
