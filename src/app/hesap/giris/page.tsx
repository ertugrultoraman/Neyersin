import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GirisFormu } from "@/components/hesap/GirisFormu";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Şef hesabınla giriş yap, profilini yönet.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

export default async function GirisSayfasi() {
  const mevcut = await oturumAl();
  if (mevcut) redirect(mevcut.rol === "admin" ? "/admin" : "/panel");

  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">Giriş yap</h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            Şef hesabınla gir, kendi profilini düzenle. Yönetici hesabı da buradan girer.
          </p>

          <GirisFormu />
        </div>

        <p className="mt-5 text-center text-sm text-kahve-600">
          Hesabın yok mu?{" "}
          <Link href="/hesap/kayit" className="tiklanabilir font-bold text-sari-700 underline">
            Şef olarak kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
