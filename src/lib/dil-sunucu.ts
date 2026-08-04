import { cookies } from "next/headers";

import { dilGecerliMi, DIL_COOKIE, VARSAYILAN_DIL, type Dil } from "./dil";

/**
 * Sunucu bileşenlerinde geçerli dil.
 *
 * Çerez yoksa Türkçe. Tarayıcı dilini otomatik algılamıyoruz: Türkiye'den
 * giren çoğu kişinin tarayıcısı İngilizce olabiliyor ve site birden
 * İngilizce açılınca kafa karıştırıyordu.
 *
 * SADECE SUNUCU: `next/headers` istemci paketinde derlenmiyor. İstemci
 * bileşenleri dili `useDil()` ile bağlamdan okuyor.
 */
export async function aktifDil(): Promise<Dil> {
  const deger = (await cookies()).get(DIL_COOKIE)?.value;
  return dilGecerliMi(deger) ? deger : VARSAYILAN_DIL;
}
