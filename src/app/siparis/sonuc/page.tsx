import type { Metadata } from "next";

import { SepetTemizleyici } from "@/components/odeme/SepetTemizleyici";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { KapatIkon, KontrolIkon, SaatIkon } from "@/components/ui/Ikonlar";

export const metadata: Metadata = {
  title: "Sipariş sonucu",
  robots: { index: false, follow: false },
};

export default async function SiparisSonucSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; no?: string; mesaj?: string }>;
}) {
  const { durum, no, mesaj } = await searchParams;
  const basarili = durum === "basarili";

  return (
    <div className="kap py-16 md:py-24">
      {/* Ödeme başarılıysa sepeti boşalt — kullanıcı iyzico sayfasından döndü */}
      {basarili && <SepetTemizleyici />}

      <div className="mx-auto max-w-xl">
        <div
          className={`rounded-[2rem] border p-8 text-center md:p-10 ${
            basarili ? "border-nane/25 bg-nane/8" : "border-domates/25 bg-domates/8"
          }`}
        >
          <span
            className={`mx-auto grid size-16 place-items-center rounded-4xl text-white ${
              basarili ? "bg-nane" : "bg-domates"
            }`}
          >
            {basarili ? (
              <KontrolIkon className="size-8" strokeWidth="2.6" />
            ) : (
              <KapatIkon className="size-8" strokeWidth="2.6" />
            )}
          </span>

          <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">
            {basarili ? "Ödemen alındı" : "Ödeme tamamlanamadı"}
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-kahve-700">
            {basarili
              ? "Siparişin restorana iletildi. Hazırlanmaya başladığında bildirim alacaksın."
              : (mesaj ??
                "Kartından tutar çekilmediyse endişelenme. Tekrar deneyebilir ya da kapıda nakit/IBAN ile ödeyebilirsin.")}
          </p>

          {no && (
            <p className="mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-white px-6 py-4 shadow-yumusak">
              <span className="text-2xs font-bold tracking-[0.16em] text-kahve-400 uppercase">
                Sipariş numarası
              </span>
              <span className="font-display text-2xl font-extrabold text-kahve-900">{no}</span>
            </p>
          )}
        </div>

        {basarili ? (
          <section className="mt-6 rounded-[2rem] border border-kahve-900/8 bg-white p-6 md:p-8">
            <h2 className="font-display text-base font-extrabold text-kahve-900">Sırada ne var?</h2>
            <ol className="mt-4 space-y-3">
              {[
                "Restoran siparişini onaylayıp hazırlamaya başlıyor.",
                "Yemeğin tahmini bitiş saatine göre kurye atanıyor.",
                "Kurye yola çıktığında canlı takip bağlantısı gönderiliyor.",
              ].map((m, i) => (
                <li key={m} className="flex gap-3 text-sm leading-relaxed text-kahve-700">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-kahve-900 text-2xs font-extrabold text-sari-300">
                    {i + 1}
                  </span>
                  {m}
                </li>
              ))}
            </ol>
            <p className="mt-5 flex items-center gap-2 border-t border-kahve-900/8 pt-4 text-xs font-semibold text-kahve-500">
              <SaatIkon className="size-4" />
              Sorun olursa sipariş numaranla destek ekibimize yazabilirsin.
            </p>
          </section>
        ) : (
          <section className="mt-6 rounded-[2rem] border border-kahve-900/8 bg-white/70 p-6 md:p-8">
            <h2 className="font-display text-base font-extrabold text-kahve-900">
              Sık görülen nedenler
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-kahve-700">
              {[
                "Kartın internetten alışverişe kapalı olabilir — bankanı arayıp açtırabilirsin.",
                "3D Secure doğrulaması zaman aşımına uğramış olabilir.",
                "Kart limiti veya bakiyesi yetersiz olabilir.",
              ].map((m) => (
                <li key={m} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-domates"
                  />
                  {m}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {basarili ? (
            <>
              <ButonBaglanti href="/#restoranlar" boyut="lg">
                Yeni sipariş ver
                <OkIkon />
              </ButonBaglanti>
              <ButonBaglanti href="/" tur="hayalet" boyut="lg">
                Ana sayfaya dön
              </ButonBaglanti>
            </>
          ) : (
            <>
              <ButonBaglanti href="/odeme" boyut="lg">
                Ödemeyi tekrar dene
                <OkIkon />
              </ButonBaglanti>
              <ButonBaglanti href="/#restoranlar" tur="hayalet" boyut="lg">
                Restoranlara dön
              </ButonBaglanti>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
