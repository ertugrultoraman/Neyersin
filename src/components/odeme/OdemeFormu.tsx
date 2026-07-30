"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type ReactNode } from "react";

import { siparisOlustur, type SiparisSonucu } from "@/app/odeme/actions";
import { ilcelerYakaya } from "@/content/istanbul";
import { odeme } from "@/content/odeme";
import type { DogrulamaHatalari, SiparisKalemi, Tutarlar } from "@/lib/siparis";
import { cn, paraFormatla } from "@/lib/utils";
import { useAdres } from "../saglayici/AdresBaglami";
import { useSepet } from "../saglayici/SepetBaglami";
import { Buton, ButonBaglanti, OkIkon } from "../ui/Buton";
import { KontrolIkon, SepetIkon } from "../ui/Ikonlar";
import { Rozet } from "../ui/Rozet";

type FormDurumu = {
  adSoyad: string;
  telefon: string;
  eposta: string;
  ilce: string;
  mahalle: string;
  acikAdres: string;
  binaNo: string;
  daireNo: string;
  tarif: string;
  not: string;
};

const BOS_FORM: FormDurumu = {
  adSoyad: "",
  telefon: "",
  eposta: "",
  ilce: "",
  mahalle: "",
  acikAdres: "",
  binaNo: "",
  daireNo: "",
  tarif: "",
  not: "",
};

