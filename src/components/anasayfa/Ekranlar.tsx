"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { AkilliGorsel } from "../ui/AkilliGorsel";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { DukkanIkon, KontrolIkon, KullaniciIkon, ScooterIkon } from "../ui/Ikonlar";
import { Rozet } from "../ui/Rozet";

const EKRANLAR = [
  {
    id: "kullanici",
    etiket: "Kullanıcı Ekranı",
    Ikon: KullaniciIkon,
    baslik: "Sipariş vermek üç dokunuş sürsün",
    ozet:
      "Adres, arama ve filtreleme tek ekranda. Kampanyalar sepette otomatik uygulanır, " +
      "sipariş sonrası canlı takip aynı yerden açılır.",
    gorsel: "home/ekran-kullanici",
    oran: "3/4" as const,
    ozellikler: [
      "Mahalle bazlı restoran listesi; puan, süre ve minimum sepete göre filtre",
      "Ürün bazlı özelleştirme: malzeme çıkarma, porsiyon ve not alanı",
      "Kampanya ve kupon motoru — indirim sepette anında görünür",
      "Kayıtlı adres ve ödeme yöntemleriyle tek dokunuşla tekrar sipariş",
      "Sipariş sonrası canlı kurye takibi ve tahmini varış saati",
    ],
  },
  {
    id: "kurye",
    etiket: "Kurye Ekranı",
    Ikon: ScooterIkon,
    baslik: "Kurye ne yapacağını tartışmasız bilsin",
    ozet:
      "Yeni sipariş bildirimi, sıralı duraklar ve tek dokunuşla teslim onayı. Kazanç ve " +
      "prim aynı ekranda şeffaf biçimde görünür.",
    gorsel: "home/ekran-kurye",
    oran: "3/4" as const,
    ozellikler: [
      "Sesli ve titreşimli yeni sipariş bildirimi; kabul için tek buton",
      "Sıralı durak listesi ve harita uygulamasına doğrudan aktarım",
      "Teslim kanıtı: fotoğraf, konum ve zaman damgası otomatik kaydedilir",
      "Vardiya kazancı, prim ve bekleme telafisi canlı hesaplanır",
      "Çevrimdışı çalışma: bağlantı gelince kayıtlar kuyruktan senkronlanır",
    ],
  },
  {
    id: "restoran",
    etiket: "Restoran Ekranı",
    Ikon: DukkanIkon,
    baslik: "Mutfak ve ciro aynı panelde",
    ozet:
      "Tüm kanallardan gelen siparişler tek kuyrukta. Mutfak ekranı, stok kontrolü ve " +
      "günlük ciro özeti tek panelden yönetilir.",
    gorsel: "home/ekran-restoran",
    oran: "4/3" as const,
    ozellikler: [
      "Tek sipariş kuyruğu: online, telefon ve salon siparişleri aynı listede",
      "Mutfak ekranı (KDS): üç kolon, süre sayacı ve gecikme uyarısı",
      "Tükenen ürünü tek dokunuşla kapat — tüm kanallarda anında görünmez olur",
      "Paketleme kontrol listesi ile eksik ürün şikâyetlerini azalt",
      "Günlük ciro, ürün kârlılığı ve iptal nedenleri raporu",
    ],
  },
];

export function Ekranlar() {
  const [aktif, setAktif] = useState(EKRANLAR[0].id);
  const azalt = useReducedMotion();
  const ekran = EKRANLAR.find((e) => e.id === aktif) ?? EKRANLAR[0];

  return (
    <Bolum id="ekranlar" className="relative overflow-hidden bg-krem-koyu/60">
      <BolumBasligi
        ustBaslik="Tek platform, üç rol"
        baslik={
          <>
            Müşteri, kurye ve restoran — <span className="metin-sari">aynı akış</span>
          </>
        }
        aciklama="Her rol yalnızca kendi işini görür; ama üçü aynı sipariş kaydı üzerinde çalışır."
      />

      {/* Sekme şeridi */}
      <div
        role="tablist"
        aria-label="Ekranlar"
        className="mt-10 flex gap-2 overflow-x-auto pb-2 gizli-scroll"
      >
        {EKRANLAR.map((e) => {
          const secili = e.id === aktif;
          return (
            <button
              key={e.id}
              role="tab"
              type="button"
              id={`sekme-${e.id}`}
              aria-selected={secili}
              aria-controls={`panel-${e.id}`}
              onClick={() => setAktif(e.id)}
              className={`relative flex shrink-0 items-center gap-2.5 rounded-full px-5 py-3
                text-sm font-bold transition-colors duration-300
                ${secili ? "text-kahve-900" : "text-kahve-500 hover:text-kahve-800"}`}
            >
              {secili && (
                <motion.span
                  layoutId="ekran-sekme"
                  className="absolute inset-0 rounded-full bg-sari-500 shadow-sari"
                  transition={{ duration: azalt ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <e.Ikon className="relative size-4.5" />
              <span className="relative">{e.etiket}</span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={ekran.id}
            id={`panel-${ekran.id}`}
            role="tabpanel"
            aria-labelledby={`sekme-${ekran.id}`}
            initial={{ opacity: 0, y: azalt ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: azalt ? 0 : -12 }}
            transition={{ duration: azalt ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid items-center gap-10 rounded-[2.5rem] border border-kahve-900/8
              bg-white/75 p-6 shadow-kart backdrop-blur-sm md:p-10 lg:grid-cols-2 lg:gap-14"
          >
            <div>
              <Rozet ton="sari">{ekran.etiket}</Rozet>
              <h3 className="mt-5 text-2xl font-extrabold sm:text-3xl">{ekran.baslik}</h3>
              <p className="mt-3.5 leading-relaxed text-kahve-600">{ekran.ozet}</p>

              <ul className="mt-7 space-y-3.5">
                {ekran.ozellikler.map((o, i) => (
                  <motion.li
                    key={o}
                    initial={{ opacity: 0, x: azalt ? 0 : -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: azalt ? 0 : 0.12 + i * 0.07,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="flex gap-3 text-sm leading-relaxed text-kahve-700"
                  >
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-nane/14 text-nane-koyu">
                      <KontrolIkon className="size-3.5" strokeWidth="2.6" />
                    </span>
                    {o}
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-4 rotate-2 rounded-[2.5rem] bg-sari-500/18"
              />
              <AkilliGorsel
                anahtar={ekran.gorsel}
                oran={ekran.oran}
                sizes="(min-width: 1024px) 34rem, 90vw"
                className="rounded-[1.75rem] shadow-kalkik ring-1 ring-kahve-900/8"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Bolum>
  );
}
