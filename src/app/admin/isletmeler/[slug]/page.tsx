import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { CiroRaporu } from "@/components/isletme/CiroRaporu";
import { SiparisTahtasi } from "@/components/isletme/SiparisTahtasi";
import { OkIkon } from "@/components/ui/Buton";
import { acikMi } from "@/lib/calisma-saatleri";
import { saatleriAl } from "@/lib/calisma-saatleri-depo";
import { depoAl, depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { raporCikar } from "@/lib/isletme-rapor";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";

export const metadata: Metadata = {
  title: "İşletme — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BİR İŞLETMENİN YÖNETİCİ GÖRÜNÜMÜ — sipariş tahtası ve ciro raporu.
 *
 * İŞLETMENİN GÖRDÜĞÜ BİLEŞENLERİN AYNISI kullanılıyor (SiparisTahtasi,
 * CiroRaporu). Yönetici için ikinci bir tahta/rapor yazılsaydı iki ekran
 * zamanla birbirinden ayrılır, telefonda "bende şu görünüyor" tartışması
 * çıkardı. Sipariş listesi de /isletme ile aynı filtreyle çekiliyor —
 * dolayısıyla iki ekrandaki sayılar tanım olarak eşit.
 *
 * DÜZENLEME YOK: burada çalışma saatleri, ürünler, fiyatlar ve profil formu
 * bilerek gösterilmiyor. Yöneticinin işletme adına düzenleme yapması gereken
 * durumda doğru yol "Hesap olarak gir" — o yol deftere yazılıyor ve ekranda
 * kimin adına iş yapıldığını söyleyen şerit çıkıyor (bkz. lib/vekil-kaydi.ts).
 * Buradan sessizce düzenleme yapılabilseydi o denetim izi kaybolurdu.
 *
 * Tek istisna sipariş tahtasındaki "hazır" düğmesi: o zaten yöneticiye açık
 * (bkz. app/panel/teslimat-actions.ts) ve mutfak yanıt vermediğinde siparişi
 * kurtaran tek müdahale.
 */
export default async function AdminIsletmeDetaySayfasi({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const oturum = await oturumAl();
  // Şef oturumu yönetici paneline giremez — rol açıkça kontrol edilir.
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const { slug: hamSlug } = await params;
  const slug = decodeURIComponent(hamSlug);

  const [hesapDepo, depo] = await Promise.all([hesapDepoAl(), depoAl()]);
  const [restoran, siparisler, sahip, calisanlar, saatler] = await Promise.all([
    restoranCoz(slug),
    depo.listele({ restoranSlug: slug, limit: 200 }),
    hesapDepo.restoranSahibi(slug).catch(() => null),
    hesapDepo.isletmeCalisanlari(slug).catch(() => []),
    saatleriAl(slug).catch(() => null),
  ]);

  /*
   * Mutfak bulunamadıysa 404: elle yazılmış ya da mutfağı silinmiş bir slug'a
   * boş tahta göstermek, "bu işletmenin hiç siparişi yok" gibi okunurdu.
   */
  if (!restoran) notFound();

  const rapor = raporCikar(siparisler);
  const durum = acikMi(saatler);

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik={restoran.ad}
      aciklama={`${siparisler.length} kayıtlı sipariş · ${slug}`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
      yan={
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
            durum.acik ? "bg-nane/15 text-nane-koyu" : "bg-domates/12 text-domates-koyu"
          }`}
        >
          {durum.acik
            ? "Sipariş alıyor"
            : durum.sebep === "elle"
              ? "Elle kapatılmış"
              : "Program dışı — kapalı"}
        </span>
      }
    >
      <Link
        href="/admin/isletmeler"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-kahve-500
          transition-colors duration-300 hover:text-kahve-900"
      >
        <OkIkon className="size-4 rotate-180" />
        Bütün işletmeler
      </Link>

      {/* Kim işletiyor — tahtadaki bir aksaklıkta yöneticinin arayacağı kişi. */}
      <section className="mt-6 grid gap-4 rounded-[2rem] border border-kahve-900/8 bg-white p-6 sm:grid-cols-3">
        <div>
          <p className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">Sahip</p>
          <p className="mt-1 text-sm font-bold text-kahve-900">
            {sahip ? sahip.ad : <span className="text-domates-koyu">Bağlı hesap yok</span>}
          </p>
          {sahip && <p className="text-xs text-kahve-500">{sahip.eposta}</p>}
        </div>
        <div>
          <p className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">Çalışanlar</p>
          {calisanlar.length === 0 ? (
            <p className="mt-1 text-sm text-kahve-500">Çalışan hesabı yok</p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {calisanlar.map((k) => (
                <li key={k.eposta} className="truncate text-xs text-kahve-600">
                  <span className="font-bold text-kahve-900">{k.ad}</span> · {k.eposta}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Link
            href={`/restoran/${slug}`}
            className="tiklanabilir rounded-xl bg-kahve-900/5 px-3 py-2 text-xs font-bold
              text-kahve-900 transition-colors duration-300 hover:bg-sari-500"
          >
            Mutfak sayfası
          </Link>
          <Link
            href="/admin/hesaplar?rol=isletme"
            className="tiklanabilir rounded-xl bg-kahve-900/5 px-3 py-2 text-xs font-bold
              text-kahve-900 transition-colors duration-300 hover:bg-sari-500"
          >
            Hesabı yönet
          </Link>
          <Link
            href={`/admin?q=${encodeURIComponent(restoran.ad)}`}
            className="tiklanabilir rounded-xl bg-kahve-900/5 px-3 py-2 text-xs font-bold
              text-kahve-900 transition-colors duration-300 hover:bg-sari-500"
          >
            Sipariş kayıtları
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <SiparisTahtasi siparisler={siparisler} />
      </section>

      <section className="mt-8 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <CiroRaporu rapor={rapor} />
      </section>
    </AdminKabuk>
  );
}
