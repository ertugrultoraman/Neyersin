import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { tamamlandiMi } from "@/lib/siparis";

import { AramaFormu } from "@/components/panel/PanelKabuk";
import { SiparisListesi } from "@/components/panel/SiparisListesi";
import { depoAl, type KayitliSiparis } from "@/lib/depo";
import { filtreUygula } from "@/lib/depo/tipler";
import { hesapDepoAl } from "@/lib/hesaplar";
import { kuryeHakedisi } from "@/lib/kurye-tarife";
import { mutfakSahibiMi, oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";
import { sefinSiparisleri } from "@/lib/sef-siparisleri";
import { paraFormatla } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Sayımların baktığı en fazla sipariş.
 *
 * Listede gösterilenden yüksek: ekrandaki "toplam hakediş" gerçekten toplam
 * olmalı, son 200 siparişin toplamı değil.
 */
const SAYIM_SINIRI = 500;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("menu.siparislerim"),
    robots: { index: false, follow: false },
  };
}

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
  const c = ceviri(await aktifDil());
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/hesabim/siparisler");
  if (oturum.rol === "admin") redirect("/admin");

  const { sekme, q } = await searchParams;
  const depo = await depoAl();

  /* İşletme de kendi mutfağına GELEN siparişleri görmeli — mutfak işi. */
  const kendiRestorani =
    mutfakSahibiMi(oturum.rol) && oturum.restoranSlug
      ? await restoranCoz(oturum.restoranSlug)
      : undefined;

  /*
   * ÜÇ LİSTE DE ARAMASIZ ÇEKİLİYOR, süzgeç bellekte uygulanıyor.
   *
   * Sekme rozetlerindeki sayılar ve özetteki "toplam" rakamlar arama kutusuna
   * bir şey yazılınca DEĞİŞMEMELİ: kurye "toplam hakediş" diye okuduğu tutarın
   * aslında yazdığı aramaya ait olduğunu anlamadan yanlış bir rakam görürdü.
   * Ayrıca aynı liste iki kez sorgulanmamış oluyor.
   */
  const [verdigimTumu, aldigimTumu, teslimatTumu] = await Promise.all([
    /** Herkesin ortak sekmesi: kendi verdiği siparişler. */
    depo.listele({ musteriEpostasi: oturum.eposta, limit: SAYIM_SINIRI }),
    /*
     * KENDİ MUTFAĞI + KİŞİSEL ATAMALAR. Yalnızca `restoranSlug` ile
     * listelenseydi yöneticinin elle yaptığı şef ataması burada görünmezdi:
     * başka bir mutfağın siparişi bir şefe atandığında şef panelinde
     * görüyor ama sipariş geçmişinde bulamıyordu.
     */
    mutfakSahibiMi(oturum.rol)
      ? sefinSiparisleri(depo, kendiRestorani?.slug, oturum.eposta, SAYIM_SINIRI)
      : Promise.resolve<KayitliSiparis[]>([]),
    oturum.rol === "kurye"
      ? depo.listele({ atananKurye: oturum.eposta, limit: SAYIM_SINIRI })
      : Promise.resolve<KayitliSiparis[]>([]),
  ]);

  const suz = (liste: KayitliSiparis[]) => (q ? filtreUygula(liste, { arama: q }) : liste);
  const verdigim = suz(verdigimTumu);
  const aldigim = suz(aldigimTumu);
  const teslimat = suz(teslimatTumu);

  /*
   * "Aldığım siparişler" sekmesi MUTFAĞI OLMAYAN şefte de çıkıyor: kendisine
   * kişisel olarak atanmış bir sipariş varsa gidecek yeri olmalı.
   */
  const aldigimVar = Boolean(kendiRestorani) || aldigimTumu.length > 0;

  const sekmeler: { id: SekmeId; etiket: string; adet: number }[] = [
    ...(aldigimVar
      ? [{ id: "aldigim" as const, etiket: c("siparis.aldigimSiparisler"), adet: aldigim.length }]
      : []),
    ...(oturum.rol === "kurye"
      ? [{ id: "teslimat" as const, etiket: c("siparis.teslimatlarim"), adet: teslimat.length }]
      : []),
    { id: "verdigim", etiket: c("siparis.verdigimSiparisler"), adet: verdigim.length },
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

  /* Toplamlar SÜZÜLMEMİŞ listelerden: bkz. yukarıdaki `SAYIM_SINIRI` notu. */
  const harcanan = verdigimTumu
    .filter((s) => tamamlandiMi(s.durum))
    .reduce((t, s) => t + s.tutarlar.toplam, 0);

  const kazanilan = aldigimTumu
    .filter((s) => tamamlandiMi(s.durum))
    .reduce((t, s) => t + s.tutarlar.toplam, 0);

  /*
   * KURYENİN TOPLAMLARI.
   *
   * Hakediş yalnızca TESLİM EDİLEN işlerden sayılıyor; yoldaki bir sipariş
   * henüz kazanılmış para değil ve "kazandım" diye gösterip sonra iptalde geri
   * almak, kuryenin hesabına güvenini bir kerede bitirirdi. Tutar tarifenin
   * kendisinden (lib/kurye-tarife) geliyor — uygulamadaki özet ekranıyla aynı
   * kaynak, yani iki ekran farklı rakam gösteremiyor.
   */
  const tamamlananTeslimat = teslimatTumu.filter((s) => s.durum === "teslim-edildi");
  const kuryeHakedisiToplam = tamamlananTeslimat.reduce(
    (t, s) => t + kuryeHakedisi(s.tutarlar),
    0,
  );
  const kuryeCirosu = tamamlananTeslimat.reduce((t, s) => t + s.tutarlar.toplam, 0);

  const bosMetinler: Record<SekmeId, string> = {
    verdigim: q ? c("siparis.aramaBos") : c("siparis.vermedin"),
    aldigim: q ? c("siparis.aramaBos") : c("siparis.mutfagaGelmedi"),
    teslimat: q ? c("siparis.teslimatAramaBos") : c("siparis.teslimatAtanmadi"),
  };

  return (
    <div>
      <header>
        <h2 className="font-display text-2xl font-extrabold text-kahve-900">{c("menu.siparislerim")}</h2>
        <p className="mt-1 text-sm text-kahve-600">
          {oturum.rol === "kurye"
            ? c("siparis.ozetKurye", {
                teslimat: tamamlananTeslimat.length,
                hakedis: paraFormatla(kuryeHakedisiToplam),
              })
            : aldigimVar
              ? c("siparis.ozetSef", {
                  gelen: aldigimTumu.length,
                  verilen: verdigimTumu.length,
                  ciro: paraFormatla(kazanilan),
                })
              : c("siparis.ozetMusteri", {
                  sayi: verdigimTumu.length,
                  tutar: paraFormatla(harcanan),
                })}
        </p>
      </header>

      {/*
        KURYENİN TOPLAM TABLOSU.
        Tek satırlık özette üç rakam birden okunmuyordu; kurye "bugüne kadar
        kaç iş yaptım, ne kazandım" sorusuyla bu ekrana geliyor ve cevabı
        listeyi taramadan görmeli. Taşınan ciro ile kendi hakedişi AYRI
        yazıyor: biri şirkete ait tutar, öteki kuryenin parası — tek rakamda
        birleştirmek ay sonunda beklenti farkı yaratırdı.
      */}
      {oturum.rol === "kurye" && (
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <ToplamKutusu
            etiket={c("siparis.kuryeToplamTeslimat")}
            deger={String(tamamlananTeslimat.length)}
            alt={c("siparis.kuryeAtanan", { sayi: teslimatTumu.length })}
          />
          <ToplamKutusu
            etiket={c("siparis.kuryeToplamCiro")}
            deger={paraFormatla(kuryeCirosu)}
            alt={c("siparis.kuryeCiroAlt")}
          />
          <ToplamKutusu
            etiket={c("siparis.kuryeToplamHakedis")}
            deger={paraFormatla(kuryeHakedisiToplam)}
            alt={c("siparis.kuryeHakedisAlt")}
            vurgu
          />
        </dl>
      )}

      {/* Sekmeler — yalnızca birden fazla liste varsa anlamlı */}
      {!tekSekme && (
        <div role="group" aria-label={c("siparis.turu")} className="mt-6 flex flex-wrap gap-2">
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
            yerTutucu={
              gecerli === "teslimat" ? c("siparis.aramaTeslimatYer") : c("siparis.aramaYer")
            }
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

/** Kurye toplamlarının tek kutusu — rakam büyük, açıklaması altında küçük. */
function ToplamKutusu({
  etiket,
  deger,
  alt,
  vurgu = false,
}: {
  etiket: string;
  deger: string;
  alt: string;
  vurgu?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        vurgu ? "border-sari-500/40 bg-sari-500/8" : "border-kahve-900/8 bg-white"
      }`}
    >
      <dt className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">{etiket}</dt>
      <dd className="mt-1 font-display text-2xl font-extrabold text-kahve-900">{deger}</dd>
      <p className="mt-0.5 text-xs text-kahve-500">{alt}</p>
    </div>
  );
}
