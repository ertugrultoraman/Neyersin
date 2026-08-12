import Constants from "expo-constants";
import { ApiIstemcisi } from "ortak";
import { cihazKimligiAl, guvenliJetonDeposu } from "ortak/native";

/**
 * Kurye uygulamasının TEK API istemcisi.
 *
 * Müşteri uygulamasındakiyle aynı sınıf, tek fark ZAMAN AŞIMI. Kurye sahada
 * ve hareket hâlinde: bodrum katta, asansörde, hücre değiştirirken cevap
 * gecikiyor. 15 saniyede pes eden bir istek, teslim bildirimini "başarısız"
 * gösterip kuryeye tekrar bastırırdı — oysa istek sunucuya çoktan ulaşmış
 * olabilir. Daha uzun beklemek, sahte hatadan iyi.
 */

const TABAN = (Constants.expoConfig?.extra?.apiTaban as string | undefined) ?? "https://neyersin.net";

export const api = new ApiIstemcisi({
  taban: TABAN,
  cihaz: "",
  depo: guvenliJetonDeposu,
  zamanAsimiMs: 30_000,
});

export async function apiHazirla(): Promise<string> {
  const cihaz = await cihazKimligiAl();
  api.cihazDegistir(cihaz);
  return cihaz;
}
