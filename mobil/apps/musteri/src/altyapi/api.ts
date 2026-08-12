import Constants from "expo-constants";
import { ApiIstemcisi } from "ortak";
import { cihazKimligiAl, guvenliJetonDeposu } from "ortak/native";

/**
 * Uygulamanın TEK API istemcisi.
 *
 * Modül düzeyinde tek örnek olmasının sebebi jeton tazeleme kilidi: istemci,
 * eş zamanlı 401'lerde tek bir tazeleme isteği atmak için kendi içinde bir
 * promise tutuyor (bkz. ortak/src/api/istemci.ts). Her ekran kendi örneğini
 * yaratsaydı o kilit paylaşılmaz, açılışta paralel giden isteklerin her biri
 * ayrı tazeleme başlatır ve rotasyon yüzünden çoğu geçersiz jetonla dönerdi.
 */

/** `app.config.ts` → `extra.apiTaban`. Geliştirmede yerel ağ adresi olur. */
const TABAN = (Constants.expoConfig?.extra?.apiTaban as string | undefined) ?? "https://neyersin.net";

/**
 * Cihaz kimliği ASENKRON okunuyor (Keychain erişimi) ama istemci senkron
 * kuruluyor. Başlangıçta boş bırakılıp `apiHazirla` ile dolduruluyor; o çağrı
 * bitene kadar hiçbir ekran açılmıyor (bkz. app/_layout.tsx).
 */
export const api = new ApiIstemcisi({
  taban: TABAN,
  cihaz: "",
  depo: guvenliJetonDeposu,
  /** Kurye uygulamasının aksine burada şebeke genelde iyi; 15 sn yeterli. */
  zamanAsimiMs: 15_000,
});

/** Açılışta bir kez çağrılıyor; cihaz kimliğini yerine koyar. */
export async function apiHazirla(): Promise<string> {
  const cihaz = await cihazKimligiAl();
  api.cihazDegistir(cihaz);
  return cihaz;
}
