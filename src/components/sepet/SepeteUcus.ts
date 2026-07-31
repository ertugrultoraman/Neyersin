"use client";

/**
 * "Ürün havadan sepete düşsün" animasyonu.
 *
 * Proje dosyasındaki fikir: müşteri sepete eklerken ürün, bastığı yerden
 * sağ alttaki sepete doğru uçsun — sipariş vermek bir oyun gibi hissettirsin.
 *
 * React durumu yerine doğrudan DOM + Web Animations API kullanılıyor: uçan öğe
 * tek seferlik, hiçbir bileşenin yeniden çizilmesine gerek yok. Böylece animasyon
 * menüdeki onlarca kartın performansını etkilemiyor.
 *
 * Hareketi azalt tercihi açıksa animasyon hiç çalışmaz.
 */

/** Uçuşun hedefi olan sepet düğmesi bu nitelikle işaretlenir. */
export const SEPET_HEDEF_NITELIGI = "data-sepet-hedefi";

export function sepeteUcur(kaynak: HTMLElement | null, gorselUrl?: string): void {
  if (typeof window === "undefined" || !kaynak) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const hedef = document.querySelector<HTMLElement>(`[${SEPET_HEDEF_NITELIGI}]`);
  if (!hedef) return;

  const baslangic = kaynak.getBoundingClientRect();
  const bitis = hedef.getBoundingClientRect();

  const oge = document.createElement("div");
  oge.setAttribute("aria-hidden", "true");
  const boyut = 44;

  Object.assign(oge.style, {
    position: "fixed",
    left: `${baslangic.left + baslangic.width / 2 - boyut / 2}px`,
    top: `${baslangic.top + baslangic.height / 2 - boyut / 2}px`,
    width: `${boyut}px`,
    height: `${boyut}px`,
    borderRadius: "9999px",
    zIndex: "80",
    pointerEvents: "none",
    boxShadow: "0 10px 24px rgb(59 36 18 / 0.28)",
    backgroundColor: "#FFC220",
    backgroundSize: "cover",
    backgroundPosition: "center",
    ...(gorselUrl ? { backgroundImage: `url("${gorselUrl}")` } : {}),
  } satisfies Partial<CSSStyleDeclaration> as Partial<CSSStyleDeclaration>);

  document.body.appendChild(oge);

  const dx = bitis.left + bitis.width / 2 - (baslangic.left + baslangic.width / 2);
  const dy = bitis.top + bitis.height / 2 - (baslangic.top + baslangic.height / 2);

  // Yay gibi bir eğri: önce hafif yukarı, sonra sepete doğru düşüş.
  const animasyon = oge.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
      {
        transform: `translate(${dx * 0.45}px, ${dy * 0.25 - 70}px) scale(0.85)`,
        opacity: 1,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.2 },
    ],
    { duration: 720, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
  );

  animasyon.onfinish = () => {
    oge.remove();
    // Sepet düğmesi bir "yakaladım" tepkisi versin.
    hedef.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18)" },
        { transform: "scale(1)" },
      ],
      { duration: 320, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
    );
  };
}
