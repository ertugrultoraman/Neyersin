import type { Metadata } from "next";

import { AyinHanimlari } from "@/components/anasayfa/AyinHanimlari";
import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { Akordiyon } from "@/components/ui/Akordiyon";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { Bolum, BolumBasligi } from "@/components/ui/Bolum";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import {
  DukkanIkon,
  GrafikIkon,
  KalkanIkon,
  KonumIkon,
  KullaniciIkon,
  MutfakIkon,
  RozetIkon,
  SaatIkon,
  ScooterIkon,
  SimsekIkon,
  VeriIkon,
  YildizIkon,
} from "@/components/ui/Ikonlar";
import { Kademeli, KademeliOge, Reveal } from "@/components/ui/Reveal";
import { Rozet } from "@/components/ui/Rozet";
import { evHanimlari, type IkonAnahtari } from "@/content/ev-hanimlari";

export const metadata: Metadata = {
  title: "Ev Hanımları & Şefler",
  description:
    "Evinde pişirip satmak isteyen ev hanımları ve şefler için Ne Yersin?: başvuru, " +
    "kendi mutfak sayfan, üç eksenli değerlendirme, kurye ataması ve resmî süreçlerde " +
    "yol gösterme. Teslimat bölgesi: İstanbul / Beylikdüzü.",
  alternates: { canonical: "/ev-hanimlari" },
};

/** İçerikteki ikon adını gerçek bileşene eşler. */
const IKONLAR: Record<IkonAnahtari, typeof DukkanIkon> = {
  dukkan: DukkanIkon,
  kullanici: KullaniciIkon,
  yildiz: YildizIkon,
  kalkan: KalkanIkon,
  rozet: RozetIkon,
  mutfak: MutfakIkon,
  saat: SaatIkon,
  scooter: ScooterIkon,
  veri: VeriIkon,
  grafik: GrafikIkon,
  konum: KonumIkon,
  simsek: SimsekIkon,
};

