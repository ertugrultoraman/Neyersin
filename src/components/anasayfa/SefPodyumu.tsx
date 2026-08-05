import Image from "next/image";
import Link from "next/link";

import { aktifDil } from "@/lib/dil-sunucu";
import { gorselCoz } from "@/lib/images";
import { sefPodyumunuAl } from "@/lib/sef-rozetleri-sunucu";
import {
  BASAMAKLAR,
  PODYUM_SIRASI,
  siparisAnahtari,
  type RozetBasamagi,
} from "@/lib/sef-rozetleri";
import { ceviri } from "@/lib/sozluk";
import { cn } from "@/lib/utils";
import { AkilliGorsel } from "../ui/AkilliGorsel";
import { Reveal } from "../ui/Reveal";
import { UstBaslik } from "../ui/Rozet";

/** Basamak yükseklikleri — birinci en yüksek, üçüncü en alçak. */
const KUTU_YUKSEKLIGI: Record<RozetBasamagi, string> = {
  1: "h-20 md:h-24",
  2: "h-14 md:h-16",
  3: "h-10 md:h-12",
};

/**
 * ŞEF PODYUMU — en çok sipariş alan üç şef, şapka rozetleriyle.
 *
 * Hero'dan kaldırılan üretilmiş kurye çiziminin yerine geçiyor. Aradaki fark
 * bilerek: o çizim kurgusal bir sahneydi, bu bölüm veritabanındaki gerçek
 * sipariş sayılarını gösteriyor ve her isim şefin kendi profiline gidiyor.
 *
 * Kimse podyuma çıkmadıysa bölüm GİZLENMİYOR, basamaklar soru işaretiyle boş
 * duruyor: ödülün var olduğunu duyurmak sistemin tanıtımının kendisi ve boş
 * basamak "burası senin olabilir" diyor. Bölümü tamamen gizleseydik şefler
 * ödülden hiç haberdar olmazdı.
 */
