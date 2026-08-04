import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EpostaDegistirFormu } from "@/components/hesap/EpostaDegistirFormu";
import { EpostaDogrulaKarti } from "@/components/hesap/EpostaDogrulaKarti";
import { Rozet } from "@/components/ui/Rozet";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("hesabim.epostaAyarlari"),
    robots: { index: false, follow: false },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EpostaAyarlariSayfasi() {
  const c = ceviri(await aktifDil());
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim/eposta");

  let dogrulandi = true;
  try {
    const hesap = await (await hesapDepoAl()).hesapBul(oturum.eposta);
    dogrulandi = hesap?.epostaDogrulandi !== false;
  } catch {
    // depo susarsa doğrulama uyarısı gösterilmez
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-extrabold text-kahve-900">
              {c("eposta.kayitliAdresim")}
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-kahve-700">{oturum.eposta}</p>
          </div>
          <Rozet ton={dogrulandi ? "nane" : "domates"}>
            {dogrulandi ? c("eposta.dogrulandiKisa") : c("eposta.dogrulanmadiKisa")}
          </Rozet>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-kahve-600">
          {c("eposta.adresAciklama")}
        </p>
      </section>

      {!dogrulandi && (
        <section className="rounded-[2rem] border border-sari-500/30 bg-sari-500/8 p-6 md:p-8">
          <EpostaDogrulaKarti eposta={oturum.eposta} />
        </section>
      )}

      <section className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <EpostaDegistirFormu mevcutEposta={oturum.eposta} />
      </section>
    </div>
  );
}
