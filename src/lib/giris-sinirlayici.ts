/**
 * Kaba kuvvet (brute force) koruması.
 *
 * Önceden giriş denemesi sınırsızdı: bir betik saniyede yüzlerce parola
 * deneyip yönetici hesabını kırabilirdi. Artık aynı kimlik + IP için ard arda
 * başarısız denemeler sayılıyor ve eşiği aşınca kapı geçici olarak kilitleniyor.
 *
 * BELLEKTE TUTULUYOR — kasıtlı bir sadeleştirme:
 *  - Tek sunucu örneğinde (yerel çalışma, tek Vercel fonksiyonu) yeterli.
 *  - Sunucu yeniden başlarsa sayaç sıfırlanır; saldırgan için kazanç sınırlı,
 *    çünkü yeniden başlatmayı o tetikleyemiyor.
 *  - Çok örnekli üretimde ortak bir sayaç (Redis/Postgres) gerekir; o zaman
 *    yalnızca bu dosya değişir, çağıran taraf aynı kalır.
 */

/** Kaç başarısız denemeden sonra kilitlensin. */
const ESIK = 5;
/** Kilit süresi (ms) — 15 dakika. */
const KILIT_SURESI = 15 * 60 * 1000;
/** Sayaç bu süre boyunca deneme gelmezse sıfırlanır (ms) — 30 dakika. */
const UNUTMA_SURESI = 30 * 60 * 1000;

type Kayit = { sayac: number; sonDeneme: number; kilitBitis: number };

const kayitlar = new Map<string, Kayit>();

/** Map'in sınırsız büyümesini engelle — eski kayıtları at. */
function temizle(simdi: number) {
  if (kayitlar.size < 500) return;
  for (const [anahtar, k] of kayitlar) {
    if (simdi - k.sonDeneme > UNUTMA_SURESI && simdi > k.kilitBitis) kayitlar.delete(anahtar);
  }
}

function anahtarla(kimlik: string, ip: string): string {
  return `${kimlik.trim().toLowerCase()}|${ip}`;
}

export type SinirDurumu = { izinli: true } | { izinli: false; kalanSaniye: number };

/** Giriş denenmeden ÖNCE çağrılır. */
export function girisDenenebilirMi(kimlik: string, ip: string): SinirDurumu {
  const simdi = Date.now();
  temizle(simdi);

  const kayit = kayitlar.get(anahtarla(kimlik, ip));
  if (!kayit) return { izinli: true };

  if (simdi < kayit.kilitBitis) {
    return { izinli: false, kalanSaniye: Math.ceil((kayit.kilitBitis - simdi) / 1000) };
  }
  return { izinli: true };
}

/** Giriş BAŞARISIZ olduğunda çağrılır. */
export function basarisizDeneme(kimlik: string, ip: string): void {
  const simdi = Date.now();
  const anahtar = anahtarla(kimlik, ip);
  const kayit = kayitlar.get(anahtar);

  // Uzun süredir deneme yoksa sayacı sıfırdan başlat
  if (!kayit || simdi - kayit.sonDeneme > UNUTMA_SURESI) {
    kayitlar.set(anahtar, { sayac: 1, sonDeneme: simdi, kilitBitis: 0 });
    return;
  }

  const sayac = kayit.sayac + 1;
  kayitlar.set(anahtar, {
    sayac,
    sonDeneme: simdi,
    kilitBitis: sayac >= ESIK ? simdi + KILIT_SURESI : 0,
  });
}

/** Giriş BAŞARILI olduğunda çağrılır — sayaç temizlenir. */
export function denemeleriSifirla(kimlik: string, ip: string): void {
  kayitlar.delete(anahtarla(kimlik, ip));
}
