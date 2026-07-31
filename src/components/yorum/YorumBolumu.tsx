import { hesapDepoAl, yorumOzetiHesapla } from "@/lib/hesaplar";
import { EksenDokumu, YildizGosterge } from "./Yildizlar";

/**
 * Bir restoranın/şefin değerlendirmeleri.
 *
 * Puanlar üç eksende tutulur (sıcaklık, teslimat hızı, tad) ve ortalama bu
 * üçünün ortalamasıdır. Yalnızca gerçekten sipariş vermiş müşteriler yazabildiği
 * için buradaki sayılar uydurma değil, sipariş kaydına bağlıdır.
 */
export async function YorumBolumu({ restoranSlug }: { restoranSlug: string }) {
  let yorumlar;
  try {
    yorumlar = await (await hesapDepoAl()).yorumlariListele(restoranSlug);
  } catch {
    return null; // depo erişilemiyorsa bölümü hiç gösterme
  }

  const ozet = yorumOzetiHesapla(yorumlar);

  return (
    <section className="mt-6 rounded-[1.75rem] border border-kahve-900/8 bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-extrabold text-kahve-900">Değerlendirmeler</h2>
        {ozet.adet > 0 && (
          <p className="flex items-center gap-2">
            <YildizGosterge puan={ozet.ortalama} boyut="md" />
            <span className="font-display text-lg font-extrabold text-kahve-900">
              {ozet.ortalama.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
            </span>
            <span className="text-sm text-kahve-500">({ozet.adet})</span>
          </p>
        )}
      </div>

      {ozet.adet === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-kahve-500">
          Henüz değerlendirme yok. Sipariş veren müşteriler sıcaklık, teslimat hızı ve tad
          başlıklarında puan verebilir.
        </p>
      ) : (
        <>
          <EksenDokumu ozet={ozet} className="mt-4" />

          <ul className="mt-6 space-y-4 border-t border-kahve-900/8 pt-5">
            {yorumlar.slice(0, 20).map((y) => {
              const kisiselOrtalama =
                Math.round(((y.sicaklik + y.teslimatHizi + y.tad) / 3) * 10) / 10;
              return (
                <li key={y.id}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-extrabold text-kahve-900">{y.musteriAdi}</span>
                    <YildizGosterge puan={kisiselOrtalama} />
                    <span className="text-xs text-kahve-400">
                      {new Date(y.tarih).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <p className="mt-1 text-2xs font-semibold text-kahve-500">
                    Sıcaklık {y.sicaklik} · Teslimat {y.teslimatHizi} · Tad {y.tad}
                  </p>
                  {y.metin && (
                    <p className="mt-1.5 text-sm leading-relaxed text-kahve-700">{y.metin}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
