import { AramaSaglayici } from "@/components/anasayfa/AramaBaglami";
import { AyinHanimlari } from "@/components/anasayfa/AyinHanimlari";
import { KategoriRayi } from "@/components/anasayfa/KategoriRayi";
import { Restoranlar } from "@/components/anasayfa/Restoranlar";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { sefMutfagiMi } from "@/content/restoranlar";
import { tumRestoranlar } from "@/lib/restoran-listesi";
import { TurSekmeleri, type Tur } from "./TurSekmeleri";

/**
 * Üç listenin ortak gövdesi: /seflerin-elinden, /isletmeler ve /restoranlar.
 *
 * Her tür kendi adresinde duruyor — sorgu parametresiyle değil. Böylece üst
 * menüde ayrı ayrı yer alabiliyorlar, hangisinde olduğun menüde doğru işaretli
 * görünüyor ve bağlantı paylaşıldığında doğrudan o liste açılıyor.
 */
const BASLIKLAR: Record<Tur, { ust: string; baslik: React.ReactNode }> = {
  sef: {
    ust: "Şeflerin Elinden",
    baslik: (
      <>
        Şeflerin <span className="metin-sari">elinden</span>
      </>
    ),
  },
  isletme: {
    ust: "İşletmeler",
    baslik: (
      <>
        Bölgendeki <span className="metin-sari">işletmeler</span>
      </>
    ),
  },
  hepsi: {
    ust: "Restoranlar",
    baslik: (
      <>
        Bugün <span className="metin-sari">ne yersin?</span>
      </>
    ),
  },
};

export async function RestoranListesiSayfasi({
  tur,
  sorgu,
}: {
  tur: Tur;
  sorgu?: string;
}) {
  // Sabit restoranlar + yönetici onayıyla açılan şef mutfakları
  const hepsi = await tumRestoranlar();

  const sefler = hepsi.filter(sefMutfagiMi);
  const isletmeler = hepsi.filter((r) => !sefMutfagiMi(r));
  const liste = tur === "sef" ? sefler : tur === "isletme" ? isletmeler : hepsi;

  const sayilar: Record<Tur, number> = {
    hepsi: hepsi.length,
    sef: sefler.length,
    isletme: isletmeler.length,
  };

  const aciklama =
    tur === "sef"
      ? `Kendi mutfağından pişiren ${sayilar.sef} şef ve ev hanımı — hepsinde ücretsiz teslimat.`
      : tur === "isletme"
        ? `${sayilar.isletme} restoran, market ve fırın — hepsinde ücretsiz teslimat.`
        : `${sayilar.hepsi} mutfak ve mağaza — hepsinde ücretsiz teslimat.`;

  return (
    <AramaSaglayici baslangicSorgu={sorgu ?? ""}>
      <SayfaBasligi
        ustBaslik={BASLIKLAR[tur].ust}
        baslik={BASLIKLAR[tur].baslik}
        aciklama={aciklama}
        kirintiYolu={[{ etiket: BASLIKLAR[tur].ust }]}
      />

      {/* İki taraf arasında tek tıkla geçiş — girişteki seçime dönmeye gerek yok */}
      <TurSekmeleri aktif={tur} sayilar={sayilar} />

      <KategoriRayi />
      <Restoranlar liste={liste} />
      {tur !== "isletme" && <AyinHanimlari />}
    </AramaSaglayici>
  );
}
