"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState, type ReactNode } from "react";

import { izgaraSiraAction } from "@/app/izgara-actions";
import {
  gunleriYaz,
  kampanyaBugunGecerliMi,
  kampanyalar,
  type Kampanya,
} from "@/content/kampanyalar";
import { cn } from "@/lib/utils";
import { useDil } from "../saglayici/DilBaglami";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { SimsekIkon } from "../ui/Ikonlar";
import { Kademeli, KademeliOge } from "../ui/Reveal";
import { SefKasigiKarti } from "./SefKasigiKarti";

/** Tailwind sınıfları statik kalmalı — tonlar sabit eşlemeyle veriliyor. */
const TONLAR: Record<Kampanya["ton"], { kart: string; vurgu: string; ikon: string }> = {
  sari: {
    kart: "bg-gradient-to-br from-sari-300 to-sari-500 text-kahve-900",
    vurgu: "text-kahve-900",
    ikon: "bg-kahve-900/12 text-kahve-900",
  },
  kahve: {
    kart: "bg-gradient-to-br from-kahve-700 to-kahve-900 text-sari-100",
    vurgu: "text-sari-400",
    ikon: "bg-white/12 text-sari-400",
  },
  domates: {
    kart: "bg-gradient-to-br from-domates to-domates-koyu text-white",
    vurgu: "text-white",
    ikon: "bg-white/18 text-white",
  },
  nane: {
    kart: "bg-gradient-to-br from-nane to-nane-koyu text-white",
    vurgu: "text-white",
    ikon: "bg-white/18 text-white",
  },
};

/** Son kutu ızgaranın sonu; -1 ve taşan sıralar oraya düşüyor. */
const SON_KONUM = kampanyalar.length;

function konumaSigdir(sira: number): number {
  return sira >= 0 ? Math.min(sira, SON_KONUM) : SON_KONUM;
}

/** Izgarada kampanya kartlarının arasında duran, taşınabilir kutu. */
type Kutu = {
  /** Konum haritasındaki ve React listesindeki kimliği. */
  anahtar: string;
  konum: number;
  /** Ekran okuyucuya "hangi kutu" diyebilmek için. */
  adi: string;
  icerik: ReactNode;
};

/**
 * Kampanya ızgarası + Şef Kaşığı tanıtım kutusu.
 *
 * Tanıtım kutusu ayrı bir şerit değil, kampanya kutucuklarının arasında
 * duruyor: ızgarada zaten boş kalan bir kutu vardı, oraya oturuyor ve sayfada
 * fazladan yer kaplamıyor.
 *
 * Yönetici girişliyken bu kutu SÜRÜKLENEBİLİR; bırakıldığı sıra sunucuya
 * yazılıyor ve herkese o konumda görünüyor. Dokunmatik ekranda sürükleme
 * çalışmadığı için ok düğmeleri de var.
 *
 * Anketler burada DEĞİL: sayfanın yan boşluklarına taşındılar
 * (bkz. `AnketRaylari`).
 */
