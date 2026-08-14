import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DurumRozeti } from "@/components/admin/DurumRozeti";
import { SiparisDestekDugmesi } from "@/components/destek/SiparisDestekDugmesi";
import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { YorumFormu } from "@/components/yorum/YorumFormu";
import { depoAl } from "@/lib/depo";
import { aktifDil } from "@/lib/dil-sunucu";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { kalemBirimFiyati, tamamlandiMi } from "@/lib/siparis";
import { ceviri } from "@/lib/sozluk";
import { paraFormatla } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("ozet.siparisim"),
    robots: { index: false, follow: false },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MÜŞTERİNİN SİPARİŞ ÖZETİ — teslimattan sonra açılan sayfa.
 *
 * NEDEN VAR: sipariş teslim edildikten sonra müşterinin gidebileceği hiçbir
 * yer yoktu. Listede küçük bir kart ve onun içinde bir "değerlendir" düğmesi
 * duruyordu; yemek gelmiş, iş bitmiş, ekranda bunu karşılayan bir şey yoktu.
 * Değerlendirme de o düğmenin arkasında saklı kaldığı için çok az sipariş
 * puanlanıyordu — oysa puan mutfakların sayfasında görünen tek gerçek veri.
 *
 * SARI ZEMİN yalnızca teslim edilmiş siparişte: kutlama bir sonuç bildirimi.
 * Yolda olan siparişte de aynı sayfa açılıyor ama sakin duruyor — "afiyet
 * olsun" demek, yemek daha gelmeden anlamsız olurdu.
 *
 * YETKİ: yalnızca siparişi VEREN kişi (ve yönetici). Başkasının sipariş
 * numarasını adrese yazan biri 404 görüyor — "yetkin yok" demek, o numaranın
 * var olduğunu söylemek olurdu. Aynı kural mutfağın detay sayfasında da var
 * (bkz. app/panel/siparis/[no]).
 */
