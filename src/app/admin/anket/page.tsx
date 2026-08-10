import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { yayindakiAnketler } from "@/app/anket-actions";
import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { AnketOlustur } from "@/components/admin/AnketOlustur";
import { AnketSatiri } from "@/components/admin/AnketSatiri";
import { AnketSonucKarti } from "@/components/admin/AnketSonucKarti";
import { VARSAYILAN_ANKET } from "@/content/anket";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl, type Anket, type AnketOyu } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Anket — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ANKET YÖNETİMİ — yalnızca yönetici.
 *
 * Buradan anket oluşturulur, yayınlanır, silinir; yayındaki anketin sonucu ve
 * KİMİN NE OY VERDİĞİ de burada. Müşteri yalnızca yüzdeleri görüyor, o da
 * ancak oy verdikten sonra. Girişsiz oylar "misafir" olarak sayılıyor —
 * kişiyi tanımlayan bir bilgi zaten toplanmıyor.
 */
export default async function AnketSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  let anketler: Anket[] = [];
  let oylar: AnketOyu[] = [];
  try {
    const depo = await hesapDepoAl();
    [anketler, oylar] = await Promise.all([depo.anketleriListele(), depo.anketOylariListele()]);
  } catch {
    // depo erişilemiyorsa sayfa yine açılsın, boş görünsün
  }

  const acikAnketler = await yayindakiAnketler();

  /*
   * Varsayılan anket kod dosyasında yaşıyor, veritabanında kaydı olmayabilir.
   * Yine de HER ZAMAN listeleniyor: oyları duruyorsa görünmeli (yoksa "0 oy"
   * sanılıp yanlış karar verilir) ve ilk gerçek anket açılınca ana sayfadan
   * çekildiği için onu geri getirmenin tek yolu buradaki "Yayına al" düğmesi —
   * listeden düşseydi bir daha ulaşılamazdı.
   */
  const listelenecek: Anket[] = [...anketler];
  if (!anketler.some((a) => a.id === VARSAYILAN_ANKET.id)) {
    listelenecek.push({
      ...VARSAYILAN_ANKET,
      yayinda: acikAnketler.some((a) => a.id === VARSAYILAN_ANKET.id),
    });
  }

  // Yayındaki anketlerin toplamı — başlıktaki özet satırı için.
  const acikOylar = oylar.filter((o) => acikAnketler.some((a) => a.id === o.anketId));
  const toplam = acikOylar.length;
  const girisliSayisi = acikOylar.filter((o) => o.girisli).length;

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Anket"
      aciklama={`${listelenecek.length} anket · ${acikAnketler.length} yayında · toplam ${toplam} oy (${girisliSayisi} üye, ${toplam - girisliSayisi} misafir)`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <AnketOlustur />

      <section className="mt-6">
        <h2 className="font-display text-base font-extrabold text-kahve-900">Anketler</h2>
        <p className="mt-1 text-xs leading-relaxed text-kahve-500">
          Yayında olan her anket ana sayfada kendi kutusunda görünür — yeni anket eskisini
          indirmez. Bir anketi kaldırmak istersen &ldquo;Yayından kaldır&rdquo; de; oyları
          silinmez, durur. Ana sayfada her anketin duracağı kutuyu sürükleyerek
          değiştirebilirsin.
        </p>
        <ul className="mt-3 space-y-2.5">
          {listelenecek.map((a) => (
            <AnketSatiri
              key={a.id}
              anket={{
                id: a.id,
                soru: a.soru,
                secenekSayisi: a.secenekler.length,
                oySayisi: oylar.filter((o) => o.anketId === a.id).length,
                yayinda: a.yayinda,
                tarih: a.olusturmaTarihi,
              }}
            />
          ))}
        </ul>
      </section>

      {/*
        Yayındaki her anketin dağılımı ve oy verenleri ayrı kartta. Tek kart
        yeterliydi, çünkü aynı anda tek anket yayında olabiliyordu; artık
        hepsi ana sayfada durduğu için hepsinin sonucu da burada.
      */}
      <h2 className="mt-8 font-display text-base font-extrabold text-kahve-900">
        Yayındaki anketlerin sonuçları
      </h2>
      {acikAnketler.map((a) => (
        <AnketSonucKarti
          key={a.id}
          anket={a}
          oylar={oylar.filter((o) => o.anketId === a.id)}
        />
      ))}
    </AdminKabuk>
  );
}
