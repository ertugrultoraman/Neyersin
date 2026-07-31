import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OdemeFormu } from "@/components/odeme/OdemeFormu";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { iyzicoTestModuMu, iyzicoYapilandirildiMi } from "@/lib/iyzico";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Ödeme — Siparişini tamamla",
  description:
    "Teslimat adresi ve iletişim bilgilerini gir, siparişini oluştur. Kartla önceden veya kapıda nakit/IBAN ile öde.",
  robots: { index: false, follow: false },
};

/** iyzipay SDK Node çalışma zamanı gerektirir. */
export const runtime = "nodejs";
/** Oturum çerezi okunduğu için sayfa isteğe göre üretilir. */
export const dynamic = "force-dynamic";

export default async function OdemeSayfasi() {
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
        ustBaslik="Ödeme"
        baslik={
          <>
            Siparişini <span className="metin-sari">tamamla</span>
          </>
        }
        aciklama={
          kartAktif
            ? "Adres ve iletişim bilgilerini gir, ödeme yöntemini seç. Kartla ödemede iyzico'nun güvenli sayfasına yönlendirilirsin."
            : "Adres ve iletişim bilgilerini gir. Ödemeyi kurye kapına geldiğinde nakit ya da IBAN'a havale ile yapabilirsin."
        }
        kirintiYolu={[{ etiket: "Ödeme" }]}
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
