import type { Metadata } from "next";

import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { Akordiyon } from "@/components/ui/Akordiyon";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { Bolum, BolumBasligi } from "@/components/ui/Bolum";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import {
  AyarIkon,
  GrafikIkon,
  KalkanIkon,
  KontrolIkon,
  VeriIkon,
} from "@/components/ui/Ikonlar";
import { Kademeli, KademeliOge, Reveal } from "@/components/ui/Reveal";
import { Rozet } from "@/components/ui/Rozet";
import { Sayac } from "@/components/ui/Sayac";

export const metadata: Metadata = {
  title: "Veri Değerlendirme — Şirket verinizi kullanılabilir hâle getiriyoruz",
  description:
    "Dağınık, birbirine bağlanmamış şirket verisini toplayıp temizliyor, modelliyor ve karar " +
    "üreten panolara dönüştürüyoruz. Keşiften devire kadar beş adımlı, ölçülebilir bir süreç.",
  alternates: { canonical: "/veri-degerlendirme" },
};

const BELIRTILER = [
  {
    baslik: "Aynı soruya iki farklı cevap",
    metin:
      "Aynı metrik iki ayrı raporda farklı çıkıyorsa sorun raporlarda değil, tanımların " +
      "hiç yazılı olmamasındadır.",
  },
  {
    baslik: "Rapor hazırlamak günler sürüyor",
    metin:
      "Her ay sonu aynı tabloyu elle birleştiren biri varsa, o kişinin zamanı değil şirketin " +
      "karar hızı kaybediliyor.",
  },
  {
    baslik: "Veri var ama kimse kullanmıyor",
    metin:
      "Kurulmuş ama açılmayan panolar, veri projelerinin en yaygın sonucudur. Sebep genelde " +
      "panonun bir karara bağlanmamış olmasıdır.",
  },
  {
    baslik: "Geçmişe dönük analiz yapılamıyor",
    metin:
      "Durum değişimleri zaman damgasıyla saklanmıyorsa “bu ne zaman bozuldu” sorusu " +
      "cevaplanamaz — ve bu veri sonradan üretilemez.",
  },
  {
    baslik: "Sistemler birbirini tanımıyor",
    metin:
      "POS, e-ticaret, ERP ve saha uygulaması ayrı ayrı doğru; birleştirildiğinde hiçbiri " +
      "tutmuyorsa ortak bir kimlik anahtarı eksiktir.",
  },
];

const SUREC = [
  {
    baslik: "Keşif",
    sure: "1–2 hafta",
    metin:
      "Hangi kararları veriyle almak istediğinizi konuşuyoruz — teknolojiden önce soruyu " +
      "netleştiriyoruz. Mevcut sistemleri, alan sözlüğünü ve veri sahiplerini çıkarıyoruz.",
    cikti: "Veri envanteri, metrik sözlüğü ve öncelik listesi",
  },
  {
    baslik: "Toplama ve temizleme",
    sure: "2–4 hafta",
    metin:
      "Kaynak sistemlerden veri akışlarını kuruyoruz. Yinelenen kayıtları birleştiriyor, " +
      "eksik alanları işaretliyor ve serbest metin alanlarını kodlu listelere çeviriyoruz.",
    cikti: "Otomatik çalışan veri hattı ve kalite raporu",
  },
  {
    baslik: "Modelleme",
    sure: "2–3 hafta",
    metin:
      "Kaynak tablolarını analiz edilebilir bir modele dönüştürüyoruz: tek müşteri kimliği, " +
      "tarih boyutu, ürün hiyerarşisi ve metrik tanımları tek yerde.",
    cikti: "Belgelenmiş veri modeli ve hesaplanmış metrikler",
  },
  {
    baslik: "Panolar ve raporlar",
    sure: "1–2 hafta",
    metin:
      "Her pano bir karara bağlanır. Beş-yedi metrik, karşılaştırma noktası ve doğrudan " +
      "eyleme dönüşen bir öneri bölümü — fazlası değil.",
    cikti: "Rol bazlı panolar ve otomatik gönderilen özetler",
  },
  {
    baslik: "Devir ve iyileştirme",
    sure: "sürekli",
    metin:
      "Ekibinize devrediyoruz: tanımlar, veri sözlüğü ve bakım prosedürleri yazılı kalır. " +
      "Sonraki dönemde kullanım verisine göre panoları sadeleştiriyoruz.",
    cikti: "Eğitim, dokümantasyon ve düzenli gözden geçirme",
  },
];

