import Link from "next/link";

import { googleYapilandirildiMi } from "@/lib/google-oturum";

/**
 * "Google ile devam et".
 *
 * Google'ın kendi JS kitaplığı KULLANILMIYOR: düğme sadece sunucudaki
 * yönlendirme ucuna gidiyor. Böylece üçüncü taraf betiği yüklenmiyor, sıkı
 * CSP'ye dokunulmuyor ve logo da dış kaynaktan değil, gömülü SVG'den geliyor.
 *
 * Ortam değişkenleri tanımlı değilse hiç görünmez — çalışmayan bir düğme
 * göstermek, kişiyi tıklayıp hata almaya davet etmek olurdu.
 */
export function GoogleDugmesi({ donus, etiket }: { donus?: string; etiket?: string }) {
  if (!googleYapilandirildiMi()) return null;

  const hedef = donus
    ? `/api/oturum/google?donus=${encodeURIComponent(donus)}`
    : "/api/oturum/google";

  return (
    <div className="mt-6">
      <Link
        href={hedef}
        prefetch={false}
        className="tiklanabilir flex h-13 w-full items-center justify-center gap-3 rounded-full
          border-2 border-kahve-900/12 bg-white text-base font-semibold text-kahve-900
          transition-[border-color,transform,box-shadow] duration-300 ease-[var(--ease-yumusak)]
          hover:-translate-y-0.5 hover:border-kahve-900/25 hover:shadow-kart"
      >
        <GoogleLogosu />
        {etiket ?? "Google ile devam et"}
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-kahve-900/10" />
        <span className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">veya</span>
        <span aria-hidden="true" className="h-px flex-1 bg-kahve-900/10" />
      </div>
    </div>
  );
}

/** Google'ın resmi dört renkli "G" işareti — gömülü, dış istek yok. */
function GoogleLogosu() {
  return (
    <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
