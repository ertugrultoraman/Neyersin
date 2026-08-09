import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AltinSefBasvuruFormu } from "@/components/panel/AltinSefBasvuruFormu";
import { hesapDepoAl, sefProfiliCoz } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";
import { KASIK_GORSELI } from "@/lib/sef-kasigi";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("altinSef.baslik"),
    robots: { index: false, follow: false },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ALTIN ŞEF BAŞVURUSU — şefin kendi panelinden.
 *
 * Unvanı yönetici veriyor; buradan yalnızca TALEP açılıyor. Şef belgelerini
 * (diploma, ustalık belgesi, çalıştığı mutfaklar) yükleyip kısa bir not
 * bırakıyor, talep destek listesine düşüyor ve yönetici belgelere bakıp
 * unvanı veriyor.
 *
 * Sayfa yalnızca MUTFAĞI OLAN şeflere açık: unvan mutfağa bağlı, kaşık
 * kayıtları da mutfaktan mutfağa tutuluyor.
 */
export default async function AltinSefBasvuruSayfasi() {
  const c = ceviri(await aktifDil());
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");
  if (oturum.rol !== "sef" || !oturum.restoranSlug) redirect("/panel");

  const [restoran, profil, bekleyen] = await Promise.all([
    restoranCoz(oturum.restoranSlug),
    sefProfiliCoz(oturum.restoranSlug),
    // Aynı şefin açık bir talebi varsa ikincisini açtırmıyoruz.
    (async () => {
      try {
        const talepler = await (await hesapDepoAl()).destekListele("acik");
        return talepler.some(
          (t) => t.eposta === oturum.eposta && t.konu.startsWith("Altın Şef"),
        );
      } catch {
        return false;
      }
    })(),
  ]);

  return (
    <div className="kap py-12 md:py-16">
      <Link href="/panel" className="tiklanabilir text-sm font-bold text-sari-700 underline">
        ← {c("sefProfil.panelDon")}
      </Link>

      <header className="mt-6 flex flex-wrap items-start gap-5 rounded-[2rem] border border-sari-500/30 bg-sari-500/6 p-6 md:p-8">
        <Image
          src={KASIK_GORSELI}
          alt=""
          width={320}
          height={323}
          aria-hidden="true"
          className="size-16 shrink-0 object-contain drop-shadow-sm sm:size-20"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900 md:text-3xl">
            {c("altinSef.baslik")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-700">{c("altinSef.aciklama")}</p>
          {restoran && (
            <p className="mt-2 text-xs font-semibold text-kahve-500">
              {c("altinSef.mutfagin", { ad: restoran.ad })}
            </p>
          )}
        </div>
      </header>

      {profil.altinSef ? (
        <p className="mt-8 rounded-[2rem] border border-nane/25 bg-nane/8 p-6 text-sm leading-relaxed font-semibold text-nane-koyu md:p-8">
          {c("altinSef.zatenVar")}
        </p>
      ) : bekleyen ? (
        <p className="mt-8 rounded-[2rem] border border-sari-500/30 bg-white p-6 text-sm leading-relaxed text-kahve-700 md:p-8">
          {c("altinSef.bekliyor")}
        </p>
      ) : (
        <section className="mt-8 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
          <AltinSefBasvuruFormu />
        </section>
      )}
    </div>
  );
}
