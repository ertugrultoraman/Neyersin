import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { tamamlandiMi } from "@/lib/siparis";

import { EpostaDogrulaKarti } from "@/components/hesap/EpostaDogrulaKarti";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { Rozet } from "@/components/ui/Rozet";
import { depoAl } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";
import { paraFormatla, tarihFormatla } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("menu.hesabim"),
    robots: { index: false, follow: false },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hesap özeti — kim olduğun, neyin var, nereye gidebilirsin. */
export default async function HesabimSayfasi() {
  const dil = await aktifDil();
  const c = ceviri(dil);
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim");

  const depo = await depoAl();
  const verdigim = await depo.listele({ musteriEpostasi: oturum.eposta, limit: 200 });

  const kendiRestorani =
    oturum.rol === "sef" && oturum.restoranSlug
      ? await restoranCoz(oturum.restoranSlug)
      : undefined;

  const aldigim = kendiRestorani
    ? await depo.listele({ restoranSlug: kendiRestorani.slug, limit: 200 })
    : [];

  const teslimat =
    oturum.rol === "kurye" ? await depo.listele({ atananKurye: oturum.eposta, limit: 200 }) : [];

  let dogrulandi = true;
  let uyelikTarihi: string | undefined;
  let telefon: string | undefined;
  try {
    const hesap = await (await hesapDepoAl()).hesapBul(oturum.eposta);
    dogrulandi = hesap?.epostaDogrulandi !== false;
    uyelikTarihi = hesap?.olusturmaTarihi;
    telefon = hesap?.telefon;
  } catch {
    // depo susarsa özet alanları boş kalır, sayfa yine açılır
  }

  const harcanan = verdigim
    .filter((s) => tamamlandiMi(s.durum))
    .reduce((t, s) => t + s.tutarlar.toplam, 0);

  const bilgiler = [
    { etiket: c("hesap.adSoyad"), deger: oturum.ad },
    { etiket: c("hesap.eposta"), deger: oturum.eposta },
    { etiket: c("hesap.telefon"), deger: telefon ?? "—" },
    { etiket: c("hesabim.uyelik"), deger: uyelikTarihi ? tarihFormatla(uyelikTarihi, dil) : "—" },
  ];

  const sayilar = [
    { etiket: c("hesabim.verdigimSiparis"), deger: String(verdigim.length) },
    { etiket: c("hesabim.odenen"), deger: paraFormatla(harcanan) },
    ...(kendiRestorani ? [{ etiket: c("hesabim.mutfagimaGelen"), deger: String(aldigim.length) }] : []),
    ...(oturum.rol === "kurye" ? [{ etiket: c("hesabim.teslimatim"), deger: String(teslimat.length) }] : []),
  ];

  const kisayolStili =
    "tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm font-bold " +
    "whitespace-nowrap text-kahve-800 transition-colors hover:border-sari-500/50";

  return (
    <div className="space-y-6">
      {!dogrulandi && (
        <section className="rounded-[2rem] border border-sari-500/30 bg-sari-500/8 p-6 md:p-8">
          <EpostaDogrulaKarti eposta={oturum.eposta} />
        </section>
      )}

      <section className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold text-kahve-900">{c("hesabim.bilgilerim")}</h2>
          <Rozet ton={dogrulandi ? "nane" : "domates"}>
            {dogrulandi ? c("hesabim.epostaDogrulandi") : c("hesabim.epostaDogrulanmadi")}
          </Rozet>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {bilgiler.map((b) => (
            <div key={b.etiket} className="min-w-0">
              <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                {b.etiket}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-kahve-900">{b.deger}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/hesabim/eposta" className={kisayolStili}>
            {c("hesabim.epostamiDegistir")}
          </Link>
          <Link href="/hesabim/parola" className={kisayolStili}>
            {c("hesabim.parolamiDegistir")}
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <h2 className="font-display text-xl font-extrabold text-kahve-900">{c("hesabim.ozet")}</h2>
        <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {sayilar.map((s) => (
            <div key={s.etiket} className="rounded-2xl bg-kahve-900/4 px-4 py-3.5">
              <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                {s.etiket}
              </dt>
              <dd className="mt-1 font-display text-xl font-extrabold text-kahve-900">{s.deger}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButonBaglanti href="/hesabim/siparisler" boyut="md">
            {c("hesabim.siparislerimeGit")}
            <OkIkon />
          </ButonBaglanti>
          <ButonBaglanti href="/restoranlar" tur="hayalet" boyut="md">
            {c("hesabim.yeniSiparis")}
          </ButonBaglanti>
        </div>
      </section>
    </div>
  );
}
