import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { HesapKarti } from "@/components/admin/HesapKarti";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl, type Rol } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz, tumSefProfilleri } from "@/lib/restoran-listesi";
import { vekilKayitlariniListele } from "@/lib/vekil-kaydi";

export const metadata: Metadata = {
  title: "Hesaplar — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEKMELER: { deger: string; etiket: string }[] = [
  { deger: "", etiket: "Tümü" },
  { deger: "sef", etiket: "Şef / Ev Hanımı" },
  { deger: "isletme", etiket: "İşletme" },
  { deger: "kurye", etiket: "Kurye" },
  { deger: "musteri", etiket: "Müşteri" },
];

export default async function HesaplarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const { rol } = await searchParams;
  const secili = SEKMELER.some((s) => s.deger === rol) ? (rol ?? "") : "";

  const depo = await hesapDepoAl();
  const hesaplar = await depo.hesaplariListele(secili ? (secili as Rol) : undefined);

  // Şeflerin mutfak adlarını da göster
  const mutfakAdlari = new Map<string, string>();
  for (const h of hesaplar) {
    if (!h.restoranSlug) continue;
    const r = await restoranCoz(h.restoranSlug);
    if (r) mutfakAdlari.set(h.eposta, r.ad);
  }

  const tumu = await depo.hesaplariListele();

  /*
   * Bağlanabilecek mutfaklar: yalnızca şef/ev hanımı mutfakları. Zaten bir
   * hesaba bağlı olanların yanında sahibinin adresi yazıyor ki yönetici
   * yanlışlıkla devretmeye çalışmasın.
   */
  const sahipler = new Map<string, string>();
  for (const h of tumu) if (h.restoranSlug) sahipler.set(h.restoranSlug, h.eposta);

  const mutfaklar = (await tumSefProfilleri())
    .map((r) => ({ slug: r.slug, ad: r.ad, sahibi: sahipler.get(r.slug) }))
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

  /*
   * Altın Şef unvanları — kart üzerinde açıp kapatılabilsin diye. Profiller
   * TEK sorguda çekiliyor; hesap başına ayrı sorgu atmak listeyi yavaşlatırdı.
   */
  const altinSefler = new Set(
    (await depo.profilleriListele()).filter((p) => p.altinSef).map((p) => p.restoranSlug),
  );

  const sayim = {
    sef: tumu.filter((h) => h.rol === "sef").length,
    isletme: tumu.filter((h) => h.rol === "isletme").length,
    kurye: tumu.filter((h) => h.rol === "kurye").length,
    musteri: tumu.filter((h) => h.rol === "musteri").length,
  };

  /* Kim hangi hesaba büründü — vekâlet yetkisinin denetim tarafı. */
  const vekilKayitlari = await vekilKayitlariniListele(20);

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Hesaplar"
      aciklama={
        `${sayim.sef} şef · ${sayim.isletme} işletme · ` +
        `${sayim.kurye} kurye · ${sayim.musteri} müşteri`
      }
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      {/* Sekmeler dar ekranda kendi içinde kayar; sayfayı sağa itmez. */}
      <div className="flex gap-2 overflow-x-auto pb-1 gizli-scroll [&>a]:shrink-0">
        {SEKMELER.map((s) => {
          const aktif = secili === s.deger;
          return (
            <Link
              key={s.etiket}
              href={`/admin/hesaplar${s.deger ? `?rol=${s.deger}` : ""}`}
              aria-current={aktif ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
                aktif
                  ? "bg-sari-500 text-kahve-900 shadow-sari"
                  : "text-kahve-500 hover:bg-kahve-900/5 hover:text-kahve-900"
              }`}
            >
              {s.etiket}
            </Link>
          );
        })}
      </div>

      <p className="mt-5 rounded-2xl bg-kahve-900/4 px-4 py-3 text-xs leading-relaxed text-kahve-600">
        Yönetici hesabı bu listede görünmez; o ortam değişkeniyle tanımlıdır ve buradan
        silinemez. Bir şefin hesabını sildiğinde otomatik açılmış mutfak sayfası da silinir —
        içerik dosyasındaki sabit restoranlar etkilenmez.
      </p>

      {hesaplar.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-kahve-900/8 bg-white p-10 text-center text-sm text-kahve-500">
          Bu rolde hesap yok.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {hesaplar.map((h) => (
            <HesapKarti
              key={h.eposta}
              hesap={h}
              mutfakAdi={mutfakAdlari.get(h.eposta)}
              mutfaklar={mutfaklar}
              altinSef={Boolean(h.restoranSlug && altinSefler.has(h.restoranSlug))}
            />
          ))}
        </div>
      )}

      {/*
        VEKÂLET DEFTERİ — "hesap olarak gir" düğmesinin denetim tarafı.
        Yetki verilip kaydı tutulmasaydı, hedef hesapta yapılan bir değişikliğin
        sahibine mi yöneticiye mi ait olduğu sonradan anlaşılamazdı.
      */}
      {vekilKayitlari.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-extrabold text-kahve-900">Vekâlet defteri</h2>
          <p className="mt-1 text-xs text-kahve-500">
            Son {vekilKayitlari.length} kayıt — hangi yönetici hangi hesabı görüntüledi.
          </p>
          <div className="mt-3 overflow-x-auto rounded-3xl border border-kahve-900/8 bg-white">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="border-b border-kahve-900/8 text-xs tracking-wide text-kahve-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold">Yönetici</th>
                  <th className="px-4 py-3 font-bold">Hesap</th>
                  <th className="px-4 py-3 font-bold">Zaman</th>
                </tr>
              </thead>
              <tbody>
                {vekilKayitlari.map((k) => (
                  <tr key={`${k.zaman}-${k.hedef}`} className="border-b border-kahve-900/5 last:border-0">
                    <td className="px-4 py-2.5 text-kahve-700">{k.yonetici}</td>
                    <td className="px-4 py-2.5 font-semibold text-kahve-900">{k.hedef}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-kahve-500">
                      {new Date(k.zaman).toLocaleString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminKabuk>
  );
}
