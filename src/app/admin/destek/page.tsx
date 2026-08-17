import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { BelgeListesi } from "@/components/admin/BelgeListesi";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import type { Belge, DestekDurumu, DestekTalebi } from "@/lib/hesaplar/tipler";
import { oturumAl } from "@/lib/oturum";
import { destekDurumuDegistir, destekYanitla } from "../yonetim-actions";

export const metadata: Metadata = {
  title: "Destek Talepleri — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEKMELER: { deger: string; etiket: string }[] = [
  { deger: "acik", etiket: "Açık" },
  { deger: "cozuldu", etiket: "Çözüldü" },
  { deger: "", etiket: "Tümü" },
];

export default async function DestekSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const { durum } = await searchParams;
  const secili = SEKMELER.some((s) => s.deger === durum) ? (durum ?? "acik") : "acik";

  let talepler: DestekTalebi[] = [];
  try {
    talepler = await (await hesapDepoAl()).destekListele(
      secili ? (secili as DestekDurumu) : undefined,
    );
  } catch {
    // depo erişilemiyorsa sayfa yine açılsın, liste boş görünsün
  }

  /*
   * Başvurulara eklenen resmî evrak (işletme ruhsatı vb.) TEK seferde
   * çekiliyor; talep başına ayrı sorgu listeyi yavaşlatırdı.
   */
  let belgeler = new Map<string, Belge[]>();
  try {
    const depo = await hesapDepoAl();
    belgeler = new Map(
      await Promise.all(
        talepler.map(
          async (t) => [t.id, await depo.belgeleriListele("iletisim", t.id)] as const,
        ),
      ),
    );
  } catch {
    // belgeler okunamazsa talepler yine listelensin
  }

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Destek talepleri"
      aciklama={`${talepler.length} talep`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <div className="flex flex-wrap gap-2">
        {SEKMELER.map((s) => (
          <Link
            key={s.etiket}
            href={s.deger ? `/admin/destek?durum=${s.deger}` : "/admin/destek?durum="}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
              secili === s.deger
                ? "bg-kahve-900 text-sari-300"
                : "bg-kahve-900/6 text-kahve-700 hover:bg-kahve-900/12"
            }`}
          >
            {s.etiket}
          </Link>
        ))}
      </div>

      {talepler.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-12 text-center text-sm text-kahve-500">
          Bu listede talep yok.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {talepler.map((t) => (
            <li
              key={t.id}
              className="rounded-3xl border border-kahve-900/8 bg-white p-5 md:p-6"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="font-mono text-xs font-bold text-kahve-500">{t.no}</span>
                <span className="font-display text-base font-extrabold text-kahve-900">
                  {t.konu}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-2xs font-bold uppercase ${
                    t.durum === "acik"
                      ? "bg-domates/12 text-domates-koyu"
                      : "bg-nane/12 text-nane-koyu"
                  }`}
                >
                  {t.durum === "acik" ? "Açık" : "Çözüldü"}
                </span>
                <span className="ml-auto text-xs text-kahve-400">
                  {new Date(t.olusturmaTarihi).toLocaleString("tr-TR")}
                </span>
              </div>

              {(belgeler.get(t.id) ?? []).length > 0 && (
                <BelgeListesi belgeler={belgeler.get(t.id) ?? []} />
              )}

              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-kahve-700">
                {t.mesaj}
              </p>

              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-kahve-900/8 pt-3 text-xs text-kahve-600">
                <div className="flex gap-1.5">
                  <dt className="font-bold">Kişi:</dt>
                  <dd>{t.ad}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="font-bold">E-posta:</dt>
                  <dd>
                    <a href={`mailto:${t.eposta}`} className="text-sari-700 underline">
                      {t.eposta}
                    </a>
                  </dd>
                </div>
                {t.telefon && (
                  <div className="flex gap-1.5">
                    <dt className="font-bold">Telefon:</dt>
                    <dd>{t.telefon}</dd>
                  </div>
                )}
                {t.siparisNo && (
                  <div className="flex gap-1.5">
                    <dt className="font-bold">Sipariş:</dt>
                    <dd>
                      <Link
                        href={`/admin/siparis/${t.siparisNo}`}
                        className="font-mono text-sari-700 underline"
                      >
                        {t.siparisNo}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>

              {/*
                YANIT ALANI. Talepler bugüne kadar yalnızca "çözüldü"
                işaretlenebiliyordu; yazılan yanıt hiçbir yere gitmiyordu.
                Kurye uygulamasından açılan talepler bu yanıtı kendi destek
                ekranında okuyor (bkz. api/mobil/v1/kurye/destek) — alan
                olmasaydı kuryenin mesajı tek yönlü kalırdı.
              */}
              {t.yanit && (
                <div className="mt-4 rounded-2xl bg-nane/8 px-4 py-3">
                  <p className="text-2xs font-bold tracking-wide text-nane-koyu uppercase">
                    Yanıtın
                  </p>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-kahve-800">
                    {t.yanit}
                  </p>
                </div>
              )}

              <form action={destekYanitla} className="mt-4 space-y-2">
                <input type="hidden" name="id" value={t.id} />
                <textarea
                  name="yanit"
                  defaultValue={t.yanit ?? ""}
                  rows={2}
                  maxLength={2000}
                  placeholder="Yanıtını yaz — kurye uygulamasında ve talep kaydında görünür."
                  className="w-full rounded-2xl border border-kahve-900/12 bg-white px-4 py-2.5
                    text-sm text-kahve-900 focus:border-sari-500/60 focus:ring-2
                    focus:ring-sari-500/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="tiklanabilir rounded-2xl bg-kahve-900 px-4 py-2 text-sm font-bold
                    text-sari-300 transition-colors duration-300 hover:bg-kahve-800"
                >
                  {t.yanit ? "Yanıtı güncelle" : "Yanıtla"}
                </button>
              </form>

              <form action={destekDurumuDegistir} className="mt-2">
                <input type="hidden" name="id" value={t.id} />
                <input
                  type="hidden"
                  name="durum"
                  value={t.durum === "acik" ? "cozuldu" : "acik"}
                />
                <button
                  type="submit"
                  className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2
                    text-sm font-bold text-kahve-800 transition-colors duration-300
                    hover:border-sari-500/60 hover:bg-sari-500/10"
                >
                  {t.durum === "acik" ? "Çözüldü olarak işaretle" : "Yeniden aç"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AdminKabuk>
  );
}
