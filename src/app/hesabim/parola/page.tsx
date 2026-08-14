import type { Metadata } from "next";
import Link from "next/link";

import { ParolaDegistirFormu } from "@/components/hesap/ParolaDegistirFormu";
import { aktifDil } from "@/lib/dil-sunucu";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
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

  /*
   * PAROLASIZ HESAP = Google ile açılmış hesap (bkz. hesaplar →
   * googleHesabiCoz). Bu kişide "mevcut parolan" diye bir şey yok; form
   * onu sorduğu sürece parola belirlemeleri imkânsızdı.
   *
   * Depo susarsa parolalı varsayılıyor: mevcut parolayı sormak, yanlışlıkla
   * hiç sormamaktan güvenli taraf.
   */
  let parolasiz = false;
  const oturum = await oturumAl();
  if (oturum) {
    try {
      const hesap = await (await hesapDepoAl()).hesapBul(oturum.eposta);
      parolasiz = Boolean(hesap) && !hesap?.parolaHash;
    } catch {
      /* sessiz */
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <ParolaDegistirFormu parolasiz={parolasiz} />
      </section>

      {/* Parolasız hesapta "şifremi unuttum" yolu anlamsız — unutulacak bir
          parola yok ve kişi zaten oturum açmış durumda. */}
      {!parolasiz && (
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
      )}
    </div>
  );
}
