import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProfilFormu } from "@/components/hesap/ProfilFormu";
import { MutfakKareleri } from "@/components/panel/MutfakKareleri";
import { UrunYonetimi } from "@/components/panel/UrunYonetimi";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { Rozet } from "@/components/ui/Rozet";
import { SefRozetiIsareti } from "@/components/ui/SefRozetiIsareti";
import { mutfakUrunleri } from "@/lib/mutfak-menusu";
import { restoranCoz } from "@/lib/restoran-listesi";
import { sefRozetiAl } from "@/lib/sef-rozetleri-sunucu";
import { BASAMAKLAR } from "@/lib/sef-rozetleri";
import { hesapDepoAl } from "@/lib/hesaplar";
import { duzenleyebilirMi, oturumAl } from "@/lib/oturum";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("restoranSayfa.sefProfili"),
    robots: { index: false, follow: false },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SefProfilSayfasi({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const c = ceviri(await aktifDil());
  const { slug } = await params;
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");

  const restoran = await restoranCoz(slug);
  if (!restoran?.evSefi) notFound();

  const depo = await hesapDepoAl();
  const profil = await depo.profilAl(slug);
  const sahip = await depo.restoranSahibi(slug);
  const duzenleyebilir = duzenleyebilirMi(oturum, slug);
  const urunler = await mutfakUrunleri(slug);
  const rozet = await sefRozetiAl(slug);

  const satirlar = (metin?: string) =>
    (metin ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <div className="kap py-12 md:py-16">
      <Link href="/panel" className="tiklanabilir text-sm font-bold text-sari-700 underline">
        ← {c("sefProfil.panelDon")}
      </Link>

      <header className="mt-6 overflow-hidden rounded-[2rem] border border-kahve-900/8 bg-white shadow-kart">
        <AkilliGorsel
          anahtar={`sef/${slug}`}
          alt={restoran.ad}
          oran="16/9"
          sizes="100vw"
          className="w-full"
        />
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold text-kahve-900 md:text-3xl">
              {restoran.ad}
            </h1>
            <Rozet ton={duzenleyebilir ? "sari" : "kahve"}>
              {duzenleyebilir ? c("sefProfil.duzenleyebilirsin") : c("sefProfil.yalnizcaGoruntuleme")}
            </Rozet>
          </div>
          {profil?.slogan && (
            <p className="mt-2 text-base font-semibold text-kahve-700">{profil.slogan}</p>
          )}
          <p className="mt-2 text-sm text-kahve-500">
            {restoran.semt} / İstanbul
            {" · "}
            {sahip ? c("sefProfil.sefAdi", { ad: sahip.ad }) : c("sefProfil.sahiplenilmedi")}
          </p>

          {/*
            Rozet durumu — şefin ödülden HABERİ OLMASI için burada.
            Kazanamayan da bu kutuyu görüyor: yalnızca kazananlara gösterseydik
            sistemin varlığını ancak kazandığı gün öğrenirdi, ki o zaman
            teşvik olmaktan çıkardı.
          */}
          <div className="mt-4 rounded-2xl border border-sari-500/25 bg-sari-500/6 p-4">
            <p className="text-2xs font-extrabold tracking-wide text-sari-700 uppercase">
              {c("sefRozeti.senindurumun")}
            </p>
            {rozet ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <SefRozetiIsareti rozet={rozet} boyut="orta" className="ring-1 ring-sari-500/30" />
                <p className="text-sm font-semibold text-kahve-700">
                  {c(rozet.adet === 1 ? "sefRozeti.rozetinVarTek" : "sefRozeti.rozetinVar", {
                    rozet: c(BASAMAKLAR[rozet.basamak].adAnahtari),
                    sayi: rozet.adet,
                    sira: rozet.basamak,
                  })}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-kahve-600">
                {c("sefRozeti.rozetinYok")}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 md:p-8">
          <h2 className="font-display text-lg font-extrabold text-kahve-900">{c("sefProfil.ozgecmis")}</h2>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-kahve-700">
            {profil?.biyografi?.trim() ||
              restoran.sefBiyografisi ||
              c("sefProfil.ozgecmisYok")}
          </p>

          {profil?.uzmanlik && (
            <>
              <h3 className="mt-6 font-display text-base font-extrabold text-kahve-900">
                {c("profil.uzmanlik")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-kahve-700">{profil.uzmanlik}</p>
            </>
          )}
        </div>

        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-6 md:p-8">
          <h2 className="font-display text-lg font-extrabold text-kahve-900">{c("restoranSayfa.sertifikalar")}</h2>
          {satirlar(profil?.sertifikalar).length > 0 ? (
            <ul className="mt-3 space-y-2">
              {satirlar(profil?.sertifikalar).map((s) => (
                <li key={s} className="flex gap-2 text-sm leading-relaxed text-kahve-700">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-sari-500" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-kahve-500">{c("sefProfil.sertifikaYok")}</p>
          )}

        </div>
      </section>

      {duzenleyebilir && (
        <section className="mt-10 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
          <UrunYonetimi
            restoranSlug={slug}
            urunler={urunler}
            adminMi={oturum.rol === "admin"}
            sahipsizMi={!sahip}
          />
        </section>
      )}

      {duzenleyebilir && (
        <section className="mt-10 rounded-[2rem] border border-sari-500/30 bg-sari-500/6 p-6 md:p-8">
          <h2 className="font-display text-xl font-extrabold text-kahve-900">{c("sefProfil.profiliDuzenle")}</h2>
          <p className="mt-1 mb-6 text-sm text-kahve-600">
            {oturum.rol === "admin"
              ? c("sefProfil.yoneticiYetkisi")
              : c("sefProfil.kendiProfilin")}
          </p>
          <ProfilFormu
            profil={profil}
            restoranSlug={slug}
            adminMi={oturum.rol === "admin"}
          />

          {/*
            MUTFAKTAN KARELER buraya da konuyor: yönetici bir mutfağı bu
            sayfadan düzenliyor. Yalnızca şefin kendi panelinde olsaydı,
            telefondan fotoğraf yükleyemeyen bir ev hanımının kareleri
            yönetici tarafından hiç eklenemezdi (bkz. panel/galeri-actions —
            slug'ı yalnızca yönetici için formdan okuyor).
          */}
          <div className="mt-8 border-t border-kahve-900/8 pt-6">
            <MutfakKareleri
              kareler={profil?.galeri ?? []}
              restoranSlug={slug}
              adminMi={oturum.rol === "admin"}
            />
          </div>
        </section>
      )}
    </div>
  );
}
