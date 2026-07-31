import crypto from "node:crypto";
import { promisify } from "node:util";

/**
 * Parola özetleme — scrypt.
 *
 * Neden scrypt: Node'un standart kütüphanesinde var (ek bağımlılık yok),
 * bellek-zor bir fonksiyon olduğu için GPU ile toplu kırmaya bcrypt'ten daha
 * dirençli. Her parola kendi rastgele tuzunu taşır, format: `tuz:ozet` (hex).
 */
const scrypt = promisify(crypto.scrypt) as (
  parola: string,
  tuz: string,
  uzunluk: number,
) => Promise<Buffer>;

const OZET_UZUNLUGU = 64;

export async function parolaOzetle(parola: string): Promise<string> {
  const tuz = crypto.randomBytes(16).toString("hex");
  const ozet = await scrypt(parola, tuz, OZET_UZUNLUGU);
  return `${tuz}:${ozet.toString("hex")}`;
}

/** Sabit zamanlı karşılaştırma — parola uzunluğu zamanlamadan sızmaz. */
export async function parolaDogrula(parola: string, kayitli: string): Promise<boolean> {
  const [tuz, ozetHex] = kayitli.split(":");
  if (!tuz || !ozetHex) return false;

  const beklenen = Buffer.from(ozetHex, "hex");
  if (beklenen.length !== OZET_UZUNLUGU) return false;

  const hesaplanan = await scrypt(parola, tuz, OZET_UZUNLUGU);
  return crypto.timingSafeEqual(hesaplanan, beklenen);
}

/** Kayıt formunda kullanılan asgari parola kuralı. */
export function parolaYeterliMi(parola: string): boolean {
  return typeof parola === "string" && parola.length >= 8;
}
