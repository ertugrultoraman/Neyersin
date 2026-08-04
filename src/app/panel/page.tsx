import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfilFormu } from "@/components/hesap/ProfilFormu";
import { PanelKabuk } from "@/components/panel/PanelKabuk";
import { SiparislerimKarti } from "@/components/panel/SiparislerimKarti";
import { TeslimatKarti } from "@/components/panel/TeslimatKarti";
import { UrunYonetimi } from "@/components/panel/UrunYonetimi";
import { AkilliGorsel } from "@/components/ui/AkilliGorsel";
import { Rozet } from "@/components/ui/Rozet";
import { mutfakUrunleri } from "@/lib/mutfak-menusu";
import { restoranCoz, tumSefProfilleri } from "@/lib/restoran-listesi";
import { depoAl } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { paraFormatla } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PanelSayfasi() {
  const c = ceviri(await aktifDil());
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris?donus=/panel");
  if (oturum.rol === "admin") redirect("/admin");
  if (oturum.rol === "musteri") redirect("/hesabim");

  const depo = await depoAl();

  if (oturum.rol === "kurye") {
    /**
     * Kurye YALNIZCA kendisine atanan siparişleri görür. Atanmamış bir sipariş
     * hiçbir kuryenin listesine düşmez — filtre depo katmanında (SQL) uygulanır.
     */
    const [teslimatlar, kendiSiparisleri] = await Promise.all([
      depo.listele({ atananKurye: oturum.eposta, limit: 200 }),
      // Kurye de sipariş verebilir; kendi siparişleri ayrı sekmede duruyor.
      depo.listele({ musteriEpostasi: oturum.eposta, limit: 200 }),
    ]);

    /*
     * Kartlarda yalnızca DEVAM EDEN işler var: iptal ve teslim edilmiş
     * siparişler listeyi şişirip kuryenin sırada ne olduğunu görmesini
     * zorlaştırıyordu.
     */
    const aktifTeslimatlar = teslimatlar.filter(
      (s) => s.durum === "odendi" || s.durum === "hazir" || s.durum === "yolda",
    );

    /*
     * Alım adresleri: her mutfağın profili tek tek çekiliyor ama YALNIZCA
     * listede geçen mutfaklar için, hepsi paralel.
     */
    const hesapDepo = await hesapDepoAl();
    const sluglar = [...new Set(aktifTeslimatlar.map((s) => s.restoranSlug))];
    const profiller = await Promise.all(
      sluglar.map(async (slug) => {
        const p = await hesapDepo.profilAl(slug).catch(() => null);
        return [slug, { adres: p?.alimAdresi, telefon: p?.alimTelefonu }] as const;
      }),
    );
    const alimBilgileri = new Map(profiller);

    return (
      <PanelKabuk
        oturum={oturum}
        baslik={`Merhaba, ${oturum.ad}`}
        aciklama={`${teslimatlar.length} teslimat sana atandı`}
        baglantilar={[{ href: "/hesabim", etiket: "Hesabım" }]}
      >
        <section className="mt-8">
          <SiparislerimKarti
            sayilar={[
              { etiket: "Teslimat", deger: teslimatlar.length },
              { etiket: "Verdiğim", deger: kendiSiparisleri.length },
            ]}
          />
        </section>

        {/*
          Teslimat listesi. Kurye burada mutfağın adresini görüp yola çıkıyor,
          aldıktan sonra "Teslim aldım" diyor. Alım adresi profillerden
          çözülüyor; müşteriye hiçbir yerde gösterilmiyor.
        */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-extrabold text-kahve-900">Teslimatların</h2>
          {aktifTeslimatlar.length === 0 ? (
            <p className="mt-4 rounded-3xl border border-kahve-900/8 bg-white p-8 text-center text-sm text-kahve-500">
              Şu an sana atanmış teslimat yok.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {aktifTeslimatlar.map((s) => {
                const profil = alimBilgileri.get(s.restoranSlug);
                const adres = [
                  s.adres.mahalle,
                  s.adres.acikAdres,
                  s.adres.binaNo && `No: ${s.adres.binaNo}`,
                  s.adres.daireNo && `Daire: ${s.adres.daireNo}`,
                  s.adres.ilce,
                ]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <TeslimatKarti
                    key={s.siparisNo}
                    siparisNo={s.siparisNo}
                    durum={s.durum}
                    restoranAdi={s.restoranAdi}
                    alimAdresi={profil?.adres}
                    alimTelefonu={profil?.telefon}
                    musteriAdi={s.musteri.adSoyad}
                    musteriTelefonu={s.musteri.telefon}
                    teslimatAdresi={adres}
                    tutar={paraFormatla(s.tutarlar.toplam)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </PanelKabuk>
    );
  }

  // --- Şef / ev hanımı
  /*
   * Sorgular art arda değil, BAĞIMLILIĞA GÖRE iki turda çalışıyor. Önceden
   * altısı da sırayla bekleniyordu; veritabanı uzak bölgede olduğu için her
   * bekleme ayrı bir gidiş-dönüş demekti ve panel gereksiz yere yavaştı.
   *
   * 1. tur: yalnızca oturuma bağlı olanlar — hemen başlayabilirler.
   * 2. tur: `kendiRestorani` sonucuna bağlı olanlar.
   */
  const [hesapDepo, kendiRestorani, kendiSiparisleri, digerProfilleriTumu] = await Promise.all([
    hesapDepoAl(),
    oturum.restoranSlug ? restoranCoz(oturum.restoranSlug) : Promise.resolve(undefined),
    // Şef de başka mutfaklardan sipariş verebilir; o liste ayrı sekmede duruyor.
    depo.listele({ musteriEpostasi: oturum.eposta, limit: 200 }),
    tumSefProfilleri(),
  ]);

  const [kendiProfili, siparisler, urunler] = await Promise.all([
    kendiRestorani ? hesapDepo.profilAl(kendiRestorani.slug) : Promise.resolve(null),
    kendiRestorani
      ? depo.listele({ restoranSlug: kendiRestorani.slug, limit: 200 })
      : Promise.resolve([]),
    // Şefin kendi eklediği ürünler — yayından kaldırdıkları da dahil.
    kendiRestorani ? mutfakUrunleri(kendiRestorani.slug) : Promise.resolve([]),
  ]);

  const digerProfiller = digerProfilleriTumu.filter((r) => r.slug !== oturum.restoranSlug);

  return (
    <PanelKabuk
      oturum={oturum}
      baslik={`Merhaba, ${oturum.ad}`}
      aciklama={kendiRestorani ? `${kendiRestorani.ad} · ${siparisler.length} sipariş` : undefined}
      baglantilar={[
        ...(kendiRestorani
          ? [{ href: `/restoran/${kendiRestorani.slug}`, etiket: c("panel.sayfamiGor") }]
          : []),
        { href: "/hesabim", etiket: "Hesabım" },
      ]}
    >
      {kendiRestorani ? (
        <>
          {/*
            Siparişler tıklanıp girilen kendi ekranında (bkz. /hesabim/siparisler):
            mutfağa GELEN ve şefin kendi VERDİĞİ siparişler orada ayrı sekmede.
            İkisi tek listede karışınca hangi siparişin kime ait olduğu
            anlaşılmıyordu.
          */}
          <section className="mt-10">
            <SiparislerimKarti
              sayilar={[
                { etiket: "Gelen", deger: siparisler.length },
                { etiket: "Verdiğim", deger: kendiSiparisleri.length },
              ]}
            />
          </section>

          <section className="mt-12 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
            <UrunYonetimi restoranSlug={kendiRestorani.slug} urunler={urunler} />
          </section>

          <section className="mt-12 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
            <h2 className="font-display text-xl font-extrabold text-kahve-900">
              {kendiRestorani.ad} — profilim
            </h2>
            <p className="mt-1 mb-6 text-sm text-kahve-600">
              Buradaki bilgiler restoran sayfanda müşterilere görünür.
            </p>
            <ProfilFormu profil={kendiProfili} restoranSlug={kendiRestorani.slug} />
          </section>
        </>
      ) : (
        <section className="mt-10 rounded-[2rem] border border-kahve-900/8 bg-white p-6 md:p-8">
          <p className="text-sm leading-relaxed text-kahve-600">
            Hesabına bağlı bir profil bulunamadı. Yöneticiyle iletişime geç.
          </p>
        </section>
      )}


      <section className="mt-12">
        <h2 className="font-display text-xl font-extrabold text-kahve-900">Diğer profiller</h2>
        <p className="mt-1 text-sm text-kahve-600">
          Diğer şef ve ev hanımlarının profillerini yalnızca görüntüleyebilirsin.
        </p>

        {digerProfiller.length === 0 ? (
          <p className="mt-6 text-sm text-kahve-500">Henüz başka profil yok.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {digerProfiller.map((r) => (
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
                      <Rozet ton="kahve">
                        {r.sefTuru === "sef" ? c("panel.sef") : c("panel.evHanimi")}
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
    </PanelKabuk>
  );
}
