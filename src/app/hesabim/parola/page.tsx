import type { Metadata } from "next";
import Link from "next/link";

import { ParolaDegistirFormu } from "@/components/hesap/ParolaDegistirFormu";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("hesabim.parolaDegistir"),
    robots: { index: false, follow: false },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ParolaSayfasi() {
  const c = ceviri(await aktifDil());

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <ParolaDegistirFormu />
      </section>

      <section className="rounded-[2rem] border border-kahve-900/8 bg-white/70 p-6 md:p-8">
        <h2 className="font-display text-base font-extrabold text-kahve-900">
          {c("parola.hatirlamiyorMusun")}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-kahve-600">
          {c("parola.unuttumAciklama1")}{" "}
          <Link
            href="/hesap/sifremi-unuttum"
            className="tiklanabilir font-bold text-sari-700 underline underline-offset-2"
          >
            {c("parola.unuttumBaglanti")}
          </Link>{" "}
          {c("parola.unuttumAciklama2")}
        </p>
      </section>
    </div>
  );
}
