import type { Metadata } from "next";

import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { Ekranlar } from "@/components/anasayfa/Ekranlar";
import { MobilUygulama } from "@/components/anasayfa/MobilUygulama";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export const metadata: Metadata = {
  title: "Ekranlar",
  description:
    "Müşteri, kurye ve restoran ekranları — Ne Yersin? platformunun her rol için sunduğu arayüzler.",
};

export default async function EkranlarSayfasi() {
  const c = ceviri(await aktifDil());

  return (
    <>
      <SayfaBasligi
        ustBaslik="Ekranlar"
        baslik={
          <>
            {c("ekranlar.baslik1")} <span className="metin-sari">{c("ekranlar.baslik2")}</span>
          </>
        }
        aciklama={c("sayfa.ekranlarAciklama")}
        kirintiYolu={[{ etiket: "Ekranlar" }]}
      />
      <Ekranlar />
      <MobilUygulama />
      <CagriBandi />
    </>
  );
}
