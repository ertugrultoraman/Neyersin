import type { KategoriIkonAdi } from "@/content/kategoriler";

/** Kategori rayındaki 12 mutfak ikonu — hepsi elle çizildi, ikon kütüphanesi yok. */
const CIZIMLER: Record<KategoriIkonAdi, React.ReactNode> = {
  burger: (
    <>
      <path d="M4 10.5a8 8 0 0 1 16 0Z" />
      <path d="M4.5 13.5h15" />
      <path d="M5 16.5h14a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5Z" />
    </>
  ),
  pizza: (
    <>
      <path d="M12 4 20 19a17 17 0 0 1-16 0Z" />
      <circle cx="12" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="15.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  doner: (
    <>
      <path d="M12 3v18" />
      <path d="M12 5c3.2 0 5.5 3.6 5.5 7.2S15.2 19 12 19" />
      <path d="M12 5c-3.2 0-5.5 3.6-5.5 7.2S8.8 19 12 19" />
      <path d="M7.5 9.5h9M7 13h10" />
    </>
  ),
  tavuk: (
    <>
      <path d="M15.5 4.5a4.5 4.5 0 0 1 3 7.6l-6.4 6.4a3 3 0 1 1-2.6-2.6l6.4-6.4" />
      <path d="M9.5 15.5 5.5 19" />
      <circle cx="5" cy="19.5" r="1.6" />
    </>
  ),
  kebap: (
    <>
      <path d="M5 4.5 19 19.5" />
      <circle cx="8.5" cy="8" r="1.9" />
      <circle cx="12" cy="11.6" r="1.9" />
      <circle cx="15.5" cy="15.2" r="1.9" />
    </>
  ),
  "ev-yemegi": (
    <>
      <path d="M4.5 9.5h15l-1.2 9a2 2 0 0 1-2 1.7H7.7a2 2 0 0 1-2-1.7Z" />
      <path d="M3.5 9.5h17" />
      <path d="M9 6.5c0-1.4 1.3-2 3-2s3 .6 3 2" />
      <path d="M4 13.5h-.5M20 13.5h.5" />
    </>
  ),
  tatli: (
    <>
      <path d="M6 11h12l-1.2 8.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3Z" />
      <path d="M5.5 11a6.5 6.5 0 0 1 13 0" />
      <path d="M12 7.5V4.5" />
      <circle cx="12" cy="3.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  kahve: (
    <>
      <path d="M5 8.5h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />
      <path d="M16 10h1.8a2.2 2.2 0 0 1 0 4.4H16" />
      <path d="M8.5 5.5c0-.8.8-1.2.8-2M12 5.5c0-.8.8-1.2.8-2" />
    </>
  ),
  borek: (
    <>
      <path d="M4 15.5c2.5-6 5.3-9 8-9s5.5 3 8 9Z" />
      <path d="M4 15.5c2.6 1.4 5.3 2 8 2s5.4-.6 8-2" />
      <path d="M9.5 11.5h.01M12 9.8h.01M14.5 11.5h.01" />
    </>
  ),
  balik: (
    <>
      <path d="M3.5 12c3-4.5 6.2-6.5 9.5-6.5S19.5 8 21 12c-1.5 4-5.2 6.5-8 6.5S6.5 16.5 3.5 12Z" />
      <path d="M21 12c-1.4 1-2.6 1.4-3.6 1.2" />
      <circle cx="8.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <path d="M13 8.5c1 2.4 1 4.6 0 7" />
    </>
  ),
  vegan: (
    <>
      <path d="M20 4.5c0 8-4.6 12.5-10 12.5-1.6 0-3-.4-4-1 0-8 4.6-11.5 10-11.5 1.7 0 3 .3 4 0Z" />
      <path d="M6 20c1.5-4.5 4.6-8.2 8.5-10.5" />
    </>
  ),
  market: (
    <>
      <path d="M3 6.5h2.2l2 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L20 9.5H6" />
      <circle cx="10" cy="20.5" r="1.2" />
      <circle cx="17" cy="20.5" r="1.2" />
    </>
  ),
};

export function KategoriIkon({
  ad,
  className,
}: {
  ad: KategoriIkonAdi;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {CIZIMLER[ad]}
    </svg>
  );
}
