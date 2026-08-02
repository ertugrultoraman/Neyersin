import type { Metadata } from "next";

import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { Bolum, BolumBasligi } from "@/components/ui/Bolum";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { KontrolIkon } from "@/components/ui/Ikonlar";
import { Kademeli, KademeliOge, Reveal } from "@/components/ui/Reveal";
import { hakkimizda } from "@/content/hakkimizda";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Ne Yersin? neden kuruldu, nasıl çalışıyor ve kimin için: ev hanımları, şefler, " +
    "kuryeler ve müşteriler. Teslimat bölgesi: İstanbul / Beylikdüzü.",
  alternates: { canonical: "/hakkimizda" },
};

export default function HakkimizdaSayfasi() {
  const i = hakkimizda;

  return (
    <>
      <SayfaBasligi
        ustBaslik={i.ustBaslik}
        baslik={
          <>
            {i.baslik} <span className="metin-sari">{i.baslikVurgu}</span>
          </>
        }
        aciklama={i.ozet}
        kirintiYolu={[{ etiket: "Hakkımızda" }]}
      />

      {/* Kapsam */}
      <Bolum className="pt-0 pb-10 md:pt-0 md:pb-12">
        <Kademeli etiket="ul" aralik={0.06} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {i.kapsam.map((k) => (
            <KademeliOge
              key={k.etiket}
              etiket="li"
              className="rounded-3xl border border-kahve-900/8 bg-white p-6"
            >
              <span className="block font-display text-2xl leading-none font-extrabold text-kahve-900">
                {k.deger}
              </span>
              <span className="mt-2.5 block text-sm leading-snug font-medium text-kahve-500">
                {k.etiket}
              </span>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Hikâye */}
      <Bolum className="bant-sari">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <BolumBasligi
              ustBaslik="Neden kurduk"
              baslik={
                <>
                  Bir tabak yemeğin fiyatında{" "}
                  <span className="metin-sari">yemekten başka çok şey var</span>
                </>
              }
              className="lg:flex-col lg:items-start"
            />
            <Kademeli aralik={0.08} className="mt-8 space-y-4">
              {i.hikaye.map((p) => (
                <KademeliOge key={p.slice(0, 32)}>
                  <p className="max-w-2xl leading-relaxed text-kahve-700">{p}</p>
                </KademeliOge>
              ))}
            </Kademeli>
          </div>

          <Reveal gecikme={0.1}>
            <AkilliGorsel
              anahtar="restoran/anne-sofrasi"
              alt="Ev mutfağında hazırlanan yemek"
              oran="4/3"
              sizes="(min-width: 1024px) 30rem, 92vw"
              className="overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgb(59_36_18/0.14)]"
            />
          </Reveal>
        </div>
      </Bolum>

      {/* İlkeler */}
      <Bolum>
        <BolumBasligi
          ustBaslik="Nasıl çalışıyoruz"
          baslik="Aldığımız kararlar"
          aciklama="Bunlar slogan değil, sistemin nasıl kurulduğunu belirleyen tercihler."
          ortala
        />

        <Kademeli
          etiket="ul"
          aralik={0.06}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {i.ilkeler.map((k) => (
            <KademeliOge
              key={k.baslik}
              etiket="li"
              className="flex h-full flex-col rounded-3xl border border-kahve-900/8 bg-white
                p-6 kart-kalk hover:border-sari-500/45"
            >
              <h3 className="font-display text-base leading-tight font-extrabold text-kahve-900">
                {k.baslik}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-kahve-600">{k.metin}</p>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Kimin için ne var */}
      <Bolum className="bant-sari">
        <BolumBasligi
          ustBaslik="Kimin için"
          baslik={
            <>
              Üç taraf var, <span className="metin-sari">üçü de kazanmalı</span>
            </>
          }
        />

        <Kademeli etiket="ul" aralik={0.08} className="mt-11 grid gap-4 lg:grid-cols-3">
          {i.taraflar.map((t) => (
            <KademeliOge
              key={t.kim}
              etiket="li"
              className="flex h-full flex-col rounded-[2rem] border border-kahve-900/8 bg-white p-7"
            >
              <h3 className="font-display text-xl leading-tight font-extrabold text-kahve-900">
                {t.kim}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-kahve-500">{t.ozet}</p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {t.maddeler.map((m) => (
                  <li key={m} className="flex gap-2.5 text-sm leading-snug text-kahve-700">
                    <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-nane/14 text-nane-koyu">
                      <KontrolIkon className="size-3" strokeWidth="3" />
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Hedefler */}
      <Bolum className="bg-kahve-900">
        <BolumBasligi
          ustBaslik="Sırada ne var"
          baslik={<span className="text-white">Hedeflerimiz</span>}
          aciklama={
            <span className="text-kahve-200/85">
              Aşağıdakiler <strong className="text-sari-300">henüz yapılmadı</strong> — sırayla
              hayata geçirmeyi planladığımız maddeler.
            </span>
          }
        />

        <Kademeli
          etiket="ul"
          aralik={0.06}
          className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {i.hedefler.map((h) => (
            <KademeliOge
              key={h.baslik}
              etiket="li"
              className="flex h-full flex-col rounded-3xl border border-white/12 bg-white/5 p-6"
            >
              <span className="text-2xs font-extrabold tracking-[0.16em] text-sari-300 uppercase">
                Planlanan
              </span>
              <h3 className="mt-2.5 font-display text-base leading-tight font-extrabold text-white">
                {h.baslik}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-kahve-200/80">{h.metin}</p>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* İletişim */}
      <Bolum>
        <Reveal>
          <div
            className="flex flex-col gap-7 rounded-[2rem] border border-kahve-900/8 bg-white
              p-8 md:flex-row md:items-center md:justify-between md:p-10"
          >
            <div>
              <h2 className="font-display text-2xl leading-tight font-extrabold text-kahve-900">
                Bize ulaş
              </h2>
              <dl className="mt-4 space-y-1.5 text-sm text-kahve-600">
                <div className="flex gap-2">
                  <dt className="font-bold text-kahve-800">Telefon:</dt>
                  <dd>{site.telefon}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-kahve-800">E-posta:</dt>
                  <dd>{site.eposta}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-kahve-800">Bölge:</dt>
                  <dd>{site.adres}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButonBaglanti href="/hesap/basvuru" boyut="lg">
                Aramıza katıl
                <OkIkon />
              </ButonBaglanti>
              <ButonBaglanti href="/iletisim" tur="hayalet" boyut="lg">
                İletişim
              </ButonBaglanti>
            </div>
          </div>
        </Reveal>
      </Bolum>

      <CagriBandi />
    </>
  );
}
