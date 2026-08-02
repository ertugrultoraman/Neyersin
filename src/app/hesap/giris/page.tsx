import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GirisFormu } from "@/components/hesap/GirisFormu";
import { GoogleDugmesi } from "@/components/hesap/GoogleDugmesi";
import { oturumAl, rolAnaSayfasi } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınla giriş yap.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Google akışından dönen hata anahtarlarının okunabilir karşılıkları. */
const GOOGLE_HATALARI: Record<string, string> = {
  "google-kapali": "Google girişi şu an kullanılamıyor. E-posta ve parolanla girebilirsin.",
  "google-durum":
    "Google girişi tamamlanamadı; istek zaman aşımına uğramış olabilir. Tekrar dene.",
  "google-dogrulama": "Google hesabın doğrulanamadı. Tekrar dene ya da parolanla gir.",
  /*
   * Bu adresin yönetici olduğunu SÖYLEMİYORUZ. Önceki metin, doğru adresi
   * deneyen birine "burası yönetici hesabı" diye onay veriyordu; hesap
   * sayımına açık kapı bırakmamak için diğer hatalarla aynı dili kullanıyor.
   */
  "google-yonetici": "Google hesabınla giriş yapılamadı. E-posta ve parolanla girebilirsin.",
  "google-hesap": "Google hesabınla bir kayıt açılamadı. Destekle iletişime geç.",
};

export default async function GirisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ donus?: string; hata?: string }>;
}) {
  const mevcut = await oturumAl();
  if (mevcut) redirect(rolAnaSayfasi(mevcut.rol));

  const { donus, hata } = await searchParams;
  const guvenliDonus = donus?.startsWith("/") && !donus.startsWith("//") ? donus : undefined;
  const googleHatasi = hata ? GOOGLE_HATALARI[hata] : undefined;

  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">Giriş yap</h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            Müşteri, şef ve kurye hesapları aynı yerden girer.
          </p>

          {googleHatasi && (
            <p
              role="alert"
              className="mt-4 rounded-2xl bg-domates/10 px-4 py-3 text-sm font-semibold text-domates-koyu"
            >
              {googleHatasi}
            </p>
          )}

          {guvenliDonus === "/odeme" && (
            <p className="mt-4 rounded-2xl bg-sari-500/12 px-4 py-3 text-sm font-semibold text-kahve-800">
              Sipariş verebilmek için giriş yapman gerekiyor. Sepetin bekliyor.
            </p>
          )}

          <GoogleDugmesi donus={guvenliDonus} />

          <GirisFormu donus={guvenliDonus} />
        </div>

        <div className="mt-5 space-y-2 text-center text-sm text-kahve-600">
          <p className="text-xs leading-relaxed text-kahve-500">
            Hesabını Google ile açtıysan parolan yoktur — &quot;Google ile devam et&quot; ile gir.
            Parolayla da girmek istersen &quot;Parolamı unuttum&quot; adımından kendine bir parola
            belirleyebilirsin.
          </p>
          <p>
            Hesabın yok mu?{" "}
            <Link
              href={`/hesap/kayit${guvenliDonus ? `?donus=${encodeURIComponent(guvenliDonus)}` : ""}`}
              className="tiklanabilir font-bold text-sari-700 underline"
            >
              Müşteri olarak kayıt ol
            </Link>
          </p>
          <p>
            Şef, ev hanımı veya kurye misin?{" "}
            <Link href="/hesap/basvuru" className="tiklanabilir font-bold text-sari-700 underline">
              Başvuru oluştur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
