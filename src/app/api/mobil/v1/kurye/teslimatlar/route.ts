import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { kuryeTeslimatlari } from "@/lib/mobil/kurye";

/**
 * GET /api/mobil/v1/kurye/teslimatlar
 *
 * Kuryeye ATANMIŞ siparişler. Rol kısıtı `kurye`; yönetici bilerek listede
 * değil çünkü uç "bana atananlar" sorusunu cevaplıyor ve yöneticinin kurye
 * kimliği yok — kendi paneli zaten hepsini gösteriyor.
 *
 * Cevap müşteriye HİÇBİR yerde gösterilmeyen alım adresini ve mutfak
 * telefonunu içeriyor (ev hanımları kendi evlerinden pişiriyor); bu yüzden
 * `acik()` değil `korumali()` ve rol beyaz listesi var.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["kurye"] }, async (oturum) =>
    basarili(await kuryeTeslimatlari(oturum.eposta)),
  );
}
