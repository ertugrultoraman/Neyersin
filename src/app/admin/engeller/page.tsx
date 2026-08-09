import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { EngelKaldir } from "@/components/admin/EngelKaldir";
import { ESIK, engelleriListele } from "@/lib/bot-engeli";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Bot engelleri — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEBEP_ETIKETLERI: Record<string, string> = {
  "bal-kupu": "Bal küpünü doldurdu",
  hiz: "Makine hızıyla gönderdi",
  isaretsiz: "Kutuyu işaretlemedi",
};

/**
 * BOT ENGELLERİ — "ben robot değilim" kapısını geçmeye çalışanlar.
 *
 * Yöneticinin bu listeyi görmesi şart: engel altı ay sürüyor ve mobil
 * operatörlerin CGNAT'ı yüzünden bir IP'nin arkasında binlerce gerçek
 * kullanıcı olabiliyor. Yanlış engellenen biri çıkarsa buradan kaldırılıyor.
 */
export default async function EngellerSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const kayitlar = await engelleriListele();
  const simdi = Date.now();
  const aktif = kayitlar.filter((k) => k.bitis && new Date(k.bitis).getTime() > simdi);
  const izlenen = kayitlar.filter((k) => !k.bitis || new Date(k.bitis).getTime() <= simdi);

  const tarih = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Bot engelleri"
      aciklama={`${aktif.length} engelli · ${izlenen.length} izlenen`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <div className="rounded-2xl bg-kahve-900/4 px-4 py-3.5 text-sm leading-relaxed text-kahve-700">
        <strong className="font-bold">Kural:</strong> &ldquo;Ben robot değilim&rdquo; kapısı, formu{" "}
        <strong className="font-bold">900 ms&apos;den hızlı</strong> gönderen ya da ekranda
        görünmeyen bal küpü alanını dolduran isteği reddediyor. Bu işaretler{" "}
        <strong className="font-bold">{ESIK}</strong> kez birikince o IP{" "}
        <strong className="font-bold">6 ay</strong> kapıya alınmıyor. Bal küpü tek başına yeterli
        sayılıyor — o alanı yalnızca otomatik yazılım doldurabilir.
        <br />
        <span className="text-kahve-600">
          Tek hatada engellemiyoruz: mobil operatörler CGNAT kullanıyor, bir IP&apos;nin arkasında
          binlerce gerçek kullanıcı olabiliyor. Yanlış engellediğini düşündüğün kaydı aşağıdan
          kaldırabilirsin.
        </span>
      </div>

      {kayitlar.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-16 text-center text-sm text-kahve-500">
          Henüz bot işareti yok. Kapıyı makine hızıyla geçmeye çalışan olursa burada görünecek.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-kahve-900/10">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-kahve-900 text-sari-200">
                {["IP", "Durum", "İşaret", "Sebep", "Son deneme", ""].map((b) => (
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
              {[...aktif, ...izlenen].map((k) => {
                const engelli = k.bitis && new Date(k.bitis).getTime() > simdi;
                return (
                  <tr key={k.ip} className={engelli ? "bg-domates/5" : ""}>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-kahve-900">
                      {k.ip}
                    </td>
                    <td className="px-4 py-3.5">
                      {engelli ? (
                        <span className="text-xs font-bold text-domates-koyu">
                          Engelli — {tarih(k.bitis!)} tarihine kadar
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-kahve-500">İzleniyor</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-display font-extrabold text-kahve-900">
                      {k.sayac}/{ESIK}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-kahve-600">
                      {SEBEP_ETIKETLERI[k.sebep] ?? k.sebep}
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap text-kahve-500">
                      {tarih(k.son)}
                    </td>
                    <td className="px-4 py-3.5">
                      <EngelKaldir ip={k.ip} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminKabuk>
  );
}
