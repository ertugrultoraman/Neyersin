import { AramaSaglayici } from "@/components/anasayfa/AramaBaglami";
import { AyinHanimlari } from "@/components/anasayfa/AyinHanimlari";
import { KategoriRayi } from "@/components/anasayfa/KategoriRayi";
import { Restoranlar } from "@/components/anasayfa/Restoranlar";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { kategoriBul } from "@/content/kategoriler";
import { sefMutfagiMi } from "@/content/restoranlar";
import { tumRestoranlar } from "@/lib/restoran-listesi";
import { TurSekmeleri, type Tur } from "./TurSekmeleri";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Üç listenin ortak gövdesi: /seflerin-elinden, /isletmeler ve /restoranlar.
 *
 * Her tür kendi adresinde duruyor — sorgu parametresiyle değil. Böylece üst
 * menüde ayrı ayrı yer alabiliyorlar, hangisinde olduğun menüde doğru işaretli
 * görünüyor ve bağlantı paylaşıldığında doğrudan o liste açılıyor.
 */
/**
 * Başlıklar METİN değil SÖZLÜK ANAHTARI tutuyor.
 *
 * Önceden burada hazır JSX vardı; JSX modül yüklenirken bir kez kuruluyor ve
 * o an çevirmen elimizde olmadığı için başlıklar İngilizce sayfada da Türkçe
 * kalıyordu. Parçalar artık çağrı yerinde birleştiriliyor.
 *
 * "Ne Yersin?" marka adı olduğu için iki dilde de aynı ve büyük harfle.
 */
const BASLIKLAR: Record<Tur, { ust: string; bas: string; vurgu: string }> = {
  sef: { ust: "liste.seflerUst", bas: "liste.seflerBaslik1", vurgu: "liste.seflerBaslik2" },
  isletme: {
    ust: "liste.isletmelerUst",
    bas: "liste.isletmeBaslik1",
    vurgu: "liste.isletmeBaslik2",
  },
  hepsi: { ust: "liste.restoranlarUst", bas: "liste.hepsiBaslik1", vurgu: "liste.hepsiBaslik2" },
};

export async function RestoranListesiSayfasi({
  tur,
  sorgu,
  kategori,
}: {
  tur: Tur;
  sorgu?: string;
  /** Ana sayfadaki kategori şeridinden gelen süzgeç (slug). */
  kategori?: string;
}) {
  const c = ceviri(await aktifDil());
  // Sabit restoranlar + yönetici onayıyla açılan şef mutfakları
  const hepsi = await tumRestoranlar();

  const sefler = hepsi.filter(sefMutfagiMi);
  const isletmeler = hepsi.filter((r) => !sefMutfagiMi(r));
  const turListesi = tur === "sef" ? sefler : tur === "isletme" ? isletmeler : hepsi;

  /*
   * Kategori süzgeci: ana sayfadaki şeritten "Pizza"ya basan kişi tüm listeyi
   * değil yalnızca pizzacıları görsün. Eşleşme, kategorinin karşıladığı mutfak
   * etiketleri üzerinden yapılıyor (bkz. content/kategoriler.ts).
   */
  const secilenKategori = kategori ? kategoriBul(kategori) : undefined;
  const liste = secilenKategori
    ? turListesi.filter((r) => r.mutfaklar.some((m) => secilenKategori.mutfaklar.includes(m)))
    : turListesi;

  const sayilar: Record<Tur, number> = {
    hepsi: hepsi.length,
    sef: sefler.length,
    isletme: isletmeler.length,
  };

  const aciklama =
    tur === "sef"
      ? c("liste.sefOzet", { sayi: sayilar.sef })
      : tur === "isletme"
        ? c("liste.isletmeOzet", { sayi: sayilar.isletme })
        : c("liste.hepsiOzet", { sayi: sayilar.hepsi });

  return (
    <AramaSaglayici baslangicSorgu={sorgu ?? ""}>
      <SayfaBasligi
        ustBaslik={c(BASLIKLAR[tur].ust)}
        baslik={
          <>
            {c(BASLIKLAR[tur].bas)} <span className="metin-sari">{c(BASLIKLAR[tur].vurgu)}</span>
          </>
        }
        aciklama={aciklama}
        kirintiYolu={[{ etiket: c(BASLIKLAR[tur].ust) }]}
      />

      {/* İki taraf arasında tek tıkla geçiş — girişteki seçime dönmeye gerek yok */}
      <TurSekmeleri aktif={tur} sayilar={sayilar} />

      <KategoriRayi />
      <Restoranlar liste={liste} />
      {tur !== "isletme" && <AyinHanimlari />}
    </AramaSaglayici>
  );
}
