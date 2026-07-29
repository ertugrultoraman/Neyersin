import type { Restoran } from "@/content/restoranlar";
import { paraFormatla, tohum } from "@/lib/utils";
import { SaatIkon, ScooterIkon, SepetIkon, SimsekIkon, YildizIkon } from "../ui/Ikonlar";
import { Rozet } from "../ui/Rozet";

/**
 * Restoranlara ait fotoğraf yerine markaya uygun, isimden türetilen kararlı bir
 * kapak üretiyoruz. Böylece 16 kart için 16 AI görseli maliyeti doğmuyor ve
 * liste görsel olarak tutarlı kalıyor.
 */
const ZEMINLER = [
  "from-sari-300 via-sari-400 to-sari-600",
  "from-kahve-400 via-kahve-600 to-kahve-800",
  "from-domates via-domates to-domates-koyu",
  "from-nane via-nane to-nane-koyu",
  "from-sari-500 via-sari-600 to-kahve-600",
  "from-kahve-600 via-kahve-700 to-kahve-900",
];

function Kapak({ restoran }: { restoran: Restoran }) {
  const t = tohum(restoran.slug);
  const zemin = ZEMINLER[t % ZEMINLER.length];
  const donme = (t % 16) - 8;

  return (
    <div
      aria-hidden="true"
      className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${zemin}`}
    >
      {/* Noktalı doku */}
      <span
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.55) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      {/* Büyük baş harf — dekoratif filigran */}
      <span
        className="absolute -right-3 -bottom-9 font-display text-[7.5rem] leading-none
          font-extrabold text-white/22 transition-transform duration-700
          ease-[var(--ease-yumusak)] group-hover:scale-105"
        style={{ transform: `rotate(${donme / 3}deg)` }}
      >
        {restoran.ad.charAt(0)}
      </span>
      {/* Scooter silueti */}
      <ScooterIkon
        className="absolute top-1/2 left-5 size-16 -translate-y-1/2 text-white/25
          transition-transform duration-700 ease-[var(--ease-yumusak)]
          group-hover:-translate-x-1 group-hover:scale-105"
      />
      {/* Alt karartma — üstteki rozetler okunabilir kalsın */}
      <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}

export function RestoranKarti({ restoran }: { restoran: Restoran }) {
  const ucretsiz = restoran.teslimatUcreti === 0;
  const hizli = restoran.sureDk[0] <= 20;

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-3xl border
        border-kahve-900/8 bg-white kart-kalk hover:border-sari-500/45"
    >
      <div className="relative">
        <Kapak restoran={restoran} />

        {/* Kampanya bandı */}
        {restoran.kampanya && (
          <p
            className="absolute inset-x-3 bottom-3 flex items-center gap-1.5 rounded-xl
              bg-white/94 px-2.5 py-1.5 text-xs font-bold text-kahve-900 shadow-yumusak
              backdrop-blur-sm"
          >
            <SimsekIkon className="size-3.5 shrink-0 text-sari-700" />
            <span className="truncate">{restoran.kampanya}</span>
          </p>
        )}

        {/* Sol üst rozetler */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {hizli && (
            <Rozet ton="kahve">
              <SimsekIkon className="size-3" />
              Süper hızlı
            </Rozet>
          )}
          {restoran.etiketler.includes("Yeni") && <Rozet ton="sari">Yeni</Rozet>}
        </div>

        {/* Puan */}
        <p
          className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/94
            px-2.5 py-1 text-xs font-extrabold text-kahve-900 shadow-yumusak backdrop-blur-sm"
        >
          <YildizIkon className="size-3.5 text-sari-500" />
          {restoran.puan.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg leading-tight font-extrabold text-kahve-900">
          {restoran.ad}
        </h3>
        <p className="mt-1 truncate text-xs font-medium text-kahve-500">
          {restoran.mutfaklar.join(" • ")}
        </p>
        <p className="mt-0.5 text-2xs font-medium text-kahve-400">
          {restoran.semt} / {restoran.sehir} · {restoran.yorum.toLocaleString("tr-TR")} değerlendirme
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-kahve-900/8 pt-3.5 text-center">
          <div>
            <dt className="sr-only">Teslimat süresi</dt>
            <dd>
              <SaatIkon className="mx-auto size-4 text-kahve-400" />
              <span className="mt-1 block text-xs font-bold text-kahve-800">
                {restoran.sureDk[0]}–{restoran.sureDk[1]} dk
              </span>
            </dd>
          </div>
          <div className="border-x border-kahve-900/8">
            <dt className="sr-only">Minimum sepet</dt>
            <dd>
              <SepetIkon className="mx-auto size-4 text-kahve-400" />
              <span className="mt-1 block text-xs font-bold text-kahve-800">
                min {paraFormatla(restoran.minSepet)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Teslimat ücreti</dt>
            <dd>
              <ScooterIkon
                className={`mx-auto size-4 ${ucretsiz ? "text-nane" : "text-kahve-400"}`}
              />
              <span
                className={`mt-1 block text-xs font-bold ${
                  ucretsiz ? "text-nane-koyu" : "text-kahve-800"
                }`}
              >
                {ucretsiz ? "Ücretsiz" : paraFormatla(restoran.teslimatUcreti)}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
