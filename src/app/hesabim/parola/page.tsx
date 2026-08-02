import type { Metadata } from "next";
import Link from "next/link";

import { ParolaDegistirFormu } from "@/components/hesap/ParolaDegistirFormu";

export const metadata: Metadata = {
  title: "Parola Değiştir",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ParolaSayfasi() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <ParolaDegistirFormu />
      </section>

      <section className="rounded-[2rem] border border-kahve-900/8 bg-white/70 p-6 md:p-8">
        <h2 className="font-display text-base font-extrabold text-kahve-900">
          Parolanı hatırlamıyor musun?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-kahve-600">
          Mevcut parolanı bilmiyorsan çıkış yapıp{" "}
          <Link
            href="/hesap/sifremi-unuttum"
            className="tiklanabilir font-bold text-sari-700 underline underline-offset-2"
          >
            parolamı unuttum
          </Link>{" "}
          adımından e-postana kod isteyebilirsin.
        </p>
      </section>
    </div>
  );
}
