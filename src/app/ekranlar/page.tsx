import type { Metadata } from "next";

import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { Ekranlar } from "@/components/anasayfa/Ekranlar";
import { MobilUygulama } from "@/components/anasayfa/MobilUygulama";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";

export const metadata: Metadata = {
  title: "Ekranlar",
  description:
    "Müşteri, kurye ve restoran ekranları — Ne Yersin? platformunun her rol için sunduğu arayüzler.",
};

export default function EkranlarSayfasi() {
  return (
    <>
      <SayfaBasligi
        ustBaslik="Ekranlar"
        baslik={
          <>
            Her role <span className="metin-sari">ayrı ekran</span>
          </>
        }
        aciklama="Müşteri, kurye ve restoran tarafında işleri yürüten arayüzler."
        kirintiYolu={[{ etiket: "Ekranlar" }]}
      />
      <Ekranlar />
      <MobilUygulama />
      <CagriBandi />
    </>
  );
}
