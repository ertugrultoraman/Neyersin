import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { OkIkon } from "@/components/ui/Buton";
import { RozetIkon } from "@/components/ui/Ikonlar";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { oturumAl } from "@/lib/oturum";
import { BASAMAKLAR, type RozetBasamagi } from "@/lib/sef-rozetleri";
import { tamSiralamaAl } from "@/lib/sef-rozetleri-sunucu";
import { sozluk } from "@/lib/sozluk";

export const metadata: Metadata = {
  title: "Şef rozetleri — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ŞEF ROZETLERİ — yöneticinin sıralamayı gördüğü ekran.
 *
 * Ana sayfadaki podyum yalnızca ilk üç ŞEFİ gösteriyor. Yönetici için o yeterli
 * değil: dördüncünün kaç farkla kaçırdığını, ticari restoranların ne sattığını
 * ve kapanmış bir mutfağın hâlâ sipariş kaydı olup olmadığını da görmesi
 * gerekiyor. Bu sayfa ham sıralamanın tamamını veriyor.
 *
 * Sayfa TÜRKÇE — yönetim paneli site sahibinin kendi ekranı, dil değiştiricinin
 * arkasında değil (panelin geri kalanıyla aynı tercih).
 */
export default async function AdminRozetlerSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const siralama = await tamSiralamaAl();
  const sefler = siralama.filter((s) => s.sefMutfagiMi);
  const rozetliler = sefler.filter((s) => s.basamak);
  const toplamSatis = siralama.reduce((t, s) => t + s.adet, 0);

  /** Podyumdaki üç kutu — boş basamak da gösteriliyor. */
  const basamaklar: RozetBasamagi[] = [1, 2, 3];
  const rozetAd = (basamak: RozetBasamagi) => sozluk[BASAMAKLAR[basamak].adAnahtari].tr;

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Şef rozetleri"
      aciklama={`${sefler.length} şef mutfağı · ${toplamSatis} satış sayıldı`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      {/* Podyumun şu anki hâli */}
      <div className="grid gap-4 sm:grid-cols-3">
        {basamaklar.map((basamak) => {
          const sahip = sefler.find((s) => s.basamak === basamak);
          return (
            <div
              key={basamak}
              className={`rounded-3xl border p-5 shadow-yumusak ${
                sahip ? "border-sari-500/40 bg-sari-500/6" : "border-dashed border-kahve-900/15 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={BASAMAKLAR[basamak].gorsel}
                  alt=""
                  width={384}
                  height={330}
                  aria-hidden="true"
                  className="size-9 shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                    {basamak}. {rozetAd(basamak)}
                  </p>
                  <p className="truncate font-display text-lg font-extrabold text-kahve-900">
                    {sahip ? sahip.restoranAdi : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-kahve-600">
                {sahip ? `${sahip.adet} satış` : "Bu basamak henüz boş"}
              </p>
            </div>
          );
        })}
      </div>

      {/*
        Kural açıkça yazılı: yönetici "bu şef neden rozet almadı?" sorusuna
        tabloya bakarak cevap verebilmeli, kodu okumak zorunda kalmamalı.
      */}
      <div className="mt-6 rounded-2xl bg-kahve-900/4 px-4 py-3.5 text-sm leading-relaxed text-kahve-700">
        <strong className="font-bold">Sıralama kuralı:</strong> ödenmiş ve iptal edilmemiş
        siparişler sayılır (ödendi, hazır, yolda, teslim edildi). Ödeme bekleyen, ödemesi
        başarısız olan ve iptal edilen siparişler sayılmaz. Rozet yalnızca{" "}
        <strong className="font-bold">şef ve ev hanımı mutfaklarına</strong> verilir; ticari
        restoranlar listede görünür ama yarışmaz. Eşitlikte ada göre alfabetik sıralanır.
      </div>

      {siralama.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-sari-500/16 text-sari-700">
            <RozetIkon className="size-7" />
          </span>
          <p className="mt-5 font-display text-lg font-extrabold text-kahve-900">
            Sayılacak satış yok
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-kahve-500">
            İlk sipariş ödendiğinde sıralama burada oluşmaya başlayacak. Ana sayfadaki podyum
            o zamana kadar boş basamaklarla duruyor.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-kahve-900/10">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-kahve-900 text-sari-200">
                {["#", "Mutfak", "Tür", "Satış", "Rozet", ""].map((b) => (
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
              {siralama.map((s, i) => (
                <tr
                  key={s.restoranSlug}
                  className={`transition-colors duration-300 hover:bg-sari-500/6 ${
                    s.basamak ? "bg-sari-500/4" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-kahve-500">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block font-semibold text-kahve-900">{s.restoranAdi}</span>
                    <span className="block font-mono text-2xs text-kahve-400">
                      {s.restoranSlug}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-kahve-600">
                    {!s.mevcutMu ? (
                      <span className="text-domates-koyu">Mutfak kapalı</span>
                    ) : s.sefMutfagiMi ? (
                      "Şef mutfağı"
                    ) : (
                      <span className="text-kahve-400">Ticari — yarışmıyor</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-display font-extrabold text-kahve-900">
                    {s.adet}
                  </td>
                  <td className="px-4 py-3.5">
                    {s.basamak ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-kahve-900">
                        <Image
                          src={BASAMAKLAR[s.basamak].gorsel}
                          alt=""
                          width={384}
                          height={330}
                          aria-hidden="true"
                          className="size-5 shrink-0 object-contain"
                        />
                        {rozetAd(s.basamak)}
                      </span>
                    ) : (
                      <span className="text-xs text-kahve-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {s.mevcutMu && (
                      <Link
                        href={`/restoran/${s.restoranSlug}`}
                        aria-label={`${s.restoranAdi} profilini aç`}
                        className="grid size-8 place-items-center rounded-full bg-kahve-900/5
                          text-kahve-600 transition-colors duration-300 hover:bg-sari-500 hover:text-kahve-900"
                      >
                        <OkIkon className="size-4" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rozetliler.length > 0 && rozetliler.length < 3 && (
        <p className="mt-4 text-sm text-kahve-500">
          Podyumda {3 - rozetliler.length} basamak boş — satışı olan şef sayısı henüz üçe
          ulaşmadı. Boş basamaklar ana sayfada soru işaretiyle görünüyor.
        </p>
      )}
    </AdminKabuk>
  );
}