const YETENEKLER = [
  {
    Ikon: VeriIkon,
    baslik: "Veri birleştirme",
    metin:
      "POS, e-ticaret, ERP, CRM, saha uygulamaları ve tablo dosyalarını ortak bir kimlik " +
      "anahtarı üzerinden birleştiriyoruz.",
  },
  {
    Ikon: AyarIkon,
    baslik: "Kalite ve tanım",
    metin:
      "Metrik tanımları yazılı hâle gelir; aynı sayı her raporda aynı anlama gelir. Kalite " +
      "kuralları otomatik kontrol edilir.",
  },
  {
    Ikon: GrafikIkon,
    baslik: "Analiz ve tahmin",
    metin:
      "Kohort analizi, kârlılık kırılımı, talep tahmini ve dar boğaz analizleri — hepsi " +
      "mevcut operasyon verinizden.",
  },
  {
    Ikon: KalkanIkon,
    baslik: "Güvenlik ve uyum",
    metin:
      "KVKK uyumlu işleme, rol bazlı erişim, anonimleştirme ve erişim kayıtları baştan " +
      "kurgulanır.",
  },
];

const TESLIMLER = [
  "Veri envanteri ve kaynak sistem haritası",
  "Yazılı metrik sözlüğü — her metriğin tek tanımı",
  "Otomatik çalışan veri hattı (günlük veya saatlik)",
  "Belgelenmiş analiz veri modeli",
  "Rol bazlı panolar: yönetim, operasyon ve saha",
  "Düzenli e-posta özetleri (haftalık/aylık)",
  "Veri kalitesi izleme ve uyarı kuralları",
  "Ekip eğitimi ve bakım dokümantasyonu",
];

const SORULAR = [
  {
    soru: "Verimiz çok dağınık, önce toparlamamız mı gerekiyor?",
    cevap:
      "Hayır — dağınıklık işin başlangıç noktası, ön koşulu değil. Keşif adımında mevcut " +
      "hâliyle çalışıyoruz. Aksine, önce kendiniz toparlamaya çalışmak genellikle iki kez iş " +
      "yapılmasına yol açar.",
  },
  {
    soru: "Hangi araçları kullanıyorsunuz?",
    cevap:
      "Araç seçimi mevcut altyapınıza göre yapılır; sizi tek bir ekosisteme kilitlemiyoruz. " +
      "Kural şu: veri modeli ve metrik tanımları taşınabilir kalır, böylece araç değişse bile " +
      "yaptığımız iş elinizde kalır.",
  },
  {
    soru: "Ne kadar sürede sonuç görürüz?",
    cevap:
      "İlk kullanılabilir pano tipik olarak 4–6 hafta içinde çıkar. Tamamı 8–12 hafta arası " +
      "sürer. Süreci baştan tek seferde bitirmek yerine, en çok kayıp üreten sorudan " +
      "başlayarak kademeli ilerlemeyi öneriyoruz.",
  },
  {
    soru: "Verimiz bizde mi kalıyor?",
    cevap:
      "Evet. Veri sizin sistemlerinizde veya sizin adınıza açılmış hesaplarda kalır. " +
      "Erişimimiz sözleşmeyle sınırlıdır, roller tanımlıdır ve proje sonunda erişimler " +
      "kapatılır. Erişim kayıtları size raporlanır.",
  },
  {
    soru: "Küçük bir işletme için de anlamlı mı?",
    cevap:
      "Anlamlı olması ölçekle değil, karar sayısıyla ilgilidir. Menü, fiyat, personel ve " +
      "tedarik kararları alıyorsanız bu kararların dayanacağı veri zaten elinizde var. " +
      "Küçük ölçekte kapsam daraltılır, süre kısalır.",
  },
  {
    soru: "Mevcut raporlarımızı sıfırdan mı yazıyorsunuz?",
    cevap:
      "Çalışan raporlar korunur. Amacımız yeni bir rapor yığını üretmek değil; tanımları " +
      "birleştirip güvenilmez olanları ayıklamak. Çoğu projede rapor sayısı azalır, " +
      "kullanım oranı artar.",
  },
];

