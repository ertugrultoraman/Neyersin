import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { kullaniciDto } from "@/lib/mobil/kullanici";

/**
 * GET /api/mobil/v1/oturum/ben
 *
 * Açılışta çağrılıyor: cihazda duran jeton hâlâ geçerli mi ve kullanıcının
 * güncel bilgileri neler? Jetonun içindeki ad/rol yazıldığı andaki hâli;
 * bu uç profil fotoğrafı ve doğrulama durumu gibi taze alanları da veriyor.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, {}, async (oturum) => basarili(await kullaniciDto(oturum)));
}
