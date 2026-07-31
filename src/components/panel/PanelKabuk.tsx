import Link from "next/link";

import { cikisAction } from "@/app/hesap/actions";
import { AraIkon } from "@/components/ui/Ikonlar";
import type { Oturum } from "@/lib/oturum";

const ROL_ETIKETLERI: Record<Oturum["rol"], string> = {
  admin: "Yönetici",
  sef: "Şef paneli",
  kurye: "Kurye paneli",
  musteri: "Hesabım",
};

/** Panel sayfalarının ortak başlığı: kim giriş yapmış, çıkış, hızlı bağlantılar. */
export function PanelKabuk({
  oturum,
  baslik,
  aciklama,
  baglantilar,
  children,
}: {
  oturum: Oturum;
  baslik: string;
  aciklama?: string;
  baglantilar?: { href: string; etiket: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="kap py-12 md:py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-sari-700 uppercase">
            {ROL_ETIKETLERI[oturum.rol]}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-kahve-900 md:text-4xl">
            {baslik}
          </h1>
          {aciklama && <p className="mt-2 text-sm text-kahve-600">{aciklama}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {baglantilar?.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5
                text-sm font-bold text-kahve-800 transition-colors hover:border-sari-500/50"
            >
              {b.etiket}
            </Link>
          ))}
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

      {children}
    </div>
  );
}

/** Panellerde tekrar eden GET arama formu. */
export function AramaFormu({
  hedef,
  deger,
  yerTutucu = "Sipariş no, restoran, ürün…",
}: {
  hedef: string;
  deger?: string;
  yerTutucu?: string;
}) {
  return (
    <form method="get" action={hedef} className="flex gap-2">
      <label className="flex flex-1 items-center gap-2.5 rounded-2xl border border-kahve-900/10 bg-white px-4 py-2.5">
        <AraIkon className="size-4 shrink-0 text-kahve-400" />
        <span className="sr-only">Sipariş ara</span>
        <input
          name="q"
          defaultValue={deger ?? ""}
          placeholder={yerTutucu}
          className="w-full min-w-32 bg-transparent text-sm font-medium text-kahve-900
            placeholder:text-kahve-400 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="tiklanabilir rounded-2xl bg-kahve-900 px-4 py-2.5 text-sm font-bold text-sari-300
          transition-colors duration-300 hover:bg-kahve-800"
      >
        Ara
      </button>
    </form>
  );
}
