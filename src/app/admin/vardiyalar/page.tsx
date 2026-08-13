import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { VardiyaFormu } from "@/components/admin/VardiyaFormu";
import { VardiyaSil } from "@/components/admin/VardiyaSil";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { cevrimiciKuryeler } from "@/lib/kurye-dagitim";
import { vardiyaAcikMi, yonetimDilimleri, type VardiyaDilimiYonetim } from "@/lib/kurye-vardiya";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Vardiyalar — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * VARDİYA PLANI — "yarın akşam sahada kaç kurye olacak?"
 *
 * Sipariş sayfasındaki "Sahadaki kuryeler" listesi yalnızca ŞU ANI gösteriyor
 * (bkz. admin/page.tsx). Bu sayfa geleceği gösteriyor: yönetici dilimleri
 * açıyor, kuryeler yer ayırıyor, doluluk buradan izleniyor. İkisi birlikte
 * "şu an kim var" ve "birazdan kim olacak" sorularının ikisini de cevaplıyor.
 *
 * REZERVASYON ZORUNLU DEĞİL (bkz. lib/kurye-vardiya): kurye yer ayırmadan da
 * çalışabiliyor. Bu yüzden sayfa doluluğu bir GARANTİ değil TAHMİN olarak
 * sunuyor — "5 kişi söz verdi" diyor, "5 kişi olacak" demiyor.
 */
export default async function VardiyalarSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  let dilimler: VardiyaDilimiYonetim[] = [];
  const kuryeAdlari = new Map<string, string>();
  let sahadaki = 0;
  try {
    const hesapDepo = await hesapDepoAl();
    const [liste, kuryeHesaplari, durumlar] = await Promise.all([
      yonetimDilimleri(),
      hesapDepo.hesaplariListele("kurye"),
      cevrimiciKuryeler(),
    ]);
    dilimler = liste;
    sahadaki = durumlar.length;
    for (const h of kuryeHesaplari) kuryeAdlari.set(h.eposta.toLowerCase(), h.ad);
  } catch {
    /* Depo susarsa sayfa yine açılsın; form çalışmaya devam eder. */
  }

  const simdi = Date.now();
  const gelecek = dilimler.filter((d) => new Date(d.bitis).getTime() > simdi);
  const gecmis = dilimler.filter((d) => new Date(d.bitis).getTime() <= simdi);

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Vardiyalar"
      aciklama={`${gelecek.length} açık dilim · şu an ${sahadaki} kurye sahada`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      {!vardiyaAcikMi() && (
        <div className="mb-6 rounded-2xl bg-domates/8 px-4 py-3.5 text-sm leading-relaxed text-kahve-700">
          <strong className="font-bold">Vardiya planı kapalı.</strong> Bu özellik veritabanı
          gerektiriyor (<code className="font-mono text-xs">DATABASE_URL</code> tanımlı değil).
          Dosya deposu tek süreçte çalıştığı için kontenjan sayımı güvenilir olmaz; bu yüzden
          liste boş görünüyor ve kuryelerin uygulamasında da hiçbir dilim çıkmıyor.
        </div>
      )}

      <VardiyaFormu />

      <Bolum
        baslik="Açık ve süren vardiyalar"
        bos="Henüz vardiya açılmamış. Yukarıdaki formdan ilk dilimi aç."
        dilimler={gelecek}
        adlar={kuryeAdlari}
        simdi={simdi}
      />

      <Bolum
        baslik="Biten vardiyalar"
        bos="Son 24 saatte biten vardiya yok."
        dilimler={gecmis}
        adlar={kuryeAdlari}
        simdi={simdi}
      />
    </AdminKabuk>
  );
}

/**
 * Saatler TÜRKİYE saat diliminde yazılıyor.
 *
 * `timeZone` verilmeseydi Node sunucunun saatini kullanırdı; Vercel UTC'de
 * çalıştığı için 19:00'da başlayan vardiya panelde 16:00 görünürdü. Kuryenin
 * telefonu ise doğru saati gösteriyordu — iki taraf arasında üç saatlik bir
 * fark, planlamayı tamamen bozardı.
 */
