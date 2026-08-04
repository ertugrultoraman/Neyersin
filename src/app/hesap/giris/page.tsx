import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GirisFormu } from "@/components/hesap/GirisFormu";
import { GoogleDugmesi } from "@/components/hesap/GoogleDugmesi";
import { aktifDil } from "@/lib/dil-sunucu";
import { oturumAl, rolAnaSayfasi } from "@/lib/oturum";
import { ceviri } from "@/lib/sozluk";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınla giriş yap.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Google akışından dönen hata anahtarlarının SÖZLÜK karşılıkları.
 *
 * "google-yonetici" durumunda bu adresin yönetici olduğunu SÖYLEMİYORUZ:
 * önceki metin, doğru adresi deneyen birine "burası yönetici hesabı" diye
 * onay veriyordu. Hesap sayımına açık kapı bırakmamak için diğer hatalarla
 * aynı dili kullanıyor.
 */
const GOOGLE_HATALARI: Record<string, string> = {
  "google-kapali": "giris.googleKapali",
  "google-durum": "giris.googleZamanAsimi",
  "google-dogrulama": "giris.googleDogrulama",
  "google-yonetici": "giris.googleYonetici",
  "google-hesap": "giris.googleHesap",
};

export default async function GirisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ donus?: string; hata?: string }>;
}) {
  const c = ceviri(await aktifDil());
  const mevcut = await oturumAl();
  if (mevcut) redirect(rolAnaSayfasi(mevcut.rol));

  const { donus, hata } = await searchParams;
  const guvenliDonus = donus?.startsWith("/") && !donus.startsWith("//") ? donus : undefined;
  const googleHatasiAnahtari = hata ? GOOGLE_HATALARI[hata] : undefined;

  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">{c("hesap.girisYap")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            {c("giris.hepsiAyniYer")}
          </p>

          {googleHatasiAnahtari && (
            <p
              role="alert"
              className="mt-4 rounded-2xl bg-domates/10 px-4 py-3 text-sm font-semibold text-domates-koyu"
            >
              {c(googleHatasiAnahtari!)}
            </p>
          )}

          {guvenliDonus === "/odeme" && (
            <p className="mt-4 rounded-2xl bg-sari-500/12 px-4 py-3 text-sm font-semibold text-kahve-800">
              {c("giris.sepetBekliyor")}
            </p>
          )}

          <GoogleDugmesi donus={guvenliDonus} />

          <GirisFormu donus={guvenliDonus} />
        </div>

        <div className="mt-5 space-y-2 text-center text-sm text-kahve-600">
          <p className="text-xs leading-relaxed text-kahve-500">
            {c("giris.googleNotu")}
          </p>
          <p>
            {c("hesap.hesabinYokMu")}{" "}
            <Link
              href={`/hesap/kayit${guvenliDonus ? `?donus=${encodeURIComponent(guvenliDonus)}` : ""}`}
              className="tiklanabilir font-bold text-sari-700 underline"
            >
              {c("giris.musteriKayit")}
            </Link>
          </p>
          <p>
            {c("giris.sefKuryeMisin")}{" "}
            <Link href="/hesap/basvuru" className="tiklanabilir font-bold text-sari-700 underline">
              {c("giris.basvuruOlustur")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
