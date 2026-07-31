import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { KayitFormu } from "@/components/hesap/KayitFormu";
import { sahipsizSefProfilleri } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Şef Kaydı",
  description: "Kendi mutfağından satan ev şefleri için hesap oluştur.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
/** Sahipsiz profil listesi veritabanından geldiği için sayfa statik üretilemez. */
export const dynamic = "force-dynamic";

export default async function KayitSayfasi() {
  const mevcut = await oturumAl();
  if (mevcut) redirect(mevcut.rol === "admin" ? "/admin" : "/panel");

  const profiller = (await sahipsizSefProfilleri()).map((r) => ({ slug: r.slug, ad: r.ad }));

  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">Şef kaydı</h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            Kendi mutfağından satan şefler için. Hesabını açtıktan sonra profilini, özgeçmişini ve
            sertifikalarını kendin düzenlersin.
          </p>

          <KayitFormu profiller={profiller} />
        </div>

        <p className="mt-5 text-center text-sm text-kahve-600">
          Zaten hesabın var mı?{" "}
          <Link href="/hesap/giris" className="tiklanabilir font-bold text-sari-700 underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
