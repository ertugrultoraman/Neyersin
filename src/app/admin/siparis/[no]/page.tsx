import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { AtamaFormu } from "@/components/admin/AtamaFormu";
import { DurumFormu } from "@/components/admin/DurumFormu";
import { DurumRozeti } from "@/components/admin/DurumRozeti";
import { OkIkon } from "@/components/ui/Buton";
import { restoranBul } from "@/content/restoranlar";
import { hesapDepoAl } from "@/lib/hesaplar";
import { siparisTeklifleri, type SiparisTeklifi } from "@/lib/kurye-dagitim";
import { siparisPaylasimi } from "@/lib/kurye-tarife";
import { oturumAl } from "@/lib/oturum";
import { depoAl, depoKaliciMi, serverlessMi } from "@/lib/depo";
import { kalemBirimFiyati, type Tutarlar } from "@/lib/siparis";
import { paraFormatla } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sipariş detayı — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSiparisDetaySayfasi({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const oturum = await oturumAl();
  // Şef oturumu yönetici paneline giremez — rol açıkça kontrol edilir.
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const { no } = await params;
  const depo = await depoAl();
  const siparis = await depo.bul(decodeURIComponent(no));
  if (!siparis) notFound();

  /** Atama listeleri — yalnızca onaylanmış, hesabı açılmış kişiler. */
  const hesapDepo = await hesapDepoAl();
  const [sefHesaplari, kuryeHesaplari] = await Promise.all([
    hesapDepo.hesaplariListele("sef"),
    hesapDepo.hesaplariListele("kurye"),
  ]);
  const sefler = sefHesaplari.map((h) => ({
    eposta: h.eposta,
    ad: h.ad,
    ek: h.restoranSlug ? restoranBul(h.restoranSlug)?.ad : undefined,
  }));
  const kuryeler = kuryeHesaplari.map((h) => ({ eposta: h.eposta, ad: h.ad, ek: h.telefon }));

  /* Dağıtım geçmişi — "bu sipariş neden bekliyor?" sorusunun cevabı. */
  const teklifler = await siparisTeklifleri(siparis.siparisNo);
  const kuryeAdi = new Map(kuryeHesaplari.map((h) => [h.eposta.toLowerCase(), h.ad]));

  const adresSatiri = [
    siparis.adres.acikAdres,
    `No: ${siparis.adres.binaNo}`,
    siparis.adres.daireNo ? `Daire: ${siparis.adres.daireNo}` : null,
    siparis.adres.mahalle,
    `${siparis.adres.ilce} / İstanbul`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik={siparis.siparisNo}
      aciklama={`${siparis.restoranAdi} · ${new Date(siparis.olusturmaTarihi).toLocaleString("tr-TR")}`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
      yan={<DurumRozeti durum={siparis.durum} />}
    >
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-kahve-500
            transition-colors duration-300 hover:text-kahve-900"
        >
          <OkIkon className="size-4 rotate-180" />
          Sipariş listesine dön
        </Link>

        {/* Siparişin geldiği mutfağın profili — her rolde erişilebilir olmalı. */}
        <Link
          href={`/restoran/${siparis.restoranSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-sari-700
            transition-colors duration-300 hover:text-kahve-900"
        >
          {siparis.restoranAdi} profilini aç
          <OkIkon className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* Sipariş içeriği */}
          <section className="rounded-3xl border border-kahve-900/8 bg-white p-5 md:p-7">
            <h2 className="font-display text-lg font-extrabold text-kahve-900">Sipariş içeriği</h2>
            <ul className="mt-4 divide-y divide-kahve-900/8">
              {siparis.kalemler.map((k) => (
                <li key={k.satirId} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-kahve-700">
                    <span className="font-bold text-kahve-900">{k.adet}×</span> {k.ad}
                    <span className="ml-2 text-xs text-kahve-400">
                      ({paraFormatla(kalemBirimFiyati(k))} birim)
                    </span>
                    {k.ekstralar && k.ekstralar.length > 0 && (
                      <span className="block text-xs text-kahve-500">
                        {k.ekstralar.map((e) => e.ad).join(", ")}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-semibold text-kahve-900">
                    {paraFormatla(kalemBirimFiyati(k) * k.adet)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-kahve-900/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-kahve-600">Ara toplam</dt>
                <dd className="font-semibold text-kahve-900">
                  {paraFormatla(siparis.tutarlar.araToplam)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kahve-600">Teslimat ücreti</dt>
                <dd className="font-semibold text-kahve-900">
                  {siparis.tutarlar.teslimatUcreti === 0
                    ? "Ücretsiz"
                    : paraFormatla(siparis.tutarlar.teslimatUcreti)}
                </dd>
              </div>
              {siparis.tutarlar.indirim > 0 && (
                <div className="flex justify-between">
                  <dt className="text-nane-koyu">
                    İndirim {siparis.tutarlar.kuponKodu ? `(${siparis.tutarlar.kuponKodu})` : ""}
                  </dt>
                  <dd className="font-semibold text-nane-koyu">
                    -{paraFormatla(siparis.tutarlar.indirim)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-kahve-900/10 pt-2">
                <dt className="font-display font-extrabold text-kahve-900">Toplam</dt>
                <dd className="font-display text-lg font-extrabold text-kahve-900">
                  {paraFormatla(siparis.tutarlar.toplam)}
                </dd>
              </div>
            </dl>

            {siparis.not && (
              <p className="mt-5 rounded-2xl bg-sari-500/10 px-4 py-3 text-sm leading-relaxed text-kahve-800">
                <strong className="font-bold">Sipariş notu:</strong> {siparis.not}
              </p>
            )}

            {/*
              PAYLAŞIM DÖKÜMÜ — bu paranın kime ne kadarı gittiği.
              Kurye kendi payını uygulamasında görüyor, satıcı kendi panelinde;
              üçünü bir arada gören tek yer burası. Mutabakat sorusu ("bu
              siparişten bize ne kaldı") başka hiçbir ekranda cevaplanmıyordu.
            */}
            <PaylasimDokumu tutarlar={siparis.tutarlar} />
          </section>

          {/* Atama: hazırlayacak şef ve teslim edecek kurye */}
          <section className="rounded-3xl border border-sari-500/30 bg-sari-500/6 p-5 md:p-7">
            <h2 className="font-display text-lg font-extrabold text-kahve-900">Atama</h2>
            <p className="mt-1 mb-5 text-sm text-kahve-600">
              Şef siparişi kendi panelinde görür (adres ve telefon görünmez). Kurye seçmek işi
              ona <strong className="font-bold">teklif eder</strong>; sipariş ancak kurye kabul
              edince üstüne geçer.
            </p>

            {/*
              BEKLEYEN TEKLİF BURADA YAZIYOR. Yönetici kuryeyi seçtikten sonra
              formda ismi görüyor ama işin kabul edilip edilmediğini göremezdi:
              kabul edilmiş bir atama ile telefonuna hiç bakmamış bir kuryenin
              ekranı aynı görünürdü. Karar bu ayrıma bağlı — beklemek mi, başka
              kuryeye vermek mi.
            */}
            {siparis.teklifEdilenKurye && (
              <p className="mb-5 rounded-2xl border border-sari-500/40 bg-white px-4 py-3 text-sm text-kahve-800">
                <strong className="font-bold">{siparis.teklifEdilenKurye}</strong> kuryesine teklif
                edildi, <strong className="font-bold">henüz kabul etmedi</strong>. Kurye çevrimiçi
                olduğunda teklif ekranına düşer; kabul etmezse süre dolunca sipariş havuza döner ve
                diğer kuryelere açılır. Başka bir kurye seçersen teklif ona geçer.
              </p>
            )}

            <AtamaFormu
              siparisNo={siparis.siparisNo}
              sefler={sefler}
              kuryeler={kuryeler}
              mevcutSef={siparis.atananSef}
              mevcutKurye={siparis.atananKurye ?? siparis.teklifEdilenKurye}
              kabulEdildi={Boolean(siparis.atananKurye)}
            />
          </section>

          {/*
            Dağıtım geçmişi. Elle seçim de artık bu tablodan geçiyor — tek
            farkı teklifin tek kişiye gitmesi. Bu bölüm olmasaydı yönetici
            yalnızca "kurye atanmamış" görür, sebebini — teklif hiç gitmedi
            mi, gitti de reddedildi mi — bilemezdi.
          */}
          <section className="rounded-3xl border border-kahve-900/8 bg-white p-5 md:p-7">
            <h2 className="font-display text-lg font-extrabold text-kahve-900">Dağıtım</h2>
            <p className="mt-1 mb-5 text-sm text-kahve-600">
              Sipariş hazır olduğunda çevrimiçi kuryelere teklif olarak düşer; ilk kabul eden
              alır. Yukarıdan kurye seçmek aynı teklifi tek kişiye yollar.
            </p>
            <TeklifGecmisi teklifler={teklifler} adlar={kuryeAdi} />
          </section>

          {/* Müşteri ve adres */}
          <section className="rounded-3xl border border-kahve-900/8 bg-white p-5 md:p-7">
            <h2 className="font-display text-lg font-extrabold text-kahve-900">
              Müşteri ve teslimat
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { e: "Ad Soyad", d: siparis.musteri.adSoyad },
                {
                  e: "Telefon",
                  d: (
                    <a
                      href={`tel:${siparis.musteri.telefon}`}
                      className="underline underline-offset-2 transition-colors duration-300 hover:text-sari-700"
                    >
                      {siparis.musteri.telefon}
                    </a>
                  ),
                },
                {
                  e: "E-posta",
                  d: (
                    <a
                      href={`mailto:${siparis.musteri.eposta}`}
                      className="underline underline-offset-2 transition-colors duration-300 hover:text-sari-700"
                    >
                      {siparis.musteri.eposta}
                    </a>
                  ),
                },
                { e: "İlçe", d: `${siparis.adres.ilce} / İstanbul` },
              ].map((s) => (
                <div key={s.e}>
                  <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                    {s.e}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-kahve-900">{s.d}</dd>
                </div>
              ))}

              <div className="sm:col-span-2">
                <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                  Açık adres
                </dt>
                <dd className="mt-1 text-sm leading-relaxed font-medium text-kahve-800">
                  {adresSatiri}
                </dd>
              </div>

              {siparis.adres.tarif && (
                <div className="sm:col-span-2">
                  <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                    Adres tarifi
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-kahve-700">
                    {siparis.adres.tarif}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* Yan kolon */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-kahve-900/8 bg-white p-5 md:p-6">
            <h2 className="font-display text-base font-extrabold text-kahve-900">Ödeme</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                  Yöntem
                </dt>
                <dd className="mt-0.5 font-semibold text-kahve-900">
                  {siparis.odemeYontemi === "iyzico"
                    ? "Kredi/banka kartı (iyzico)"
                    : "Kapıda ödeme (nakit / IBAN)"}
                </dd>
              </div>
              <div>
                <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                  Durum
                </dt>
                <dd className="mt-1">
                  <DurumRozeti durum={siparis.durum} />
                </dd>
              </div>
              {siparis.saglayiciOdemeId && (
                <div>
                  <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                    iyzico paymentId
                  </dt>
                  <dd className="mt-0.5 font-mono text-xs break-all text-kahve-800">
                    {siparis.saglayiciOdemeId}
                  </dd>
                </div>
              )}
              {siparis.odenenTutar && (
                <div>
                  <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                    Tahsil edilen
                  </dt>
                  <dd className="mt-0.5 font-semibold text-kahve-900">
                    {siparis.odenenTutar} TL
                  </dd>
                </div>
              )}
              {siparis.odemeMesaji && (
                <div>
                  <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                    Not
                  </dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-kahve-600">
                    {siparis.odemeMesaji}
                  </dd>
                </div>
              )}
              <div className="border-t border-kahve-900/10 pt-3">
                <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                  Son güncelleme
                </dt>
                <dd className="mt-0.5 text-xs text-kahve-600">
                  {new Date(siparis.guncellemeTarihi).toLocaleString("tr-TR")}
                </dd>
              </div>
            </dl>
          </section>

          <DurumFormu siparisNo={siparis.siparisNo} mevcutDurum={siparis.durum} />
        </div>
      </div>
    </AdminKabuk>
  );
}

const TEKLIF_DURUM_ADI: Record<SiparisTeklifi["durum"], string> = {
  bekliyor: "Bekliyor",
  kabul: "Kabul etti",
  ret: "Reddetti",
  "zaman-asimi": "Cevap vermedi",
  kacirildi: "Başkası aldı",
};

const TEKLIF_DURUM_SINIFI: Record<SiparisTeklifi["durum"], string> = {
  bekliyor: "bg-sari-500/15 text-kahve-800",
  kabul: "bg-emerald-500/15 text-emerald-800",
  ret: "bg-red-500/12 text-red-800",
  "zaman-asimi": "bg-kahve-900/8 text-kahve-600",
  kacirildi: "bg-kahve-900/8 text-kahve-500",
};

/**
 * Siparişin üç tarafa dağılımı.
 *
 * ORAN DA YAZILIYOR: yalnızca tutarlar gösterilseydi, kademe sınırının hangi
 * tarafında kalındığı görünmezdi — 399 TL ile 401 TL'lik iki sipariş arasında
 * kuryenin payı %25'ten %18'e düşüyor ve bunun sebebi ancak oran yazılınca
 * anlaşılıyor.
 */
function PaylasimDokumu({ tutarlar }: { tutarlar: Tutarlar }) {
  const p = siparisPaylasimi(tutarlar);

  const satirlar = [
    { ad: "Kurye", tutar: p.kurye, oran: p.oranlar.kurye },
    { ad: "Ne Yersin", tutar: p.platform, oran: p.oranlar.platform },
    { ad: "Satıcı", tutar: p.satici, oran: p.oranlar.satici },
  ];

  return (
    <div className="mt-5 rounded-2xl border border-kahve-900/10 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="font-display text-sm font-extrabold text-kahve-900">Paylaşım</h3>
        <span className="text-xs text-kahve-500">
          {paraFormatla(p.taban)} üzerinden
          {p.indirim > 0 ? ` · kupon ${paraFormatla(p.indirim)} üçe bölündü` : ""}
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        {satirlar.map((s) => (
          <div key={s.ad} className="flex items-baseline justify-between gap-3">
            <dt className="text-kahve-700">
              {s.ad}
              <span className="ml-1.5 text-2xs font-bold text-kahve-400">
                %{Math.round(s.oran * 100)}
              </span>
              {p.kisiBasiIndirim > 0 && (
                <span className="ml-1.5 text-2xs text-domates-koyu">
                  −{paraFormatla(p.kisiBasiIndirim)}
                </span>
              )}
            </dt>
            <dd className="font-semibold text-kahve-900">{paraFormatla(s.tutar)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-kahve-900/10 pt-2">
          <dt className="font-display font-extrabold text-kahve-900">Dağıtılan</dt>
          <dd className="font-display font-extrabold text-kahve-900">
            {paraFormatla(p.odenen)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function TeklifGecmisi({
  teklifler,
  adlar,
}: {
  teklifler: SiparisTeklifi[];
  adlar: Map<string, string>;
}) {
  if (teklifler.length === 0) {
    return (
      <p className="rounded-2xl bg-kahve-900/4 px-4 py-3 text-sm text-kahve-600">
        Bu sipariş için henüz teklif oluşmadı. Sipariş <strong>ödendi</strong> ya da{" "}
        <strong>hazır</strong> durumdayken çevrimiçi kuryelere düşer — o an sahada kurye yoksa
        teklif de oluşmaz.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {teklifler.map((t) => (
        <li
          key={`${t.eposta}-${t.olusturmaTarihi}`}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-kahve-900/8 px-4 py-3"
        >
          <span className="text-sm font-semibold text-kahve-900">
            {adlar.get(t.eposta) ?? t.eposta}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-2xs font-bold ${TEKLIF_DURUM_SINIFI[t.durum]}`}
          >
            {TEKLIF_DURUM_ADI[t.durum]}
          </span>
          <span className="ml-auto text-xs text-kahve-500">
            {paraFormatla(t.ucret)} · {new Date(t.olusturmaTarihi).toLocaleString("tr-TR")}
          </span>
        </li>
      ))}
    </ul>
  );
}
