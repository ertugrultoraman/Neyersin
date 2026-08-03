import postgres from "postgres";

/**
 * Kaba kuvvet (brute force) koruması.
 *
 * Önceden giriş denemesi sınırsızdı: bir betik saniyede yüzlerce parola
 * deneyip yönetici hesabını kırabilirdi. Artık aynı kimlik + IP için ard arda
 * başarısız denemeler sayılıyor ve eşiği aşınca kapı geçici olarak kilitleniyor.
 *
 * SAYAÇ VERİTABANINDA TUTULUYOR.
 *
 * Önceden yalnızca bellekteydi. Vercel'de her istek ayrı bir sunucu örneğine
 * düşebildiği için saldırgan denemelerini örnekler arasına dağıtarak 5 deneme
 * sınırını fiilen aşabiliyordu: her örnek kendi sayacını sıfırdan tutuyordu.
 * Ortak sayaç veritabanında olunca sınır gerçekten uygulanıyor.
 *
 * `DATABASE_URL` yoksa (dosya deposu modu, yerel deneme) bellekteki eski
 * davranışa düşülüyor — tek örnekli çalışmada o da yeterli.
 */

/** Kaç başarısız denemeden sonra kilitlensin. */
const ESIK = 5;
/** Kilit süresi (ms) — 15 dakika. */
const KILIT_SURESI = 15 * 60 * 1000;
/** Sayaç bu süre boyunca deneme gelmezse sıfırlanır (ms) — 30 dakika. */
const UNUTMA_SURESI = 30 * 60 * 1000;

type Kayit = { sayac: number; sonDeneme: number; kilitBitis: number };

function anahtarla(kimlik: string, ip: string): string {
  return `${kimlik.trim().toLowerCase()}|${ip}`;
}

// ---------------------------------------------------------------------------
// Bellek yedeği — yalnızca DATABASE_URL yokken kullanılır
// ---------------------------------------------------------------------------

const kayitlar = new Map<string, Kayit>();

/** Map'in sınırsız büyümesini engelle — eski kayıtları at. */
function bellegiTemizle(simdi: number) {
  if (kayitlar.size < 500) return;
  for (const [anahtar, k] of kayitlar) {
    if (simdi - k.sonDeneme > UNUTMA_SURESI && simdi > k.kilitBitis) kayitlar.delete(anahtar);
  }
}

// ---------------------------------------------------------------------------
// Postgres
// ---------------------------------------------------------------------------

let baglanti: ReturnType<typeof postgres> | null = null;
let semaHazir = false;

