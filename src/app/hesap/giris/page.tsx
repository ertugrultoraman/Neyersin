import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GirisFormu } from "@/components/hesap/GirisFormu";
import { oturumAl, rolAnaSayfasi } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınla giriş yap.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GirisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ donus?: string }>;
}) {
  const mevcut = await oturumAl();
  if (mevcut) redirect(rolAnaSayfasi(mevcut.rol));

  const { donus } = await searchParams;
  const guvenliDonus = donus?.startsWith("/") && !donus.startsWith("//") ? donus : undefined;

  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">Giriş yap</h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            Müşteri, şef, kurye ve yönetici hesapları aynı yerden girer.
          </p>

          {guvenliDonus === "/odeme" && (
            <p className="mt-4 rounded-2xl bg-sari-500/12 px-4 py-3 text-sm font-semibold text-kahve-800">
              Sipariş verebilmek için giriş yapman gerekiyor. Sepetin bekliyor.
            </p>
          )}

          <GirisFormu donus={guvenliDonus} />
        </div>

        <div className="mt-5 space-y-2 text-center text-sm text-kahve-600">
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
