import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OdemeFormu } from "@/components/odeme/OdemeFormu";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { iyzicoTestModuMu, iyzicoYapilandirildiMi } from "@/lib/iyzico";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function generateMetadata(): Promise<Metadata> {
  const c = ceviri(await aktifDil());
  return {
    title: c("odeme.metaBaslik"),
    description: c("odeme.metaAciklama"),
    robots: { index: false, follow: false },
  };
}

/** iyzipay SDK Node çalışma zamanı gerektirir. */
export const runtime = "nodejs";
/** Oturum çerezi okunduğu için sayfa isteğe göre üretilir. */
export const dynamic = "force-dynamic";

export default async function OdemeSayfasi() {
  const c = ceviri(await aktifDil());

  /**
   * Sipariş vermek için giriş zorunlu. Girişsiz gelen kullanıcı sepetini
   * kaybetmeden giriş sayfasına gider, giriş sonrası buraya döner.
   */
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=%2Fodeme");

  // Ad/e-posta/telefon hesaptan hazır gelsin — müşteri tekrar yazmasın.
  const hesap = oturum.rol === "musteri" ? await (await hesapDepoAl()).hesapBul(oturum.eposta) : null;

  // Ortam değişkenleri yalnızca sunucuda okunabilir; sonucu prop olarak geçiyoruz.
  const kartAktif = iyzicoYapilandirildiMi();

  return (
    <>
      <SayfaBasligi
        ustBaslik={c("sayfa.odeme")}
        baslik={
          <>
            {c("odeme.baslik1")} <span className="metin-sari">{c("odeme.baslik2")}</span>
          </>
        }
        aciklama={
          kartAktif
            ? c("odeme.aciklamaKart")
            : c("odeme.aciklamaKapida")
        }
        kirintiYolu={[{ etiket: c("sayfa.odeme") }]}
      />
      <OdemeFormu
        kartAktif={kartAktif}
        testModu={kartAktif && iyzicoTestModuMu()}
        hesap={{
          adSoyad: hesap?.ad ?? oturum.ad,
          eposta: oturum.eposta,
          telefon: hesap?.telefon ?? "",
        }}
      />
    </>
  );
}