export default function VeriDegerlendirmeSayfasi() {
  return (
    <>
      <SayfaBasligi
        ustBaslik="Veri değerlendirme"
        baslik={
          <>
            Şirketinizin verisini{" "}
            <span className="metin-sari">kullanılabilir hâle</span> getiriyoruz
          </>
        }
        aciklama="Elinizde zaten bir varlık var: geçmiş sipariş, satış, stok ve saha kayıtları. Biz bu veriyi toplayıp temizliyor, modelliyor ve karar üreten panolara dönüştürüyoruz."
        kirintiYolu={[{ etiket: "Veri Değerlendirme" }]}
        cocuk={
          <div className="flex flex-wrap gap-3">
            <ButonBaglanti href="#surec" boyut="lg">
              Süreci gör
              <OkIkon />
            </ButonBaglanti>
            <ButonBaglanti href="/iletisim?konu=kurumsal" tur="hayalet" boyut="lg">
              Görüşme planla
            </ButonBaglanti>
          </div>
        }
      />

      {/* Kapak görseli */}
      <div className="kap">
        <Reveal kaydir={30}>
          <AkilliGorsel
            anahtar="veri/hero"
            oran="21/9"
            priority
            sizes="(min-width: 1280px) 76rem, 94vw"
            className="rounded-[2rem] shadow-kalkik ring-1 ring-kahve-900/8"
          />
        </Reveal>
      </div>

      {/* Sayılar */}
      <div className="kap mt-14">
        <Reveal>
          <dl className="grid grid-cols-1 gap-6 rounded-[2rem] bg-kahve-900 px-6 py-9 sm:grid-cols-4 md:px-10">
            {[
              { hedef: 5, sonEk: "", etiket: "adımlı, tanımlı süreç" },
              { hedef: 6, sonEk: " hafta", etiket: "ilk kullanılabilir panoya kadar" },
              { hedef: 12, sonEk: "+", etiket: "bağlanabilen kaynak sistem tipi" },
              { hedef: 100, sonEk: "%", etiket: "veri sizin sistemlerinizde kalır" },
            ].map((s) => (
              <div key={s.etiket} className="text-center">
                <dt className="sr-only">{s.etiket}</dt>
                <dd>
                  <span className="block font-display text-3xl font-extrabold text-sari-400 md:text-4xl">
                    <Sayac hedef={s.hedef} sonEk={s.sonEk} />
                  </span>
                  <span className="mt-1.5 block text-xs leading-snug font-medium text-kahve-200/80">
                    {s.etiket}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      {/* Belirtiler */}
      <Bolum>
        <BolumBasligi
          ustBaslik="Tanı"
          baslik="Verinizin değerlendirilmeye ihtiyacı var mı?"
          aciklama="Aşağıdakilerden ikisi tanıdık geliyorsa, sorun veri eksikliği değil; verinin karar üretecek biçime hiç getirilmemiş olması."
        />
        <Kademeli
          etiket="ul"
          aralik={0.06}
          className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {BELIRTILER.map((b, i) => (
            <KademeliOge key={b.baslik} etiket="li">
              <article className="flex h-full flex-col rounded-3xl border border-domates/20 bg-domates/5 p-6">
                <span className="grid size-10 place-items-center rounded-2xl bg-domates/14 font-display text-sm font-extrabold text-domates-koyu">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-base leading-snug font-extrabold text-kahve-900">
                  {b.baslik}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-kahve-600">{b.metin}</p>
              </article>
            </KademeliOge>
          ))}
        </Kademeli>
      </Bolum>

      {/* Süreç */}
      <Bolum id="surec" className="bg-krem-koyu/60">
        <BolumBasligi
          ustBaslik="Süreç"
          baslik={
            <>
              Keşiften devire, <span className="metin-sari">beş adım</span>
            </>
          }
          aciklama="Her adımın tanımlı bir çıktısı var. Sonraki adıma ancak o çıktı elinizde olduğunda geçiyoruz."
        />

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <Kademeli etiket="ol" aralik={0.08} className="space-y-4">
            {SUREC.map((a, i) => (
              <KademeliOge key={a.baslik} etiket="li">
                <article className="group relative rounded-3xl border border-kahve-900/8 bg-white p-6 transition-[border-color,box-shadow] duration-400 ease-[var(--ease-yumusak)] hover:border-sari-500/45 hover:shadow-kart md:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="flex items-center gap-3 text-lg font-extrabold text-kahve-900">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-2xl bg-sari-500
                          font-display text-sm font-extrabold text-kahve-900
                          transition-transform duration-500 ease-[var(--ease-yayli)]
                          group-hover:-rotate-6"
                      >
                        {i + 1}
                      </span>
                      {a.baslik}
                    </h3>
                    <Rozet ton="acik">{a.sure}</Rozet>
                  </div>

                  <p className="mt-3.5 text-sm leading-relaxed text-kahve-600">{a.metin}</p>

                  <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-nane/8 px-4 py-3 text-sm leading-snug font-semibold text-nane-koyu">
                    <KontrolIkon className="mt-0.5 size-4 shrink-0" strokeWidth="2.6" />
                    <span>
                      <span className="text-2xs font-extrabold tracking-wide uppercase opacity-70">
                        Çıktı
                      </span>
                      <br />
                      {a.cikti}
                    </span>
                  </p>
                </article>
              </KademeliOge>
            ))}
          </Kademeli>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal gecikme={0.1}>
              <AkilliGorsel
                anahtar="veri/surec"
                oran="4/3"
                sizes="(min-width: 1024px) 30rem, 92vw"
                className="rounded-[1.75rem] shadow-kart ring-1 ring-kahve-900/8"
              />
            </Reveal>

            <Reveal gecikme={0.16}>
              <div className="mt-6 rounded-3xl border border-kahve-900/8 bg-white p-6">
                <h3 className="font-display text-2xs font-extrabold tracking-[0.18em] text-kahve-400 uppercase">
                  Teslim edilenler
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {TESLIMLER.map((t) => (
                    <li key={t} className="flex gap-2.5 text-sm leading-snug text-kahve-700">
                      <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-sari-500/18 text-sari-700">
                        <KontrolIkon className="size-3" strokeWidth="3" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </Bolum>

      {/* Yetenekler */}
      <Bolum id="entegrasyon">
        <BolumBasligi
          ustBaslik="Kapsam"
          baslik="Neleri kapsıyor?"
          aciklama="Veri hattından panoya, tanım disiplininden erişim güvenliğine kadar tek sorumlulukta."
        />
        <Kademeli etiket="ul" className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {YETENEKLER.map((y) => (
            <KademeliOge key={y.baslik} etiket="li">
              <article className="group flex h-full gap-5 rounded-3xl border border-kahve-900/8 bg-white p-6 kart-kalk hover:border-sari-500/45 md:p-7">
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sari-500/14
                    text-sari-700 transition-all duration-500 ease-[var(--ease-yayli)]
                    group-hover:-rotate-6 group-hover:bg-sari-500 group-hover:text-kahve-900"
                >
                  <y.Ikon className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg leading-snug font-extrabold text-kahve-900">{y.baslik}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-kahve-600">{y.metin}</p>
                </div>
              </article>
            </KademeliOge>
          ))}
        </Kademeli>

        <Reveal gecikme={0.1}>
          <div className="mt-6 rounded-3xl border border-kahve-900/8 bg-white/70 p-6 md:p-8">
            <h3 className="font-display text-2xs font-extrabold tracking-[0.18em] text-kahve-400 uppercase">
              Bağlanabilen kaynaklar
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {[
                "POS / yazarkasa",
                "E-ticaret altyapıları",
                "Pazaryerleri",
                "ERP",
                "CRM",
                "Stok / WMS",
                "Saha uygulamaları",
                "Ödeme sağlayıcıları",
                "e-Fatura / e-Arşiv",
                "Excel & CSV dosyaları",
                "Google Analytics",
                "Reklam platformları",
              ].map((k) => (
                <li key={k}>
                  <span className="inline-flex items-center gap-2 rounded-full bg-kahve-900/5 px-3.5 py-2 text-sm font-semibold text-kahve-700">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-sari-600" />
                    {k}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Bolum>

      {/* Pano örneği */}
      <Bolum className="bg-krem-koyu/60">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <BolumBasligi
              ustBaslik="Sonuç"
              baslik="Kimsenin açmadığı pano, kurulmamış panodur"
              aciklama="Bu yüzden her panoyu bir karara bağlıyoruz: kim, hangi sıklıkla, hangi kararı verirken bakacak? Cevabı olmayan metrik panoya girmiyor."
              className="lg:flex-col lg:items-start"
            />
            <ul className="mt-8 space-y-3">
              {[
                "Ekranda en fazla 5–7 metrik — fazlası panoyu terk ettirir",
                "Her metriğin yanında karşılaştırma: geçen dönem veya hedef",
                "Şube, saat dilimi ve kanal bazında kırılım imkânı",
                "Eylem bölümü: doğrudan karara dönüşen öneri listesi",
                "Sabit ritim: pazartesi sabahı gelen özet en çok okunan rapordur",
              ].map((m) => (
                <li key={m} className="flex gap-3 text-[0.9375rem] leading-relaxed text-kahve-700">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-nane/14 text-nane-koyu">
                    <KontrolIkon className="size-3.5" strokeWidth="2.8" />
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal gecikme={0.1} kaydir={30}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-3 -rotate-2 rounded-[2.5rem] bg-sari-500/18"
              />
              <AkilliGorsel
                anahtar="veri/panel"
                oran="16/9"
                sizes="(min-width: 1024px) 34rem, 92vw"
                className="rounded-[1.75rem] shadow-kalkik ring-1 ring-kahve-900/8"
              />
            </div>
          </Reveal>
        </div>
      </Bolum>

      {/* SSS */}
      <Bolum>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <BolumBasligi
            ustBaslik="Sıkça sorulanlar"
            baslik="Süreç hakkında"
            className="lg:flex-col lg:items-start"
          />
          <Reveal gecikme={0.08}>
            <Akordiyon ogeler={SORULAR} />
          </Reveal>
        </div>
      </Bolum>

      {/* CTA */}
      <Bolum className="pt-0">
        <Reveal>
          <div className="rounded-[2rem] bg-gradient-to-br from-sari-300 to-sari-500 px-7 py-10 md:px-12 md:py-14">
            <h2 className="max-w-2xl text-2xl leading-tight font-extrabold text-kahve-900 sm:text-3xl md:text-4xl">
              Elinizdeki veriyle ne yapılabileceğini birlikte görelim
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-kahve-800/85">
              İlk görüşme bir keşif konuşmasıdır: hangi kararları veriyle almak istediğinizi
              konuşur, mevcut sistemlerinize bakar ve size gerçekçi bir kapsam öneririz.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButonBaglanti href="/iletisim?konu=kurumsal" tur="ikincil" boyut="lg">
                Keşif görüşmesi planla
                <OkIkon />
              </ButonBaglanti>
              <ButonBaglanti href="/blog/siparis-verisini-kara-cevirmek" tur="hayalet" boyut="lg">
                Önce örnek analizleri oku
              </ButonBaglanti>
            </div>
          </div>
        </Reveal>
      </Bolum>
    </>
  );
}
