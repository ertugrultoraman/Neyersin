import type { Metadata } from "next";

import { OdemeFormu } from "@/components/odeme/OdemeFormu";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { iyzicoTestModuMu, iyzicoYapilandirildiMi } from "@/lib/iyzico";

export const metadata: Metadata = {
  title: "Ödeme — Siparişini tamamla",
  description:
    "Teslimat adresi ve iletişim bilgilerini gir, siparişini oluştur. Kart (iyzico) veya havale/EFT.",
  robots: { index: false, follow: false },
};

/** iyzipay SDK Node çalışma zamanı gerektirir. */
export const runtime = "nodejs";

export default function OdemeSayfasi() {
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
            : "Adres ve iletişim bilgilerini gir. Ödeme havale/EFT ile alınıyor — sipariş numaranı ve IBAN'ı bir sonraki adımda göreceksin."
        }
        kirintiYolu={[{ etiket: "Ödeme" }]}
      />
      <OdemeFormu kartAktif={kartAktif} testModu={kartAktif && iyzicoTestModuMu()} />
    </>
  );
}
