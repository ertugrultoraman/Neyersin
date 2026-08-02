import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiparisDestekDugmesi } from "@/components/destek/SiparisDestekDugmesi";
import { EpostaDogrulaKarti } from "@/components/hesap/EpostaDogrulaKarti";
import { ParolaDegistirFormu } from "@/components/hesap/ParolaDegistirFormu";
import { AramaFormu, PanelKabuk } from "@/components/panel/PanelKabuk";
import { IptalDugmesi } from "@/components/panel/IptalDugmesi";
import { SiparisKarti } from "@/components/panel/SiparisKarti";
import { YorumFormu } from "@/components/yorum/YorumFormu";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { depoAl } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl, rolAnaSayfasi } from "@/lib/oturum";
import { musteriIptalEdebilirMi } from "@/lib/siparis";
import { paraFormatla } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HesabimSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim");
  if (oturum.rol !== "musteri") redirect(rolAnaSayfasi(oturum.rol));

  const { q } = await searchParams;
  const depo = await depoAl();
  // Müşteri yalnızca kendi e-postasıyla açılmış siparişleri görür.
  const siparisler = await depo.listele({
    musteriEpostasi: oturum.eposta,
    arama: q,
    limit: 100,
  });

  /** Zaten değerlendirilmiş siparişlerde form tekrar gösterilmesin. */
  const yorumlananlar = new Set<string>();
  /** Doğrulanmamışsa profilde doğrulama kartı çıkar. Depo susarsa uyarı gösterilmez. */
  let dogrulandi = true;
  try {
    const hesapDepo = await hesapDepoAl();
    for (const y of await hesapDepo.yorumlariListele()) yorumlananlar.add(y.siparisNo);
    const hesap = await hesapDepo.hesapBul(oturum.eposta);
    dogrulandi = hesap?.epostaDogrulandi !== false;
  } catch {
    // depo erişilemiyorsa form yine gösterilir; sunucu yine de çift yorumu engeller
  }

  const harcanan = siparisler
    .filter((s) => s.durum === "odendi")
    .reduce((t, s) => t + s.tutarlar.toplam, 0);

  return (
    <PanelKabuk
      oturum={oturum}
      baslik={`Merhaba, ${oturum.ad}`}
      aciklama={`${siparisler.length} sipariş · ${paraFormatla(harcanan)} ödenen`}
    >
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <ButonBaglanti href="/restoranlar" boyut="md">
          Yeni sipariş ver
          <OkIkon />
        </ButonBaglanti>
        <div className="min-w-64 flex-1 md:max-w-sm">
          <AramaFormu hedef="/hesabim" deger={q} yerTutucu="Sipariş no, restoran…" />
        </div>
      </div>

      {siparisler.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-kahve-900/8 bg-white p-10 text-center">
          <p className="text-sm text-kahve-500">
            {q ? "Aramanla eşleşen sipariş yok." : "Henüz sipariş vermedin."}
          </p>
          {!q && (
            <Link
              href="/restoranlar"
              className="tiklanabilir mt-3 inline-block text-sm font-bold text-sari-700 underline"
            >
              Restoranlara göz at
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {siparisler.map((s) => (
            <SiparisKarti
              key={s.siparisNo}
              siparis={s}
              musteriBilgisi
              ekAlan={
                /* Destek düğmesi HER siparişte var — asistanı o sipariş
                   numarasıyla açar. İptal/değerlendirme ise duruma bağlı. */
                <div className="flex flex-wrap items-center gap-2">
                  {musteriIptalEdebilirMi(s.durum) && <IptalDugmesi siparisNo={s.siparisNo} />}
                  {s.durum === "odendi" && !yorumlananlar.has(s.siparisNo) && (
                    <YorumFormu siparisNo={s.siparisNo} />
                  )}
                  <SiparisDestekDugmesi siparisNo={s.siparisNo} />
                </div>
              }
            />
          ))}
        </div>
      )}

      {!dogrulandi && (
        <section className="mt-12 rounded-[2rem] border border-sari-500/30 bg-sari-500/8 p-6 md:p-8">
          <EpostaDogrulaKarti eposta={oturum.eposta} />
        </section>
      )}

      <section className="mt-12 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <ParolaDegistirFormu />
      </section>
    </PanelKabuk>
  );
}
