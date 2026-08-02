import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SifremiUnuttumFormu } from "@/components/hesap/SifremiUnuttumFormu";
import { oturumAl, rolAnaSayfasi } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Parolamı Unuttum",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SifremiUnuttumSayfasi() {
  const mevcut = await oturumAl();
  if (mevcut) redirect(rolAnaSayfasi(mevcut.rol));

  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">
            Parolamı unuttum
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            E-posta adresini yaz; sana 6 haneli bir doğrulama kodu gönderelim. Kodu girip yeni
            parolanı belirleyebilirsin.
          </p>

          <SifremiUnuttumFormu />
        </div>

        <div className="mt-5 space-y-2 text-center text-sm text-kahve-600">
          <p>
            Parolanı hatırladın mı?{" "}
            <Link href="/hesap/giris" className="tiklanabilir font-bold text-sari-700 underline">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
