import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { DurumRozeti } from "@/components/admin/DurumRozeti";
import { OkIkon } from "@/components/ui/Buton";
import { AraIkon, SepetIkon } from "@/components/ui/Ikonlar";
import { oturumAl } from "@/lib/oturum";
import { depoAl, depoKaliciMi, serverlessMi } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { cevrimiciKuryeler, type KuryeDurumu } from "@/lib/kurye-dagitim";
import { sefPodyumunuAl } from "@/lib/sef-rozetleri-sunucu";
import type { SiparisDurumu } from "@/lib/siparis";
import { paraFormatla } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siparişler — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DURUM_SEKMELERI: { deger: string; etiket: string }[] = [
  { deger: "", etiket: "Tümü" },
  { deger: "odeme-bekliyor", etiket: "Ödeme bekleyen" },
  { deger: "odendi", etiket: "Ödenen" },
  { deger: "odeme-basarisiz", etiket: "Başarısız" },
  { deger: "iptal", etiket: "İptal" },
];

export default async function AdminSiparislerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; q?: string }>;
}) {
  const oturum = await oturumAl();
  // Şef oturumu yönetici paneline giremez — rol açıkça kontrol edilir.
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const { durum, q } = await searchParams;
  const depo = await depoAl();

  const gecerliDurum = DURUM_SEKMELERI.some((s) => s.deger === durum && s.deger !== "")
    ? (durum as SiparisDurumu)
    : undefined;

  const [siparisler, ozet, podyum] = await Promise.all([
    depo.listele({ durum: gecerliDurum, arama: q, limit: 300 }),
    depo.ozet(),
    sefPodyumunuAl(),
  ]);

  /**
   * Bekleyen işler — yöneticinin "haberim olmayan bir şey var mı?" sorusunun
   * cevabı. Müşteri tarafında üretilen her şeyin (destek talebi, başvuru,
   * yorum) burada bir karşılığı olmalı; depo erişilemezse sayfa yine açılsın.
   */
  let acikDestek = 0;
  let bekleyenBasvuru = 0;
  let toplamYorum = 0;
  let fiyatsizUrun = 0;
  let bekleyenKod = 0;
  try {
    const hesapDepo = await hesapDepoAl();
    const [destekler, basvurular, yorumlar, urunler, kodlar] = await Promise.all([
      hesapDepo.destekListele("acik"),
      hesapDepo.basvurulariListele("bekliyor"),
      hesapDepo.yorumlariListele(),
      hesapDepo.urunleriListele(),
      hesapDepo.kodlariListele(),
    ]);
    acikDestek = destekler.length;
    bekleyenBasvuru = basvurular.length;
    toplamYorum = yorumlar.length;
    // Fiyatı girilmemiş ürün satılamaz — yöneticinin görmesi gereken bir eksik.
    fiyatsizUrun = urunler.filter((u) => u.fiyat <= 0).length;
    // Postası gidememiş kodlar: yöneticinin kişiye elle iletmesi gerekiyor.
    bekleyenKod = kodlar.filter(
      (k) => !k.kullanildi && !k.gonderildi && new Date(k.sonGecerlilik).getTime() > Date.now(),
    ).length;
  } catch {
    // hesap deposu yoksa sayaçlar 0 kalır
  }

  /*
   * Sahadaki kuryeler ve adları. Dağıtım deposu susarsa liste boş kalıyor ve
   * sayfa yine açılıyor — sipariş yönetimi kurye durumuna bağlı değil.
   */
  let sahadakiler: KuryeDurumu[] = [];
  const kuryeAdlari = new Map<string, string>();
  try {
    const hesapDepo = await hesapDepoAl();
    const [durumlar, kuryeHesaplari] = await Promise.all([
      cevrimiciKuryeler(),
      hesapDepo.hesaplariListele("kurye"),
    ]);
    sahadakiler = durumlar;
    for (const h of kuryeHesaplari) kuryeAdlari.set(h.eposta.toLowerCase(), h.ad);
  } catch {
    // dağıtım deposu yoksa sahada kimse görünmez
  }

  const kartlar = [
    { etiket: "Bugün", deger: String(ozet.bugunSiparis), href: "/admin" },
    { etiket: "Ödeme bekleyen", deger: String(ozet.odemeBekleyen), href: "/admin?durum=bekliyor" },
    {
      etiket: "Açık destek talebi",
      deger: String(acikDestek),
      href: "/admin/destek?durum=acik",
      dikkat: acikDestek > 0,
    },
    {
      etiket: "Bekleyen başvuru",
      deger: String(bekleyenBasvuru),
      href: "/admin/basvurular",
      dikkat: bekleyenBasvuru > 0,
    },
    { etiket: "Yorum", deger: String(toplamYorum), href: "/admin/yorumlar" },
    {
      etiket: "Fiyatsız ürün",
      deger: String(fiyatsizUrun),
      href: "/admin/urunler?suzgec=fiyatsiz",
      dikkat: fiyatsizUrun > 0,
    },
    {
      etiket: "İletilecek kod",
      deger: String(bekleyenKod),
      href: "/admin/dogrulamalar",
      dikkat: bekleyenKod > 0,
    },
    { etiket: "Ödenen ciro", deger: paraFormatla(ozet.odenenCiro), href: "/admin" },
    // Podyumda kaç basamak dolu — üçü de boşsa rozet henüz kimseye gitmemiş.
    { etiket: "Rozetli şef", deger: `${podyum.length}/3`, href: "/admin/rozetler" },
  ];

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Siparişler"
      aciklama={`${ozet.toplamSiparis} kayıt · depo: ${depo.ad}`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      {/*
        Özet kartları — bekleyen iş varsa kart vurgulanır ve tıklanabilir.
        Rozet kartıyla birlikte dokuz oldular: 8'li ızgarada dokuzuncu tek
        başına ikinci satıra düşüyordu, 3/6 düzeni ikisini de tam dolduruyor.
      */}
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
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

      {/*
        SAHADAKİ KURYELER — dağıtımın çalışıp çalışmadığını gösteren tek yer.
        Sipariş bekliyorsa ilk bakılacak şey bu: kimse sahada değilse teklif
        de üretilmiyor demektir (bkz. lib/kurye-dagitim). Kart olarak değil
        liste olarak duruyor çünkü "kaç kişi" yetmiyor — hangi araçla ve ne
        zamandır orada olduğu, işi kime elle atayacağını belirliyor.
      */}
      <SahadakiKuryeler kuryeler={sahadakiler} adlar={kuryeAdlari} />

      {/* Filtreler */}
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Duruma göre filtrele" className="flex flex-wrap gap-2">
          {DURUM_SEKMELERI.map((s) => {
            const secili = (durum ?? "") === s.deger;
            const hedef = new URLSearchParams();
            if (s.deger) hedef.set("durum", s.deger);
            if (q) hedef.set("q", q);
            const qs = hedef.toString();
            return (
              <Link
                key={s.etiket}
                href={`/admin${qs ? `?${qs}` : ""}`}
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

        <form method="get" action="/admin" className="flex gap-2">
          {durum && <input type="hidden" name="durum" value={durum} />}
          <label className="flex items-center gap-2.5 rounded-2xl border border-kahve-900/10 bg-white px-4 py-2.5">
            <AraIkon className="size-4 shrink-0 text-kahve-400" />
            <span className="sr-only">Sipariş ara</span>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Sipariş no, ad, telefon, ilçe…"
              className="w-full min-w-40 bg-transparent text-sm font-medium text-kahve-900
                placeholder:text-kahve-400 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-kahve-900 px-4 py-2.5 text-sm font-bold text-sari-300
              transition-colors duration-300 hover:bg-kahve-800"
          >
            Ara
          </button>
        </form>
      </div>

      {/* Liste */}
      {siparisler.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-sari-500/16 text-sari-700">
            <SepetIkon className="size-7" />
          </span>
          <p className="mt-5 font-display text-lg font-extrabold text-kahve-900">
            {q || durum ? "Bu filtreyle sipariş yok" : "Henüz sipariş yok"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-kahve-500">
            {q || durum
              ? "Filtreyi temizleyip tekrar deneyin."
              : "Sitede bir sipariş oluşturulduğunda burada görünecek."}
          </p>
          {(q || durum) && (
            <Link
              href="/admin"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-sari-700
                transition-colors duration-300 hover:text-kahve-900"
            >
              Filtreleri temizle
              <OkIkon className="size-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-kahve-900/10">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-kahve-900 text-sari-200">
                {["Sipariş no", "Tarih", "Müşteri", "Restoran", "İlçe", "Ödeme", "Tutar", "Durum", ""].map(
                  (b) => (
                    <th
                      key={b}
                      className="px-4 py-3.5 font-display text-2xs font-extrabold tracking-wide uppercase"
                    >
                      {b}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-kahve-900/8 bg-white">
              {siparisler.map((s) => (
                <tr key={s.siparisNo} className="transition-colors duration-300 hover:bg-sari-500/6">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/siparis/${s.siparisNo}`}
                      className="font-mono text-xs font-bold text-kahve-900 underline
                        underline-offset-4 transition-colors duration-300 hover:text-sari-700"
                    >
                      {s.siparisNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-kahve-500">
                    {new Date(s.olusturmaTarihi).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block font-semibold text-kahve-900">{s.musteri.adSoyad}</span>
                    <span className="block text-xs text-kahve-500">{s.musteri.telefon}</span>
                  </td>
                  <td className="px-4 py-3.5 text-kahve-600">{s.restoranAdi}</td>
                  <td className="px-4 py-3.5 text-kahve-600">{s.adres.ilce}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-bold text-kahve-700">
                      {s.odemeYontemi === "iyzico" ? "Kart" : "Kapıda"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-display font-extrabold whitespace-nowrap text-kahve-900">
                    {paraFormatla(s.tutarlar.toplam)}
                  </td>
                  <td className="px-4 py-3.5">
                    <DurumRozeti durum={s.durum} />
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/siparis/${s.siparisNo}`}
                      aria-label={`${s.siparisNo} detayını aç`}
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
    </AdminKabuk>
  );
}

const ARAC_ADI: Record<string, string> = {
  motosiklet: "Motosiklet",
  moped: "Moped",
  otomobil: "Otomobil",
  scooter: "Scooter",
  bisiklet: "Bisiklet",
};

/** "3 dk önce" — saniye hassasiyeti bu listede bilgi taşımıyor. */
function neZaman(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime();
  const dk = Math.floor(fark / 60_000);
  if (dk < 1) return "az önce";
  return `${dk} dk önce`;
}

function SahadakiKuryeler({
  kuryeler,
  adlar,
}: {
  kuryeler: KuryeDurumu[];
  adlar: Map<string, string>;
}) {
  return (
    <section className="mt-8 rounded-3xl border border-kahve-900/8 bg-white p-5 md:p-7">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-lg font-extrabold text-kahve-900">Sahadaki kuryeler</h2>
        <span className="text-sm text-kahve-500">
          {kuryeler.length > 0 ? `${kuryeler.length} kişi çevrimiçi` : "şu an kimse yok"}
        </span>
      </div>

      {kuryeler.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-kahve-900/4 px-4 py-3 text-sm text-kahve-600">
          Çevrimiçi kurye olmadığı sürece siparişler teklif olarak dağıtılmaz. Bekleyen sipariş
          varsa şeflere haber verip kuryeye elle atama yapabilirsin.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {kuryeler.map((k) => (
            <li
              key={k.eposta}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-kahve-900/8 px-4 py-3"
            >
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span className="text-sm font-semibold text-kahve-900">
                {adlar.get(k.eposta) ?? k.eposta}
              </span>
              {k.arac && (
                <span className="rounded-full bg-sari-500/15 px-2 py-0.5 text-2xs font-bold text-kahve-800">
                  {ARAC_ADI[k.arac] ?? k.arac}
                </span>
              )}
              <span className="ml-auto text-xs text-kahve-500">
                {/*
                  Konum yoksa yalnızca "çevrimiçi" yazıyor: kurye vardiyayı
                  açmış ama izin vermemiş ya da henüz ilk konum gelmemiş
                  olabilir. "Konum yok" demek, sorunun görünür kalmasını
                  sağlıyor.
                */}
                {k.konumTarihi ? `konum ${neZaman(k.konumTarihi)}` : "konum yok"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
