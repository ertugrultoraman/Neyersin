import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Adın baş harfleri — fotoğrafı olmayan hesabın yer tutucusu.
 *
 * Boş gri bir daire yerine harf konuyor: listede kimin kim olduğu fotoğraf
 * yüklenmemişken de bir bakışta ayırt edilebilsin.
 */
function basHarfler(ad: string): string {
  const parcalar = ad.trim().split(/\s+/).filter(Boolean);
  if (parcalar.length === 0) return "?";
  const harfler = parcalar.length === 1 ? parcalar[0].slice(0, 2) : parcalar[0][0] + parcalar[1][0];
  return harfler.toLocaleUpperCase("tr-TR");
}

/**
 * Hesabın yuvarlak profil görseli. Fotoğraf yoksa baş harfler.
 *
 * YÖNETİM ALANINDAN AYRI DOSYADA: yükleme/kaldırma formu (ProfilFotografi)
 * bir istemci bileşeni ve sunucu eylemlerini içeri taşıyor. Avatar herkese
 * açık mutfak sayfasında da gösteriliyor; aynı dosyada dursaydı o sayfanın
 * istemci paketine hiç kullanılmayan bir yönetim formu binerdi.
 *
 * `alt` bilerek boş: görselin hemen yanında (ya da altında) kişinin adı
 * yazıyor, ekran okuyucu aynı ismi iki kez okumasın.
 */
export function ProfilAvatari({
  ad,
  url,
  className = "size-14 text-sm",
  sizes = "128px",
}: {
  ad: string;
  url?: string;
  /** Boyut ve yazı ölçüsü — çağıran yer belirliyor. */
  className?: string;
  /**
   * Tarayıcının indireceği görsel genişliği. Varsayılan küçük listeler için;
   * mutfak sayfasındaki büyük avatar gibi yerler kendi ölçüsünü veriyor —
   * yoksa 160 piksellik daire 128 piksellik görselle bulanık çıkıyor.
   */
  sizes?: string;
}) {
  if (url) {
    return (
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border border-kahve-900/8 bg-kahve-900/6",
          className,
        )}
      >
        <Image src={url} alt="" fill sizes={sizes} className="object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        `grid shrink-0 place-items-center rounded-full border border-sari-500/30
         bg-sari-500/18 font-display font-extrabold text-kahve-700`,
        className,
      )}
      aria-hidden="true"
    >
      {basHarfler(ad)}
    </span>
  );
}
