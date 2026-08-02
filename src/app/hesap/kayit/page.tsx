import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleDugmesi } from "@/components/hesap/GoogleDugmesi";
import { KayitFormu } from "@/components/hesap/KayitFormu";
import { oturumAl, rolAnaSayfasi } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Ne Yersin? hesabı oluştur.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function KayitSayfasi({
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
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">Kayıt ol</h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            Sipariş verebilmek için müşteri hesabı yeterli. Şef, ev hanımı ve kurye hesapları
            başvuru onayıyla açılır.
          </p>

          <GoogleDugmesi donus={guvenliDonus} etiket="Google ile kayıt ol" />

          <KayitFormu donus={guvenliDonus} />
        </div>

        <div className="mt-5 space-y-2 text-center text-sm text-kahve-600">
          <p>
            Zaten hesabın var mı?{" "}
            <Link href="/hesap/giris" className="tiklanabilir font-bold text-sari-700 underline">
              Giriş yap
            </Link>
          </p>
          <p>
            Şef, ev hanımı veya kurye olmak istiyorsan{" "}
            <Link href="/hesap/basvuru" className="tiklanabilir font-bold text-sari-700 underline">
              başvuru oluştur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