export default async function SiparisOzetiSayfasi({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const dil = await aktifDil();
  const c = ceviri(dil);
  const { no } = await params;
  const siparisNo = decodeURIComponent(no);

  const oturum = await oturumAl();
  if (!oturum) redirect(`/hesap/giris?donus=/siparis/${encodeURIComponent(siparisNo)}`);

  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) notFound();

  const sahibi =
    (siparis.musteri?.eposta ?? "").trim().toLowerCase() === oturum.eposta.trim().toLowerCase();
  if (!sahibi && oturum.rol !== "admin") notFound();

  const teslimEdildi = tamamlandiMi(siparis.durum);

  /*
   * Yorum durumu depo susarsa "yazılmamış" kabul ediliyor: form yine çıkıyor
   * ve ikinci yorumu sunucu zaten reddediyor (bkz. hesabim/yorum-actions).
   * Ters varsayım, hiç değerlendirmemiş kişiye "teşekkürler" derdi.
   */
  let yorumlandi = false;
  try {
    yorumlandi = await (await hesapDepoAl()).siparisYorumlandiMi(siparisNo);
  } catch {
    /* sessiz */
  }

  const tarih = new Date(siparis.olusturmaTarihi).toLocaleString(
    dil === "en" ? "en-GB" : "tr-TR",
    { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" },
  );

  return (
    <div className="kap py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        {teslimEdildi ? (
          <section className="rounded-[2rem] bg-sari-500 p-8 text-center md:p-10">
            <h1 className="font-display text-3xl font-extrabold text-kahve-900 sm:text-4xl">
              {c("ozet.afiyetOlsun")}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed font-semibold text-kahve-800">
              {c("ozet.teslimEdildi", { restoran: siparis.restoranAdi })}
            </p>

            <p className="mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-white/85 px-7 py-4">
              <span className="text-2xs font-bold tracking-[0.16em] text-kahve-500 uppercase">
                {c("ozet.odenen")}
              </span>
              <span className="font-display text-3xl font-extrabold text-kahve-900">
                {paraFormatla(siparis.tutarlar.toplam)}
              </span>
              <span className="text-xs font-semibold text-kahve-600">{siparis.siparisNo}</span>
            </p>
          </section>
        ) : (
          <section className="rounded-[2rem] border border-kahve-900/8 bg-white p-8 text-center md:p-10">
            <h1 className="font-display text-2xl font-extrabold text-kahve-900 sm:text-3xl">
              {c("ozet.yolda")}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-kahve-700">
              {c("ozet.yoldaAciklama")}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <DurumRozeti durum={siparis.durum} />
              <span className="text-sm font-semibold text-kahve-600">{siparis.siparisNo}</span>
            </div>
          </section>
        )}

        {/*
          DEĞERLENDİRME EN ÜSTTE, ürünlerin önünde. Sayfanın altına konsaydı
          kişi zaten bildiği şeyi (ne sipariş ettiğini) okuyup çıkar, asıl
          istediğimiz şeye hiç ulaşmazdı. Form açık başlıyor: bu sayfada bir
          düğmenin arkasına saklamak fazladan bir dokunuş demekti.
        */}
        {teslimEdildi && (
          <section className="mt-6 rounded-[2rem] border border-sari-500/40 bg-sari-500/8 p-6 md:p-8">
            <h2 className="font-display text-xl font-extrabold text-kahve-900">
              {c("ozet.begendinizMi")}
            </h2>
            {yorumlandi ? (
              <p className="mt-2 text-sm font-semibold text-nane-koyu">{c("ozet.tesekkurler")}</p>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-kahve-700">
                  {c("ozet.begendinizMiAciklama")}
                </p>
                <div className="mt-5">
                  <YorumFormu siparisNo={siparis.siparisNo} acikBasla />
                </div>
              </>
            )}
          </section>
        )}

        <section className="mt-6 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-extrabold text-kahve-900">
              {c("ozet.siparisim")}
            </h2>
            <span className="text-xs font-semibold text-kahve-500">{tarih}</span>
          </div>
          <p className="mt-1 text-sm text-kahve-600">{siparis.restoranAdi}</p>

          <ul className="mt-5 space-y-3">
            {/* Anahtar `satirId`: aynı ürün farklı ekstralarla iki ayrı satır olabiliyor. */}
            {siparis.kalemler.map((k) => (
              <li key={k.satirId} className="rounded-2xl bg-kahve-900/3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-display text-base font-extrabold text-kahve-900">
                    <span className="text-sari-700">{k.adet}×</span> {k.ad}
                  </p>
                  <p className="font-display text-base font-extrabold whitespace-nowrap text-kahve-900">
                    {paraFormatla(kalemBirimFiyati(k) * k.adet)}
                  </p>
                </div>
                {k.ekstralar && k.ekstralar.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-kahve-900/8 pt-2">
                    {k.ekstralar.map((e) => (
                      <li
                        key={e.id}
                        className="flex justify-between gap-3 text-xs font-semibold text-kahve-700"
                      >
                        <span>+ {e.ad}</span>
                        <span className="shrink-0 text-kahve-500">{paraFormatla(e.fiyat)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-kahve-900/8 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-kahve-600">{c("sepet.araToplam")}</dt>
              <dd className="font-semibold text-kahve-900">
                {paraFormatla(siparis.tutarlar.araToplam)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-kahve-600">{c("sepet.teslimatUcreti")}</dt>
              <dd className="font-semibold text-kahve-900">
                {paraFormatla(siparis.tutarlar.teslimatUcreti)}
              </dd>
            </div>
            {siparis.tutarlar.indirim > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-kahve-600">
                  {c("siparis.indirim")}
                  {siparis.tutarlar.kuponKodu && (
                    <span className="ml-1.5 text-xs text-kahve-500">
                      {c("siparis.kuponKodu", { kod: siparis.tutarlar.kuponKodu })}
                    </span>
                  )}
                </dt>
                <dd className="font-semibold text-nane-koyu">
                  −{paraFormatla(siparis.tutarlar.indirim)}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-kahve-900/8 pt-2.5">
              <dt className="font-display text-base font-extrabold text-kahve-900">
                {c("sepet.toplam")}
              </dt>
              <dd className="font-display text-base font-extrabold text-kahve-900">
                {paraFormatla(siparis.tutarlar.toplam)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-kahve-900/8 pt-4">
            <p className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
              {c("ozet.teslimAdresi")}
            </p>
            <p className="mt-1 text-sm text-kahve-700">
              {[
                siparis.adres.mahalle,
                siparis.adres.acikAdres,
                siparis.adres.binaNo && `No: ${siparis.adres.binaNo}`,
                siparis.adres.daireNo && `Daire: ${siparis.adres.daireNo}`,
                siparis.adres.ilce,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButonBaglanti href={`/restoran/${siparis.restoranSlug}`} boyut="lg">
            {c("ozet.yeniSiparis")}
            <OkIkon />
          </ButonBaglanti>
          <Link
            href="/hesabim/siparisler"
            className="tiklanabilir inline-flex items-center rounded-2xl border border-kahve-900/12
              px-5 py-3 text-sm font-bold text-kahve-700 transition-colors hover:text-kahve-900"
          >
            {c("menu.siparislerim")}
          </Link>
          <SiparisDestekDugmesi siparisNo={siparis.siparisNo} />
        </div>
      </div>
    </div>
  );
}
