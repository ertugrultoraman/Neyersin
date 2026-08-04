"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { anketSiraAction, type AnketSonucu } from "@/app/anket-actions";
import {
  gunleriYaz,
  kampanyaBugunGecerliMi,
  kampanyalar,
  type Kampanya,
} from "@/content/kampanyalar";
import { cn } from "@/lib/utils";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { SimsekIkon } from "../ui/Ikonlar";
import { Kademeli, KademeliOge } from "../ui/Reveal";
import { Anket } from "./Anket";

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
}: {
  anket?: AnketSonucu;
  yonetici?: boolean;
}) {
  const yonlendirici = useRouter();
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);

  /** Anketin ızgaradaki yeri; -1 ve taşan değerler sona düşüyor. */
  const baslangicKonumu =
    anket && anket.sira >= 0 ? Math.min(anket.sira, kampanyalar.length) : kampanyalar.length;
  const [konum, setKonum] = useState(baslangicKonumu);
  const [suruklenen, setSuruklenen] = useState(false);
  const [ustundeki, setUstundeki] = useState<number | null>(null);

  /** Yeni konumu iyimser gösterip sunucuya yazıyor; hata olursa sayfa yenilenince eskiye döner. */
  function konumaTasi(yeni: number) {
    if (!anket) return;
    const sinirli = Math.max(0, Math.min(yeni, kampanyalar.length));
    setKonum(sinirli);
    const veri = new FormData();
    veri.set("id", anket.anketId);
    veri.set("sira", String(sinirli));
    startTransition(() => {
      void anketSiraAction({}, veri);
    });
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
  function anketKutusu(hedefKonum: number) {
    if (!anket) return null;

    return (
      <KademeliOge key="anket" etiket="li">
        <div
          draggable={yonetici}
          onDragStart={
            yonetici
              ? (e) => {
                  e.dataTransfer.effectAllowed = "move";
                  // Firefox sürüklemeyi ancak veri konunca başlatıyor.
                  e.dataTransfer.setData("text/plain", "anket");
                  setSuruklenen(true);
                }
              : undefined
          }
          onDragEnd={yonetici ? () => setSuruklenen(false) : undefined}
          className={cn("h-full", yonetici && "cursor-grab", suruklenen && "opacity-70")}
        >
          {yonetici && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl bg-kahve-900/5 px-3 py-2">
              <span aria-hidden="true" className="text-kahve-400">
                ⠿
              </span>
              <span className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
                Sürükleyerek taşı
              </span>
              <span className="ml-auto flex gap-1">
                <button
                  type="button"
                  onClick={() => konumaTasi(hedefKonum - 1)}
                  disabled={hedefKonum <= 0}
                  aria-label="Anketi bir kutu geriye al"
                  className="tiklanabilir rounded-lg border border-kahve-900/12 px-2 py-0.5 text-xs
                    font-bold text-kahve-700 disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => konumaTasi(hedefKonum + 1)}
                  disabled={hedefKonum >= kampanyalar.length}
                  aria-label="Anketi bir kutu ileriye al"
                  className="tiklanabilir rounded-lg border border-kahve-900/12 px-2 py-0.5 text-xs
                    font-bold text-kahve-700 disabled:opacity-40"
                >
                  →
                </button>
              </span>
            </div>
          )}
          <Anket sonuc={anket} baslik={anket.soru} />
        </div>
      </KademeliOge>
    );
  }

  return (
    <Bolum id="kampanyalar">
      <BolumBasligi
        ustBaslik="Fırsatlar"
        baslik="Bu haftanın kampanyaları"
        aciklama="Karta dokun, kodu kopyala — ödeme adımında yapıştır, indirim otomatik uygulanır."
        yan={
          <ButonBaglanti href="/restoranlar" tur="hayalet" boyut="md">
            Tümünü gör
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
            ...(anket && konum === i ? [anketKutusu(i)] : []),
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
                        konumaTasi(i);
                      }
                    : undefined
                }
                aria-label={
                  kilitli
                    ? `${k.baslik} — bugün geçerli değil`
                    : k.kod
                      ? `${k.baslik} — kupon kodunu kopyala`
                      : `${k.baslik} — restoranlara git`
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
                  {k.baslik}
                </h3>

                <p className="relative mt-2.5 flex-1 text-sm leading-relaxed opacity-85">
                  {k.aciklama}
                </p>

                {k.kod && (
                  <p className="relative mt-5 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border border-current/25",
                        "border-dashed px-3 py-2 font-mono text-sm font-bold tracking-wider transition-colors duration-300",
                      )}
                    >
                      {kopyalanan === k.slug ? "Kopyalandı ✓" : k.kod}
                    </span>
                    {kilitli && (
                      <span className="text-2xs font-bold tracking-wide uppercase opacity-85">
                        Yalnızca {gunleriYaz(k.gecerliGunler ?? [])}
                      </span>
                    )}
                  </p>
                )}
              </article>
            </KademeliOge>,
          ];
        })}

        {/* Izgaranın sonundaki boş kutu — anketin varsayılan yeri. */}
        {anket && konum >= kampanyalar.length && anketKutusu(kampanyalar.length)}
      </Kademeli>
    </Bolum>
  );
}
