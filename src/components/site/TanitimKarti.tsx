import { ProfilAvatari } from "@/components/hesap/ProfilAvatari";
import { TanitimFotografi } from "@/components/site/TanitimFotografi";

/**
 * HAKKIMIZDA TANITIM KARTI — "bunu kim yapıyor" sorusunun yüzü.
 *
 * Sayfa baştan sona "biz" diye konuşuyor ama ortada bir yüz yoktu; başlığın
 * yanındaki boşluk da öylece duruyordu. Mutfak sayfasındaki büyük yuvarlak
 * fotoğrafın aynısı buraya kondu: fotoğraf yoksa silüet yer tutucu çıkıyor,
 * böylece oraya bir fotoğraf konabildiği bakınca anlaşılıyor.
 *
 * Yükleme alanı yalnızca YÖNETİCİYE basılıyor — düzenleme, sonucun göründüğü
 * yerde duruyor.
 */
export function TanitimKarti({
  url,
  ad,
  unvan,
  satir,
  yonetici,
}: {
  url?: string;
  ad: string;
  unvan: string;
  satir: string;
  yonetici: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-[2rem] border border-kahve-900/8 bg-white/80
        p-7 text-center shadow-kart backdrop-blur-sm md:p-8"
    >
      <ProfilAvatari
        ad={ad}
        url={url}
        yerTutucu="siluet"
        className="size-36 shadow-kart ring-4 ring-sari-500/25 sm:size-44"
        sizes="(min-width: 640px) 176px, 144px"
      />

      <p className="mt-5 font-display text-xl leading-tight font-extrabold text-kahve-900">{ad}</p>
      <p className="mt-1 text-xs font-bold tracking-wide text-sari-700 uppercase">{unvan}</p>
      <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-kahve-600">{satir}</p>

      {yonetici && <TanitimFotografi varMi={Boolean(url)} />}
    </div>
  );
}
