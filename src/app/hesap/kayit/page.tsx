import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleDugmesi } from "@/components/hesap/GoogleDugmesi";
import { KayitFormu } from "@/components/hesap/KayitFormu";
import { oturumAl, rolAnaSayfasi } from "@/lib/oturum";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

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
  const c = ceviri(await aktifDil());
  const mevcut = await oturumAl();
  if (mevcut) redirect(rolAnaSayfasi(mevcut.rol));

  const { donus } = await searchParams;
  const guvenliDonus = donus?.startsWith("/") && !donus.startsWith("//") ? donus : undefined;

  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">{c("sayfa.kayitOl")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            {c("sayfa.kayitAciklama")}
          </p>

          <GoogleDugmesi donus={guvenliDonus} etiket={c("giris.googleKayit")} />

          <KayitFormu donus={guvenliDonus} />
        </div>

        <div className="mt-5 space-y-2 text-center text-sm text-kahve-600">
          <p>
            {c("hesap.hesabinVarMi")}{" "}
            <Link href="/hesap/giris" className="tiklanabilir font-bold text-sari-700 underline">
              {c("hesap.girisYap")}
            </Link>
          </p>
          <p>
            {c("sayfa.sefKuryeBasvuru")}{" "}
            <Link href="/hesap/basvuru" className="tiklanabilir font-bold text-sari-700 underline">
              {c("giris.basvuruOlustur")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
