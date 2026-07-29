"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Görünür olduğunda hedef değere doğru sayan rakam.
 * Hareket azaltma tercihinde doğrudan son değeri gösterir.
 */
export function Sayac({
  hedef,
  sure = 1.6,
  onEk = "",
  sonEk = "",
  ondalik = 0,
  className,
}: {
  hedef: number;
  sure?: number;
  onEk?: string;
  sonEk?: string;
  ondalik?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const gorunur = useInView(ref, { once: true, margin: "-60px" });
  const azalt = useReducedMotion();
  const [deger, setDeger] = useState(0);

  useEffect(() => {
    if (!gorunur) return;
    if (azalt) {
      setDeger(hedef);
      return;
    }
    const kontrol = animate(0, hedef, {
      duration: sure,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDeger(v),
    });
    return () => kontrol.stop();
  }, [gorunur, hedef, sure, azalt]);

  return (
    <span ref={ref} className={className}>
      {onEk}
      {deger.toLocaleString("tr-TR", {
        minimumFractionDigits: ondalik,
        maximumFractionDigits: ondalik,
      })}
      {sonEk}
    </span>
  );
}
