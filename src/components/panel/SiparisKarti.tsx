import { DurumRozeti } from "@/components/admin/DurumRozeti";
import type { KayitliSiparis } from "@/lib/depo";
import { kalemBirimFiyati } from "@/lib/siparis";
import { paraFormatla } from "@/lib/utils";

/**
 * Sipariş kartı — hangi alanların görüneceği role göre belirlenir.
 *
 * `musteriBilgisi` KASITLI olarak varsayılan `false`: şef paneli müşterinin
 * adını, telefonunu ve adresini GÖRMEZ. Şefin işi yemeği hazırlamak; kişisel
 * veri yalnızca teslimatı yapan kurye ve yöneticide durur.
 */
export function SiparisKarti({
  siparis,
  musteriBilgisi = false,
  kalemler = true,
  ekAlan,
}: {
  siparis: KayitliSiparis;
  musteriBilgisi?: boolean;
  kalemler?: boolean;
  ekAlan?: React.ReactNode;
}) {
  const tarih = new Date(siparis.olusturmaTarihi).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold text-kahve-900">{siparis.siparisNo}</p>
          <p className="mt-0.5 text-xs text-kahve-500">
            {tarih} · {siparis.restoranAdi}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DurumRozeti durum={siparis.durum} />
          <span className="font-display text-lg font-extrabold text-kahve-900">
            {paraFormatla(siparis.tutarlar.toplam)}
          </span>
        </div>
      </header>

      {kalemler && (
        <ul className="mt-4 space-y-2 border-t border-kahve-900/8 pt-4">
          {siparis.kalemler.map((k) => (
            <li key={k.satirId} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-kahve-900">
                  {k.adet}× {k.ad}
                </span>
                <span className="shrink-0 font-bold text-kahve-700">
                  {paraFormatla(kalemBirimFiyati(k) * k.adet)}
                </span>
              </div>
              {k.ekstralar && k.ekstralar.length > 0 && (
                <p className="mt-0.5 text-xs text-kahve-500">
                  + {k.ekstralar.map((e) => e.ad).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {siparis.not && (
        <p className="mt-3 rounded-2xl bg-sari-500/10 px-3.5 py-2.5 text-sm leading-relaxed text-kahve-800">
          <span className="font-bold">Not:</span> {siparis.not}
        </p>
      )}

      {musteriBilgisi ? (
        <div className="mt-4 border-t border-kahve-900/8 pt-4 text-sm">
          <p className="font-bold text-kahve-900">{siparis.musteri.adSoyad}</p>
          <p className="mt-0.5 text-kahve-600">{siparis.musteri.telefon}</p>
          <p className="mt-1.5 leading-relaxed text-kahve-700">
            {siparis.adres.mahalle}, {siparis.adres.acikAdres} No: {siparis.adres.binaNo}
            {siparis.adres.daireNo ? ` D: ${siparis.adres.daireNo}` : ""} — {siparis.adres.ilce}
          </p>
          {siparis.adres.tarif && (
            <p className="mt-1 text-xs text-kahve-500">{siparis.adres.tarif}</p>
          )}
        </div>
      ) : (
        <p className="mt-4 border-t border-kahve-900/8 pt-3 text-xs text-kahve-400">
          Müşteri bilgisi ve adres gizlidir.
        </p>
      )}

      {ekAlan && <div className="mt-4 border-t border-kahve-900/8 pt-4">{ekAlan}</div>}
    </article>
  );
}
