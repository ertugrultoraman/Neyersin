import type { Metadata } from "next";

import { OdemeFormu } from "@/components/odeme/OdemeFormu";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";

export const metadata: Metadata = {
  title: "Ödeme — Siparişini tamamla",
  description:
    "Teslimat adresi ve iletişim bilgilerini gir, siparişini oluştur. Ödeme yöntemi: Havale / EFT.",
  robots: { index: false, follow: false },
};

export default function OdemeSayfasi() {
  return (
    <>
      <SayfaBasligi
        ustBaslik="Ödeme"
        baslik={
          <>
            Siparişini <span className="metin-sari">tamamla</span>
          </>
        }
        aciklama="Adres ve iletişim bilgilerini gir. Ödeme havale/EFT ile alınıyor — sipariş numaranı ve IBAN'ı bir sonraki adımda göreceksin."
        kirintiYolu={[{ etiket: "Ödeme" }]}
      />
      <OdemeFormu />
    </>
  );
}
