import Link from "next/link";

import type { SefProfili } from "@/lib/hesaplar";

/**
 * PROFİL TAMAMLAMA ÇUBUĞU — eksik olanı adıyla söyleyen liste.
 *
 * NEDEN VAR: profil alanları isteğe bağlı ve şeflerin çoğu formu bir kez
 * açıp sloganı yazıp çıkıyor. Sonuç, müşteri tarafında gri bir silüet ve
 * boş bir sayfa — sitenin "sahte" hissettiren yeri tam olarak burası.
 * Eksikleri saymak yerine ADIYLA yazmak fark yaratıyor: "profilin %60 dolu"
 * kimseyi harekete geçirmiyor, "fotoğrafın yok" geçiriyor.
 *
 * YÜZDE DEĞİL SAYI: "5'te 3" ilerlemenin sonunun görünmesini sağlıyor;
 * yüzde, kaç şey kaldığını gizliyor.
 *
 * ZORLAMIYOR: hiçbir alan zorunlu değil ve eksik profil mutfağı kapatmıyor.
 * Kutu yalnızca eksiği söylüyor; şef isterse yıllarca öyle bırakabilir.
 *
 * METİNLER DIŞARIDAN: sunucu bileşeni olduğu için dili çağıran sayfadan
 * alıyor (bkz. panel/page). Kendi içinde `useDil` kullansaydı istemci
 * bileşenine dönüşür, sırf bir liste için tarayıcıya JavaScript inerdi.
 */
export function ProfilTamamlama({
  profil,
  fotografVar,
  metinler,
}: {
  profil: SefProfili | null;
  fotografVar: boolean;
  metinler: {
    baslik: string;
    aciklama: string;
    tamam: string;
    baglanti: string;
    eksik: {
      fotograf: string;
      deneyim: string;
      memleket: string;
      imza: string;
      biyografi: string;
      galeri: string;
    };
  };
}) {
  const eksikler = [
    !fotografVar && metinler.eksik.fotograf,
    !profil?.deneyimYili && metinler.eksik.deneyim,
    !profil?.memleket?.trim() && metinler.eksik.memleket,
    !profil?.imzaYemegi?.trim() && metinler.eksik.imza,
    !profil?.biyografi?.trim() && metinler.eksik.biyografi,
    (profil?.galeri ?? []).length === 0 && metinler.eksik.galeri,
  ].filter((e): e is string => Boolean(e));

  const toplam = 6;
  const dolu = toplam - eksikler.length;

  if (eksikler.length === 0) {
    return (
      <div className="rounded-2xl border border-nane/30 bg-nane/8 px-4 py-3">
        <p className="text-sm font-bold text-nane-koyu">{metinler.tamam}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sari-500/40 bg-sari-500/8 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm font-extrabold text-kahve-900">{metinler.baslik}</p>
        <span className="text-xs font-bold text-kahve-600">
          {dolu}/{toplam}
        </span>
      </div>

      {/* İnce ilerleme şeridi — sayının görsel karşılığı. */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-kahve-900/10">
        <div
          className="h-full rounded-full bg-sari-500 transition-[width] duration-500"
          style={{ width: `${(dolu / toplam) * 100}%` }}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-kahve-700">{metinler.aciklama}</p>
      <ul className="mt-2 space-y-1">
        {eksikler.map((e) => (
          <li key={e} className="flex gap-2 text-xs font-semibold text-kahve-800">
            <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sari-600" />
            {e}
          </li>
        ))}
      </ul>

      <Link
        href="/hesabim"
        className="tiklanabilir mt-3 inline-block text-xs font-bold text-sari-700 underline
          underline-offset-2"
      >
        {metinler.baglanti}
      </Link>
    </div>
  );
}
