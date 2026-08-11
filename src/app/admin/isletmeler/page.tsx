import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { OkIkon } from "@/components/ui/Buton";
import { DukkanIkon } from "@/components/ui/Ikonlar";
import { depoAl, depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { raporCikar, type IsletmeRaporu } from "@/lib/isletme-rapor";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";
import { paraFormatla } from "@/lib/utils";

export const metadata: Metadata = {
  title: "İşletmeler — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * İŞLETMELER — yöneticinin işletme tarafına baktığı ekran.
 *
 * NEDEN AYRI SEKME: "Siparişler" bütün siparişleri tek düz tabloda veriyor,
 * "Hesaplar" ise kimin hangi rolde olduğunu. İkisinin arasında kalan soru —
 * "hangi işletme ne kadar satıyor, kimde bekleyen sipariş var" — hiçbir
 * ekranda cevaplanmıyordu; yönetici ancak o hesaba bürünüp /isletme'yi açarak
 * görebiliyordu. Bürünme kişisel bir yetki devri; sadece ciroya bakmak için
 * kullanılmamalı (bkz. lib/oturum.ts `vekaleteGir`).
 *
 * SAYILAR İŞLETMENİNKİYLE AYNI KAYNAKTAN: her satır `raporCikar` ile
 * hesaplanıyor ve sipariş listesi /isletme ile AYNI filtreyle (aynı slug,
 * aynı limit) çekiliyor. Yönetici ile işletme aynı ciroyu okumazsa hangisinin
 * doğru olduğu tartışılır hâle gelirdi.
 */
type Satir = {
  slug: string;
  ad: string;
  sahip?: string;
  calisanSayisi: number;
  rapor: IsletmeRaporu;
};

export default async function AdminIsletmelerSayfasi() {
  const oturum = await oturumAl();
  // Şef oturumu yönetici paneline giremez — rol açıkça kontrol edilir.
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const [hesapDepo, depo] = await Promise.all([hesapDepoAl(), depoAl()]);
  const hesaplar = await hesapDepo.hesaplariListele("isletme");

  /*
   * Ekranın birimi HESAP değil MUTFAK: bir işletmenin kasa ve mutfak
   * çalışanları da ayrı birer işletme hesabı (bkz. isletme/calisan-actions.ts).
   * Hesap başına satır çıkarsaydık aynı dükkân listede üç kez görünür ve cirosu
   * üç kere sayılmış gibi okunurdu.
   */
  const sahipler = new Map<string, string>();
  const calisanSayilari = new Map<string, number>();
  for (const h of hesaplar) {
    if (!h.restoranSlug) continue;
    if (h.isletmeYetkisi === "calisan") {
      calisanSayilari.set(h.restoranSlug, (calisanSayilari.get(h.restoranSlug) ?? 0) + 1);
    } else if (!sahipler.has(h.restoranSlug)) {
      sahipler.set(h.restoranSlug, h.eposta);
    }
  }

  /* Sahibi silinmiş ama çalışanı duran mutfak da listede kalsın — gözden kaçmasın. */
  const sluglar = [...new Set([...sahipler.keys(), ...calisanSayilari.keys()])];

  const satirlar: Satir[] = await Promise.all(
    sluglar.map(async (slug) => {
      const [restoran, siparisler] = await Promise.all([
        restoranCoz(slug),
        depo.listele({ restoranSlug: slug, limit: 200 }),
      ]);
      return {
        slug,
        ad: restoran?.ad ?? slug,
        sahip: sahipler.get(slug),
        calisanSayisi: calisanSayilari.get(slug) ?? 0,
        rapor: raporCikar(siparisler),
      };
    }),
  );

  /*
   * Sıra: önce BEKLEYEN İŞİ olan. Ciroya göre sıralasaydık en çok satan dükkân
   * hep başta durur, o an mutfakta bekleyen sipariş listenin dibinde kalırdı —
   * yöneticinin bu ekranda aradığı ilk şey o.
   */
  satirlar.sort(
    (a, b) =>
      b.rapor.yoldakiSiparis - a.rapor.yoldakiSiparis ||
      b.rapor.sonOtuzGun.ciro - a.rapor.sonOtuzGun.ciro ||
      a.ad.localeCompare(b.ad, "tr"),
  );

  /* Mutfağı bağlanmamış işletme hesabı: paneli açıyor ama bomboş görüyor. */
  const bagsizlar = hesaplar.filter((h) => !h.restoranSlug);

  const toplamAcik = satirlar.reduce((t, s) => t + s.rapor.yoldakiSiparis, 0);
  const toplamCiro = satirlar.reduce((t, s) => t + s.rapor.sonOtuzGun.ciro, 0);

  const kartlar = [
    { etiket: "İşletme", deger: String(satirlar.length) },
    { etiket: "Bekleyen sipariş", deger: String(toplamAcik), dikkat: toplamAcik > 0 },
    { etiket: "30 günlük ciro", deger: paraFormatla(toplamCiro) },
    {
      etiket: "Mutfağı bağlanmamış",
      deger: String(bagsizlar.length),
      dikkat: bagsizlar.length > 0,
    },
  ];

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="İşletmeler"
      aciklama={`${satirlar.length} mutfak · sipariş tahtası ve ciro raporu`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kartlar.map((k) => (
          <div
            key={k.etiket}
            className={`rounded-3xl border p-5 shadow-yumusak ${
              k.dikkat ? "border-domates/30 bg-domates/8" : "border-kahve-900/8 bg-white"
            }`}
          >
            <dt
              className={`text-2xs font-bold tracking-wide uppercase ${
                k.dikkat ? "text-domates-koyu" : "text-kahve-400"
              }`}
            >
              {k.etiket}
            </dt>
            <dd
              className={`mt-1.5 font-display text-2xl font-extrabold md:text-3xl ${
                k.dikkat ? "text-domates-koyu" : "text-kahve-900"
              }`}
            >
              {k.deger}
            </dd>
          </div>
        ))}
      </dl>

      {satirlar.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-sari-500/16 text-sari-700">
            <DukkanIkon className="size-7" />
          </span>
          <p className="mt-5 font-display text-lg font-extrabold text-kahve-900">
            Mutfağa bağlı işletme yok
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-kahve-500">
            İşletme hesabı açıldıktan sonra Hesaplar ekranından bir mutfağa bağlanır; bağlandığı
            anda sipariş tahtası ve cirosu burada görünür.
          </p>
          <Link
            href="/admin/hesaplar?rol=isletme"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-sari-700
              transition-colors duration-300 hover:text-kahve-900"
          >
            İşletme hesapları
            <OkIkon className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-kahve-900/10">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-kahve-900 text-sari-200">
                {["İşletme", "Sahip", "Bekleyen", "Bugün", "Son 30 gün", "İptal", ""].map((b) => (
                  <th
                    key={b}
                    className="px-4 py-3.5 font-display text-2xs font-extrabold tracking-wide uppercase"
                  >
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-kahve-900/8 bg-white">
              {satirlar.map((s) => (
                <tr key={s.slug} className="transition-colors duration-300 hover:bg-sari-500/6">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/isletmeler/${s.slug}`}
                      className="font-semibold text-kahve-900 underline underline-offset-4
                        transition-colors duration-300 hover:text-sari-700"
                    >
                      {s.ad}
                    </Link>
                    <span className="block text-xs text-kahve-500">
                      {s.calisanSayisi > 0 ? `${s.calisanSayisi} çalışan` : "çalışan yok"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-kahve-600">
                    {s.sahip ?? <span className="font-bold text-domates-koyu">sahibi yok</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`grid size-7 place-items-center rounded-full text-xs font-extrabold ${
                        s.rapor.yoldakiSiparis > 0
                          ? "bg-domates/12 text-domates-koyu"
                          : "bg-kahve-900/6 text-kahve-500"
                      }`}
                    >
                      {s.rapor.yoldakiSiparis}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-kahve-700">
                    {paraFormatla(s.rapor.bugun.ciro)}
                  </td>
                  <td className="px-4 py-3.5 font-display font-extrabold whitespace-nowrap text-kahve-900">
                    {paraFormatla(s.rapor.sonOtuzGun.ciro)}
                    <span className="block text-2xs font-semibold text-kahve-500">
                      {s.rapor.sonOtuzGun.siparis} sipariş
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-kahve-600">
                    %{s.rapor.iptalOrani}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/isletmeler/${s.slug}`}
                      aria-label={`${s.ad} tahtasını aç`}
                      className="grid size-8 place-items-center rounded-full bg-kahve-900/5
                        text-kahve-600 transition-colors duration-300 hover:bg-sari-500 hover:text-kahve-900"
                    >
                      <OkIkon className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/*
        MUTFAĞI BAĞLANMAMIŞ HESAPLAR — panelinde "Hesabına bağlı bir profil
        bulunamadı" yazan kişiler. Bu liste olmasaydı yönetici o kişiyi ancak
        şikâyet geldiğinde fark ederdi; eksik bir bağlantı sessizce duruyordu.
      */}
      {bagsizlar.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-extrabold text-kahve-900">
            Mutfağı bağlanmamış işletme hesapları
          </h2>
          <p className="mt-1 text-xs text-kahve-500">
            Bu hesaplar işletme panelini açıyor ama boş görüyor. Hesaplar ekranından bir mutfağa
            bağlanınca sipariş tahtaları çalışmaya başlar.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {bagsizlar.map((h) => (
              <li
                key={h.eposta}
                className="flex items-center justify-between gap-3 rounded-2xl border
                  border-domates/25 bg-domates/6 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-kahve-900">{h.ad}</span>
                  <span className="block truncate text-xs text-kahve-600">{h.eposta}</span>
                </span>
                <Link
                  href="/admin/hesaplar?rol=isletme"
                  className="tiklanabilir shrink-0 rounded-xl bg-kahve-900 px-3 py-2 text-xs
                    font-bold text-sari-300 transition-colors duration-300 hover:bg-kahve-800"
                >
                  Mutfak bağla
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AdminKabuk>
  );
}
