import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FiyatKarti } from "@/components/admin/FiyatKarti";
import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { bekleyenFiyatlar } from "@/app/panel/fiyat-actions";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";

export const metadata: Metadata = {
  title: "Fiyat Onayları — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * FİYAT ONAYLARI.
 *
 * Şefler fiyatı doğrudan değiştiremiyor; talepleri buraya düşüyor. Onaya
 * kadar müşteri eski fiyatı görüyor ve siparişler eski fiyattan hesaplanıyor.
 * Amaç fahiş fiyatı engellemek ve şef/kurye/sistem arasındaki pay dengesini
 * korumak.
 */
export default async function FiyatlarSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const talepler = await bekleyenFiyatlar();

  // Mutfak adlarını tek turda çöz — kartlarda slug değil isim görünsün.
  const adlar = new Map<string, string>();
  for (const t of talepler) {
    if (adlar.has(t.restoranSlug)) continue;
    const r = await restoranCoz(t.restoranSlug);
    adlar.set(t.restoranSlug, r?.ad ?? t.restoranSlug);
  }

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Fiyat onayları"
      aciklama={
        talepler.length === 0
          ? "Bekleyen fiyat talebi yok."
          : `${talepler.length} ürün onay bekliyor`
      }
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <p className="mt-5 rounded-2xl bg-kahve-900/4 px-4 py-3 text-xs leading-relaxed text-kahve-600">
        Şefler kendi profillerinden fiyat değişikliği talep ediyor. Sen onaylayana kadar
        müşteri eski fiyatı görür ve siparişler eski fiyattan hesaplanır. Böylece fahiş
        fiyat menüye düşmüyor.
      </p>

      {talepler.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-kahve-900/8 bg-white p-10 text-center text-sm text-kahve-500">
          Şu an bekleyen talep yok.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {talepler.map((t) => (
            <FiyatKarti
              key={t.id}
              urunId={t.id}
              ad={t.ad}
              mutfakAdi={adlar.get(t.restoranSlug) ?? t.restoranSlug}
              restoranSlug={t.restoranSlug}
              eskiFiyat={t.fiyat}
              yeniFiyat={t.bekleyenFiyat ?? 0}
              tarih={t.bekleyenTarih}
            />
          ))}
        </div>
      )}
    </AdminKabuk>
  );
}
