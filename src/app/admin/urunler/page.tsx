import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { Rozet } from "@/components/ui/Rozet";
import { menuBul } from "@/content/menuler";
import { bolumAdindanBul, bolumCoz, mutfakBolumleri } from "@/content/mutfak-bolumleri";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl, type MutfakUrunu } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { tumSefProfilleri } from "@/lib/restoran-listesi";
import { paraFormatla } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ürünler — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tabloda gösterilen tek satır — iki kaynaktan da aynı biçimde üretilir. */
type Satir = {
  anahtar: string;
  mutfakSlug: string;
  mutfakAdi: string;
  bolumId: string;
  bolumAdi: string;
  bolumSirasi: number;
  ad: string;
  birim?: string;
  fiyat: number;
  yayinda: boolean;
  /** Sabit içerikten mi geliyor yoksa şef kendi mi ekledi? */
  kaynak: "icerik" | "sef";
};

export default async function AdminUrunlerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ mutfak?: string; suzgec?: string }>;
}) {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const { mutfak: seciliMutfak, suzgec } = await searchParams;

  const profiller = await tumSefProfilleri();

  /**
   * Şeflerin girdiği ürünler TEK sorguyla çekilip mutfağa göre gruplanıyor;
   * profil başına ayrı sorgu atılmıyor.
   */
  let sefUrunleri: MutfakUrunu[] = [];
  try {
    sefUrunleri = await (await hesapDepoAl()).urunleriListele();
  } catch {
    // depo erişilemiyorsa yalnızca sabit içerik gösterilir
  }

  const satirlar: Satir[] = [];

  for (const profil of profiller) {
    // 1) Sabit içerikteki menü
    for (const kategori of menuBul(profil.slug)) {
      const bolum = bolumAdindanBul(kategori.ad);
      for (const urun of kategori.urunler) {
        satirlar.push({
          anahtar: `icerik:${profil.slug}:${urun.id}`,
          mutfakSlug: profil.slug,
          mutfakAdi: profil.ad,
          bolumId: bolum?.id ?? kategori.ad,
          bolumAdi: bolum?.ad ?? kategori.ad,
          bolumSirasi: bolum?.sira ?? 900,
          ad: urun.ad,
          birim: urun.birim,
          fiyat: urun.taslak ? 0 : urun.fiyat,
          yayinda: true,
          kaynak: "icerik",
        });
      }
    }

    // 2) Şefin kendi panelinden eklediği ürünler
    for (const urun of sefUrunleri.filter((u) => u.restoranSlug === profil.slug)) {
      const bolum = bolumCoz(urun.bolum);
      satirlar.push({
        anahtar: `sef:${urun.id}`,
        mutfakSlug: profil.slug,
        mutfakAdi: profil.ad,
        bolumId: bolum.id,
        bolumAdi: bolum.ad,
        bolumSirasi: bolum.sira,
        ad: urun.ad,
        birim: urun.birim,
        fiyat: urun.fiyat,
        yayinda: urun.yayinda,
        kaynak: "sef",
      });
    }
  }

  const fiyatsizlar = satirlar.filter((s) => s.fiyat <= 0);
  const evYapimi = satirlar.filter((s) => s.bolumId === "ev-yapimi");

  const suzulmus = satirlar
    .filter((s) => !seciliMutfak || s.mutfakSlug === seciliMutfak)
    .filter((s) => {
      if (suzgec === "fiyatsiz") return s.fiyat <= 0;
      if (suzgec === "ev-yapimi") return s.bolumId === "ev-yapimi";
      if (suzgec === "kapali") return !s.yayinda;
      return true;
    })
    .sort(
      (a, b) =>
        a.mutfakAdi.localeCompare(b.mutfakAdi, "tr") ||
        a.bolumSirasi - b.bolumSirasi ||
        a.ad.localeCompare(b.ad, "tr"),
    );

  const kartlar = [
    { etiket: "Toplam ürün", deger: String(satirlar.length), href: "/admin/urunler" },
    {
      etiket: "Ev yapımı ürün",
      deger: String(evYapimi.length),
      href: "/admin/urunler?suzgec=ev-yapimi",
    },
    {
      etiket: "Fiyatı girilmemiş",
      deger: String(fiyatsizlar.length),
      href: "/admin/urunler?suzgec=fiyatsiz",
      dikkat: fiyatsizlar.length > 0,
    },
    {
      etiket: "Şefin girdiği",
      deger: String(satirlar.filter((s) => s.kaynak === "sef").length),
      href: "/admin/urunler",
    },
  ];

  const suzgecler = [
    { deger: "", etiket: "Tümü" },
    { deger: "ev-yapimi", etiket: "Ev yapımı ürünler" },
    { deger: "fiyatsiz", etiket: "Fiyatı yok" },
    { deger: "kapali", etiket: "Menüde değil" },
  ];

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Ürünler"
      aciklama={`${profiller.length} şef/ev hanımı mutfağı · ${satirlar.length} ürün`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kartlar.map((k) => (
          <Link
            key={k.etiket}
            href={k.href}
            className={`rounded-3xl border p-5 shadow-yumusak transition-all duration-300
              hover:-translate-y-0.5 ${
                k.dikkat
                  ? "border-domates/30 bg-domates/8 hover:border-domates/60"
                  : "border-kahve-900/8 bg-white hover:border-sari-500/50"
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
          </Link>
        ))}
      </dl>

      {fiyatsizlar.length > 0 && (
        <p className="mt-6 rounded-2xl bg-sari-500/12 px-4 py-3.5 text-sm leading-relaxed text-kahve-800">
          <strong>{fiyatsizlar.length} ürünün fiyatı yok.</strong> Menüde &quot;fiyat
          yakında&quot; görünüyorlar ve sipariş edilemiyorlar. Fiyat bir kâr/zarar kararı olduğu
          için otomatik doldurulmuyor — şef kendi panelinden girebilir, ya da bir mutfağın
          satırındaki <em>Düzenle</em> ile sen girebilirsin.
        </p>
      )}

      {/* Süzgeçler */}
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Ürünleri süz">
        {suzgecler.map((s) => {
          const secili = (suzgec ?? "") === s.deger;
          const hedef = new URLSearchParams();
          if (s.deger) hedef.set("suzgec", s.deger);
          if (seciliMutfak) hedef.set("mutfak", seciliMutfak);
          const qs = hedef.toString();
          return (
            <Link
              key={s.etiket}
              href={`/admin/urunler${qs ? `?${qs}` : ""}`}
              aria-current={secili ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
                secili
                  ? "bg-sari-500 text-kahve-900 shadow-sari"
                  : "text-kahve-500 hover:bg-kahve-900/5 hover:text-kahve-900"
              }`}
            >
              {s.etiket}
            </Link>
          );
        })}
      </div>

      {/* Mutfak süzgeci */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/admin/urunler${suzgec ? `?suzgec=${suzgec}` : ""}`}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-300 ${
            !seciliMutfak
              ? "bg-kahve-900 text-sari-300"
              : "bg-kahve-900/5 text-kahve-600 hover:bg-kahve-900/10"
          }`}
        >
          Tüm mutfaklar
        </Link>
        {profiller.map((p) => {
          const hedef = new URLSearchParams({ mutfak: p.slug });
          if (suzgec) hedef.set("suzgec", suzgec);
          return (
            <Link
              key={p.slug}
              href={`/admin/urunler?${hedef.toString()}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-300 ${
                seciliMutfak === p.slug
                  ? "bg-kahve-900 text-sari-300"
                  : "bg-kahve-900/5 text-kahve-600 hover:bg-kahve-900/10"
              }`}
            >
              {p.ad}
            </Link>
          );
        })}
      </div>

      {suzulmus.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-14 text-center text-sm text-kahve-500">
          Bu süzgeçle ürün yok.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-kahve-900/10">
          <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-kahve-900 text-sari-200">
                {["Mutfak", "Bölüm", "Ürün", "Birim", "Fiyat", "Durum", "Kaynak", ""].map((b) => (
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
              {suzulmus.map((s) => (
                <tr key={s.anahtar} className="transition-colors duration-300 hover:bg-sari-500/6">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/restoran/${s.mutfakSlug}`}
                      className="font-semibold text-kahve-900 underline underline-offset-4
                        transition-colors duration-300 hover:text-sari-700"
                    >
                      {s.mutfakAdi}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-kahve-600">{s.bolumAdi}</td>
                  <td className="px-4 py-3.5 font-semibold text-kahve-900">{s.ad}</td>
                  <td className="px-4 py-3.5 text-xs text-kahve-500">{s.birim ?? "—"}</td>
                  <td className="px-4 py-3.5 font-display font-extrabold whitespace-nowrap text-kahve-900">
                    {s.fiyat > 0 ? paraFormatla(s.fiyat) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    {s.fiyat <= 0 ? (
                      <Rozet ton="domates">Fiyat yok</Rozet>
                    ) : !s.yayinda ? (
                      <Rozet ton="acik">Menüde değil</Rozet>
                    ) : (
                      <Rozet ton="nane">Satışta</Rozet>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-kahve-500">
                    {s.kaynak === "sef" ? "Şef girdi" : "Site içeriği"}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/panel/${s.mutfakSlug}`}
                      className="text-xs font-bold text-sari-700 underline underline-offset-4
                        transition-colors duration-300 hover:text-kahve-900"
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-kahve-500">
        Bölüm sırası her profilde aynı:{" "}
        {mutfakBolumleri.map((b) => b.ad).join(" → ")}.
      </p>
    </AdminKabuk>
  );
}