export default function EvHanimlariSayfasi() {
  const i = evHanimlari;

  return (
    <>
      <SayfaBasligi
        ustBaslik={i.ustBaslik}
        baslik={
          <>
            {i.baslik}
            {" — "}
            <span className="metin-sari">{i.baslikVurgu}</span>
          </>
        }
        aciklama={i.ozet}
        kirintiYolu={[{ etiket: "Ev Hanımları" }]}
        cocuk={
          <div className="flex flex-wrap items-center gap-3">
            <ButonBaglanti href="/hesap/basvuru" boyut="lg">
              Başvuru yap
              <OkIkon />
            </ButonBaglanti>
            <ButonBaglanti href="/hesap/giris" tur="hayalet" boyut="lg">
              Zaten hesabım var
            </ButonBaglanti>
          </div>
        }
      />

      {/* Rakamlar */}
      <Bolum className="pt-0 pb-10 md:pt-0 md:pb-12">
        <Kademeli etiket="ul" aralik={0.06} className="grid gap-4 sm:grid-cols-3">
          {i.rakamlar.map((r) => (
            <KademeliOge
              key={r.etiket}
              etiket="li"
              className="rounded-3xl border border-kahve-900/8 bg-white p-6"
            >
              <span className="block font-display text-3xl leading-none font-extrabold text-kahve-900">
                {r.deger}
              </span>
              <span className="mt-2.5 block text-sm leading-snug font-medium text-kahve-500">
                {r.etiket}
              </span>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Engel — neden böyle bir şey lazım */}
      <Bolum className="bant-sari">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <BolumBasligi
              ustBaslik="Neden"
              baslik={
                <>
                  Engel yemek yapmak değil — <span className="metin-sari">geri kalan her şey</span>
                </>
              }
              aciklama="Evinde iyi yemek yapan çok kişi var. Bu işi satışa çeviremeyenlerin takıldığı yer hep aynı üç madde."
              className="lg:flex-col lg:items-start"
            />

            <Kademeli etiket="ul" aralik={0.07} className="mt-9 space-y-4">
              {i.engeller.map((e, s) => (
                <KademeliOge key={e.baslik} etiket="li" className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full
                      bg-domates/12 font-display text-sm font-extrabold text-domates-koyu"
                  >
                    {s + 1}
                  </span>
                  <span>
                    <span className="block font-display text-base font-extrabold text-kahve-900">
                      {e.baslik}
                    </span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-kahve-600">
                      {e.metin}
                    </span>
                  </span>
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

      {/* Adımlar */}
      <Bolum id="nasil-basvururum">
        <BolumBasligi
          ustBaslik="Nasıl başlarım"
          baslik="Başvurudan ilk siparişe dört adım"
          aciklama="Hepsi bugün çalışıyor — anlatılan akışın tamamı sistemde kurulu."
          ortala
        />

        <Kademeli
          etiket="ol"
          aralik={0.07}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {i.adimlar.map((a) => (
            <KademeliOge
              key={a.no}
              etiket="li"
              className="relative flex h-full flex-col rounded-3xl border border-kahve-900/8
                bg-white p-6 kart-kalk"
            >
              <span className="font-display text-3xl leading-none font-extrabold text-sari-500">
                {a.no}
              </span>
              <h3 className="mt-4 font-display text-lg leading-tight font-extrabold text-kahve-900">
                {a.baslik}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-kahve-600">{a.metin}</p>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Bugün çalışan özellikler */}
      <Bolum className="bant-sari">
        <BolumBasligi
          ustBaslik="Bugün sistemde olan"
          baslik={
            <>
              Onaylandığın gün <span className="metin-sari">elinde ne oluyor?</span>
            </>
          }
          aciklama="Aşağıdakiler söz değil, kurulu özellikler. Henüz yapılmamış olanlar sayfanın alt tarafında ayrı listede."
        />

        <Kademeli
          etiket="ul"
          aralik={0.06}
          className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {i.bugunVarOlanlar.map((o) => {
            const Ikon = IKONLAR[o.ikon];
            return (
              <KademeliOge
                key={o.baslik}
                etiket="li"
                className="flex h-full flex-col rounded-3xl border border-kahve-900/8 bg-white
                  p-6 kart-kalk hover:border-sari-500/45"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-sari-500/16 text-sari-700">
                  <Ikon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-extrabold text-kahve-900">
                  {o.baslik}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-kahve-600">{o.metin}</p>
              </KademeliOge>
            );
          })}
        </Kademeli>
      </Bolum>

      {/* Üç eksen */}
      <Bolum id="degerlendirme">
        <BolumBasligi
          ustBaslik="Değerlendirme"
          baslik="Tek yıldız değil, üç ayrı not"
          aciklama="Müşteri siparişini üç başlıkta ayrı ayrı puanlar. Böylece iyi olduğun taraf da, düzeltmen gereken taraf da kaybolmaz."
          ortala
        />

        <Kademeli etiket="ul" aralik={0.08} className="mt-12 grid gap-4 md:grid-cols-3">
          {i.eksenler.map((e, s) => (
            <KademeliOge
              key={e.ad}
              etiket="li"
              className="flex h-full flex-col rounded-[2rem] border border-kahve-900/8 bg-white p-7"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-full bg-kahve-900 font-display
                    text-sm font-extrabold text-sari-300"
                >
                  {s + 1}
                </span>
                <h3 className="font-display text-xl font-extrabold text-kahve-900">{e.ad}</h3>
              </div>

              <p className="mt-4 flex items-start gap-2 text-sm font-bold text-kahve-800">
                <YildizIkon className="mt-0.5 size-4 shrink-0 text-sari-500" />
                {e.ozet}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-kahve-600">{e.metin}</p>
            </KademeliOge>
          ))}
        </Kademeli>

        <Reveal gecikme={0.1}>
          <div
            className="mt-6 flex flex-col gap-4 rounded-[2rem] border-2 border-domates/25
              bg-domates/6 p-7 sm:flex-row sm:items-center md:p-8"
          >
            <span
              className="grid shrink-0 place-items-center rounded-2xl bg-domates px-5 py-3
                font-display text-xl font-extrabold text-white"
            >
              {i.puanKurali.esik}
            </span>
            <p className="text-sm leading-relaxed text-kahve-700 md:text-[0.9375rem]">
              {i.puanKurali.metin}
            </p>
          </div>
        </Reveal>
      </Bolum>

      {/* Resmî taraf */}
      <Bolum className="bant-sari">
        <BolumBasligi
          ustBaslik="Resmî taraf"
          baslik={
            <>
              Belgeler <span className="metin-sari">seni korkutmasın</span>
            </>
          }
          aciklama="Bu süreçler kişinin kendi adına yürüyor — ama hangi belge nereden alınır, sırası nedir, birlikte çözüyoruz."
        />

        <Kademeli etiket="ul" aralik={0.07} className="mt-11 grid gap-4 md:grid-cols-3">
          {i.resmiKonular.map((r) => (
            <KademeliOge
              key={r.baslik}
              etiket="li"
              className="flex h-full flex-col rounded-3xl border border-kahve-900/8 bg-white p-6 md:p-7"
            >
              <Rozet ton="nane" className="self-start">
                {r.kurum}
              </Rozet>
              <h3 className="mt-4 font-display text-lg leading-tight font-extrabold text-kahve-900">
                {r.baslik}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-kahve-600">{r.metin}</p>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Sistemdeki ev hanımları */}
      <AyinHanimlari />

      {/* Yol haritası — henüz yapılmadı */}
      <Bolum className="bg-kahve-900" id="yol-haritasi">
        <BolumBasligi
          ustBaslik="Yol haritası"
          baslik={<span className="text-white">Sırada ne var?</span>}
          aciklama={
            <span className="text-kahve-200/85">
              Aşağıdakiler <strong className="text-sari-300">henüz yapılmadı</strong> — proje
              dosyasında yazan ve sırayla hayata geçirilecek maddeler. Var olan özelliklerle
              karışmasın diye ayrı tutuyoruz.
            </span>
          }
        />

        <Kademeli
          etiket="ul"
          aralik={0.05}
          className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {i.yolHaritasi.map((y) => (
            <KademeliOge
              key={y.baslik}
              etiket="li"
              className="flex h-full flex-col rounded-3xl border border-white/12 bg-white/5 p-6"
            >
              <span className="text-2xs font-extrabold tracking-[0.16em] text-sari-300 uppercase">
                Planlanan
              </span>
              <h3 className="mt-2.5 font-display text-base leading-tight font-extrabold text-white">
                {y.baslik}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-kahve-200/80">{y.metin}</p>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* SSS */}
      <Bolum>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <BolumBasligi
            ustBaslik="Sıkça sorulan sorular"
            baslik="Başvurmadan önce"
            aciklama="Aradığın cevap yoksa iletişim sayfasından yazabilirsin."
            className="lg:flex-col lg:items-start"
          />
          <Reveal gecikme={0.08}>
            <Akordiyon ogeler={[...i.sss]} />
          </Reveal>
        </div>
      </Bolum>

      <CagriBandi />
    </>
  );
}