export function OdemeFormu() {
  const { kalemler, restoranSlug, restoranAdi, tutarlar, hazir, temizle } = useSepet();
  const { ilce: secilenIlce } = useAdres();

  const [form, setForm] = useState<FormDurumu>(BOS_FORM);
  const [hatalar, setHatalar] = useState<DogrulamaHatalari>({});
  const [sonuc, setSonuc] = useState<
    | {
        siparisNo: string;
        tutarlar: Tutarlar;
        restoranAdi: string;
        kalemler: SiparisKalemi[];
      }
    | null
  >(null);
  const [gonderiliyor, basla] = useTransition();

  // Header'dan seçilen ilçeyi forma taşı
  useEffect(() => {
    if (secilenIlce) setForm((o) => (o.ilce ? o : { ...o, ilce: secilenIlce }));
  }, [secilenIlce]);

  function guncelle<K extends keyof FormDurumu>(alan: K, deger: FormDurumu[K]) {
    setForm((o) => ({ ...o, [alan]: deger }));
    setHatalar((o) => ({ ...o, [alan]: undefined }));
  }

  function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!restoranSlug) return;

    basla(async () => {
      const cevap: SiparisSonucu = await siparisOlustur(
        restoranSlug,
        kalemler.map((k) => ({ urunId: k.urunId, adet: k.adet })),
        {
          musteri: { adSoyad: form.adSoyad, telefon: form.telefon, eposta: form.eposta },
          adres: {
            ilce: form.ilce,
            mahalle: form.mahalle,
            acikAdres: form.acikAdres,
            binaNo: form.binaNo,
            daireNo: form.daireNo,
            tarif: form.tarif,
          },
          not: form.not,
        },
      );

      if (cevap.basarili) {
        setSonuc({
          siparisNo: cevap.siparisNo,
          tutarlar: cevap.tutarlar,
          restoranAdi: cevap.restoranAdi,
          kalemler: cevap.kalemler,
        });
        setHatalar({});
        temizle();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setHatalar(cevap.hatalar);
        document
          .querySelector("[data-hata='true']")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // 1) Sipariş oluştu → havale talimatı
  if (sonuc) return <SiparisTamam sonuc={sonuc} />;

  // 2) Sepet henüz yüklenmedi
  if (!hazir) {
    return (
      <div className="kap py-20">
        <div className="mx-auto h-40 max-w-md rounded-3xl parlayan" />
      </div>
    );
  }

  // 3) Sepet boş
  if (kalemler.length === 0 || !restoranSlug) {
    return (
      <div className="kap py-16 md:py-24">
        <div className="mx-auto max-w-md rounded-[2rem] border border-kahve-900/8 bg-white px-6 py-14 text-center shadow-yumusak">
          <span className="mx-auto grid size-16 place-items-center rounded-4xl bg-sari-500/16 text-sari-700">
            <SepetIkon className="size-8" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Sepetin boş</h1>
          <p className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed text-kahve-500">
            Ödeme adımına geçmek için önce bir restorandan ürün eklemen gerekiyor.
          </p>
          <ButonBaglanti href="/#restoranlar" boyut="lg" className="mt-7">
            Restoranlara göz at
            <OkIkon />
          </ButonBaglanti>
        </div>
      </div>
    );
  }

  return (
    <div className="kap py-10 md:py-14">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <form onSubmit={gonder} noValidate className="space-y-6">
          {/* Genel hatalar */}
          {(hatalar.kalemler || hatalar.minSepet || hatalar.restoran) && (
            <p
              data-hata="true"
              role="alert"
              className="rounded-2xl bg-domates/10 px-4 py-3 text-sm font-semibold text-domates-koyu"
            >
              {hatalar.kalemler ?? hatalar.minSepet ?? hatalar.restoran}
            </p>
          )}

          {/* İletişim */}
          <Kart baslik="İletişim bilgileri" adim={1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Alan
                etiket="Ad Soyad"
                hata={hatalar.adSoyad}
                className="sm:col-span-2"
              >
                <input
                  value={form.adSoyad}
                  onChange={(e) => guncelle("adSoyad", e.target.value)}
                  autoComplete="name"
                  placeholder="Adınız ve soyadınız"
                  className={girdiSinifi(hatalar.adSoyad)}
                />
              </Alan>

              <Alan etiket="Telefon" hata={hatalar.telefon} ipucu="Kurye bu numarayı arar">
                <input
                  value={form.telefon}
                  onChange={(e) => guncelle("telefon", e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="5XX XXX XX XX"
                  className={girdiSinifi(hatalar.telefon)}
                />
              </Alan>

              <Alan etiket="E-posta" hata={hatalar.eposta} ipucu="Sipariş özeti buraya gider">
                <input
                  value={form.eposta}
                  onChange={(e) => guncelle("eposta", e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="ornek@eposta.com"
                  className={girdiSinifi(hatalar.eposta)}
                />
              </Alan>
            </div>
          </Kart>

          {/* Adres */}
          <Kart
            baslik="Teslimat adresi"
            adim={2}
            yan={<Rozet ton="acik">Yalnızca İstanbul</Rozet>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Alan etiket="İlçe" hata={hatalar.ilce}>
                <select
                  value={form.ilce}
                  onChange={(e) => guncelle("ilce", e.target.value)}
                  className={girdiSinifi(hatalar.ilce)}
                >
                  <option value="">İlçe seçin</option>
                  {ilcelerYakaya().map((grup) => (
                    <optgroup key={grup.yaka} label={`${grup.yaka} Yakası`}>
                      {grup.ilceler.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Alan>

              <Alan etiket="Mahalle" hata={hatalar.mahalle}>
                <input
                  value={form.mahalle}
                  onChange={(e) => guncelle("mahalle", e.target.value)}
                  placeholder="Örn. Caferağa"
                  className={girdiSinifi(hatalar.mahalle)}
                />
              </Alan>

              <Alan
                etiket="Cadde / Sokak"
                hata={hatalar.acikAdres}
                className="sm:col-span-2"
              >
                <input
                  value={form.acikAdres}
                  onChange={(e) => guncelle("acikAdres", e.target.value)}
                  autoComplete="street-address"
                  placeholder="Örn. Moda Caddesi, Güneş Sokak"
                  className={girdiSinifi(hatalar.acikAdres)}
                />
              </Alan>

              <Alan etiket="Bina No" hata={hatalar.binaNo}>
                <input
                  value={form.binaNo}
                  onChange={(e) => guncelle("binaNo", e.target.value)}
                  placeholder="12/A"
                  className={girdiSinifi(hatalar.binaNo)}
                />
              </Alan>

              <Alan etiket="Daire No" ipucu="Zorunlu değil">
                <input
                  value={form.daireNo}
                  onChange={(e) => guncelle("daireNo", e.target.value)}
                  placeholder="7"
                  className={girdiSinifi()}
                />
              </Alan>

              <Alan
                etiket="Adres tarifi"
                ipucu="Zorunlu değil — kuryeye yardımcı olur"
                className="sm:col-span-2"
              >
                <input
                  value={form.tarif}
                  onChange={(e) => guncelle("tarif", e.target.value)}
                  placeholder="Örn. eczanenin yanındaki apartman, zil çalışmıyor"
                  className={girdiSinifi()}
                />
              </Alan>
            </div>
          </Kart>

          {/* Ödeme */}
          <Kart baslik="Ödeme yöntemi" adim={3}>
            <div className="rounded-2xl border-2 border-sari-500 bg-sari-500/8 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sari-500 text-kahve-900">
                  <KontrolIkon className="size-3.5" strokeWidth="3" />
                </span>
                <div>
                  <p className="font-display text-base font-extrabold text-kahve-900">
                    {odeme.yontemAdi}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-kahve-700">
                    Siparişini oluşturduğunda sipariş numaran ve IBAN bilgisi gösterilecek.
                    Ödemeni {odeme.odemeSuresiSaat} saat içinde yaptığında sipariş mutfağa
                    iletilir. {odeme.aciklamaKurali}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-kahve-500">
              Online kart ödemesi şu an aktif değil. Kapıda ödeme de bulunmuyor.
            </p>

            <Alan etiket="Sipariş notu" ipucu="Zorunlu değil" className="mt-5">
              <textarea
                value={form.not}
                onChange={(e) => guncelle("not", e.target.value)}
                rows={3}
                placeholder="Örn. sos ayrı gelsin, soğan olmasın"
                className={cn(girdiSinifi(), "resize-y")}
              />
            </Alan>
          </Kart>

          <Buton
            type="submit"
            boyut="lg"
            className="w-full"
            disabled={gonderiliyor || !tutarlar?.minSepetKarsilandi}
            ikon={gonderiliyor ? undefined : <OkIkon />}
          >
            {gonderiliyor ? "Sipariş oluşturuluyor…" : "Siparişi oluştur"}
          </Buton>

          <p className="text-center text-xs leading-relaxed text-kahve-500">
            Siparişi oluşturduğunda{" "}
            <Link href="/#yasal" className="underline underline-offset-2">
              kullanım koşullarını
            </Link>{" "}
            kabul etmiş olursun.
          </p>
        </form>

        {/* Sipariş özeti */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak">
            <h2 className="font-display text-base font-extrabold text-kahve-900">
              Sipariş özeti
            </h2>
            <p className="mt-1 text-xs font-semibold text-kahve-500">{restoranAdi}</p>

            <ul className="mt-4 space-y-2.5 border-t border-kahve-900/8 pt-4">
              {kalemler.map((k) => (
                <li key={k.urunId} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 text-kahve-700">
                    <span className="font-bold text-kahve-900">{k.adet}×</span> {k.ad}
                  </span>
                  <span className="shrink-0 font-semibold text-kahve-900">
                    {paraFormatla(k.fiyat * k.adet)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-kahve-900/8 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-kahve-600">Ara toplam</dt>
                <dd className="font-semibold text-kahve-900">
                  {paraFormatla(tutarlar?.araToplam ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kahve-600">Teslimat ücreti</dt>
                <dd className="font-semibold text-kahve-900">
                  {tutarlar?.teslimatUcreti === 0 ? (
                    <span className="text-nane-koyu">Ücretsiz</span>
                  ) : (
                    paraFormatla(tutarlar?.teslimatUcreti ?? 0)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-kahve-900/10 pt-2">
                <dt className="font-display font-extrabold text-kahve-900">Ödenecek tutar</dt>
                <dd className="font-display text-lg font-extrabold text-kahve-900">
                  {paraFormatla(tutarlar?.toplam ?? 0)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- yardımcılar */

function girdiSinifi(hata?: string) {
  return cn(
    "w-full rounded-2xl border bg-white px-4 py-3 text-[0.9375rem] font-medium text-kahve-900",
    "transition-[border-color,box-shadow] duration-300 placeholder:text-kahve-400",
    "focus:outline-none focus:ring-2 focus:ring-sari-500/40",
    hata ? "border-domates" : "border-kahve-900/12 focus:border-sari-500/60",
  );
}

function Kart({
  baslik,
  adim,
  yan,
  children,
}: {
  baslik: string;
  adim: number;
  yan?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-kahve-900/8 bg-white/70 p-5 md:p-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-lg font-extrabold text-kahve-900">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-sari-500 text-sm font-extrabold">
            {adim}
          </span>
          {baslik}
        </h2>
        {yan}
      </div>
      {children}
    </section>
  );
}

function Alan({
  etiket,
  hata,
  ipucu,
  children,
  className,
}: {
  etiket: string;
  hata?: string;
  ipucu?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)} data-hata={hata ? "true" : undefined}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold tracking-wide text-kahve-700 uppercase">{etiket}</span>
        {ipucu && !hata && <span className="text-2xs font-medium text-kahve-400">{ipucu}</span>}
      </span>
      {children}
      {hata && (
        <span role="alert" className="mt-1.5 block text-xs font-semibold text-domates-koyu">
          {hata}
        </span>
      )}
    </label>
  );
}

/* ------------------------------------------------------------ başarı görünümü */

function SiparisTamam({
  sonuc,
}: {
  sonuc: { siparisNo: string; tutarlar: Tutarlar; restoranAdi: string; kalemler: SiparisKalemi[] };
}) {
  const [kopyalandi, setKopyalandi] = useState<string | null>(null);

  async function kopyala(metin: string, etiket: string) {
    try {
      await navigator.clipboard.writeText(metin);
      setKopyalandi(etiket);
      setTimeout(() => setKopyalandi(null), 2000);
    } catch {
      // pano izni yok — kullanıcı elle kopyalayabilir
    }
  }

  return (
    <div className="kap py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[2rem] border border-nane/25 bg-nane/8 p-6 text-center md:p-9">
          <span className="mx-auto grid size-16 place-items-center rounded-4xl bg-nane text-white">
            <KontrolIkon className="size-8" strokeWidth="2.6" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">Siparişin oluşturuldu</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-kahve-700">
            {sonuc.restoranAdi} siparişin ödeme bekliyor. Havaleni yaptıktan sonra dekont
            eşleşince sipariş mutfağa iletilecek.
          </p>

          <div className="mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-white px-6 py-4 shadow-yumusak">
            <span className="text-2xs font-bold tracking-[0.16em] text-kahve-400 uppercase">
              Sipariş numarası
            </span>
            <button
              type="button"
              onClick={() => kopyala(sonuc.siparisNo, "no")}
              className="font-display text-2xl font-extrabold text-kahve-900 transition-colors
                duration-300 hover:text-sari-700"
              title="Kopyala"
            >
              {sonuc.siparisNo}
            </button>
            <span className="text-2xs font-semibold text-nane-koyu">
              {kopyalandi === "no" ? "Kopyalandı ✓" : "Kopyalamak için dokun"}
            </span>
          </div>
        </div>

        {/* Havale talimatı */}
        <section className="mt-6 rounded-[2rem] border border-kahve-900/8 bg-white p-6 md:p-8">
          <h2 className="font-display text-lg font-extrabold text-kahve-900">
            Havale / EFT bilgileri
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            Aşağıdaki hesaba{" "}
            <strong className="text-kahve-900">{paraFormatla(sonuc.tutarlar.toplam)}</strong>{" "}
            gönder. {odeme.aciklamaKurali}
          </p>

          <div className="mt-5 space-y-4">
            {odeme.hesaplar.map((h) => (
              <div
                key={h.iban}
                className="rounded-2xl border border-kahve-900/10 bg-krem-koyu/50 p-4"
              >
                {h.ornekMi && (
                  <p className="mb-3 rounded-xl bg-domates/12 px-3 py-2 text-2xs leading-snug font-bold text-domates-koyu">
                    ÖRNEK HESAP — canlıya çıkmadan{" "}
                    <code className="font-mono">src/content/odeme.ts</code> içindeki gerçek IBAN
                    ile değiştirilmeli.
                  </p>
                )}
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-kahve-500">Banka</dt>
                    <dd className="font-semibold text-kahve-900">{h.banka}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-kahve-500">Hesap sahibi</dt>
                    <dd className="text-right font-semibold text-kahve-900">{h.unvan}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-kahve-500">IBAN</dt>
                    <dd>
                      <button
                        type="button"
                        onClick={() => kopyala(h.iban.replace(/\s/g, ""), h.iban)}
                        className="font-mono text-sm font-bold text-kahve-900 underline
                          underline-offset-4 transition-colors duration-300 hover:text-sari-700"
                      >
                        {kopyalandi === h.iban ? "Kopyalandı ✓" : h.iban}
                      </button>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-kahve-900/10 pt-2">
                    <dt className="text-kahve-500">Açıklama</dt>
                    <dd className="font-mono text-sm font-bold text-kahve-900">
                      {sonuc.siparisNo}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-kahve-500">Tutar</dt>
                    <dd className="font-display text-lg font-extrabold text-kahve-900">
                      {paraFormatla(sonuc.tutarlar.toplam)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <ol className="mt-6 space-y-2.5 border-t border-kahve-900/8 pt-5">
            {[
              `Havaleyi ${odeme.odemeSuresiSaat} saat içinde tamamla — sonrasında sipariş otomatik iptal edilir.`,
              "Açıklama alanına yalnızca sipariş numarasını yaz; başka bir metin eşleştirmeyi geciktirir.",
              "Ödeme eşleştiğinde e-posta ve SMS ile bilgilendirilirsin, sipariş mutfağa düşer.",
            ].map((m, i) => (
              <li key={m} className="flex gap-3 text-sm leading-relaxed text-kahve-700">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-kahve-900 text-2xs font-extrabold text-sari-300">
                  {i + 1}
                </span>
                {m}
              </li>
            ))}
          </ol>
        </section>

        {/* Sipariş içeriği */}
        <section className="mt-6 rounded-[2rem] border border-kahve-900/8 bg-white/70 p-6 md:p-8">
          <h2 className="font-display text-base font-extrabold text-kahve-900">
            Sipariş içeriği
          </h2>
          <ul className="mt-4 space-y-2">
            {sonuc.kalemler.map((k) => (
              <li key={k.urunId} className="flex justify-between gap-3 text-sm">
                <span className="text-kahve-700">
                  <span className="font-bold text-kahve-900">{k.adet}×</span> {k.ad}
                </span>
                <span className="font-semibold text-kahve-900">
                  {paraFormatla(k.fiyat * k.adet)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-kahve-900/8 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-kahve-600">Teslimat ücreti</dt>
              <dd className="font-semibold text-kahve-900">
                {sonuc.tutarlar.teslimatUcreti === 0
                  ? "Ücretsiz"
                  : paraFormatla(sonuc.tutarlar.teslimatUcreti)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-kahve-900/10 pt-2">
              <dt className="font-display font-extrabold text-kahve-900">Toplam</dt>
              <dd className="font-display text-lg font-extrabold text-kahve-900">
                {paraFormatla(sonuc.tutarlar.toplam)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButonBaglanti href="/#restoranlar" boyut="lg">
            Yeni sipariş ver
            <OkIkon />
          </ButonBaglanti>
          <ButonBaglanti href="/" tur="hayalet" boyut="lg">
            Ana sayfaya dön
          </ButonBaglanti>
        </div>
      </div>
    </div>
  );
}