function veritabaniVarMi(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Hesap ve sipariş depolarıyla aynı bağlantı ayarları, kendi havuzu. */
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

async function semayiHazirla() {
  if (semaHazir) return;
  const q = sql();
  await q`
    CREATE TABLE IF NOT EXISTS giris_denemeleri (
      anahtar       TEXT PRIMARY KEY,
      sayac         INTEGER NOT NULL,
      son_deneme    TIMESTAMPTZ NOT NULL,
      kilit_bitis   TIMESTAMPTZ
    )
  `;
  // Süresi geçmiş kayıtları toplarken kullanılıyor.
  await q`CREATE INDEX IF NOT EXISTS giris_denemeleri_son_idx ON giris_denemeleri (son_deneme)`;
  semaHazir = true;
}

/**
 * Eski kayıtları topla. Kilit süresi de unutma süresi de geçmiş satırlar
 * artık hiçbir şey ifade etmiyor; tablo sınırsız büyümesin.
 */
async function veritabaniniTemizle(): Promise<void> {
  const q = sql();
  const esik = new Date(Date.now() - UNUTMA_SURESI);
  await q`
    DELETE FROM giris_denemeleri
    WHERE son_deneme < ${esik} AND (kilit_bitis IS NULL OR kilit_bitis < now())
  `;
}

export type SinirDurumu = { izinli: true } | { izinli: false; kalanSaniye: number };

/**
 * Giriş denenmeden ÖNCE çağrılır.
 *
 * Veritabanına ulaşılamazsa girişi ENGELLEMİYORUZ: aksi hâlde veritabanı
 * kesintisi bütün kullanıcıları kapı dışında bırakırdı. Bu bilinçli bir
 * tercih — sınırlayıcının amacı erişimi kesmek değil, denemeyi yavaşlatmak.
 */
export async function girisDenenebilirMi(kimlik: string, ip: string): Promise<SinirDurumu> {
  const simdi = Date.now();
  const anahtar = anahtarla(kimlik, ip);

  if (!veritabaniVarMi()) {
    bellegiTemizle(simdi);
    const kayit = kayitlar.get(anahtar);
    if (!kayit) return { izinli: true };
    if (simdi < kayit.kilitBitis) {
      return { izinli: false, kalanSaniye: Math.ceil((kayit.kilitBitis - simdi) / 1000) };
    }
    return { izinli: true };
  }

  try {
    await semayiHazirla();
    const satirlar = await sql()<{ kilit_bitis: Date | null }[]>`
      SELECT kilit_bitis FROM giris_denemeleri WHERE anahtar = ${anahtar}
    `;
    const kilitBitis = satirlar[0]?.kilit_bitis;
    if (!kilitBitis) return { izinli: true };

    const kalan = kilitBitis.getTime() - simdi;
    if (kalan > 0) return { izinli: false, kalanSaniye: Math.ceil(kalan / 1000) };
    return { izinli: true };
  } catch {
    return { izinli: true };
  }
}

/**
 * Giriş BAŞARISIZ olduğunda çağrılır.
 *
 * Sayaç tek sorguda artırılıyor (`ON CONFLICT ... DO UPDATE`): iki istek aynı
 * anda gelirse ikisi de sayılsın, biri diğerini ezmesin.
 */
export async function basarisizDeneme(kimlik: string, ip: string): Promise<void> {
  const simdi = Date.now();
  const anahtar = anahtarla(kimlik, ip);

  if (!veritabaniVarMi()) {
    const kayit = kayitlar.get(anahtar);
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
    return;
  }

  try {
    await semayiHazirla();
    const q = sql();
    const unutmaEsigi = new Date(simdi - UNUTMA_SURESI);
    const kilitSonu = new Date(simdi + KILIT_SURESI);

    await q`
      INSERT INTO giris_denemeleri (anahtar, sayac, son_deneme, kilit_bitis)
      VALUES (${anahtar}, 1, now(), NULL)
      ON CONFLICT (anahtar) DO UPDATE SET
        /* Uzun süredir deneme yoksa sayacı sıfırdan başlat. */
        sayac = CASE
          WHEN giris_denemeleri.son_deneme < ${unutmaEsigi} THEN 1
          ELSE giris_denemeleri.sayac + 1
        END,
        son_deneme = now(),
        kilit_bitis = CASE
          WHEN giris_denemeleri.son_deneme < ${unutmaEsigi} THEN NULL
          WHEN giris_denemeleri.sayac + 1 >= ${ESIK} THEN ${kilitSonu}
          ELSE NULL
        END
    `;
    await veritabaniniTemizle();
  } catch {
    // Sayaç yazılamadıysa girişi bozmuyoruz; koruma o istek için devre dışı kalır.
  }
}

/** Giriş BAŞARILI olduğunda çağrılır — sayaç temizlenir. */
export async function denemeleriSifirla(kimlik: string, ip: string): Promise<void> {
  const anahtar = anahtarla(kimlik, ip);
  kayitlar.delete(anahtar);
  if (!veritabaniVarMi()) return;
  try {
    await semayiHazirla();
    await sql()`DELETE FROM giris_denemeleri WHERE anahtar = ${anahtar}`;
  } catch {
    // Temizlenemezse en kötü senaryo: kişi bir süre daha sayaçta görünür.
  }
}
