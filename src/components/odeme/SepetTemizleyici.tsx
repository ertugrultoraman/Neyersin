"use client";

import { useEffect } from "react";

import { useSepet } from "../saglayici/SepetBaglami";

/**
 * Kart ödemesinde kullanıcı iyzico'nun sayfasına gidip geri döndüğü için sepeti
 * form tarafında boşaltamıyoruz. Ödeme başarıyla doğrulandıktan sonra sonuç
 * sayfasında bir kez temizliyoruz.
 */
export function SepetTemizleyici() {
  const { temizle, kalemler, hazir } = useSepet();

  useEffect(() => {
    if (hazir && kalemler.length > 0) temizle();
  }, [hazir, kalemler.length, temizle]);

  return null;
}
