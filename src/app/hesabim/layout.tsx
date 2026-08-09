import Link from "next/link";
import { redirect } from "next/navigation";

import { cikisAction } from "@/app/hesap/actions";
import { HesapMenusu, type HesapBolumu } from "@/components/hesap/HesapMenusu";
import { oturumAl } from "@/lib/oturum";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROL_ETIKETLERI = {
  musteri: "hesabim.rolMusteri",
  sef: "hesabim.rolSef",
  isletme: "hesabim.rolIsletme",
  kurye: "hesabim.rolKurye",
  admin: "hesabim.rolAdmin",
} as const;

/**
 * HESABIM — her kullanıcının ortak hesap alanı.
 *
 * Rol fark etmiyor: müşteri, şef ve kurye aynı ekranı görüyor. Ayarlar
 * profillerin içine dağılmak yerine burada, sol menüde toplandı; her başlık
 * tıklanınca kendi sayfası açılıyor.
 *
 * Yönetici buraya girmez: onun hesabı veritabanında değil, ortam
 * değişkenlerinde tanımlı — parolası da e-postası da buradan değiştirilemez.
 */
export default async function HesabimDuzeni({ children }: { children: React.ReactNode }) {
  const c = ceviri(await aktifDil());
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim");
  if (oturum.rol === "admin") redirect("/admin");

  const bolumler: HesapBolumu[] = [
    { href: "/hesabim", etiket: c("menu.hesabim"), aciklama: c("hesabim.bilgilerinOzet") },
    {
      href: "/hesabim/siparisler",
      etiket: c("menu.siparislerim"),
      aciklama: c("hesabim.gecmisSiparisler"),
    },
    {
      href: "/hesabim/eposta",
      etiket: c("hesabim.epostaAyarlari"),
      aciklama: c("hesabim.adresDogrula"),
    },
    {
      href: "/hesabim/parola",
      etiket: c("hesabim.parolaDegistir"),
      aciklama: c("hesabim.yeniParolaBelirle"),
    },
  ];

  /** Şef, işletme ve kurye kendi çalışma paneline hızlıca dönebilsin. */
  const panelBaglantisi =
    oturum.rol === "musteri" ? null : oturum.rol === "isletme" ? "/isletme" : "/panel";

  return (
    <div className="kap py-10 md:py-14">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-sari-700 uppercase">
            {c(ROL_ETIKETLERI[oturum.rol])}
          </p>
          <h1 className="mt-1.5 text-3xl leading-tight font-extrabold sm:text-4xl">
            {c("panel.merhaba", { ad: oturum.ad })}
          </h1>
          <p className="mt-1.5 text-sm text-kahve-500">{oturum.eposta}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {panelBaglantisi && (
            <Link
              href={panelBaglantisi}
              className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
                font-bold whitespace-nowrap text-kahve-800 transition-colors
                hover:border-sari-500/50"
            >
              {c("hesabim.calismaPaneline")}
            </Link>
          )}
          <form action={cikisAction}>
            <button
              type="submit"
              className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5
                text-sm font-bold whitespace-nowrap text-kahve-800 transition-colors
                hover:border-domates/50 hover:text-domates-koyu"
            >
              {c("menu.cikisYap")}
            </button>
          </form>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <HesapMenusu bolumler={bolumler} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
