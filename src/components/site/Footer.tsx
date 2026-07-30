import Image from "next/image";
import Link from "next/link";

import { ilceler, mutfaklar, site } from "@/content/site";
import { KontrolIkon, ScooterIkon, TelefonIkon } from "../ui/Ikonlar";

export function Footer() {
  const yil = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-kahve-900 text-kahve-100">
      {/* Üst kenarda sarı marka şeridi */}
      <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-sari-600 via-sari-400 to-sari-600" />

      {/* Yumuşak ışık lekesi */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full
          bg-sari-500/12 blur-3xl"
      />

      <div className="kap relative py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_2fr]">
          {/* Marka bloğu — logonun orijinal hâli koyu zeminde kullanılıyor */}
          <div>
            <div className="relative w-full max-w-[19rem] overflow-hidden rounded-3xl shadow-kalkik">
              <Image
                src="/brand/ne-yersin-logo.jpeg"
                alt="Ne Yersin? logosu"
                width={1536}
                height={1024}
                sizes="(min-width: 1024px) 19rem, 80vw"
                className="h-auto w-full"
              />
            </div>

            <p className="mt-6 max-w-sm text-sm leading-relaxed text-kahve-200/85">
              {site.aciklama}
            </p>

            <div className="mt-6 flex flex-col gap-2.5 text-sm">
              <a
                href={`tel:${site.telefon.replace(/\s/g, "")}`}
                className="inline-flex w-fit items-center gap-2.5 text-kahve-100
                  transition-colors duration-300 hover:text-sari-400"
              >
                <TelefonIkon className="size-4 text-sari-500" />
                {site.telefon}
              </a>
              <a
                href={`mailto:${site.eposta}`}
                className="inline-flex w-fit items-center gap-2.5 text-kahve-100
                  transition-colors duration-300 hover:text-sari-400"
              >
                <KontrolIkon className="size-4 text-sari-500" />
                {site.eposta}
              </a>
              <p className="flex items-start gap-2.5 text-kahve-200/70">
                <ScooterIkon className="mt-0.5 size-4 shrink-0 text-sari-500" />
                {site.adres}
              </p>
            </div>

            <div className="mt-7 flex gap-2.5">
              {site.sosyal.map((s) => (
                <a
                  key={s.etiket}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.etiket}
                  className="grid size-10 place-items-center rounded-2xl bg-white/8 text-sm font-bold
                    text-kahve-100 transition-all duration-300 ease-[var(--ease-yumusak)]
                    hover:-translate-y-0.5 hover:bg-sari-500 hover:text-kahve-900"
                >
                  {s.kisa}
                </a>
              ))}
            </div>
          </div>

          {/* Bağlantı kolonları */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {site.footer.map((kolon) => (
              <nav key={kolon.baslik} aria-label={kolon.baslik}>
                <h3 className="font-display text-base font-extrabold tracking-wide text-sari-400">
                  {kolon.baslik}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {kolon.baglantilar.map((b) => (
                    <li key={`${kolon.baslik}-${b.etiket}`}>
                      <Link
                        href={b.href}
                        className="group inline-flex text-sm text-kahve-200/80 transition-colors
                          duration-300 hover:text-sari-300"
                      >
                        <span className="relative">
                          {b.etiket}
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0
                              bg-sari-400 transition-transform duration-400
                              ease-[var(--ease-yumusak)] group-hover:scale-x-100"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Şehir ve mutfak bazlı iç bağlantılar */}
        <div className="mt-14 space-y-6 border-t border-white/10 pt-10">
          <div>
            <h3 className="text-2xs font-extrabold tracking-[0.18em] text-kahve-300 uppercase">
              İstanbul ilçelerine yemek siparişi
            </h3>
            <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-1.5">
              {ilceler.map((ilce) => (
                <li key={ilce}>
                  <Link
                    href="/#restoranlar"
                    className="inline-block rounded-full px-2.5 py-1 text-xs text-kahve-200/70
                      transition-colors duration-300 hover:bg-white/8 hover:text-sari-300"
                  >
                    {ilce} yemek siparişi
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-2xs font-extrabold tracking-[0.18em] text-kahve-300 uppercase">
              Mutfaklara göre
            </h3>
            <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-1.5">
              {mutfaklar.map((m) => (
                <li key={m}>
                  <Link
                    href="/#restoranlar"
                    className="inline-block rounded-full px-2.5 py-1 text-xs text-kahve-200/70
                      transition-colors duration-300 hover:bg-white/8 hover:text-sari-300"
                  >
                    {m}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Alt bant */}
        <div
          id="yasal"
          className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8
            text-xs text-kahve-300/70 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            © {yil} {site.ad} — Tüm hakları saklıdır.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {site.footer[3].baglantilar.map((b) => (
              <li key={`alt-${b.etiket}`}>
                <Link href={b.href} className="transition-colors duration-300 hover:text-sari-300">
                  {b.etiket}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
