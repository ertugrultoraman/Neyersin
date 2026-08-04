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
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri, sec } from "@/lib/sozluk";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Ne Yersin? neden kuruldu, nasıl çalışıyor ve kimin için: ev hanımları, şefler, " +
    "kuryeler ve müşteriler. Teslimat bölgesi: İstanbul / Beylikdüzü.",
  alternates: { canonical: "/hakkimizda" },
};

export default async function HakkimizdaSayfasi() {
  const dil = await aktifDil();
  const c = ceviri(dil);
  const i = hakkimizda;

  return (
    <>
      <SayfaBasligi
        ustBaslik={sec(dil, i.ustBaslik, i.ustBaslikEn)}
        baslik={
          <>
            {sec(dil, i.baslik, i.baslikEn)}{" "}
            <span className="metin-sari">{sec(dil, i.baslikVurgu, i.baslikVurguEn)}</span>
          </>
        }
        aciklama={sec(dil, i.ozet, i.ozetEn)}
        kirintiYolu={[{ etiket: sec(dil, i.ustBaslik, i.ustBaslikEn) }]}
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
                {sec(dil, k.deger, k.degerEn)}
              </span>
              <span className="mt-2.5 block text-sm leading-snug font-medium text-kahve-500">
                {sec(dil, k.etiket, k.etiketEn)}
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
              ustBaslik={c("hakkimizda.nedenKurduk")}
              baslik={
                <>
                  {c("hakkimizda.hikayeBaslik1")}{" "}
                  <span className="metin-sari">{c("hakkimizda.hikayeBaslik2")}</span>
                </>
              }
              className="lg:flex-col lg:items-start"
            />
            <Kademeli aralik={0.08} className="mt-8 space-y-4">
              {(dil === "en" && i.hikayeEn ? i.hikayeEn : i.hikaye).map((p) => (
                <KademeliOge key={p.slice(0, 32)}>
                  <p className="max-w-2xl leading-relaxed text-kahve-700">{p}</p>
                </KademeliOge>
              ))}
            </Kademeli>
          </div>

          <Reveal gecikme={0.1}>
            <AkilliGorsel
              anahtar="restoran/anne-sofrasi"
              alt={c("hakkimizda.gorselAlt")}
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
          ustBaslik={c("hakkimizda.nasilCalisiyoruz")}
          baslik={c("hakkimizda.aldigimizKararlar")}
          aciklama={c("hakkimizda.kararlarAciklama")}
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
                {sec(dil, k.baslik, k.baslikEn)}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-kahve-600">{sec(dil, k.metin, k.metinEn)}</p>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Kimin için ne var */}
      <Bolum className="bant-sari">
        <BolumBasligi
          ustBaslik={c("sayfa.kimIcin")}
          baslik={
            <>
              {c("sayfa.kimIcin1")} <span className="metin-sari">{c("sayfa.kimIcin2")}</span>
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
                {sec(dil, t.kim, t.kimEn)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-kahve-500">{sec(dil, t.ozet, t.ozetEn)}</p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {(dil === "en" && t.maddelerEn ? t.maddelerEn : t.maddeler).map((m) => (
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
          ustBaslik={c("hakkimizda.siradaNeVar")}
          baslik={<span className="text-white">{c("hakkimizda.hedeflerimiz")}</span>}
          aciklama={
            <span className="text-kahve-200/85">
              <strong className="text-sari-300">{c("hakkimizda.henuzYapilmadi")}</strong>{" "}
              {c("hakkimizda.hedefAciklama")}
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
                {c("hakkimizda.planlanan")}
              </span>
              <h3 className="mt-2.5 font-display text-base leading-tight font-extrabold text-white">
                {sec(dil, h.baslik, h.baslikEn)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-kahve-200/80">{sec(dil, h.metin, h.metinEn)}</p>
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
                {c("hakkimizda.bizeUlas")}
              </h2>
              <dl className="mt-4 space-y-1.5 text-sm text-kahve-600">
                <div className="flex gap-2">
                  <dt className="font-bold text-kahve-800">{c("hakkimizda.telefon")}</dt>
                  <dd>{site.telefon}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-kahve-800">{c("hakkimizda.eposta")}</dt>
                  <dd>{site.eposta}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-kahve-800">{c("hakkimizda.bolge")}</dt>
                  <dd>{site.adres}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButonBaglanti href="/hesap/basvuru" boyut="lg">
                {c("hakkimizda.aramizaKatil")}
                <OkIkon />
              </ButonBaglanti>
              <ButonBaglanti href="/iletisim" tur="hayalet" boyut="lg">
                {c("menu.iletisim")}
              </ButonBaglanti>
            </div>
          </div>
        </Reveal>
      </Bolum>

      <CagriBandi />
    </>
  );
}
