import type { Metadata } from "next";

import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { NasilCalisir } from "@/components/anasayfa/NasilCalisir";
import { Sss } from "@/components/anasayfa/Sss";
import { TeslimatTakibi } from "@/components/anasayfa/TeslimatTakibi";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export const metadata: Metadata = {
  title: "Nasıl Çalışır",
  description:
    "Sipariş verişten kapına gelene kadar Ne Yersin? nasıl işliyor: seçim, mutfak, kurye ve canlı teslimat takibi.",
};

export default async function NasilCalisirSayfasi() {
  const c = ceviri(await aktifDil());

  return (
    <>
      <SayfaBasligi
        ustBaslik={c("nasil.ustBaslik")}
        baslik={
          <>
            {c("sayfa.nasilBaslik1")} <span className="metin-sari">{c("sayfa.nasilBaslik2")}</span>{" "}
            {c("sayfa.nasilBaslik3")}
          </>
        }
        aciklama={c("sayfa.nasilAciklama")}
        kirintiYolu={[{ etiket: c("nasil.ustBaslik") }]}
      />
      <NasilCalisir />
      <TeslimatTakibi />
      <Sss />
      <CagriBandi />
    </>
  );
}
