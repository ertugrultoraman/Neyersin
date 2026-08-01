import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { YildizGosterge } from "@/components/yorum/Yildizlar";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl, yorumOzetiHesapla } from "@/lib/hesaplar";
import type { Yorum } from "@/lib/hesaplar/tipler";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";

export const metadata: Metadata = {
  title: "Yorumlar — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Düşük puan eşiği — bu seviyenin altı incelemeye alınır (bkz. Ev Hanımları sayfası). */
const DUSUK_ESIK = 4.2;

export default async function AdminYorumlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ dusuk?: string }>;
}) {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const { dusuk } = await searchParams;
  const sadeceDusuk = dusuk === "1";

  let yorumlar: Yorum[] = [];
  try {
    yorumlar = await (await hesapDepoAl()).yorumlariListele();
  } catch {
    // depo erişilemiyorsa sayfa yine açılsın
  }

  const ortalamasi = (y: Yorum) =>
    Math.round(((y.sicaklik + y.teslimatHizi + y.tad) / 3) * 10) / 10;

  const gosterilen = sadeceDusuk
    ? yorumlar.filter((y) => ortalamasi(y) < DUSUK_ESIK)
    : yorumlar;

  // Mutfak bazlı özet — hangi profil incelemeye girmeli?
  const mutfakGruplari = new Map<string, Yorum[]>();
  for (const y of yorumlar) {
    const liste = mutfakGruplari.get(y.restoranSlug);
    if (liste) liste.push(y);
    else mutfakGruplari.set(y.restoranSlug, [y]);
  }

  const mutfakOzetleri = await Promise.all(
    [...mutfakGruplari.entries()].map(async ([slug, liste]) => {
      const restoran = await restoranCoz(slug);
      return { slug, ad: restoran?.ad ?? slug, ozet: yorumOzetiHesapla(liste) };
    }),
  );
  mutfakOzetleri.sort((a, b) => a.ozet.ortalama - b.ozet.ortalama);

  const dusukSayisi = yorumlar.filter((y) => ortalamasi(y) < DUSUK_ESIK).length;

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Yorumlar"
      aciklama={`${yorumlar.length} değerlendirme · ${dusukSayisi} tanesi ${DUSUK_ESIK.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} altında`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      {/* Mutfak bazlı özet — en düşük puanlı üstte */}
      {mutfakOzetleri.length > 0 && (
        <section className="rounded-3xl border border-kahve-900/8 bg-white p-5 md:p-6">
          <h2 className="font-display text-base font-extrabold text-kahve-900">
            Mutfağa göre ortalama
          </h2>
          <ul className="mt-4 space-y-2.5">
            {mutfakOzetleri.map((m) => {
              const inceleme = m.ozet.ortalama < DUSUK_ESIK;
              return (
                <li key={m.slug} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/restoran/${m.slug}#degerlendirmeler`}
                    className="text-sm font-bold text-kahve-900 hover:text-sari-700"
                  >
                    {m.ad}
                  </Link>
                  <YildizGosterge puan={m.ozet.ortalama} />
                  <span className="text-sm font-extrabold text-kahve-800">
                    {m.ozet.ortalama.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} / 5
                  </span>
                  <span className="text-xs text-kahve-400">({m.ozet.adet} yorum)</span>
                  {inceleme && (
                    <span className="rounded-full bg-domates/12 px-2.5 py-0.5 text-2xs font-bold text-domates-koyu uppercase">
                      İncelemeye al
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/yorumlar"
          className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
            !sadeceDusuk ? "bg-kahve-900 text-sari-300" : "bg-kahve-900/6 text-kahve-700"
          }`}
        >
          Tümü ({yorumlar.length})
        </Link>
        <Link
          href="/admin/yorumlar?dusuk=1"
          className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
            sadeceDusuk ? "bg-domates text-white" : "bg-domates/10 text-domates-koyu"
          }`}
        >
          Düşük puanlı ({dusukSayisi})
        </Link>
      </div>

      {gosterilen.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-12 text-center text-sm text-kahve-500">
          {yorumlar.length === 0
            ? "Henüz değerlendirme yok. Müşteriler sipariş teslim edildikten sonra puan verebilir."
            : "Bu listede yorum yok."}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {gosterilen.map((y) => {
            const ort = ortalamasi(y);
            return (
              <li
                key={y.id}
                className={`rounded-3xl border bg-white p-5 ${
                  ort < DUSUK_ESIK ? "border-domates/30" : "border-kahve-900/8"
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="font-display text-base font-extrabold text-kahve-900">
                    {y.musteriAdi}
                  </span>
                  <YildizGosterge puan={ort} />
                  <span className="text-sm font-extrabold text-kahve-800">
                    {ort.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} / 5
                  </span>
                  <Link
                    href={`/restoran/${y.restoranSlug}#degerlendirmeler`}
                    className="text-xs font-bold text-sari-700 underline underline-offset-2"
                  >
                    {y.restoranSlug}
                  </Link>
                  <span className="ml-auto text-xs text-kahve-400">
                    {new Date(y.tarih).toLocaleString("tr-TR")}
                  </span>
                </div>

                <p className="mt-2 text-2xs font-semibold text-kahve-500">
                  Sıcaklık {y.sicaklik} · Teslimat {y.teslimatHizi} · Tad {y.tad} · Sipariş{" "}
                  <Link
                    href={`/admin/siparis/${y.siparisNo}`}
                    className="font-mono text-sari-700 underline"
                  >
                    {y.siparisNo}
                  </Link>
                </p>

                {y.metin && (
                  <p className="mt-2 text-sm leading-relaxed text-kahve-700">{y.metin}</p>
                )}
                <p className="mt-2 text-2xs text-kahve-400">{y.musteriEposta}</p>
              </li>
            );
          })}
        </ul>
      )}
    </AdminKabuk>
  );
}
