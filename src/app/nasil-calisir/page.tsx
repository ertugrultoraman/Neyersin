import type { Metadata } from "next";

import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { NasilCalisir } from "@/components/anasayfa/NasilCalisir";
import { Sss } from "@/components/anasayfa/Sss";
import { TeslimatTakibi } from "@/components/anasayfa/TeslimatTakibi";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";

export const metadata: Metadata = {
  title: "Nasıl Çalışır",
  description:
    "Sipariş verişten kapına gelene kadar Ne Yersin? nasıl işliyor: seçim, mutfak, kurye ve canlı teslimat takibi.",
};

export default function NasilCalisirSayfasi() {
  return (
    <>
      <SayfaBasligi
        ustBaslik="Nasıl Çalışır"
        baslik={
          <>
            Siparişten <span className="metin-sari">kapına</span> kadar
          </>
        }
        aciklama="Dört adımda ne olduğunu ve siparişini nasıl takip edeceğini anlatalım."
        kirintiYolu={[{ etiket: "Nasıl Çalışır" }]}
      />
      <NasilCalisir />
      <TeslimatTakibi />
      <Sss />
      <CagriBandi />
    </>
  );
}
