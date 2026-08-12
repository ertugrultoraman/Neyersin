import type { NextRequest, NextResponse } from "next/server";

import type { Rol } from "../hesaplar";
import { istektenOturum, type MobilOturum } from "./jeton";
import { sunucuHatasi, yasak, yetkisiz } from "./cevap";

/**
 * UÇ KORUMASI — her mobil route handler'ının içindeki ortak kabuk.
 *
 * Üç işi bir arada yapıyor:
 *  1. `Authorization` başlığından oturumu çözer, yoksa 401.
 *  2. Rol beyaz listesini uygular, uymuyorsa 403.
 *  3. Beklenmeyen istisnaları yakalayıp JSON 500 zarfına çevirir.
 *
 * Üçüncüsü göründüğünden önemli: yakalanmayan bir istisnada Next.js kendi HTML
 * hata sayfasını dönüyor. Uygulama gövdeyi JSON bekleyip çözümleyemiyor ve
 * kullanıcı "sunucuya ulaşılamadı" görüyordu — oysa sunucu cevap vermişti.
 *
 * 401 ile 403 AYRIMI istemci davranışını belirliyor: 401 alan istemci yenileme
 * jetonuyla tazeleyip isteği bir kez tekrarlıyor, 403 alan doğrudan kullanıcıya
 * söylüyor. İkisi karışsaydı yetkisi olmayan kullanıcı sonsuz tazeleme
 * döngüsüne girerdi.
 *
 * BİÇİM NOTU: sarmalayıcı değil, doğrudan çağrılan bir fonksiyon. Handler'ı
 * sarıp döndüren bir tasarım denendi ama Next.js'in ürettiği route tiplerine
 * karşı imza uyuşmazlığı çıkarıyordu; ayrıca dinamik segmentler (`params`)
 * sarmalayıcının içinden geçmek zorunda kalıyordu. Böyle, dışa aktarılan
 * fonksiyonun imzası Next'in beklediğinin BİREBİR aynısı kalıyor.
 *
 *   export async function GET(istek: NextRequest) {
 *     return korumali(istek, { roller: ["kurye"] }, async (oturum) => …);
 *   }
 */

export type KorumaSecenekleri = {
  /**
   * İzin verilen roller. Verilmezse giriş yapmış HERKES geçer.
   *
   * Yönetici bilerek otomatik geçirilmiyor: "admin her şeyi yapabilir"
   * kestirmesi, kurye konumu bildirmek gibi rolün kendisine ait uçlarda
   * anlamsız veri üretirdi. Yöneticinin görmesi gereken uçlarda `admin`
   * listeye açıkça yazılıyor.
   */
  roller?: readonly Rol[];
};

export async function korumali(
  istek: NextRequest,
  secenekler: KorumaSecenekleri,
  isleyici: (oturum: MobilOturum) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  const oturum = istektenOturum(istek);
  if (!oturum) return yetkisiz();

  if (secenekler.roller && !secenekler.roller.includes(oturum.rol)) {
    return yasak();
  }

  try {
    return await isleyici(oturum);
  } catch (e) {
    console.error("[mobil] beklenmeyen hata:", e);
    return sunucuHatasi();
  }
}

/**
 * Oturum İSTEMEYEN uçlar için (katalog, giriş, kayıt).
 *
 * Yalnızca istisna kabuğunu veriyor; kimlik kontrolü yok. Oturum varsa yine de
 * çözülüp isleyiciye geçiliyor — katalog uçları girişli kullanıcıya kişisel
 * bilgi (son sipariş, kupon hakkı) ekleyebilsin diye.
 */
export async function acik(
  istek: NextRequest,
  isleyici: (oturum: MobilOturum | null) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  try {
    return await isleyici(istektenOturum(istek));
  } catch (e) {
    console.error("[mobil] beklenmeyen hata:", e);
    return sunucuHatasi();
  }
}
