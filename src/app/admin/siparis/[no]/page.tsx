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
import { oturumAl } from "@/lib/oturum";
import { depoAl, depoKaliciMi, serverlessMi } from "@/lib/depo";
import { kalemBirimFiyati } from "@/lib/siparis";
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
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-kahve-500
          transition-colors duration-300 hover:text-kahve-900"
      >
        <OkIkon className="size-4 rotate-180" />
        Sipariş listesine dön
      </Link>

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
          </section>

          {/* Atama: hazırlayacak şef ve teslim edecek kurye */}
          <section className="rounded-3xl border border-sari-500/30 bg-sari-500/6 p-5 md:p-7">
            <h2 className="font-display text-lg font-extrabold text-kahve-900">Atama</h2>
            <p className="mt-1 mb-5 text-sm text-kahve-600">
              Şef siparişi kendi panelinde görür (adres ve telefon görünmez). Kurye yalnızca
              kendisine atanan siparişi görür.
            </p>
            <AtamaFormu
              siparisNo={siparis.siparisNo}
              sefler={sefler}
              kuryeler={kuryeler}
              mevcutSef={siparis.atananSef}
              mevcutKurye={siparis.atananKurye}
            />
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
                  {siparis.odemeYontemi === "iyzico" ? "Kredi/banka kartı (iyzico)" : "Havale / EFT"}
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