export async function SefPodyumu() {
  const dil = await aktifDil();
  const c = ceviri(dil);
  const rozetler = await sefPodyumunuAl();
  const sayiDili = dil === "en" ? "en-GB" : "tr-TR";
  const kimseYok = rozetler.length === 0;

  /** Basamağı kim tuttuysa o; boşsa undefined. */
  const basamaktaki = (basamak: RozetBasamagi) =>
    rozetler.find((r) => r.basamak === basamak);

  return (
    <Reveal gecikme={0.12}>
      <div
        className="relative overflow-hidden rounded-[2.5rem] border border-kahve-900/8
          bg-white/75 p-6 shadow-kart backdrop-blur-sm sm:p-8"
      >
        {/* Sahne ışığı — referans görseldeki spot etkisinin CSS karşılığı. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-16 h-56
            bg-[radial-gradient(ellipse_at_center,var(--color-sari-300)_0%,transparent_70%)] opacity-45"
        />

        <div className="relative">
          <UstBaslik>{c("sefRozeti.ustBaslik")}</UstBaslik>
          <h2 className="mt-3 font-display text-xl leading-tight font-extrabold text-kahve-900 sm:text-2xl">
            {c("sefRozeti.baslik")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            {kimseYok ? c("sefRozeti.henuzYok") : c("sefRozeti.aciklama")}
          </p>

          {/*
            `items-end`: basamaklar farklı yükseklikte ve ALTTAN hizalanmalı;
            üstten hizalansalardı birinci şef aşağıda kalır, podyum ters görünürdü.

            `pt-16`: şapkalar MUTLAK konumlu, yani yükseklik hesabına girmiyor.
            Yer ayrılmazsa dairenin üstüne taşan kısım açıklama metninin
            üzerine biner. Ayrılan pay en büyük dairenin çapına göre
            (yaklaşık 0,73 × çap).
          */}
          <ul className="relative mt-5 flex items-end justify-center gap-2 pt-16 sm:gap-3">
            {PODYUM_SIRASI.map((basamak) => {
              const tanim = BASAMAKLAR[basamak];
              const sahip = basamaktaki(basamak);
              const birinci = basamak === 1;

              const icerik = (
                <>
                  {/*
                    ŞAPKANIN DAİREYE GÖRE YERİ — referans görselden ÖLÇÜLDÜ.

                    Şapka bir süre daireden %27 geniş, tam ortalı ve %28
                    bindirmeli duruyordu; bant sağa taşıyor ve şapka kafadan
                    kayıyormuş gibi görünüyordu. Kullanıcının verdiği podyum
                    görseli ölçüldüğünde yerleşimin apayrı olduğu çıktı
                    (D = daire çapı):

                      genişlik  ≈ D × 1,00   (daireyle aynı)
                      yatay     ≈ D × 0,18 SOLA kaydırılmış
                      bindirme  ≈ D × 0,18   (band dairenin üstüne oturuyor)

                    Şapkanın kabarık tepesi bandın sağına doğru taşıyor
                    (ölçüm: +%3,5); sola kaydırma bunu dengeliyor ve şapka
                    kafaya yan takılmış gibi duruyor — referanstaki hâli.

                    Konumlandırma MUTLAK: daire sarmalayıcısının yüksekliği
                    çapa eşit olduğu için `bottom-[82%]` bindirmeyi doğrudan
                    çap cinsinden veriyor. `-translate-x-[68%]` = ortalamak
                    için %50 + sola kaydırma için %18 (şapka genişliği çapa
                    eşit olduğundan oran birebir).
                  */}
                  <span
                    className={cn(
                      "relative mx-auto block",
                      birinci ? "w-[70%]" : "w-[58%]",
                    )}
                  >
                    <Image
                      src={tanim.gorsel}
                      alt={c(tanim.adAnahtari)}
                      width={384}
                      height={330}
                      priority
                      className="absolute bottom-[82%] left-1/2 z-10 w-full max-w-none
                        -translate-x-[68%] drop-shadow-sm"
                    />

                    {sahip && gorselCoz(`sef/${sahip.slug}`).tur === "uzak" ? (
                      <AkilliGorsel
                        anahtar={`sef/${sahip.slug}`}
                        alt={sahip.ad}
                        oran="1/1"
                        sizes="96px"
                        className="w-full rounded-full ring-4 ring-white"
                      />
                    ) : sahip ? (
                      /*
                        Fotoğrafı olmayan şef için BAŞ HARF.
                        Varsayılan `MarkaPlaceholder` düz sarı bir blok basıyor;
                        geniş kart görselinde sorun değil ama buradaki küçük
                        dairede tanımsız bir sarı leke gibi duruyordu.
                      */
                      <span
                        aria-hidden="true"
                        className="grid aspect-square w-full place-items-center rounded-full
                          bg-gradient-to-br from-sari-300 to-sari-500 ring-4 ring-white
                          font-display text-2xl font-extrabold text-kahve-900"
                      >
                        {sahip.ad.trim().charAt(0).toLocaleUpperCase(dil === "en" ? "en-GB" : "tr-TR")}
                      </span>
                    ) : (
                      <span
                        className="grid aspect-square w-full place-items-center rounded-full
                          border-2 border-dashed border-kahve-900/20 bg-white/70
                          font-display text-2xl font-extrabold text-kahve-300"
                      >
                        ?<span className="sr-only">{c("sefRozeti.bosBasamak")}</span>
                      </span>
                    )}
                  </span>

                  {/*
                    `truncate` YALNIZCA dolu basamakta: şef adı uzunsa tek
                    satırda kalmalı. Boş basamağın yazısı ise sarmalı —
                    kolon ~130 piksel ve İngilizce "This step is open"
                    sığmayıp "This step is o…" diye kesiliyordu.
                  */}
                  <p
                    className={cn(
                      "mt-2.5 px-0.5 text-center font-display text-xs font-extrabold sm:text-sm",
                      sahip ? "truncate text-kahve-900" : "text-balance text-kahve-400",
                    )}
                  >
                    {sahip ? sahip.ad : c("sefRozeti.bosBasamak")}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-center text-2xs font-semibold text-kahve-500",
                      sahip ? "truncate" : "text-balance",
                    )}
                  >
                    {sahip
                      ? c(siparisAnahtari(sahip.adet), {
                          sayi: sahip.adet.toLocaleString(sayiDili),
                        })
                      : c("sefRozeti.bosAciklama")}
                  </p>

                  {/* Basamağın kendisi */}
                  <span
                    className={cn(
                      "mt-2.5 grid w-full place-items-center rounded-t-xl shadow-yumusak",
                      KUTU_YUKSEKLIGI[basamak],
                      tanim.kutu,
                    )}
                  >
                    <span
                      className={cn(
                        "font-display text-xl font-extrabold sm:text-2xl",
                        tanim.numara,
                      )}
                    >
                      {basamak}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={basamak} className={cn("min-w-0 flex-1", birinci && "-mx-0.5")}>
                  {sahip ? (
                    <Link
                      href={`/restoran/${sahip.slug}`}
                      aria-label={`${sahip.ad} — ${c("sefRozeti.siraNo", { sira: basamak })}`}
                      className="tiklanabilir block transition-transform duration-300
                        ease-[var(--ease-yumusak)] hover:-translate-y-1"
                    >
                      {icerik}
                    </Link>
                  ) : (
                    <div>{icerik}</div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Podyumun oturduğu zemin çizgisi */}
          <span aria-hidden="true" className="block h-1 rounded-full bg-kahve-900/10" />

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href="/seflerin-elinden"
              className="tiklanabilir text-xs font-extrabold text-sari-700 underline
                underline-offset-4 transition-colors duration-300 hover:text-kahve-900"
            >
              {c("sefRozeti.siralamayiGor")}
            </Link>
            <Link
              href="/hesap/basvuru"
              className="tiklanabilir text-xs font-extrabold text-kahve-500 underline
                underline-offset-4 transition-colors duration-300 hover:text-kahve-900"
            >
              {c("sefRozeti.sefOl")}
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
