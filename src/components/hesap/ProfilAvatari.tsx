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
 * Fotoğrafı olmayan mutfağın yer tutucusu — MARKA DAİRESİ.
 *
 * ÖNCEDEN GRİ BİR İNSAN SİLÜETİYDİ ve sayfanın en tepesinde, en büyük öğe
 * olarak duruyordu. Sonuç, tam tersi bir izlenimdi: "burada bir insan yok"
 * demek, mutfağı gerçek değil sahte gösteriyordu — oysa anlatmak istediği
 * yalnızca "buraya fotoğraf konabilir"di.
 *
 * Şimdi markanın sarısında bir daire, içinde ADIN BAŞ HARFLERİ ve altında
 * küçük bir tencere işareti duruyor. Üç şeyi birden yapıyor: eksik değil
 * kasıtlı görünüyor, mutfağı diğerlerinden ayırt ediyor ve oraya bir
 * fotoğrafın geleceğini hâlâ anlatıyor.
 *
 * Çizim SVG: `next/image` yolundan geçen yerel bir dosya olsaydı hem her
 * boyutta yeniden ölçeklenirdi hem de bakım modunda (ara katman çerezsiz
 * isteğe 404 döndüğü için) kırık çıkardı.
 */
function MarkaDairesi({ harfler }: { harfler: string }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id="ny-avatar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD873" />
          <stop offset="100%" stopColor="#FFC531" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#ny-avatar)" />

      {/* Baş harfler — mutfağı ayırt eden asıl işaret. */}
      <text
        x="50"
        y="47"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#241608"
        fontSize="34"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        letterSpacing="1"
      >
        {harfler}
      </text>

      {/* Küçük tencere — burasının bir mutfak olduğunu söyleyen tek detay. */}
      <g fill="none" stroke="#241608" strokeOpacity="0.45" strokeWidth="3.2" strokeLinecap="round">
        <path d="M35 70h30v9a6 6 0 0 1-6 6H41a6 6 0 0 1-6-6z" />
        <path d="M31 72h-4M69 72h4" />
        <path d="M45 62c0-3 2-3 2-6M53 62c0-3 2-3 2-6" strokeOpacity="0.3" />
      </g>
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
          "relative shrink-0 overflow-hidden rounded-full border border-sari-600/30",
          className,
        )}
        aria-hidden="true"
        /* Testin tutunacağı yer — çizim `alt` metni taşımıyor. */
        data-yer-tutucu="profil"
      >
        <MarkaDairesi harfler={basHarfler(ad)} />
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
