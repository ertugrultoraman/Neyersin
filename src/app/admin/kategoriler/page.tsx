import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { kategoriGorselleri } from "@/app/admin/kategori-actions";
import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { KategoriGorselKarti } from "@/components/admin/KategoriGorselKarti";
import { kategoriler, kategoriNotu } from "@/content/kategoriler";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Kategori Fotoğrafları — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * KATEGORİ FOTOĞRAFLARI.
 *
 * Ana sayfadaki "Ne canın çekiyor?" şeridi kategorileri çizim ikonla
 * gösteriyordu. Gerçek yemek fotoğrafı hem daha iştah açıcı hem de kategori
 * bir bakışta anlaşılıyor. Fotoğraf yüklenmemiş kategori ikonla görünmeye
 * devam ediyor — zorunlu değil.
 */
export default async function KategorilerSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const gorseller = await kategoriGorselleri();
  const yuklu = kategoriler.filter((k) => gorseller.has(k.slug)).length;

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Kategori fotoğrafları"
      aciklama={`${kategoriler.length} kategoriden ${yuklu} tanesinde fotoğraf var`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <p className="mt-5 rounded-2xl bg-kahve-900/4 px-4 py-3 text-xs leading-relaxed text-kahve-600">
        Ana sayfadaki kategori şeridinde görünen fotoğraflar. Fotoğraf yüklenmemiş kategori
        çizim ikonuyla görünür. Ziyaretçi bir kategoriye tıklayınca yalnızca o kategorinin
        mutfakları listeleniyor. JPG, PNG, WebP veya AVIF — en fazla 4 MB.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kategoriler.map((k) => (
          <KategoriGorselKarti
            key={k.slug}
            slug={k.slug}
            ad={k.ad}
            not={kategoriNotu(k)}
            mevcutUrl={gorseller.get(k.slug)}
          />
        ))}
      </div>
    </AdminKabuk>
  );
}
