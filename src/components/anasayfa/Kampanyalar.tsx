"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { anketSiraAction, type AnketSonucu } from "@/app/anket-actions";
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
import { Anket } from "./Anket";
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

/**
 * Kampanya ızgarası + ANKET.
 *
 * Anket ayrı bir şerit değil, kampanya kutucuklarının arasında duruyor:
 * ızgarada zaten boş kalan bir kutu vardı, anket tam oraya oturuyor ve sayfada
 * fazladan yer kaplamıyor.
 *
 * Yönetici girişliyken anket kutusu SÜRÜKLENEBİLİR; bırakıldığı sıra
 * sunucuya yazılıyor ve herkese o konumda görünüyor. Dokunmatik ekranda
 * sürükleme çalışmadığı için ok düğmeleri de var.
 */
export function Kampanyalar({
  anket,
  yonetici = false,
  kasikSirasi = -1,
  kasikToplami = 0,
}: {
  anket?: AnketSonucu;
  yonetici?: boolean;
  /** Şef Kaşığı kartının ızgaradaki yeri; -1 sona koyar. */
  kasikSirasi?: number;
  /** Bugüne kadar atılmış toplam kaşık. */
  kasikToplami?: number;
}) {
  const yonlendirici = useRouter();
  const { c, s: secDil } = useDil();
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);

  /** Anketin ızgaradaki yeri; -1 ve taşan değerler sona düşüyor. */
  const baslangicKonumu =
    anket && anket.sira >= 0 ? Math.min(anket.sira, kampanyalar.length) : kampanyalar.length;
  const [konum, setKonum] = useState(baslangicKonumu);
  /** Şef Kaşığı kartının yeri — anketle aynı sürükleme düzeni. */
  const [kasikKonum, setKasikKonum] = useState(
    kasikSirasi >= 0 ? Math.min(kasikSirasi, kampanyalar.length) : kampanyalar.length,
  );
  /**
   * Hangi kutu sürükleniyor? Eskiden boolean idi; ikinci sürüklenebilir kutu
   * gelince bırakma anında hangisinin taşınacağı bilinemiyordu.
   */
  const [suruklenen, setSuruklenen] = useState<"anket" | "kasik" | null>(null);
  const [ustundeki, setUstundeki] = useState<number | null>(null);

  /**
   * Yeni konumu iyimser gösterip sunucuya yazıyor; hata olursa sayfa
   * yenilenince eskiye döner.
   *
   * Anketin sırası kendi kaydında, Şef Kaşığı kartınınki genel ızgara
   * tablosunda tutuluyor — bu yüzden iki ayrı eylem çağrılıyor.
   */
  function konumaTasi(hangi: "anket" | "kasik", yeni: number) {
    const sinirli = Math.max(0, Math.min(yeni, kampanyalar.length));
    const veri = new FormData();

    if (hangi === "anket") {
      if (!anket) return;
      setKonum(sinirli);
      veri.set("id", anket.anketId);
      veri.set("sira", String(sinirli));
      startTransition(() => void anketSiraAction({}, veri));
      return;
    }

    setKasikKonum(sinirli);
    veri.set("anahtar", "sef-kasigi");
    veri.set("sira", String(sinirli));
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
   * Izgaradaki anket kutusu.
   *
   * Ziyaretçi için sıradan bir kart; YÖNETİCİ girişliyken üstünde sürükleme
   * kolu ve ok düğmeleri beliriyor. Oy verme düğmeleriyle sürüklemenin
   * çakışmaması için sürükleme yalnızca koldan başlıyor (`draggable` kutunun
   * tamamında değil, kolun üstünde).
   */
  function surukleKutusu(
    hangi: "anket" | "kasik",
    hedefKonum: number,
    icerik: React.ReactNode,
  ) {
    return (
      <KademeliOge key={hangi} etiket="li">
        <div
          draggable={yonetici}
          onDragStart={
            yonetici
              ? (e) => {
                  e.dataTransfer.effectAllowed = "move";
                  // Firefox sürüklemeyi ancak veri konunca başlatıyor.
                  e.dataTransfer.setData("text/plain", hangi);
                  setSuruklenen(hangi);
                }
              : undefined
          }
          onDragEnd={yonetici ? () => setSuruklenen(null) : undefined}
          className={cn(
            "h-full",
            yonetici && "cursor-grab",
            suruklenen === hangi && "opacity-70",
          )}
        >
          {yonetici && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl bg-kahve-900/5 px-3 py-2">
              <span aria-hidden="true" className="text-kahve-400">
                ⠿
              </span>
              <span className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
                {c("anket.surukleyerekTasi")}
              </span>
              <span className="ml-auto flex gap-1">
                <button
                  type="button"
                  onClick={() => konumaTasi(hangi, hedefKonum - 1)}
                  disabled={hedefKonum <= 0}
                  aria-label={c("anket.geriyeAl")}
                  className="tiklanabilir rounded-lg border border-kahve-900/12 px-2 py-0.5 text-xs
                    font-bold text-kahve-700 disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => konumaTasi(hangi, hedefKonum + 1)}
                  disabled={hedefKonum >= kampanyalar.length}
                  aria-label={c("anket.ileriyeAl")}
                  className="tiklanabilir rounded-lg border border-kahve-900/12 px-2 py-0.5 text-xs
                    font-bold text-kahve-700 disabled:opacity-40"
                >
                  →
                </button>
              </span>
            </div>
          )}
          {icerik}
        </div>
      </KademeliOge>
    );
  }

  /** Bir konuma denk gelen sürüklenebilir kutular (anket, Şef Kaşığı). */
  function ozelKutular(i: number) {
    const kutular = [];
    if (anket && konum === i) {
      kutular.push(surukleKutusu("anket", i, <Anket sonuc={anket} baslik={anket.soru} />));
    }
    if (kasikKonum === i) {
      kutular.push(surukleKutusu("kasik", i, <SefKasigiKarti toplam={kasikToplami} />));
    }
    return kutular;
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

      <Kademeli
        etiket="ul"
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {kampanyalar.flatMap((k, i) => {
          const ton = TONLAR[k.ton];
          const genis = i === 0;
          const kilitli = kilitliMi(k);

          return [
            ...ozelKutular(i),
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
                  suruklenen
                    ? (e) => {
                        e.preventDefault();
                        setUstundeki(i);
                      }
                    : undefined
                }
                onDragLeave={suruklenen ? () => setUstundeki(null) : undefined}
                onDrop={
                  suruklenen
                    ? (e) => {
                        e.preventDefault();
                        setUstundeki(null);
                        konumaTasi(suruklenen, i);
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

                <span
                  className={`relative grid size-11 place-items-center rounded-2xl ${ton.ikon}`}
                >
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
            </KademeliOge>,
          ];
        })}

        {/* Izgaranın sonundaki boş kutu — anketin varsayılan yeri. */}
        {/* Izgaranın sonuna düşen kutular — sıraları liste uzunluğuna eşit ya da fazlaysa. */}
        {ozelKutular(kampanyalar.length)}
      </Kademeli>
    </Bolum>
  );
}
