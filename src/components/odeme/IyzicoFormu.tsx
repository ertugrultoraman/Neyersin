"use client";

import { useEffect, useRef } from "react";

/**
 * iyzico `checkoutFormContent` gömme bileşeni.
 *
 * Yanıt bir HTML+script parçası olarak geliyor. `innerHTML` ile eklenen script
 * etiketleri tarayıcı tarafından ÇALIŞTIRILMAZ; bu yüzden her script yeniden
 * oluşturulup yerine konuyor. (Öncelikli akış `paymentPageUrl` ile yönlendirme;
 * bu bileşen yalnızca iyzico hesabı hosted sayfa döndürmediğinde kullanılır.)
 */
export function IyzicoFormu({ icerik }: { icerik: string }) {
  const kapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kap = kapRef.current;
    if (!kap || !icerik) return;

    kap.innerHTML = icerik;

    for (const eski of Array.from(kap.querySelectorAll("script"))) {
      const yeni = document.createElement("script");
      for (const nitelik of Array.from(eski.attributes)) {
        yeni.setAttribute(nitelik.name, nitelik.value);
      }
      yeni.text = eski.text;
      eski.replaceWith(yeni);
    }

    return () => {
      kap.innerHTML = "";
    };
  }, [icerik]);

  return (
    <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-5 md:p-7">
      <p className="mb-4 text-sm font-semibold text-kahve-600">
        Güvenli ödeme formu yükleniyor…
      </p>
      <div ref={kapRef} id="iyzipay-checkout-form" className="responsive" />
    </div>
  );
}