const TR = "Europe/Istanbul";

function gunYaz(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    timeZone: TR,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function saatYaz(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    timeZone: TR,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Bolum({
  baslik,
  bos,
  dilimler,
  adlar,
  simdi,
}: {
  baslik: string;
  bos: string;
  dilimler: VardiyaDilimiYonetim[];
  adlar: Map<string, string>;
  simdi: number;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-extrabold text-kahve-900">{baslik}</h2>

      {dilimler.length === 0 ? (
        <p className="mt-3 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-10 text-center text-sm text-kahve-500">
          {bos}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {dilimler.map((d) => (
            <DilimKarti key={d.id} dilim={d} adlar={adlar} simdi={simdi} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DilimKarti({
  dilim,
  adlar,
  simdi,
}: {
  dilim: VardiyaDilimiYonetim;
  adlar: Map<string, string>;
  simdi: number;
}) {
  const basladi = new Date(dilim.baslangic).getTime() <= simdi;
  const bitti = new Date(dilim.bitis).getTime() <= simdi;
  const rezerveler = dilim.rezervasyonlar.filter((r) => r.durum === "rezerve");
  const iptaller = dilim.rezervasyonlar.filter((r) => r.durum === "iptal");

  /*
   * BOŞ DİLİM İŞARETLİ. Yönetici için en kritik satır, kimsenin yer
   * ayırmadığı bir akşam vardiyası; listede diğerleriyle aynı görünseydi
   * gözden kaçardı.
   */
  const bosKaldi = !bitti && rezerveler.length === 0;

  return (
    <li
      className={`rounded-3xl border bg-white p-5 ${
        bosKaldi ? "border-domates/35" : "border-kahve-900/8"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-base font-extrabold text-kahve-900">
          {gunYaz(dilim.baslangic)} · {saatYaz(dilim.baslangic)} – {saatYaz(dilim.bitis)}
        </span>

        {dilim.bolge && (
          <span className="rounded-full bg-sari-500/15 px-2.5 py-0.5 text-2xs font-bold text-kahve-800">
            {dilim.bolge}
          </span>
        )}

        {basladi && !bitti && (
          <span className="rounded-full bg-nane/12 px-2.5 py-0.5 text-2xs font-bold text-nane-koyu">
            Sürüyor
          </span>
        )}

        <span className="ml-auto text-sm font-bold text-kahve-900">
          {rezerveler.length}/{dilim.kontenjan} yer
        </span>

        {!basladi && <VardiyaSil id={dilim.id} rezerveSayisi={rezerveler.length} />}
      </div>

      {dilim.not && <p className="mt-1.5 text-xs text-kahve-600">{dilim.not}</p>}

      {bosKaldi && (
        <p className="mt-2 text-xs font-bold text-domates-koyu">
          Kimse yer ayırmadı. Bu saatte sipariş bekleniyorsa kuryelere haber vermek gerekebilir.
        </p>
      )}

      {rezerveler.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {rezerveler.map((r) => (
            <li
              key={r.eposta}
              className="rounded-full border border-kahve-900/10 px-3 py-1 text-xs font-semibold text-kahve-800"
            >
              {adlar.get(r.eposta) ?? r.eposta}
            </li>
          ))}
        </ul>
      )}

      {/*
        İPTALLER DE GÖRÜNÜYOR: "vardiya başlamadan iki saat önce üç kişi düştü"
        bilgisi, kapasite planlamasında doluluk sayısı kadar önemli. Kayıt
        silinmediği için burada gösterilebiliyor (bkz. lib/kurye-vardiya).
      */}
      {iptaller.length > 0 && (
        <p className="mt-2 text-xs text-kahve-500">
          Bırakanlar: {iptaller.map((r) => adlar.get(r.eposta) ?? r.eposta).join(", ")}
        </p>
      )}
    </li>
  );
}
