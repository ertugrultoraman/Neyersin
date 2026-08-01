import type { Metadata } from "next";

import { AramaSaglayici } from "@/components/anasayfa/AramaBaglami";
import { AyinHanimlari } from "@/components/anasayfa/AyinHanimlari";
import { KategoriRayi } from "@/components/anasayfa/KategoriRayi";
import { Restoranlar } from "@/components/anasayfa/Restoranlar";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { filtreSirasi, sefMutfagiMi } from "@/content/restoranlar";
import { tumRestoranlar } from "@/lib/restoran-listesi";

export const metadata: Metadata = {
  title: "Restoranlar",
  description:
    "Beylikdüzü'ne teslimat yapan ev mutfakları, şefler ve işletmeler. Hazırlık süresine ve minimum sepete göre filtrele.",
};

export default async function RestoranlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tur?: string }>;
}) {
  const { q, tur } = await searchParams;
  // Sabit restoranlar + yönetici onayıyla açılan şef mutfakları
  const liste = await tumRestoranlar();

  // Anasayfadaki seçim ekranı buraya `?tur=sef` / `?tur=isletme` ile geliyor.
  const baslangicFiltre = filtreSirasi(tur);
  const sefSayisi = liste.filter(sefMutfagiMi).length;
  const isletmeSayisi = liste.length - sefSayisi;

  const baslik =
    tur === "sef" ? (
      <>
        Şeflerin <span className="metin-sari">elinden</span>
      </>
    ) : tur === "isletme" ? (
      <>
        Bölgendeki <span className="metin-sari">işletmeler</span>
      </>
    ) : (
      <>
        Bugün <span className="metin-sari">ne yersin?</span>
      </>
    );

  const aciklama =
    tur === "sef"
      ? `Kendi mutfağından pişiren ${sefSayisi} şef ve ev hanımı — hepsinde ücretsiz teslimat.`
      : tur === "isletme"
        ? `${isletmeSayisi} restoran, market ve fırın — hepsinde ücretsiz teslimat.`
        : `${liste.length} mutfak ve mağaza — hepsinde ücretsiz teslimat.`;

  return (
    <AramaSaglayici baslangicSorgu={q ?? ""}>
      <SayfaBasligi
        ustBaslik="Restoranlar"
        baslik={baslik}
        aciklama={aciklama}
        kirintiYolu={[{ etiket: "Restoranlar" }]}
      />
      <KategoriRayi />
      <Restoranlar liste={liste} baslangicFiltre={baslangicFiltre} />
      <AyinHanimlari />
    </AramaSaglayici>
  );
}
