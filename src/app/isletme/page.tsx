import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfilFormu } from "@/components/hesap/ProfilFormu";
import { PanelKabuk } from "@/components/panel/PanelKabuk";
import { CalismaSaatleri } from "@/components/isletme/CalismaSaatleri";
import { CiroRaporu } from "@/components/isletme/CiroRaporu";
import { raporCikar } from "@/lib/isletme-rapor";
import { SiparisTahtasi } from "@/components/isletme/SiparisTahtasi";
import { VARSAYILAN_PROGRAM, acikMi } from "@/lib/calisma-saatleri";
import { saatleriAl } from "@/lib/calisma-saatleri-depo";
import { UrunYonetimi } from "@/components/panel/UrunYonetimi";
import { mutfakUrunleri } from "@/lib/mutfak-menusu";
import { restoranCoz } from "@/lib/restoran-listesi";
import { depoAl } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { paraFormatla } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("panel.rolIsletme"),
    robots: { index: false, follow: false },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * İŞLETME PANELİ — restoran, pastane, kasap gibi kayıtlı işletmeler için.
 *
 * Şef panelinden neden ayrı: işletme günde onlarca sipariş alıyor ve kart
 * listesi o hacimde kullanılamaz hâle geliyor. Buradaki ana ekran bir SİPARİŞ
 * TAHTASI — mutfak ekranı gibi, sipariş hangi aşamadaysa o sütunda.
 *
 * Bireysel takdirler (Altın Şef, Şef Kaşığı) burada YOK: onlar kişiye veriliyor,
 * kuruma değil (bkz. lib/oturum.ts `mutfakSahibiMi`).
 */
export default async function IsletmePaneli() {
  const c = ceviri(await aktifDil());
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/isletme");
  if (oturum.rol === "admin") redirect("/admin");
  /* Şef ve kurye kendi paneline; işletme paneli yalnızca işletmeye açık. */
  if (oturum.rol !== "isletme") redirect("/panel");
  if (!oturum.restoranSlug) {
    return (
      <PanelKabuk oturum={oturum} baslik={c("panel.merhaba", { ad: oturum.ad })}>
        <section className="mt-10 rounded-[2rem] border border-kahve-900/8 bg-white p-6 md:p-8">
          <p className="text-sm leading-relaxed text-kahve-600">{c("panel.profilBulunamadi")}</p>
        </section>
      </PanelKabuk>
    );
  }

  const [hesapDepo, restoran, depo] = await Promise.all([
    hesapDepoAl(),
    restoranCoz(oturum.restoranSlug),
    depoAl(),
  ]);

  const [profil, siparisler, urunler, saatler] = await Promise.all([
    hesapDepo.profilAl(oturum.restoranSlug).catch(() => null),
    depo.listele({ restoranSlug: oturum.restoranSlug, limit: 200 }),
    mutfakUrunleri(oturum.restoranSlug),
    saatleriAl(oturum.restoranSlug),
  ]);

  /*
   * Başlıktaki ciro, raporun "son 30 gün" kutusuyla AYNI kaynaktan geliyor.
   * Önce `tamamlandiMi` kullanılıyordu ama o "odendi"yi de sayıyor — yani
   * parası alınmış ama hâlâ mutfakta duran siparişleri. İki sayı yan yana
   * durup tutmayınca hangisinin doğru olduğu anlaşılmazdı.
   */
  const rapor = raporCikar(siparisler);

  return (
    <PanelKabuk
      oturum={oturum}
      baslik={restoran?.ad ?? oturum.ad}
      aciklama={c("isletme.ozet", {
        sayi: siparisler.length,
        ciro: paraFormatla(rapor.sonOtuzGun.ciro),
      })}
      baglantilar={[
        ...(restoran ? [{ href: `/restoran/${restoran.slug}`, etiket: c("panel.sayfamiGor") }] : []),
        { href: "/hesabim", etiket: c("menu.hesabim") },
      ]}
    >
      {/* Alım adresi eksikse kurye siparişi alamıyor — şef panelindeki uyarının aynısı. */}
      {!profil?.alimAdresi?.trim() && (
        <section className="mt-8 rounded-[2rem] border border-domates/30 bg-domates/8 p-6 md:p-8">
          <h2 className="font-display text-lg font-extrabold text-domates-koyu">
            {c("panel.alimAdresiEksik")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-kahve-700">
            {c("panel.alimAdresiEksikAciklama")}
          </p>
          <a
            href="#alim-adresi"
            className="tiklanabilir mt-4 inline-flex items-center gap-1.5 rounded-xl
              bg-domates px-4 py-2.5 text-sm font-bold text-white transition-colors
              hover:bg-domates-koyu"
          >
            {c("panel.adresiGir")}
          </a>
        </section>
      )}

      <section className="mt-10 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <CalismaSaatleri
          program={saatler?.program ?? VARSAYILAN_PROGRAM}
          durum={acikMi(saatler)}
        />
      </section>

      <section className="mt-10">
        <SiparisTahtasi siparisler={siparisler} />
      </section>

      <section className="mt-12 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <CiroRaporu rapor={rapor} />
      </section>

      <section className="mt-12 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <UrunYonetimi restoranSlug={oturum.restoranSlug} urunler={urunler} />
      </section>

      <section className="mt-12 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <h2 className="font-display text-xl font-extrabold text-kahve-900">
          {c("panel.profilimBaslik", { ad: restoran?.ad ?? oturum.ad })}
        </h2>
        <p className="mt-1 mb-6 text-sm text-kahve-600">{c("panel.profilimAciklama")}</p>
        <ProfilFormu profil={profil} restoranSlug={oturum.restoranSlug} />
      </section>
    </PanelKabuk>
  );
}
