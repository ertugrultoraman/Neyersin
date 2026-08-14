import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DurumRozeti } from "@/components/admin/DurumRozeti";
import { HazirDugmesi } from "@/components/panel/HazirDugmesi";
import { PanelKabuk } from "@/components/panel/PanelKabuk";
import { depoAl } from "@/lib/depo";
import { mutfakSahibiMi, oturumAl } from "@/lib/oturum";
import { calismayaAcikMi, kalemBirimFiyati } from "@/lib/siparis";
import { paraFormatla } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ceviri(await aktifDil())("siparis.icerik"),
    robots: { index: false, follow: false },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MUTFAĞIN SİPARİŞ DETAYI — şef, ev hanımı ve işletme için.
 *
 * NEDEN AYRI SAYFA: hem tahtadaki kart hem listedeki kart yeri dar; ürün adı
 * ve adet sığıyor ama seçilen ekstralar tek satıra sıkışıyor, uzun bir müşteri
 * notu kırpılıyordu. Yanlış hazırlanan bir siparişin sebebi çoğu zaman burada:
 * "acısız olsun", "ekstra peynir" gibi ayrıntılar okunmadan kalıyor.
 *
 * MÜŞTERİ BİLGİSİ YOK. Kart bileşenindeki kuralın aynısı: mutfağın işi yemeği
 * hazırlamak, kişisel veri yalnızca teslimatı yapan kuryede ve yöneticide
 * duruyor (bkz. components/panel/SiparisKarti.tsx). Detay sayfası "nasıl olsa
 * tek siparişe bakıyor" diye bu kuralı gevşetmiyor — ad, telefon ve adres
 * burada da geçmiyor.
 *
 * YETKİ SİPARİŞTEN OKUNUYOR: kişinin oturumundaki mutfak, siparişin mutfağıyla
 * aynı olmalı. Başka bir mutfağın sipariş numarasını adrese yazan biri 404
 * görüyor — "yetkin yok" demek, o numaranın var olduğunu söylemek olurdu.
 */
