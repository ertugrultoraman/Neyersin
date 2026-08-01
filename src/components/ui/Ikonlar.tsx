import type { SVGProps } from "react";

/**
 * Site genelinde kullanılan çizgi ikon seti. Hepsi 24x24 kutuda, `currentColor`
 * ile boyanır ve `aria-hidden` gelir — anlam her zaman çevresindeki metinde durur.
 */
type IkonProp = SVGProps<SVGSVGElement>;

function Govde({ children, ...p }: IkonProp) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const AraIkon = (p: IkonProp) => (
  <Govde {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Govde>
);

export const KonumIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Govde>
);

export const SaatIkon = (p: IkonProp) => (
  <Govde {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Govde>
);

export const ScooterIkon = (p: IkonProp) => (
  <Govde {...p}>
    <circle cx="5.5" cy="17.5" r="3" />
    <circle cx="18" cy="17.5" r="3" />
    <path d="M8.5 17.5h5l2-8h-3" />
    <path d="M15.5 9.5H19v6" />
    <path d="M18 14.5V6h2.5" />
  </Govde>
);

export const SepetIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M4.5 8.5h15l-1.4 10a2 2 0 0 1-2 1.7H7.9a2 2 0 0 1-2-1.7Z" />
    <path d="M9 8.5V6a3 3 0 0 1 6 0v2.5" />
  </Govde>
);

export const KontrolIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Govde>
);

export const YildizIkon = (p: IkonProp) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 17l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8Z" />
  </svg>
);

export const SimsekIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M13.5 3 6 13.5h4.5L10 21l7.5-10.5H13Z" />
  </Govde>
);

export const KalkanIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Govde>
);

export const GrafikIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8.5 20v-5.5" />
    <path d="M13 20V9" />
    <path d="M17.5 20v-8" />
  </Govde>
);

export const VeriIkon = (p: IkonProp) => (
  <Govde {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="2.8" />
    <path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6" />
    <path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8" />
  </Govde>
);

export const MenuIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h11" />
  </Govde>
);

/** Konuşma balonu — canlı destek. */
export const DestekIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M20.5 12.5c0 4-3.8 7.2-8.5 7.2-1 0-2-.2-2.9-.4L4 21l1.4-3.6C4 16.1 3.5 14.4 3.5 12.5c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z" />
    <path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01" strokeWidth="2.4" />
  </Govde>
);

/** Üç nokta — dar ekranda sığmayan menü öğelerinin toplandığı düğme. */
export const UcNoktaIkon = (p: IkonProp) => (
  <Govde {...p} fill="currentColor" stroke="none">
    <circle cx="12" cy="5" r="1.9" />
    <circle cx="12" cy="12" r="1.9" />
    <circle cx="12" cy="19" r="1.9" />
  </Govde>
);

export const KapatIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Govde>
);

export const MikrofonIkon = (p: IkonProp) => (
  <Govde {...p}>
    <rect x="9.5" y="3" width="5" height="10" rx="2.5" />
    <path d="M6 11.5a6 6 0 0 0 12 0" />
    <path d="M12 17.5V21" />
  </Govde>
);

export const TelefonIkon = (p: IkonProp) => (
  <Govde {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M10.8 5.5h2.4" />
  </Govde>
);

export const MutfakIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M4 11h16" />
    <path d="M5.5 11a6.5 6.5 0 0 1 13 0" />
    <path d="M12 4.5V3" />
    <path d="M6 15h12l-1 5.5H7Z" />
  </Govde>
);

export const AyarIkon = (p: IkonProp) => (
  <Govde {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
  </Govde>
);

export const KullaniciIkon = (p: IkonProp) => (
  <Govde {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
  </Govde>
);

export const DukkanIkon = (p: IkonProp) => (
  <Govde {...p}>
    <path d="M4 9.5V20h16V9.5" />
    <path d="M3 9.5 5 4h14l2 5.5Z" />
    <path d="M10 20v-5h4v5" />
  </Govde>
);

export const RozetIkon = (p: IkonProp) => (
  <Govde {...p}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="M9 13.5 7.5 21l4.5-2.4 4.5 2.4L15 13.5" />
  </Govde>
);
