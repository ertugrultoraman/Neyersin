"use client";

/**
 * "Ürün havadan sepetin içine düşsün" animasyonu.
 *
 * Proje dosyasındaki fikir: müşteri sepete eklerken ürün, bastığı yerden sağ
 * alttaki kırmızı el sepetine doğru uçsun ve içine düşsün — sipariş vermek bir
 * oyun gibi hissettirsin.
 *
 * Uçuş üç parçalı: yay çizerek yüksel → sepetin ağzının üstünde asılı kal →
 * içine bırak. Son adımda öğe yassılaşarak ağzın karanlığında kayboluyor,
 * sepet de aynı anda "yakaladım" diye ezilip toparlanıyor.
 *
 * React durumu yerine doğrudan DOM + Web Animations API kullanılıyor: uçan öğe
 * tek seferlik, hiçbir bileşenin yeniden çizilmesine gerek yok.
 *
 * Hareketi azalt tercihi açıksa animasyon hiç çalışmaz.
 */

/** Uçuşun hedefi olan sarmalayıcı bu nitelikle işaretlenir (hiç dönüştürülmez). */
export const SEPET_HEDEF_NITELIGI = "data-sepet-hedefi";

/**
 * "Yakaladım" tepkisini alan sepet çizimi. Düğmenin kendisi framer-motion
 * tarafından yönetildiği için ayrı bir öğe: aynı transform'u iki taraf birden
 * yazsaydı animasyonlar birbirini eziyordu.
 */
export const SEPET_GOVDE_NITELIGI = "data-sepet-govde";

/**
 * Hedefi birkaç kare boyunca bekleyerek arar.
 *
 * İlk ürün eklendiğinde sepet düğmesi henüz boyanmamış olabiliyor; hedefi tek
 * seferde arayıp vazgeçseydik ilk eklenen ürün hiç uçmazdı.
 */
function hedefiBekle(kalanKare = 12): Promise<HTMLElement | null> {
  return new Promise((coz) => {
    const bak = (kalan: number) => {
      const hedef = document.querySelector<HTMLElement>(`[${SEPET_HEDEF_NITELIGI}]`);
      if (hedef) return coz(hedef);
      if (kalan <= 0) return coz(null);
      requestAnimationFrame(() => bak(kalan - 1));
    };
    bak(kalanKare);
  });
}

export async function sepeteUcur(kaynak: HTMLElement | null, gorselUrl?: string): Promise<void> {
  if (typeof window === "undefined" || !kaynak) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Kaynağın yeri HEMEN ölçülüyor: hedefi beklerken sayfa kayabilir.
  const baslangic = kaynak.getBoundingClientRect();
  if (baslangic.width === 0 && baslangic.height === 0) return;

  const hedef = await hedefiBekle();
  if (!hedef) return;

  /*
   * Hedef, sarmalayıcının kendisi değil İÇİNDEKİ SEPET ÇİZİMİ.
   *
   * Sepet ürün sayısına göre büyüdüğü için (bkz. SepetFab) sarmalayıcının
   * yerleşim kutusuna göre hesaplanan ağız noktası büyüdükçe kayıyordu.
   * `getBoundingClientRect` üst öğelerin ölçeğini de içerdiğinden, çizimi
   * doğrudan ölçmek her boyutta doğru noktayı veriyor.
   */
  const sepetCizimi = hedef.querySelector<HTMLElement>(`[${SEPET_GOVDE_NITELIGI}]`) ?? hedef;
  const hedefKutu = sepetCizimi.getBoundingClientRect();
  const boyut = 46;

  const oge = document.createElement("div");
  oge.setAttribute("aria-hidden", "true");
  Object.assign(oge.style, {
    position: "fixed",
    left: `${baslangic.left + baslangic.width / 2 - boyut / 2}px`,
    top: `${baslangic.top + baslangic.height / 2 - boyut / 2}px`,
    width: `${boyut}px`,
    height: `${boyut}px`,
    borderRadius: "9999px",
    // Sepet düğmesi z-40; uçan öğe onun altında kalsın ki içine giriyormuş gibi dursun.
    zIndex: "39",
    pointerEvents: "none",
    boxShadow: "0 10px 24px rgb(59 36 18 / 0.3)",
    backgroundColor: "#fdc806",
    backgroundSize: "cover",
    backgroundPosition: "center",
    ...(gorselUrl ? { backgroundImage: `url("${gorselUrl}")` } : {}),
  } as Partial<CSSStyleDeclaration>);

  document.body.appendChild(oge);

  const kaynakX = baslangic.left + baslangic.width / 2;
  const kaynakY = baslangic.top + baslangic.height / 2;
  // Sepetin ağzı çizimin üst ortasında.
  const agizX = hedefKutu.left + hedefKutu.width * 0.5;
  const agizY = hedefKutu.top + hedefKutu.height * 0.3;

  const dx = agizX - kaynakX;
  const dy = agizY - kaynakY;

  const ucus = oge.animate(
    [
      { transform: "translate(0px, 0px) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.45}px, ${dy * 0.2 - 90}px) scale(0.9) rotate(-12deg)`,
        opacity: 1,
        offset: 0.45,
      },
      {
        transform: `translate(${dx}px, ${dy - 26}px) scale(0.62) rotate(6deg)`,
        opacity: 1,
        offset: 0.78,
      },
      {
        transform: `translate(${dx}px, ${dy + 8}px) scale(0.3, 0.16) rotate(0deg)`,
        opacity: 0,
        offset: 1,
      },
    ],
    /*
     * Süre bilerek uzun: 820 ms'de ürün göze çarpmadan kayboluyordu, hareketin
     * "sepete gidiyor" anlatısı kaçıyordu. 1,4 sn'de yay çizişi ve ağza düşüşü
     * rahatça izlenebiliyor; sepete ekleme akışını da bloklamıyor.
     */
    { duration: 1400, easing: "cubic-bezier(0.32, 0.04, 0.24, 1)", fill: "forwards" },
  );

  ucus.onfinish = () => {
    oge.remove();

    // Sepet "yakaladım" tepkisi: hafifçe ezilip toparlanır.
    const sepet =
      hedef.querySelector<HTMLElement>(`[${SEPET_GOVDE_NITELIGI}]`) ?? hedef;
    sepet.animate(
      [
        { transform: "scale(1, 1) translateY(0px)" },
        { transform: "scale(1.12, 0.84) translateY(5px)", offset: 0.35 },
        { transform: "scale(0.96, 1.06) translateY(-3px)", offset: 0.65 },
        { transform: "scale(1, 1) translateY(0px)" },
      ],
      { duration: 520, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
    );
  };
}
