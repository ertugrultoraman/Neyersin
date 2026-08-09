import postgres from "postgres";

/**
 * BOT ENGELİ — "ben robot değilim" kapısını makine hızıyla geçmeye çalışana.
 *
 * Kapı zaten hızlı gönderimi REDDEDİYORDU (bkz. insan-dogrulama.ts): kutuyu
 * işaretlemek, bal küpünü boş bırakmak ve formu 900 ms'den geç göndermek
 * gerekiyor. Ama reddedilen bot hemen tekrar deneyebiliyordu — sonsuz kez.
 * Burası o boşluğu kapatıyor: bot işareti biriktikçe IP kapıya alınmıyor.
 *
 * NEDEN TEK VURUŞTA DEĞİL (eşik 3):
 * Türkiye'de mobil operatörlerin büyük kısmı CGNAT kullanıyor — binlerce
 * gerçek kullanıcı AYNI genel IP'nin arkasında olabiliyor. Tek bir hatalı
 * gönderim için o IP'yi altı ay kapatmak, bir botu durdurmak uğruna bir
 * mahalleyi kapı dışında bırakmak olurdu. Üç ayrı bot işareti tesadüf değil.
 *
 * BAL KÜPÜ TEK BAŞINA YETER: o alanı yalnızca formu otomatik dolduran bir
 * yazılım doldurabilir, insan onu göremiyor bile. O yüzden bal küpü işareti
 * eşiği doğrudan doldurur.
 *
 * SÜRE: altı ay (kullanıcının isteği).
 *
 * Sayaç VERİTABANINDA: Vercel'de her istek ayrı örneğe düşebiliyor, bellekteki
 * sayaç saldırganın denemelerini örneklere dağıtmasıyla anlamsızlaşırdı
 * (aynı gerekçe: lib/giris-sinirlayici.ts).
 */

/** Kaç bot işaretinden sonra engellensin. */
export const ESIK = 3;
/** Engel süresi — altı ay. */
export const ENGEL_SURESI = 182 * 24 * 60 * 60 * 1000;
/** Bu süre boyunca yeni işaret gelmezse sayaç sıfırlanır — bir gün. */
const UNUTMA_SURESI = 24 * 60 * 60 * 1000;

export type BotSebebi = "bal-kupu" | "hiz" | "isaretsiz";

/** Bal küpü tek başına yeterli kanıt; diğerleri birikmeli. */
function agirlik(sebep: BotSebebi): number {
  return sebep === "bal-kupu" ? ESIK : 1;
}

type Kayit = { sayac: number; son: number; bitis: number; sebep: string };
const bellek = new Map<string, Kayit>();

let baglanti: ReturnType<typeof postgres> | null = null;
let semaSozu: Promise<void> | null = null;

const veritabaniVarMi = () => Boolean(process.env.DATABASE_URL);

function sql() {
  if (!baglanti) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL tanımlı değil.");
    baglanti = postgres(url, {
      max: 2,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: url.includes("sslmode=disable") ? false : "require",
    });
  }
  return baglanti;
}

function semayiHazirla(): Promise<void> {
  semaSozu ??= (async () => {
    await sql()`
      CREATE TABLE IF NOT EXISTS bot_engelleri (
        ip      TEXT PRIMARY KEY,
        sayac   INTEGER NOT NULL,
        son     TIMESTAMPTZ NOT NULL,
        bitis   TIMESTAMPTZ,
        sebep   TEXT
      )
    `;
  })().catch((hata) => {
    semaSozu = null;
    throw hata;
  });
  return semaSozu;
}

export type EngelDurumu = { engelli: false } | { engelli: true; bitis: string; sebep: string };

/**
 * Bu IP kapıdan geçebilir mi?
 *
 * Veritabanına ulaşılamazsa ENGELLEMİYORUZ: bir veritabanı kesintisi bütün
 * ziyaretçileri siteden atmamalı. Engelin amacı erişimi kesmek değil, botu
 * yormak (aynı tercih: giris-sinirlayici.ts).
 */
export async function botEngelliMi(ip: string): Promise<EngelDurumu> {
  if (!ip) return { engelli: false };
  const simdi = Date.now();

  if (!veritabaniVarMi()) {
    const kayit = bellek.get(ip);
    if (kayit && simdi < kayit.bitis) {
      return { engelli: true, bitis: new Date(kayit.bitis).toISOString(), sebep: kayit.sebep };
    }
    return { engelli: false };
  }

  try {
    await semayiHazirla();
    const satirlar = await sql()<{ bitis: Date | null; sebep: string | null }[]>`
      SELECT bitis, sebep FROM bot_engelleri WHERE ip = ${ip}
    `;
    const bitis = satirlar[0]?.bitis;
    if (bitis && new Date(bitis).getTime() > simdi) {
      return {
        engelli: true,
        bitis: new Date(bitis).toISOString(),
        sebep: satirlar[0]?.sebep ?? "bot",
      };
    }
  } catch {
    // veritabanı yoksa kapıyı açık bırak
  }
  return { engelli: false };
}

