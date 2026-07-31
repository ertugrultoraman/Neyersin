import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfilFormu } from "@/components/hesap/ProfilFormu";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { Rozet } from "@/components/ui/Rozet";
import { restoranBul, restoranlar } from "@/content/restoranlar";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { cikisAction } from "../hesap/actions";

export const metadata: Metadata = {
  title: "Şef Paneli",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PanelSayfasi() {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");

  const depo = await hesapDepoAl();
  const kendiRestorani = oturum.restoranSlug ? restoranBul(oturum.restoranSlug) : undefined;
  const kendiProfili = kendiRestorani ? await depo.profilAl(kendiRestorani.slug) : null;

  const digerSefler = restoranlar.filter(
    (r) => r.evSefi && r.slug !== oturum.restoranSlug,
  );

  return (
    <div className="kap py-12 md:py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-sari-700 uppercase">
            {oturum.rol === "admin" ? "Yönetici" : "Şef paneli"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-kahve-900 md:text-4xl">
            Merhaba, {oturum.ad}
          </h1>
          <p className="mt-2 text-sm text-kahve-600">{oturum.eposta}</p>
        </div>

        <div className="flex items-center gap-3">
          {oturum.rol === "admin" && (
            <Link
              href="/admin"
              className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5
                text-sm font-bold text-kahve-800 transition-colors hover:border-sari-500/50"
            >
              Sipariş paneli
            </Link>
          )}
          <form action={cikisAction}>
            <button
              type="submit"
              className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5
                text-sm font-bold text-kahve-800 transition-colors hover:border-domates/50
                hover:text-domates-koyu"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      </header>

      {kendiRestorani ? (
        <section className="mt-10 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold text-kahve-900">
                {kendiRestorani.ad} — profilim
              </h2>
              <p className="mt-1 text-sm text-kahve-600">
                Buradaki bilgiler restoran sayfanda müşterilere görünür.
              </p>
            </div>
            <Link
              href={`/restoran/${kendiRestorani.slug}`}
              className="tiklanabilir text-sm font-bold text-sari-700 underline"
            >
              Sayfamı gör
            </Link>
          </div>

          <div className="mt-6">
            <ProfilFormu profil={kendiProfili} restoranSlug={kendiRestorani.slug} />
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-[2rem] border border-kahve-900/8 bg-white p-6 md:p-8">
          <p className="text-sm leading-relaxed text-kahve-600">
            {oturum.rol === "admin"
              ? "Yönetici hesabına bağlı bir şef profili yok. Aşağıdan istediğin şefin profilini açıp düzenleyebilirsin."
              : "Hesabına bağlı bir şef profili bulunamadı."}
          </p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-display text-xl font-extrabold text-kahve-900">
          {oturum.rol === "admin" ? "Tüm şefler" : "Diğer şefler"}
        </h2>
        <p className="mt-1 text-sm text-kahve-600">
          {oturum.rol === "admin"
            ? "Yönetici olarak her profili düzenleyebilirsin."
            : "Diğer şeflerin profillerini yalnızca görüntüleyebilirsin."}
        </p>

        {digerSefler.length === 0 ? (
          <p className="mt-6 text-sm text-kahve-500">Henüz başka şef yok.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {digerSefler.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/panel/${r.slug}`}
                  className="tiklanabilir group block overflow-hidden rounded-3xl border
                    border-kahve-900/8 bg-white kart-kalk"
                >
                  <AkilliGorsel
                    anahtar={`sef/${r.slug}`}
                    alt={r.ad}
                    oran="4/3"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="w-full"
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-extrabold text-kahve-900">
                        {r.ad}
                      </h3>
                      <Rozet ton={oturum.rol === "admin" ? "sari" : "kahve"}>
                        {oturum.rol === "admin" ? "Düzenle" : "Görüntüle"}
                      </Rozet>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-kahve-500">
                      {r.semt} / İstanbul
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
