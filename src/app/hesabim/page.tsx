import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EpostaDogrulaKarti } from "@/components/hesap/EpostaDogrulaKarti";
import { ParolaDegistirFormu } from "@/components/hesap/ParolaDegistirFormu";
import { PanelKabuk } from "@/components/panel/PanelKabuk";
import { SiparislerimKarti } from "@/components/panel/SiparislerimKarti";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { depoAl } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl, rolAnaSayfasi } from "@/lib/oturum";
import { paraFormatla } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HesabimSayfasi() {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim");
  if (oturum.rol !== "musteri") redirect(rolAnaSayfasi(oturum.rol));

  const depo = await depoAl();
  // Müşteri yalnızca kendi e-postasıyla açılmış siparişleri görür.
  const siparisler = await depo.listele({ musteriEpostasi: oturum.eposta, limit: 200 });
  const siparisSayisi = siparisler.length;

  /** Doğrulanmamışsa profilde doğrulama kartı çıkar. Depo susarsa uyarı gösterilmez. */
  let dogrulandi = true;
  try {
    const hesap = await (await hesapDepoAl()).hesapBul(oturum.eposta);
    dogrulandi = hesap?.epostaDogrulandi !== false;
  } catch {
    // depo erişilemiyorsa uyarı gösterilmez
  }

  const harcanan = siparisler
    .filter((s) => s.durum === "odendi")
    .reduce((t, s) => t + s.tutarlar.toplam, 0);

  return (
    <PanelKabuk
      oturum={oturum}
      baslik={`Merhaba, ${oturum.ad}`}
      aciklama={`${siparisSayisi} sipariş · ${paraFormatla(harcanan)} ödenen`}
    >
      <div className="mt-8">
        <ButonBaglanti href="/restoranlar" boyut="md">
          Yeni sipariş ver
          <OkIkon />
        </ButonBaglanti>
      </div>

      {/*
        Siparişler artık burada uzun bir liste değil, tıklanıp girilen kendi
        ekranı (bkz. /siparislerim). Profil kimlik ve ayar ekranı olarak kaldı.
      */}
      <section className="mt-8">
        <SiparislerimKarti sayilar={[{ etiket: "Sipariş", deger: siparisSayisi }]} />
      </section>

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
