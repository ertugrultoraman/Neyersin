"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  AyarIkon,
  DestekIkon,
  KontrolIkon,
  KullaniciIkon,
  RozetIkon,
  SepetIkon,
  VeriIkon,
  YildizIkon,
} from "../ui/Ikonlar";

/**
 * Yönetim panelinin sekme şeridi.
 *
 * AÇIK SEKME İŞARETLİ: on üç sekme tıpatıp aynı görünüyordu, yönetici hangi
 * sayfada olduğunu ancak başlığı okuyarak anlıyordu. Şerit kaydırıldığında
 * başlık ekrandan çıkabildiği için o ipucu da her zaman durmuyordu.
 *
 * Ayrı bir istemci bileşeni: açık sekmeyi bulmak için `usePathname` gerekiyor,
 * AdminKabuk ise sunucu bileşeni (çıkış eylemini doğrudan çağırıyor). Sekmeler
 * buraya alınınca kabuk sunucuda kalabiliyor.
 *
 * Şerit KENDİ İÇİNDE yatay kayıyor, sayfayı itmiyor: sekmeler telefon
 * genişliğine sığmıyor ve eskiden başlık, içerik, her şey birlikte sağa
 * kayıyordu.
 *
 * Çubuk GÖRÜNÜR (`surukle-scroll`): önce gizliydi ve sağdaki sekmeler
 * kesiliyordu ama kaydırılabildiğine dair hiçbir işaret yoktu — fareyle
 * kullanan "Yorumlar"ın yarısını görüp arkasında başka sekme olduğunu
 * anlamıyordu.
 */
const SEKMELER = [
  { yol: "/admin", etiket: "Siparişler", Ikon: VeriIkon },
  { yol: "/admin/basvurular", etiket: "Başvurular", Ikon: KullaniciIkon },
  { yol: "/admin/hesaplar", etiket: "Hesaplar", Ikon: AyarIkon },
  { yol: "/admin/urunler", etiket: "Ürünler", Ikon: SepetIkon },
  { yol: "/admin/fiyatlar", etiket: "Fiyatlar", Ikon: KontrolIkon },
  { yol: "/admin/kategoriler", etiket: "Kategoriler", Ikon: SepetIkon },
  { yol: "/admin/anket", etiket: "Anket", Ikon: KontrolIkon },
  { yol: "/admin/destek", etiket: "Destek", Ikon: DestekIkon },
  { yol: "/admin/dogrulamalar", etiket: "Doğrulamalar", Ikon: KontrolIkon },
  { yol: "/admin/yorumlar", etiket: "Yorumlar", Ikon: YildizIkon },
  { yol: "/admin/rozetler", etiket: "Rozetler", Ikon: RozetIkon },
  { yol: "/admin/engeller", etiket: "Engeller", Ikon: KontrolIkon },
] as const;

/**
 * "/admin" HER yolun başlangıcı olduğu için tam eşleşme aranıyor; yoksa
 * Siparişler sekmesi bütün alt sayfalarda açık görünürdü.
 *
 * Alt sayfalarda önek yetiyor: /admin/basvurular/12 açıkken Başvurular
 * sekmesi de işaretli kalsın.
 */
function acikMi(sekmeYolu: string, aktifYol: string): boolean {
  if (sekmeYolu === "/admin") return aktifYol === "/admin";
  return aktifYol === sekmeYolu || aktifYol.startsWith(`${sekmeYolu}/`);
}

const ORTAK =
  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold " +
  "transition-colors duration-300";

export function AdminSekmeler() {
  const aktifYol = usePathname() ?? "";

  return (
    <nav
      aria-label="Panel menüsü"
      className="mt-7 flex gap-2 overflow-x-auto border-b border-kahve-900/10 pb-3
        surukle-scroll [&>a]:shrink-0"
    >
      {SEKMELER.map(({ yol, etiket, Ikon }) => {
        const acik = acikMi(yol, aktifYol);
        return (
          <Link
            key={yol}
            href={yol}
            /*
             * `aria-current`: ekran okuyucu da açık sekmeyi duysun — renk tek
             * başına yeterli bir işaret değil.
             */
            aria-current={acik ? "page" : undefined}
            className={`${ORTAK} ${
              acik
                ? "bg-sari-500 text-kahve-900 shadow-kart"
                : "bg-kahve-900/5 text-kahve-900 hover:bg-sari-500"
            }`}
          >
            <Ikon className="size-4" />
            {etiket}
          </Link>
        );
      })}
      <Link
        href="/"
        className={`${ORTAK} text-kahve-500 hover:bg-kahve-900/5 hover:text-kahve-900`}
      >
        Siteye dön
      </Link>
    </nav>
  );
}
