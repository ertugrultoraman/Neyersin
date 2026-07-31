import type { Metadata } from "next";
import Link from "next/link";

import { BasvuruFormu } from "@/components/hesap/BasvuruFormu";
import { BASVURU_TURLERI } from "@/lib/hesaplar";

export const metadata: Metadata = {
  title: "Şef / Kurye Başvurusu",
  description: "Ne Yersin? platformunda şef, ev hanımı veya kurye olarak yer al.",
};

export const runtime = "nodejs";

export default function BasvuruSayfasi() {
  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-xl">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900 md:text-3xl">
            Aramıza katıl
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            Kendi mutfağından satmak veya teslimat yapmak istiyorsan başvurunu bırak. Doğrudan
            hesap açılmaz — başvurunu değerlendirip seninle iletişime geçeriz.
          </p>

          <BasvuruFormu turler={[...BASVURU_TURLERI]} />
        </div>

        <p className="mt-5 text-center text-sm text-kahve-600">
          Sadece sipariş vermek istiyorsan{" "}
          <Link href="/hesap/kayit" className="tiklanabilir font-bold text-sari-700 underline">
            müşteri hesabı aç
          </Link>
        </p>
      </div>
    </div>
  );
}
