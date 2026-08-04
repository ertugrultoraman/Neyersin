import { Akordiyon } from "../ui/Akordiyon";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { Reveal } from "../ui/Reveal";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Sıkça sorulan sorular.
 *
 * Metin değil SÖZLÜK ANAHTARI tutuluyor: sorular hem Türkçe hem İngilizce
 * gösteriliyor ve çeviriler tek yerden (lib/sozluk.ts) geliyor.
 *
 * "Sipariş verilerim nasıl kullanılıyor?" cevabı BİLEREK sade. Önceki metin
 * "analiz ve raporlamada yalnızca anonimleştirilmiş toplu veriler kullanılır"
 * diyordu; ortada öyle bir analiz sistemi yok, yani karşılığı olmayan bir
 * taahhüttü. Yalnızca gerçekten yaptığımız şey yazılı.
 */
const SORU_ANAHTARLARI = [1, 2, 3, 4, 5, 6, 7];

export async function Sss() {
  const c = ceviri(await aktifDil());

  return (
    <Bolum id="sss">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <BolumBasligi
          ustBaslik={c("sss.ustBaslik")}
          baslik={c("sss.baslik")}
          aciklama={c("sss.aciklama")}
          className="lg:flex-col lg:items-start"
        />

        <Reveal gecikme={0.08}>
          <Akordiyon
            ogeler={SORU_ANAHTARLARI.map((i) => ({
              soru: c(`sss.s${i}`),
              cevap: c(`sss.c${i}`),
            }))}
          />
        </Reveal>
      </div>
    </Bolum>
  );
}
