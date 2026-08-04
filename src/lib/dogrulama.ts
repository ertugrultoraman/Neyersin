import crypto from "node:crypto";

import { epostaGonder, epostaYapilandirildiMi, kodPostasi } from "./eposta";
import { VARSAYILAN_DIL } from "./dil";
import { aktifDil } from "./dil-sunucu";
import {
  hesapDepoAl,
  parolaDogrula,
  parolaOzetle,
  type DogrulamaKodu,
  type KodAmaci,
} from "./hesaplar";

/**
 * E-posta doğrulama ve parola sıfırlama kodları.
 *
 * Kurallar:
 *  - Kod 6 haneli, KRİPTOGRAFİK olarak rastgele (Math.random değil).
 *  - Veritabanında yalnızca scrypt özeti durur; kodun kendisi saklanmaz.
 *  - 15 dakika geçerli, 5 yanlış denemede yanar.
 *  - Aynı e-posta için yeni kod üretilince eskiler geçersiz olur.
 *  - Kod hiçbir koşulda tarayıcıya/JSON'a dönmez. Posta gönderilemiyorsa
 *    yalnızca yönetici panelinde görünür (bkz. tipler.ts → DogrulamaKodu).
 */

const GECERLILIK_DK = 15;
const AZAMI_DENEME = 5;
/** Aynı adrese arka arkaya kod yağdırılmasın. */
const YENIDEN_GONDERIM_SN = 60;

export function kodUret(): string {
  // 0–999999 aralığında düzgün dağılımlı, tahmin edilemez kod.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

const kucuk = (e: string) => e.trim().toLowerCase();

export type KodGonderimSonucu =
  | { basarili: true; postaGitti: boolean }
  | { basarili: false; hata: string };

/**
 * Yeni kod üretir, kaydeder ve e-postayla gönderir.
 * Dönen değer kodu ASLA içermez.
 */
export async function kodGonder(eposta: string, amac: KodAmaci): Promise<KodGonderimSonucu> {
  const adres = kucuk(eposta);
  const depo = await hesapDepoAl();

  // Çok sık istenmesin.
  const onceki = await depo.sonKodBul(adres, amac);
  if (onceki) {
    const gecen = Date.now() - new Date(onceki.olusturmaTarihi).getTime();
    if (gecen < YENIDEN_GONDERIM_SN * 1000) {
      const kalan = Math.ceil((YENIDEN_GONDERIM_SN * 1000 - gecen) / 1000);
      return { basarili: false, hata: `Yeni kod istemek için ${kalan} saniye bekle.` };
    }
  }

  await depo.kodlariTuket(adres, amac);

  const kod = kodUret();
  /*
   * Posta, kullanıcının sitede seçtiği dilde gidiyor. İstek bağlamı dışında
   * (bakım betikleri) çerez okunamadığı için Türkçeye düşülüyor.
   */
  const dil = await aktifDil().catch(() => VARSAYILAN_DIL);
  const posta = kodPostasi(kod, amac, dil);
  const sonuc = await epostaGonder({ alici: adres, ...posta });

  const kayit: DogrulamaKodu = {
    id: crypto.randomUUID(),
    eposta: adres,
    amac,
    kodOzeti: await parolaOzetle(kod),
    /*
     * Posta gidemediyse kodu düz metin sakla ki yönetici panelinden okunup
     * kişiye iletilebilsin. SMTP tanımlıysa bu alan HİÇ yazılmaz.
     */
    duzKod: sonuc.gonderildi ? undefined : kod,
    deneme: 0,
    kullanildi: false,
    gonderildi: sonuc.gonderildi,
    sonGecerlilik: new Date(Date.now() + GECERLILIK_DK * 60_000).toISOString(),
    olusturmaTarihi: new Date().toISOString(),
  };
  await depo.kodKaydet(kayit);

  return { basarili: true, postaGitti: sonuc.gonderildi };
}

export type KodDogrulamaSonucu = { gecerli: true } | { gecerli: false; hata: string };

/** Kodu doğrular ve doğruysa tüketir (tek kullanımlık). */
export async function koduDogrula(
  eposta: string,
  amac: KodAmaci,
  girilen: string,
): Promise<KodDogrulamaSonucu> {
  const adres = kucuk(eposta);
  const temiz = girilen.replace(/\D/g, "");
  if (temiz.length !== 6) return { gecerli: false, hata: "Kod 6 haneli olmalı." };

  const depo = await hesapDepoAl();
  const kayit = await depo.sonKodBul(adres, amac);
  if (!kayit) {
    return { gecerli: false, hata: "Geçerli bir kod bulunamadı. Yeniden kod iste." };
  }
  if (new Date(kayit.sonGecerlilik).getTime() < Date.now()) {
    await depo.kodlariTuket(adres, amac);
    return { gecerli: false, hata: "Kodun süresi doldu. Yeniden kod iste." };
  }
  if (kayit.deneme >= AZAMI_DENEME) {
    await depo.kodlariTuket(adres, amac);
    return { gecerli: false, hata: "Çok fazla yanlış deneme. Yeniden kod iste." };
  }

  const dogru = await parolaDogrula(temiz, kayit.kodOzeti);
  if (!dogru) {
    await depo.kodKaydet({ ...kayit, deneme: kayit.deneme + 1 });
    const kalan = AZAMI_DENEME - (kayit.deneme + 1);
    return {
      gecerli: false,
      hata: kalan > 0 ? `Kod yanlış. ${kalan} deneme hakkın kaldı.` : "Kod yanlış. Yeniden kod iste.",
    };
  }

  await depo.kodKaydet({ ...kayit, kullanildi: true, duzKod: undefined });
  return { gecerli: true };
}

/** Arayüzde "posta gitmedi, yöneticiye sor" uyarısı göstermek için. */
export function postaHazirMi(): boolean {
  return epostaYapilandirildiMi();
}