export default async function MutfakSiparisDetayi({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const c = ceviri(await aktifDil());
  const { no } = await params;
  const siparisNo = decodeURIComponent(no);

  const oturum = await oturumAl();
  if (!oturum) redirect(`/hesap/giris?donus=/panel/siparis/${encodeURIComponent(siparisNo)}`);

  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) notFound();

  /* İşletme ÇALIŞANI da görüyor: tahtada zaten gördüğü siparişin içeriği bu. */
  const yetkili =
    oturum.rol === "admin" ||
    (mutfakSahibiMi(oturum.rol) && oturum.restoranSlug === siparis.restoranSlug);
  if (!yetkili) notFound();

  const dil = await aktifDil();
  const tarih = new Date(siparis.olusturmaTarihi).toLocaleString(
    dil === "en" ? "en-GB" : "tr-TR",
    { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" },
  );

  const toplamAdet = siparis.kalemler.reduce((t, k) => t + k.adet, 0);

  /* Geri dönüş, kişinin siparişi gördüğü ekrana: işletmede tahta, şefte liste. */
  const donus =
    oturum.rol === "isletme"
      ? "/isletme"
      : oturum.rol === "admin"
        ? "/admin"
        : "/hesabim/siparisler?sekme=aldigim";

  return (
    <PanelKabuk
      oturum={oturum}
      baslik={siparis.siparisNo}
      aciklama={`${tarih} · ${siparis.restoranAdi}`}
      baglantilar={[{ href: donus, etiket: c("siparis.panelDon") }]}
    >
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <DurumRozeti durum={siparis.durum} />
        <span className="text-sm font-semibold text-kahve-600">
          {c("siparis.kalemSayisi", { cesit: siparis.kalemler.length, adet: toplamAdet })}
        </span>
        <span className="text-sm font-semibold text-kahve-600">
          ·{" "}
          {siparis.odemeYontemi === "iyzico"
            ? c("siparis.odemeKart")
            : c("siparis.odemeKapida")}
        </span>
      </div>

      {/*
        MÜŞTERİNİN NOTU EN ÜSTTE ve ürünlerden önce: yemek hazırlanmaya
        başlamadan okunması gereken tek alan bu. Tutarların yanına konsaydı
        sayfanın altında kalır, çoğu zaman hiç görülmezdi.
      */}
      <section className="mt-6 rounded-[2rem] border border-sari-500/35 bg-sari-500/8 p-6 md:p-8">
        <h2 className="font-display text-lg font-extrabold text-kahve-900">
          {c("siparis.musteriNotu")}
        </h2>
        {siparis.not?.trim() ? (
          <p className="mt-2 text-base leading-relaxed whitespace-pre-line text-kahve-900">
            {siparis.not}
          </p>
        ) : (
          <p className="mt-2 text-sm text-kahve-600">{c("siparis.notYok")}</p>
        )}
      </section>

      <section className="mt-8 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <h2 className="font-display text-xl font-extrabold text-kahve-900">
          {c("siparis.icerik")}
        </h2>
        <p className="mt-1 text-sm text-kahve-600">{c("siparis.icerikAciklama")}</p>

        <ul className="mt-6 space-y-3">
          {/*
            Anahtar `satirId`: aynı ürün farklı ekstralarla iki ayrı satır
            olabiliyor, ada göre anahtarlansaydı çakışırdı.
          */}
          {siparis.kalemler.map((k) => (
            <li
              key={k.satirId}
              className="rounded-2xl border border-kahve-900/10 bg-kahve-900/2 p-4 md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-display text-lg font-extrabold text-kahve-900">
                  <span className="text-sari-700">{k.adet}×</span> {k.ad}
                </p>
                <p className="font-display text-lg font-extrabold whitespace-nowrap text-kahve-900">
                  {paraFormatla(kalemBirimFiyati(k) * k.adet)}
                </p>
              </div>

              {/*
                EKSTRALAR TEK TEK, fiyatlarıyla. Kartta virgülle ayrılmış tek
                satırdı; üç ekstralı bir üründe hangisinin gerçekten seçildiği
                bakışta okunmuyordu.
              */}
              {k.ekstralar && k.ekstralar.length > 0 && (
                <div className="mt-3 border-t border-kahve-900/8 pt-3">
                  <p className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
                    {c("siparis.ekstralar")}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {k.ekstralar.map((e) => (
                      <li
                        key={e.id}
                        className="flex justify-between gap-3 text-sm font-semibold text-kahve-800"
                      >
                        <span>+ {e.ad}</span>
                        <span className="shrink-0 text-kahve-600">{paraFormatla(e.fiyat)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-[2rem] border border-kahve-900/8 bg-white p-6 shadow-kart md:p-8">
        <h2 className="font-display text-xl font-extrabold text-kahve-900">
          {c("siparis.tutarlar")}
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
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

        <p className="mt-5 border-t border-kahve-900/8 pt-4 text-xs text-kahve-400">
          {c("siparis.musteriGizli")}
        </p>
      </section>

      {/*
        Hazırlamayı bitirince kuryeye haber vermek de buradan yapılabilsin.
        Kapıda ödemeli sipariş `odeme-bekliyor` kalıyor (para kapıda alınıyor);
        `durum === "odendi"` koşulu düğmeyi o siparişlerde hiç göstermiyordu.
      */}
      {calismayaAcikMi(siparis) && siparis.durum !== "hazir" && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <HazirDugmesi siparisNo={siparis.siparisNo} />
          <Link
            href={donus}
            className="text-sm font-bold text-kahve-500 transition-colors hover:text-kahve-900"
          >
            {c("siparis.panelDon")}
          </Link>
        </div>
      )}
    </PanelKabuk>
  );
}
