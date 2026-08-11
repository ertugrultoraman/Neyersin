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
 * Fotoğrafı olmayan hesabın SİLÜET yer tutucusu — omuz hizasından bir insan.
 *
 * Baş harflerden farkı: harfler kişiyi AYIRT ETMEK için (listede kim kim),
 * silüet ise fotoğrafın yerini GÖSTERMEK için. Mutfak sayfasında sayfanın en
 * tepesinde duran boşluk, oraya bir fotoğrafın konabileceğini kendiliğinden
 * anlatmıyordu; iki harf de sayfanın en büyük öğesi olarak koca bir sarı
 * daireye dönüşüyordu.
 *
 * Çizim SVG: `next/image` yolundan geçen yerel bir dosya olsaydı hem her
 * boyutta yeniden ölçeklenirdi hem de bakım modunda (ara katman çerezsiz
 * isteğe 404 döndüğü için) kırık çıkardı.
 */
function Siluet() {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      <circle cx="50" cy="43" r="15" fill="currentColor" />
      <path
        d="M50 68c-17.7 0-32 14.3-32 32v8h64v-8c0-17.7-14.3-32-32-32Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Hesabın yuvarlak profil görseli. Fotoğraf yoksa baş harfler ya da silüet.
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
  yerTutucu = "harf",
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
  /** Fotoğraf yokken ne görünecek: adın baş harfleri mi, insan silüeti mi? */
  yerTutucu?: "harf" | "siluet";
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

  if (yerTutucu === "siluet") {
    return (
      <span
        className={cn(
          `relative shrink-0 overflow-hidden rounded-full border border-kahve-900/8
           bg-kahve-900/10 text-white`,
          className,
        )}
        aria-hidden="true"
        /* Testin tutunacağı yer — çizimin kendisinde metin yok. */
        data-yer-tutucu="profil"
      >
        <Siluet />
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