/**
 * Bot işareti kaydeder; eşiğe ulaşınca altı aylık engeli koyar.
 * @returns Bu işaretle engel konduysa `true`.
 */
export async function botIsareti(ip: string, sebep: BotSebebi): Promise<boolean> {
  if (!ip) return false;
  const simdi = Date.now();
  const artis = agirlik(sebep);

  if (!veritabaniVarMi()) {
    const kayit = bellek.get(ip);
    const taze = kayit && simdi - kayit.son < UNUTMA_SURESI ? kayit : { sayac: 0, son: simdi, bitis: 0, sebep };
    const sayac = taze.sayac + artis;
    const bitis = sayac >= ESIK ? simdi + ENGEL_SURESI : taze.bitis;
    bellek.set(ip, { sayac, son: simdi, bitis, sebep });
    if (bellek.size > 2000) {
      for (const [k, v] of bellek) if (simdi - v.son > UNUTMA_SURESI && simdi > v.bitis) bellek.delete(k);
    }
    return sayac >= ESIK;
  }

  try {
    await semayiHazirla();
    /*
     * Sayaç ESKİYSE sıfırdan başlıyor: bir yıl önce bir kez hatalı gönderim
     * yapmış bir IP, bugünkü bir hatayla eşiği doldurmamalı.
     */
    const satirlar = await sql()<{ sayac: number }[]>`
      INSERT INTO bot_engelleri (ip, sayac, son, sebep)
      VALUES (${ip}, ${artis}, now(), ${sebep})
      ON CONFLICT (ip) DO UPDATE SET
        sayac = CASE
          WHEN bot_engelleri.son < now() - ${`${UNUTMA_SURESI} milliseconds`}::interval THEN ${artis}
          ELSE bot_engelleri.sayac + ${artis}
        END,
        son   = now(),
        sebep = ${sebep}
      RETURNING sayac
    `;

    const sayac = satirlar[0]?.sayac ?? artis;
    if (sayac >= ESIK) {
      await sql()`
        UPDATE bot_engelleri
        SET bitis = now() + ${`${ENGEL_SURESI} milliseconds`}::interval
        WHERE ip = ${ip} AND (bitis IS NULL OR bitis < now())
      `;
      return true;
    }
  } catch {
    // sayaç tutulamadıysa kapı yine de reddediyor, yalnızca engel konmuyor
  }
  return false;
}

export type EngelKaydi = { ip: string; sayac: number; son: string; bitis: string | null; sebep: string };

/** Yönetici listesi — süresi geçmemiş engeller önce. */
export async function engelleriListele(): Promise<EngelKaydi[]> {
  if (!veritabaniVarMi()) {
    return [...bellek.entries()].map(([ip, k]) => ({
      ip,
      sayac: k.sayac,
      son: new Date(k.son).toISOString(),
      bitis: k.bitis ? new Date(k.bitis).toISOString() : null,
      sebep: k.sebep,
    }));
  }
  try {
    await semayiHazirla();
    const satirlar = await sql()<
      { ip: string; sayac: number; son: Date; bitis: Date | null; sebep: string | null }[]
    >`SELECT ip, sayac, son, bitis, sebep FROM bot_engelleri ORDER BY bitis DESC NULLS LAST, son DESC LIMIT 200`;
    return satirlar.map((s) => ({
      ip: s.ip,
      sayac: s.sayac,
      son: new Date(s.son).toISOString(),
      bitis: s.bitis ? new Date(s.bitis).toISOString() : null,
      sebep: s.sebep ?? "bot",
    }));
  } catch {
    return [];
  }
}

/**
 * Engeli kaldırır — yanlışlıkla engellenen gerçek kullanıcı için.
 *
 * CGNAT yüzünden bir IP'nin arkasında binlerce kişi olabiliyor; yöneticinin
 * bunu geri alabilmesi şart, yoksa hata altı ay boyunca düzeltilemezdi.
 */
export async function engeliKaldir(ip: string): Promise<void> {
  bellek.delete(ip);
  if (!veritabaniVarMi()) return;
  try {
    await semayiHazirla();
    await sql()`DELETE FROM bot_engelleri WHERE ip = ${ip}`;
  } catch {
    // kaldırılamadıysa yönetici tekrar deneyecek
  }
}
