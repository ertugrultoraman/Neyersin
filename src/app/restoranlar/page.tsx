import type { Metadata } from "next";

import { AramaSaglayici } from "@/components/anasayfa/AramaBaglami";
import { AyinHanimlari } from "@/components/anasayfa/AyinHanimlari";
import { KategoriRayi } from "@/components/anasayfa/KategoriRayi";
import { Restoranlar } from "@/components/anasayfa/Restoranlar";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { tumRestoranlar } from "@/lib/restoran-listesi";

export const metadata: Metadata = {
  title: "Restoranlar",
  description:
    "Beylikdüzü'ne teslimat yapan restoranlar, ev şefleri ve marketler. Puana, teslimat süresine ve minimum sepete göre filtrele.",
};

export default async function RestoranlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  // Sabit restoranlar + yönetici onayıyla açılan şef mutfakları
  const liste = await tumRestoranlar();

  return (
    <AramaSaglayici baslangicSorgu={q ?? ""}>
      <SayfaBasligi
        ustBaslik="Restoranlar"
        baslik={
          <>
            Bugün <span className="metin-sari">ne yersin?</span>
          </>
        }
        aciklama={`${liste.length} restoran, ev şefi ve market — hepsinde ücretsiz teslimat.`}
        kirintiYolu={[{ etiket: "Restoranlar" }]}
      />
      <KategoriRayi />
      <Restoranlar liste={liste} />
      <AyinHanimlari />
    </AramaSaglayici>
  );
}
