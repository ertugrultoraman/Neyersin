import crypto from "node:crypto";
import postgres from "postgres";

/**
 * VARDİYA PLANI — kuryenin önceden yer ayırttığı çalışma dilimleri.
 *
 * NEDEN GEREKİYOR: dağıtım motoru (bkz. lib/kurye-dagitim.ts) yalnızca ŞU ANI
 * biliyor — kim çevrimiçi, kime teklif düştü. "Yarın akşam 19:00'da kaç kurye
 * olacak?" sorusunun cevabı hiçbir yerde yoktu; yönetici ancak o saat gelip
 * kimse sahada olmayınca öğreniyordu. Dilim + rezervasyon, o soruyu ÖNCEDEN
 * cevaplıyor.
 *
 * REZERVASYON ÇEVRİMİÇİ OLMAYI ENGELLEMİYOR. Rezervasyonu olmayan kurye yine
 * çalışmaya başlayabiliyor ve teklif alabiliyor. "Vardiyasız çalışılamaz"
 * kuralı bir İŞ KARARI ve henüz verilmedi; kodda varsayılan olarak açmak,
 * bir akşam kimse rezervasyon yapmadığında bütün sahayı kapatmak demekti.
 * Karar verildiğinde tek yerde açılıyor: `teklifleriTazele` içindeki
 * çevrimiçilik kontrolüne bir koşul ekleniyor.
 *
 * İPTAL SİLMİYOR, İŞARETLİYOR. Rezervasyon satırı kalıcı; iptal `durum`
 * alanına yazılıyor. Satır silinseydi "vardiya başlamadan iki saat önce üç
 * kişi düştü" bilgisi kaybolurdu — kapasite planlamasında en çok işe yarayan
 * şey tam olarak bu.
 */

/** Kuryeye kaç günlük vitrin gösteriliyor. */
const VITRIN_GUN_SAYISI = 14;

/**
 * Bir dilim en fazla bu kadar sürebilir.
 *
 * Yazım hatasına karşı: yönetici bitiş saatini yanlış girdiğinde (19:00 →
 * 09:00 gibi) 22 saatlik bir vardiya oluşuyor ve kontenjan bütün gün boyunca
 * kilitli kalıyordu.
 */
const EN_UZUN_DILIM_SAAT = 12;

/** Kontenjan üst sınırı — elle giriş hatasını erken yakalamak için. */
const EN_COK_KONTENJAN = 200;

export type RezervasyonDurumu = "rezerve" | "iptal";

export type VardiyaDilimi = {
  id: string;
  baslangic: string;
  bitis: string;
  /** "Kadıköy", "Avrupa yakası" gibi serbest metin; boş olabilir. */
  bolge: string;
  not: string;
  kontenjan: number;
  /** Şu an rezerve edilmiş yer sayısı (iptaller hariç). */
  dolu: number;
};

export type VardiyaRezervasyonu = {
  eposta: string;
  durum: RezervasyonDurumu;
  olusturmaTarihi: string;
  iptalTarihi: string | null;
};

/** Yönetici görünümü: dilim + kimlerin yer ayırttığı. */
export type VardiyaDilimiYonetim = VardiyaDilimi & { rezervasyonlar: VardiyaRezervasyonu[] };

/** Kurye görünümü: dilim + "benim mi, alabilir miyim". */
export type VardiyaDilimiGorunumu = VardiyaDilimi & {
  benim: boolean;
  rezerveEdilebilir: boolean;
  iptalEdilebilir: boolean;
};

export type VardiyaPlani = {
  siradaki: VardiyaDilimiGorunumu | null;
  rezervasyonlarim: VardiyaDilimiGorunumu[];
  acikDilimler: VardiyaDilimiGorunumu[];
};

export type VardiyaSonucu = { tamam: true } | { tamam: false; sebep: string };

/* --------------------------------------------------------------------------
 * Depo
 * ----------------------------------------------------------------------- */

let baglanti: ReturnType<typeof postgres> | null = null;
let semaSozu: Promise<void> | null = null;