export function Kampanyalar({
  yonetici = false,
  kasikSirasi = -1,
  kasikToplami = 0,
}: {
  yonetici?: boolean;
  /** Şef Kaşığı kartının ızgaradaki yeri; -1 sona koyar. */
  kasikSirasi?: number;
  /** Bugüne kadar atılmış toplam kaşık. */
  kasikToplami?: number;
}) {
  const yonlendirici = useRouter();
  const { c, s: secDil } = useDil();
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);

  /**
   * Taşınabilir kutuların yeri: kutu anahtarı → ızgara konumu.
   *
   * Yalnızca yöneticinin bu oturumda taşıdığı kutular burada; geri kalanı
   * sunucudan gelen `sira` alanına düşüyor. Böylece yeni yayınlanan bir anket
   * eski bir konum haritasına takılmıyor.
   */
  const [konumlar, setKonumlar] = useState<Record<string, number>>({});
  /** Hangi kutu sürükleniyor — bırakma anında taşınacak olan. */
  const [suruklenen, setSuruklenen] = useState<string | null>(null);
  const [ustundeki, setUstundeki] = useState<number | null>(null);

  const konumBul = (anahtar: string, sira: number) => konumlar[anahtar] ?? konumaSigdir(sira);

  const kutular: Kutu[] = [
    {
      anahtar: "kasik",
      konum: konumBul("kasik", kasikSirasi),
      adi: c("kasik.ad"),
      icerik: <SefKasigiKarti toplam={kasikToplami} />,
    },
  ];

  /**
   * Yeni konumu iyimser gösterip sunucuya yazıyor; hata olursa sayfa
   * yenilenince eskiye döner.
   */
  function konumaTasi(kutu: Kutu, yeni: number) {
    const sinirli = Math.max(0, Math.min(yeni, SON_KONUM));
    setKonumlar((eski) => ({ ...eski, [kutu.anahtar]: sinirli }));

    const veri = new FormData();
    veri.set("sira", String(sinirli));
    veri.set("anahtar", "sef-kasigi");
    startTransition(() => void izgaraSiraAction({}, veri));
  }

  /**
   * Gün kontrolü yalnızca tarayıcıda yapılır: ana sayfa statik üretildiği için
   * build anındaki gün donup kalırdı. Sunucu tarafı `kuponUygula` zaten aynı
   * kuralı uyguluyor — buradaki kilit sadece arayüz göstergesi.
   */
  const [bugunGecerli, setBugunGecerli] = useState<Record<string, boolean>>({});
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    const durum: Record<string, boolean> = {};
    for (const k of kampanyalar) durum[k.slug] = kampanyaBugunGecerliMi(k);
    setBugunGecerli(durum);
    setYuklendi(true);
  }, []);

  const kilitliMi = (k: Kampanya) => yuklendi && bugunGecerli[k.slug] === false;

  async function karttaTiklandi(k: Kampanya) {
    if (!k.kod) {
      // Kodsuz kampanya kartı restoran sayfasını açar (aşağı kaydırmaz).
      yonlendirici.push("/restoranlar");
      return;
    }
    if (kilitliMi(k)) return; // bugün geçerli değil — kopyalatma
    try {
      await navigator.clipboard.writeText(k.kod);
    } catch {
      // pano izni yok — kod zaten kart üzerinde okunabilir durumda
    }
    setKopyalanan(k.slug);
    setTimeout(() => setKopyalanan((s) => (s === k.slug ? null : s)), 1800);
  }

  /**
   * Izgaradaki taşınabilir kutu.
   *
   * Ziyaretçi için sıradan bir kart; YÖNETİCİ girişliyken üstünde sürükleme
   * kolu ve ok düğmeleri beliriyor. Oy verme düğmeleriyle sürüklemenin
   * çakışmaması için sürükleme yalnızca koldan başlıyor (`draggable` kutunun
   * tamamında değil, kolun üstünde).
   */
  function tasinabilirKutu(kutu: Kutu) {
    return (
      /*
       * `bagimsiz`: kutu, kapsayıcının kademe sırasına katılmadan kendi
       * açılışını yürütüyor. Kademe bir kez açıldıktan sonra listeye yeni
       * katılan öğe mirasla "gizli" kalıyor ve taşınan kutu bir daha hiç
       * görünmüyordu.
       */
      <KademeliOge key={kutu.anahtar} etiket="li" bagimsiz>
        <div
          draggable={yonetici}
          onDragStart={
            yonetici
              ? (e) => {
                  e.dataTransfer.effectAllowed = "move";
                  // Firefox sürüklemeyi ancak veri konunca başlatıyor.
                  e.dataTransfer.setData("text/plain", kutu.anahtar);
                  setSuruklenen(kutu.anahtar);
                }
              : undefined
          }
          onDragEnd={yonetici ? () => setSuruklenen(null) : undefined}
          className={cn(
            "h-full",
            yonetici && "cursor-grab",
            suruklenen === kutu.anahtar && "opacity-70",
          )}
        >
          {yonetici && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl bg-kahve-900/5 px-3 py-2">
              <span aria-hidden="true" className="text-kahve-400">
                ⠿
              </span>
              <span className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
                {c("kasik.surukleyerekTasi")}
              </span>
              <span className="ml-auto flex gap-1">
                <button
                  type="button"
                  onClick={() => konumaTasi(kutu, kutu.konum - 1)}
                  disabled={kutu.konum <= 0}
                  aria-label={c("kasik.geriyeAl")}
                  className="tiklanabilir rounded-lg border border-kahve-900/12 px-2 py-0.5 text-xs
                    font-bold text-kahve-700 disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => konumaTasi(kutu, kutu.konum + 1)}
                  disabled={kutu.konum >= SON_KONUM}
                  aria-label={c("kasik.ileriyeAl")}
                  className="tiklanabilir rounded-lg border border-kahve-900/12 px-2 py-0.5 text-xs
                    font-bold text-kahve-700 disabled:opacity-40"
                >
                  →
                </button>
              </span>
            </div>
          )}
          {kutu.icerik}
        </div>
      </KademeliOge>
    );
  }

  function kampanyaKarti(k: Kampanya, i: number) {
    const ton = TONLAR[k.ton];
    const genis = i === 0;
    const kilitli = kilitliMi(k);
    const suruklenenKutu = kutular.find((kt) => kt.anahtar === suruklenen);

    return (
      <KademeliOge
        key={k.slug}
        etiket="li"
        className={cn(genis && "sm:col-span-2", ustundeki === i && "opacity-60")}
      >
        <article
          role="button"
          tabIndex={0}
          aria-disabled={kilitli || undefined}
          onDragOver={
            suruklenenKutu
              ? (e) => {
                  e.preventDefault();
                  setUstundeki(i);
                }
              : undefined
          }
          onDragLeave={suruklenenKutu ? () => setUstundeki(null) : undefined}
          onDrop={
            suruklenenKutu
              ? (e) => {
                  e.preventDefault();
                  setUstundeki(null);
                  konumaTasi(suruklenenKutu, i);
                }
              : undefined
          }
          aria-label={
            kilitli
              ? c("kampanya.gecerliDegil", { baslik: secDil(k.baslik, k.baslikEn) })
              : k.kod
                ? c("kampanya.koduKopyala", { baslik: secDil(k.baslik, k.baslikEn) })
                : c("kampanya.restoranlaraGit", { baslik: secDil(k.baslik, k.baslikEn) })
          }
          onClick={() => karttaTiklandi(k)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              karttaTiklandi(k);
            }
          }}
          className={cn(
            "group relative flex h-full flex-col overflow-hidden rounded-4xl p-6 md:p-7",
            ton.kart,
            kilitli ? "cursor-not-allowed opacity-70 saturate-50" : "tiklanabilir kart-kalk",
          )}
        >
          {/* Dekoratif halkalar */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-12 size-44 rounded-full
              border-[14px] border-white/10 transition-transform duration-700
              ease-[var(--ease-yumusak)] group-hover:scale-110"
          />

          <span className={`relative grid size-11 place-items-center rounded-2xl ${ton.ikon}`}>
            <SimsekIkon className="size-5.5" />
          </span>

          <p
            className={`relative mt-5 font-display leading-none font-extrabold ${ton.vurgu}
              ${genis ? "text-6xl md:text-7xl" : "text-4xl"}`}
          >
            {k.vurgu}
          </p>

          <h3
            className={`relative mt-4 font-extrabold ${genis ? "text-2xl md:text-3xl" : "text-lg"}
              ${k.ton === "sari" ? "text-kahve-900" : "text-inherit"}`}
          >
            {secDil(k.baslik, k.baslikEn)}
          </h3>

          <p className="relative mt-2.5 flex-1 text-sm leading-relaxed opacity-85">
            {secDil(k.aciklama, k.aciklamaEn)}
          </p>

          {k.kod && (
            <p className="relative mt-5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-current/25",
                  "border-dashed px-3 py-2 font-mono text-sm font-bold tracking-wider transition-colors duration-300",
                )}
              >
                {kopyalanan === k.slug ? c("kampanya.kopyalandi") : k.kod}
              </span>
              {kilitli && (
                <span className="text-2xs font-bold tracking-wide uppercase opacity-85">
                  {c("kampanya.yalnizca", { gunler: gunleriYaz(k.gecerliGunler ?? [], c) })}
                </span>
              )}
            </p>
          )}
        </article>
      </KademeliOge>
    );
  }

  /*
   * Izgaranın öğeleri TEK bir dizide toplanıyor.
   *
   * Eskiden kampanyaların arasına giren kutularla sondaki kutular iki ayrı
   * dizideydi; kutu birinden diğerine geçince React onu taşımak yerine söküp
   * yeniden kuruyordu. Kaybolmasının yapısal sebebi buydu — tek dizide anahtar
   * korunduğu için kutu yalnızca yer değiştiriyor.
   */
  const ogeler: ReactNode[] = [];
  for (let i = 0; i < kampanyalar.length; i++) {
    for (const kutu of kutular.filter((kt) => kt.konum === i)) ogeler.push(tasinabilirKutu(kutu));
    ogeler.push(kampanyaKarti(kampanyalar[i], i));
  }
  // Izgaranın sonuna düşen kutular — sırası liste uzunluğuna eşit ya da fazlaysa.
  for (const kutu of kutular.filter((kt) => kt.konum >= SON_KONUM)) {
    ogeler.push(tasinabilirKutu(kutu));
  }

  return (
    <Bolum id="kampanyalar">
      <BolumBasligi
        ustBaslik={c("kampanya.ustBaslik")}
        baslik={c("kampanya.baslik")}
        aciklama={c("kampanya.aciklama")}
        yan={
          <ButonBaglanti href="/restoranlar" tur="hayalet" boyut="md">
            {c("genel.tumunuGor")}
            <OkIkon />
          </ButonBaglanti>
        }
      />

      <Kademeli etiket="ul" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ogeler}
      </Kademeli>
    </Bolum>
  );
}
