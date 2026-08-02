"use client";

import { DESTEK_OLAYI } from "./DestekWidget";

/**
 * Alt menüdeki "Canlı Destek" bağlantısı.
 *
 * Neden ayrı bir bileşen: `<Link href="#destek">` ile çözmeye çalışmak
 * işe yaramıyordu — Next yönlendirmesi adresi History API ile güncelliyor ve
 * tarayıcının `hashchange` olayı hiç doğmuyor, dolayısıyla asistan açılmıyordu.
 * Burada olayı doğrudan yayınlıyoruz; sayfa da değişmiyor, kişi bulunduğu
 * yerde kalıyor.
 */
export function DestekBaglantisi({
  etiket,
  className,
  children,
}: {
  etiket: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(DESTEK_OLAYI, { detail: {} }))}
      className={className}
      aria-label={`${etiket} — canlı destek asistanını açar`}
    >
      {children ?? etiket}
    </button>
  );
}