/**
 * Dağıtımla aynı ilke: VERİTABANI YOKSA VARDİYA DA YOK.
 *
 * Dosya deposu tek süreçte çalışıyor; kontenjan yarışının anlamı çok süreçli
 * bir sunucuda. `DATABASE_URL` yokken listeler boş dönüyor ve uygulama
 * "vardiya planı şu an kapalı" diyor — var olmayan bir dilimi rezerve
 * edilebilir göstermektense hiç göstermemek doğru.
 */
export const vardiyaAcikMi = () => Boolean(process.env.DATABASE_URL);

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
    const q = sql();

    await q`
      CREATE TABLE IF NOT EXISTS vardiya_dilimleri (
        id         TEXT PRIMARY KEY,
        baslangic  TIMESTAMPTZ NOT NULL,
        bitis      TIMESTAMPTZ NOT NULL,
        bolge      TEXT NOT NULL DEFAULT '',
        not_metni  TEXT NOT NULL DEFAULT '',
        kontenjan  INTEGER NOT NULL,
        olusturma  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    await q`
      CREATE TABLE IF NOT EXISTS vardiya_rezervasyonlari (
        id            TEXT PRIMARY KEY,
        dilim_id      TEXT NOT NULL,
        eposta        TEXT NOT NULL,
        durum         TEXT NOT NULL DEFAULT 'rezerve',
        olusturma     TIMESTAMPTZ NOT NULL DEFAULT now(),
        iptal_tarihi  TIMESTAMPTZ
      )
    `;

    /*
     * BİR DİLİM + BİR KURYE = BİR SATIR. Kısıt olmadan, çift dokunuş ya da
     * yeniden gönderilen istek aynı kuryeyi iki kez yazar ve kontenjanı
     * kendisiyle doldururdu.
     */
    await q`
      CREATE UNIQUE INDEX IF NOT EXISTS vardiya_rezervasyonlari_tekil
      ON vardiya_rezervasyonlari (dilim_id, eposta)
    `;
    await q`
      CREATE INDEX IF NOT EXISTS vardiya_rezervasyonlari_kurye
      ON vardiya_rezervasyonlari (eposta, durum)
    `;
    await q`
      CREATE INDEX IF NOT EXISTS vardiya_dilimleri_zaman
      ON vardiya_dilimleri (baslangic)
    `;
  })().catch((hata) => {
    semaSozu = null;
    throw hata;
  });
  return semaSozu;
}

const kucuk = (e: string) => e.trim().toLocaleLowerCase("tr");

type DilimSatiri = {
  id: string;
  baslangic: Date;
  bitis: Date;
  bolge: string;
  not_metni: string;
  kontenjan: number;
  dolu: number;
};

function satirdanDilim(s: DilimSatiri): VardiyaDilimi {
  return {
    id: s.id,
    baslangic: new Date(s.baslangic).toISOString(),
    bitis: new Date(s.bitis).toISOString(),
    bolge: s.bolge,
    not: s.not_metni,
    kontenjan: s.kontenjan,
    dolu: Number(s.dolu ?? 0),
  };
}

/* --------------------------------------------------------------------------
 * Yönetim — dilim açma ve kapatma
 * ----------------------------------------------------------------------- */

export type DilimGirdisi = {
  baslangic: string;
  bitis: string;
  bolge?: string;
  not?: string;
  kontenjan: number;
};

/**
 * Yeni vardiya dilimi açar.
 *
 * DOĞRULAMA SUNUCUDA: formdaki `datetime-local` alanı tarayıcıda boş
 * bırakılamıyor ama sunucu eylemi doğrudan da çağrılabilir ve bozuk bir dilim
 * kuryenin vitrinine düşer.
 */
export async function dilimOlustur(
  girdi: DilimGirdisi,
): Promise<{ tamam: true; id: string } | { tamam: false; sebep: string }> {
  if (!vardiyaAcikMi()) return { tamam: false, sebep: "Vardiya planı için veritabanı gerekiyor." };

  const bas = new Date(girdi.baslangic).getTime();
  const bit = new Date(girdi.bitis).getTime();

  if (!Number.isFinite(bas) || !Number.isFinite(bit)) {
    return { tamam: false, sebep: "Başlangıç ve bitiş saatini gir." };
  }
  if (bit <= bas) return { tamam: false, sebep: "Bitiş, başlangıçtan sonra olmalı." };
  if (bit - bas > EN_UZUN_DILIM_SAAT * 3_600_000) {
    return { tamam: false, sebep: `Bir dilim en fazla ${EN_UZUN_DILIM_SAAT} saat sürebilir.` };
  }
  /*
   * GEÇMİŞE DİLİM AÇILMIYOR. Kimsenin rezerve edemeyeceği bir dilim yalnızca
   * doluluk tablosunu kirletirdi. Yazım hatasını (yıl 2025 yerine 2015) da
   * burada yakalıyor.
   */
  if (bit <= Date.now()) return { tamam: false, sebep: "Bu dilim çoktan bitmiş." };

  const kontenjan = Math.trunc(girdi.kontenjan);
  if (!Number.isFinite(kontenjan) || kontenjan < 1 || kontenjan > EN_COK_KONTENJAN) {
    return { tamam: false, sebep: `Kontenjan 1 ile ${EN_COK_KONTENJAN} arasında olmalı.` };
  }

  await semayiHazirla();
  const id = crypto.randomUUID();
  await sql()`
    INSERT INTO vardiya_dilimleri (id, baslangic, bitis, bolge, not_metni, kontenjan)
    VALUES (${id}, ${new Date(bas).toISOString()}, ${new Date(bit).toISOString()},
            ${(girdi.bolge ?? "").trim()}, ${(girdi.not ?? "").trim()}, ${kontenjan})
  `;
  return { tamam: true, id };
}

/**
 * Dilimi kaldırır.
 *
 * BAŞLAMIŞ DİLİM SİLİNMİYOR: kurye o an sahada olabilir ve rezervasyonu
 * altından çekilirse özet ekranındaki plan bir anda boşalır. Yanlış açılmış
 * bir dilim başlamadan önce silinir; başlamışsa yaşayıp bitmesi gerekiyor.
 */
export async function dilimSil(id: string): Promise<VardiyaSonucu> {
  if (!vardiyaAcikMi()) return { tamam: false, sebep: "Vardiya planı için veritabanı gerekiyor." };
  await semayiHazirla();

  const satirlar = await sql()<{ id: string }[]>`
    DELETE FROM vardiya_dilimleri
    WHERE id = ${id} AND baslangic > now()
    RETURNING id
  `;
  if (satirlar.length === 0) {
    return { tamam: false, sebep: "Dilim bulunamadı ya da çoktan başlamış." };
  }

  await sql()`DELETE FROM vardiya_rezervasyonlari WHERE dilim_id = ${id}`;
  return { tamam: true };
}

/**
 * Yönetici listesi: dünden başlayıp iki hafta ileriye kadar bütün dilimler.
 *
 * DÜNÜ DE KAPSIYOR çünkü yöneticinin en sık sorduğu şey "dün akşam kaç kişi
 * söz verip gelmedi" — bunun için biten dilimin rezervasyon listesi lazım.
 */
export async function yonetimDilimleri(): Promise<VardiyaDilimiYonetim[]> {
  if (!vardiyaAcikMi()) return [];
  await semayiHazirla();
  const q = sql();

  const dilimler = await q<DilimSatiri[]>`
    SELECT d.*, (
      SELECT COUNT(*) FROM vardiya_rezervasyonlari r
      WHERE r.dilim_id = d.id AND r.durum = 'rezerve'
    )::int AS dolu
    FROM vardiya_dilimleri d
    WHERE d.bitis > now() - interval '1 day'
      AND d.baslangic < now() + ${`${VITRIN_GUN_SAYISI} days`}::interval
    ORDER BY d.baslangic ASC
  `;
  if (dilimler.length === 0) return [];

  const rezervasyonlar = await q<
    {
      dilim_id: string;
      eposta: string;
      durum: string;
      olusturma: Date;
      iptal_tarihi: Date | null;
    }[]
  >`
    SELECT dilim_id, eposta, durum, olusturma, iptal_tarihi
    FROM vardiya_rezervasyonlari
    WHERE dilim_id = ANY(${dilimler.map((d) => d.id)})
    ORDER BY olusturma ASC
  `;

  const gruplar = new Map<string, VardiyaRezervasyonu[]>();
  for (const r of rezervasyonlar) {
    const liste = gruplar.get(r.dilim_id) ?? [];
    liste.push({
      eposta: r.eposta,
      durum: r.durum as RezervasyonDurumu,
      olusturmaTarihi: new Date(r.olusturma).toISOString(),
      iptalTarihi: r.iptal_tarihi ? new Date(r.iptal_tarihi).toISOString() : null,
    });
    gruplar.set(r.dilim_id, liste);
  }

  return dilimler.map((d) => ({
    ...satirdanDilim(d),
    rezervasyonlar: gruplar.get(d.id) ?? [],
  }));
}

/* --------------------------------------------------------------------------
 * Kurye — plan, rezervasyon, iptal
 * ----------------------------------------------------------------------- */

function gorunume(
  dilim: VardiyaDilimi,
  benim: boolean,
  simdi: number,
): VardiyaDilimiGorunumu {
  const basladi = new Date(dilim.baslangic).getTime() <= simdi;
  return {
    ...dilim,
    benim,
    /* Başlamış dilime yer ayrılmıyor — vardiya zaten yürüyor. */
    rezerveEdilebilir: !benim && !basladi && dilim.dolu < dilim.kontenjan,
    /*
     * İptal, dilim BAŞLAYANA KADAR serbest. Son dakika iptaline ceza yazmak
     * (ör. "iki saat kala iptal edilemez") bir iş kararı ve verilmedi; kayıt
     * tutuluyor, karar verildiğinde kuralı burası taşıyacak.
     */
    iptalEdilebilir: benim && !basladi,
  };
}

/**
 * Kuryenin vardiya planı: sıradaki vardiya, rezervasyonları ve açık dilimler.
 *
 * TEK ÇAĞRI çünkü üç liste tek ekranda görünüyor; ayrı uçlara bölünseydi
 * uygulama üç istek atar ve arada rezervasyon yapıldığında listeler kendi
 * içinde çelişirdi (dilim hem "açık" hem "benim" görünürdü).
 */
export async function kuryeVardiyaPlani(eposta: string): Promise<VardiyaPlani> {
  const bos: VardiyaPlani = { siradaki: null, rezervasyonlarim: [], acikDilimler: [] };
  if (!vardiyaAcikMi()) return bos;
  await semayiHazirla();

  const kim = kucuk(eposta);
  const simdi = Date.now();

  const satirlar = await sql()<(DilimSatiri & { benim: boolean })[]>`
    SELECT d.*, (
      SELECT COUNT(*) FROM vardiya_rezervasyonlari r
      WHERE r.dilim_id = d.id AND r.durum = 'rezerve'
    )::int AS dolu, EXISTS (
      SELECT 1 FROM vardiya_rezervasyonlari r
      WHERE r.dilim_id = d.id AND r.eposta = ${kim} AND r.durum = 'rezerve'
    ) AS benim
    FROM vardiya_dilimleri d
    WHERE d.bitis > now()
      AND d.baslangic < now() + ${`${VITRIN_GUN_SAYISI} days`}::interval
    ORDER BY d.baslangic ASC
  `;

  const gorunumler = satirlar.map((s) => gorunume(satirdanDilim(s), s.benim, simdi));
  const benimkiler = gorunumler.filter((g) => g.benim);

  return {
    /*
     * "Sıradaki" ŞU AN SÜREN vardiyayı da kapsıyor: sorgu `bitis > now()`
     * filtreliyor ve liste başlangıca göre sıralı, yani devam eden dilim
     * listenin başında kalıyor. Yalnızca gelecekteki dilimler alınsaydı
     * kurye vardiyasının ortasında ekranda "planlanmış vardiyan yok" görürdü.
     */
    siradaki: benimkiler[0] ?? null,
    rezervasyonlarim: benimkiler,
    acikDilimler: gorunumler.filter((g) => !g.benim),
  };
}

/**
 * Dilime yer ayırır.
 *
 * KONTENJAN YARIŞI GERÇEK: son bir yer için aynı anda dokunan iki kurye,
 * sayımı ayrı ayrı okuyup ikisi de "yer var" görebilir. Bu yüzden dilim satırı
 * işlem içinde `FOR UPDATE` ile kilitleniyor; ikinci istek birincinin yazması
 * bitene kadar bekliyor ve güncel sayımı görüyor. Koşullu tek bir INSERT
 * yazmak yetmezdi — READ COMMITTED'da iki alt sorgu da eski sayımı okur.
 */
export async function vardiyaRezerve(eposta: string, dilimId: string): Promise<VardiyaSonucu> {
  if (!vardiyaAcikMi()) return { tamam: false, sebep: "Vardiya planı şu an kapalı." };
  await semayiHazirla();

  const kim = kucuk(eposta);

  return sql().begin(async (tx) => {
    const dilimler = await tx<{ id: string; baslangic: Date; kontenjan: number }[]>`
      SELECT id, baslangic, kontenjan FROM vardiya_dilimleri
      WHERE id = ${dilimId}
      FOR UPDATE
    `;
    const dilim = dilimler[0];
    if (!dilim) return { tamam: false, sebep: "Bu vardiya kaldırılmış." } as VardiyaSonucu;
    if (new Date(dilim.baslangic).getTime() <= Date.now()) {
      return { tamam: false, sebep: "Bu vardiya başlamış, artık yer ayrılamıyor." };
    }

    const [{ dolu }] = await tx<{ dolu: number }[]>`
      SELECT COUNT(*)::int AS dolu FROM vardiya_rezervasyonlari
      WHERE dilim_id = ${dilimId} AND durum = 'rezerve' AND eposta <> ${kim}
    `;
    if (dolu >= dilim.kontenjan) {
      return { tamam: false, sebep: "Bu vardiya doldu." };
    }

    /*
     * ÇAKIŞMADA GÜNCELLE: kurye daha önce iptal ettiyse satır duruyor.
     * `DO NOTHING` yazılsaydı bir kez iptal eden kurye aynı vardiyaya bir
     * daha giremezdi ve sebebini de göremezdi.
     */
    await tx`
      INSERT INTO vardiya_rezervasyonlari (id, dilim_id, eposta, durum, olusturma)
      VALUES (${crypto.randomUUID()}, ${dilimId}, ${kim}, 'rezerve', now())
      ON CONFLICT (dilim_id, eposta) DO UPDATE SET
        durum = 'rezerve',
        olusturma = now(),
        iptal_tarihi = NULL
    `;

    return { tamam: true };
  }) as Promise<VardiyaSonucu>;
}

/** Rezervasyonu iptal eder — satır silinmiyor, iptal olarak işaretleniyor. */
export async function vardiyaIptal(eposta: string, dilimId: string): Promise<VardiyaSonucu> {
  if (!vardiyaAcikMi()) return { tamam: false, sebep: "Vardiya planı şu an kapalı." };
  await semayiHazirla();

  const satirlar = await sql()<{ id: string }[]>`
    UPDATE vardiya_rezervasyonlari r
    SET durum = 'iptal', iptal_tarihi = now()
    FROM vardiya_dilimleri d
    WHERE r.dilim_id = d.id
      AND r.dilim_id = ${dilimId}
      AND r.eposta = ${kucuk(eposta)}
      AND r.durum = 'rezerve'
      AND d.baslangic > now()
    RETURNING r.id
  `;

  return satirlar.length > 0
    ? { tamam: true }
    : { tamam: false, sebep: "Başlamış bir vardiya iptal edilemiyor." };
}
