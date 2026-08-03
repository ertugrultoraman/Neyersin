import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { tamamlandiMi } from "@/lib/siparis";

import { AramaFormu } from "@/components/panel/PanelKabuk";
import { SiparisListesi } from "@/components/panel/SiparisListesi";
import { depoAl, type KayitliSiparis } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";
import { paraFormatla } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siparişlerim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SekmeId = "verdigim" | "aldigim" | "teslimat";

/**
 * SİPARİŞLERİM — her hesap türü için tek ekran.
 *
 *  - Müşteri : tek liste, sekme yok. Yalnızca kendi verdiği siparişler.
 *  - Şef     : "Aldığım siparişler" (kendi mutfağına gelenler) ve "Verdiğim
 *              siparişler" (başka mutfaklardan kendi verdikleri) ayrı sekmede.
 *              Şef de bir müşteri olabilir; iki listeyi karıştırmak sipariş
 *              takibini imkânsız hâle getiriyordu.
 *  - Kurye   : "Teslimatlarım" ve kendi verdiği siparişler.
 *  - Yönetici: buraya gelmez, /admin'e döner.
 */
export default async function SiparislerimSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ sekme?: string; q?: string }>;
}) {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim/siparisler");
  if (oturum.rol === "admin") redirect("/admin");

  const { sekme, q } = await searchParams;
  const depo = await depoAl();

  const kendiRestorani =
    oturum.rol === "sef" && oturum.restoranSlug
      ? await restoranCoz(oturum.restoranSlug)
      : undefined;

  /** Herkesin ortak sekmesi: kendi verdiği siparişler. */
  const verdigim = await depo.listele({
    musteriEpostasi: oturum.eposta,
    arama: q,
    limit: 200,
  });

  let aldigim: KayitliSiparis[] = [];
  if (kendiRestorani) {
    aldigim = await depo.listele({ restoranSlug: kendiRestorani.slug, arama: q, limit: 200 });
  }

  let teslimat: KayitliSiparis[] = [];
  if (oturum.rol === "kurye") {
    teslimat = await depo.listele({ atananKurye: oturum.eposta, arama: q, limit: 200 });
  }

  const sekmeler: { id: SekmeId; etiket: string; adet: number }[] = [
    ...(kendiRestorani
      ? [{ id: "aldigim" as const, etiket: "Aldığım siparişler", adet: aldigim.length }]
      : []),
    ...(oturum.rol === "kurye"
      ? [{ id: "teslimat" as const, etiket: "Teslimatlarım", adet: teslimat.length }]
      : []),
    { id: "verdigim", etiket: "Verdiğim siparişler", adet: verdigim.length },
  ];

  const gecerli = sekmeler.some((s) => s.id === sekme) ? (sekme as SekmeId) : sekmeler[0].id;
  const tekSekme = sekmeler.length === 1;

  const liste = gecerli === "aldigim" ? aldigim : gecerli === "teslimat" ? teslimat : verdigim;

  /** Değerlendirilmiş siparişlerde yorum formu tekrar çıkmasın. */
  const yorumlananlar = new Set<string>();
  try {
    const hesapDepo = await hesapDepoAl();
    for (const y of await hesapDepo.yorumlariListele()) yorumlananlar.add(y.siparisNo);
  } catch {
    // depo susarsa form yine gösterilir; sunucu çift yorumu zaten engelliyor
  }

  const harcanan = verdigim
    .filter((s) => tamamlandiMi(s.durum))
    .reduce((t, s) => t + s.tutarlar.toplam, 0);

  const kazanilan = aldigim
    .filter((s) => tamamlandiMi(s.durum))
    .reduce((t, s) => t + s.tutarlar.toplam, 0);

  const bosMetinler: Record<SekmeId, string> = {
    verdigim: q ? "Aramanla eşleşen sipariş yok." : "Henüz sipariş vermedin.",
    aldigim: q ? "Aramanla eşleşen sipariş yok." : "Mutfağına henüz sipariş gelmedi.",
    teslimat: q ? "Aramanla eşleşen teslimat yok." : "Sana atanmış teslimat yok.",
  };

  return (
    <div>
      <header>
        <h2 className="font-display text-2xl font-extrabold text-kahve-900">Siparişlerim</h2>
        <p className="mt-1 text-sm text-kahve-600">
          {kendiRestorani
            ? `${aldigim.length} gelen · ${verdigim.length} verilen · ${paraFormatla(kazanilan)} ciro`
            : `${verdigim.length} sipariş · ${paraFormatla(harcanan)} ödenen`}
        </p>
      </header>

      {/* Sekmeler — yalnızca birden fazla liste varsa anlamlı */}
      {!tekSekme && (
        <div role="group" aria-label="Sipariş türü" className="mt-6 flex flex-wrap gap-2">
          {sekmeler.map((s) => {
            const secili = s.id === gecerli;
            const hedef = new URLSearchParams({ sekme: s.id });
            if (q) hedef.set("q", q);
            return (
              <Link
                key={s.id}
                href={`/hesabim/siparisler?${hedef.toString()}`}
                aria-current={secili ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold
                  transition-colors duration-300 ${
                    secili
                      ? "bg-sari-500 text-kahve-900 shadow-sari"
                      : "bg-kahve-900/5 text-kahve-600 hover:bg-kahve-900/10 hover:text-kahve-900"
                  }`}
              >
                {s.etiket}
                <span
                  className={`grid min-w-5 place-items-center rounded-full px-1.5 text-2xs font-extrabold ${
                    secili ? "bg-kahve-900/15 text-kahve-900" : "bg-kahve-900/8 text-kahve-500"
                  }`}
                >
                  {s.adet}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className={tekSekme ? "mt-6" : "mt-5"}>
        <div className="max-w-md">
          <AramaFormu
            hedef="/hesabim/siparisler"
            deger={q}
            yerTutucu={gecerli === "teslimat" ? "Sipariş no, mahalle, ad…" : "Sipariş no, restoran…"}
            /* Arama yapınca açık sekme korunsun. */
            korunanlar={tekSekme ? undefined : { sekme: gecerli }}
          />
        </div>
      </div>

      <SiparisListesi
        siparisler={liste}
        tur={gecerli}
        yorumlananlar={yorumlananlar}
        bosMetin={bosMetinler[gecerli]}
      />
    </div>
  );
}
