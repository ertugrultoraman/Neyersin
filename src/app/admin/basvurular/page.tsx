import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { BasvuruKarti } from "@/components/admin/BasvuruKarti";
import {
  BASVURU_TURLERI,
  basvuruTuruEtiketi,
  hesapDepoAl,
  type BasvuruDurumu,
} from "@/lib/hesaplar";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Başvurular — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEKMELER: { deger: string; etiket: string }[] = [
  { deger: "bekliyor", etiket: "Bekleyen" },
  { deger: "onaylandi", etiket: "Onaylanan" },
  { deger: "reddedildi", etiket: "Reddedilen" },
  { deger: "", etiket: "Tümü" },
];

export default async function BasvurularSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const { durum } = await searchParams;
  const secili = SEKMELER.some((s) => s.deger === durum) ? (durum ?? "bekliyor") : "bekliyor";

  const depo = await hesapDepoAl();
  const basvurular = await depo.basvurulariListele(
    secili ? (secili as BasvuruDurumu) : undefined,
  );

  const bekleyenSayisi = (await depo.basvurulariListele("bekliyor")).length;

  /*
   * Belgeler TEK seferde çekiliyor, başvuru başına ayrı sorgu atılmıyor.
   * İçerik gelmiyor — yalnızca ad/tür/boyut (bkz. belgeleriListele).
   */
  const belgeler = new Map(
    await Promise.all(
      basvurular.map(
        async (b) => [b.id, await depo.belgeleriListele("basvuru", b.id)] as const,
      ),
    ),
  );

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Başvurular"
      aciklama={`${bekleyenSayisi} bekleyen başvuru`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <div className="flex flex-wrap gap-2">
        {SEKMELER.map((s) => {
          const aktif = secili === s.deger;
          return (
            <Link
              key={s.etiket}
              href={`/admin/basvurular${s.deger ? `?durum=${s.deger}` : "?durum="}`}
              aria-current={aktif ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
                aktif
                  ? "bg-sari-500 text-kahve-900 shadow-sari"
                  : "text-kahve-500 hover:bg-kahve-900/5 hover:text-kahve-900"
              }`}
            >
              {s.etiket}
            </Link>
          );
        })}
      </div>

      {basvurular.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-kahve-900/8 bg-white p-10 text-center text-sm text-kahve-500">
          Bu durumda başvuru yok.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {basvurular.map((b) => (
            <BasvuruKarti
              key={b.id}
              basvuru={b}
              turEtiketi={basvuruTuruEtiketi(b.tur)}
              roller={[...BASVURU_TURLERI]}
              belgeler={belgeler.get(b.id) ?? []}
            />
          ))}
        </div>
      )}
    </AdminKabuk>
  );
}
