import crypto from "node:crypto";
import postgres from "postgres";

import { depoAl, type KayitliSiparis } from "./depo";
import { kuryeHakedisi, kuryeUcretDokumu, type UcretDokumu } from "./kurye-tarife";
import { siparisMesafesiKm } from "./mesafe";
import { restoranCoz } from "./restoran-listesi";
import { calismayaAcikMi } from "./siparis";

/**
 * KURYE DAĞITIM MOTORU — müsaitlik, konum ve iş teklifleri.
 *
 * ÇEKMELİ (pull) TASARIM. Vercel'de sürekli çalışan bir arka plan işçisi yok;
 * "sipariş hazır oldu → yakındaki kuryelere teklif düşür" diyecek bir kuyruk
 * kurulamıyor. Bunun yerine teklifler OKUNDUĞU AN üretiliyor: çevrimiçi kurye
 * `teklifleriTazele` çağırdığında, sahipsiz siparişler için kendisine bir
 * teklif kaydı açılıyor. Sonuç kuryenin gözünde aynı — telefonu birkaç
 * saniyede bir soruyor ve iş belirdiği anda ekranına düşüyor — ama kurulum
 * bir cron'a, bir kuyruğa ya da açık bir sokete bağlı değil.
 *
 * TEKLİF KAYDI KALICI: kabul, ret ve zaman aşımı ayrı ayrı yazılıyor. İki
 * sebeple: (1) reddedilen iş aynı kuryeye tekrar düşmüyor, (2) kabul oranı
 * bu kayıtlardan hesaplanıyor — ayrı bir sayaç tutulsaydı sayaçla gerçek
 * kayıtlar zamanla ayrışırdı.
 *
 * MESAFEYE GÖRE SIRALAMA YOK: siparişteki adres serbest metin, koordinatı
 * yok. "Yakındaki kuryelere" demek için önce geokodlama gerekiyor. O gelene
 * kadar teklif bütün çevrimiçi kuryelere aynı anda düşüyor ve ilk kabul eden
 * alıyor — kimin daha yakın olduğunu bilmiyoruz, biliyormuş gibi yapmıyoruz.
 */

/** Teklif ekranda bu kadar süre duruyor, sonra düşüyor. */
export const TEKLIF_SURESI_MS = 45_000;

/**
 * Bu yaştan eski siparişler teklif edilmiyor.
 *
 * Mutfakta unutulmuş, iptal edilmemiş ama kimsenin de almadığı eski bir
 * sipariş, kurye her uygulamayı açtığında karşısına çıkardı.
 */
const TEKLIF_YAS_SINIRI_MS = 6 * 60 * 60 * 1000;

/** Kabul oranı bu kadar geriye bakıyor. */
const KABUL_ORANI_PENCERESI_GUN = 30;

/**
 * Konum bu süredir gelmiyorsa kurye "çevrimiçi" sayılmıyor.
 *
 * Uygulamayı kapatan ya da şebekesi kesilen kurye çevrimdışı olduğunu
 * sunucuya söyleyemiyor. Son görülme damgası olmadan, iki gün önce
 * uygulamayı kapatmış bir kurye hâlâ müsait görünür ve teklifler ona da
 * gider — kimse cevap vermediği için sipariş bekler.
 */
const CEVRIMICI_SAYILMA_SURESI_MS = 3 * 60 * 1000;

export type AracTuru = "motosiklet" | "moped" | "otomobil" | "scooter" | "bisiklet";

/** Ayna: components/iletisim/IletisimFormu.tsx → ARACLAR */
export const ARAC_TURLERI: readonly AracTuru[] = [
  "motosiklet",
  "moped",
  "otomobil",
  "scooter",
  "bisiklet",
];

export type KuryeDurumu = {
  eposta: string;
  cevrimici: boolean;
  arac: AracTuru | null;
  konum: { enlem: number; boylam: number; dogruluk?: number; yon?: number; hiz?: number } | null;
  konumTarihi: string | null;
  guncellemeTarihi: string;
};

export type TeklifDurumu = "bekliyor" | "kabul" | "ret" | "zaman-asimi" | "kacirildi";

export type Teklif = {
  siparisNo: string;
  restoranAdi: string;
  alimSemti: string;
  teslimIlcesi: string;
  teslimMahallesi: string;
  kalemSayisi: number;
  /** Kapıda tahsil edilecek tutar; kartla ödendiyse 0. */
  tahsilat: number;
  /** Mutfaktan teslim adresine yaklaşık yol (km); hesaplanamıyorsa null. */
  mesafeKm: number | null;
  ucret: UcretDokumu;
  /** Teklifin düştüğü an (ISO). */
  olusturmaTarihi: string;
  sonGecerlilik: string;
  /** Sunucunun hesapladığı kalan süre — istemcinin saati yanlış olabilir. */
  kalanSaniye: number;
};

/* --------------------------------------------------------------------------
 * Depo
 * ----------------------------------------------------------------------- */

let baglanti: ReturnType<typeof postgres> | null = null;
let semaSozu: Promise<void> | null = null;

/**
 * Dağıtım VERİTABANI İSTİYOR.
 *
 * Dosya deposu tek süreçte çalışıyor ve teklif yarışının anlamı çok süreçli
 * bir sunucuda. `DATABASE_URL` yokken uçlar boş dönüyor, uygulama "şu an
 * dağıtım kapalı" diyor — yanlış bir teklif göstermektense hiç göstermemek
 * doğru. (Aynı yaklaşım: lib/siparis-mesajlari.ts)
 */
export const dagitimAcikMi = () => Boolean(process.env.DATABASE_URL);

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
      CREATE TABLE IF NOT EXISTS kurye_durumu (
        eposta       TEXT PRIMARY KEY,
        cevrimici    BOOLEAN NOT NULL DEFAULT false,
        arac         TEXT,
        enlem        DOUBLE PRECISION,
        boylam       DOUBLE PRECISION,
        dogruluk     DOUBLE PRECISION,
        yon          DOUBLE PRECISION,
        hiz          DOUBLE PRECISION,
        konum_tarihi TIMESTAMPTZ,
        guncelleme   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    await q`
      CREATE TABLE IF NOT EXISTS kurye_teklifleri (
        id             TEXT PRIMARY KEY,
        siparis_no     TEXT NOT NULL,
        eposta         TEXT NOT NULL,
        durum          TEXT NOT NULL,
        ucret          NUMERIC(10,2) NOT NULL,
        olusturma      TIMESTAMPTZ NOT NULL DEFAULT now(),
        son_gecerlilik TIMESTAMPTZ NOT NULL
      )
    `;

    /*
     * BİR SİPARİŞ + BİR KURYE = BİR TEKLİF. Kısıt olmadan, aynı anda gelen
     * iki yoklama isteği aynı kuryeye iki teklif açar ve ekranda aynı iş iki
     * kez görünürdü.
     */
    await q`
      CREATE UNIQUE INDEX IF NOT EXISTS kurye_teklifleri_tekil
      ON kurye_teklifleri (siparis_no, eposta)
    `;
    await q`
      CREATE INDEX IF NOT EXISTS kurye_teklifleri_eposta_durum
      ON kurye_teklifleri (eposta, durum)
    `;
    await q`
      CREATE INDEX IF NOT EXISTS kurye_teklifleri_siparis
      ON kurye_teklifleri (siparis_no, durum)
    `;
  })().catch((hata) => {
    semaSozu = null;
    throw hata;
  });
  return semaSozu;
}

const kucuk = (e: string) => e.trim().toLocaleLowerCase("tr");

/* --------------------------------------------------------------------------
 * Müsaitlik ve konum
 * ----------------------------------------------------------------------- */

type DurumSatiri = {
  eposta: string;
  cevrimici: boolean;
  arac: string | null;
  enlem: number | null;
  boylam: number | null;
  dogruluk: number | null;
  yon: number | null;
  hiz: number | null;
  konum_tarihi: Date | null;
  guncelleme: Date;
};

function satirdanDurum(s: DurumSatiri): KuryeDurumu {
  return {
    eposta: s.eposta,
    /*
     * Bayrak TEK BAŞINA yetmiyor: uygulamayı kapatan kurye "çevrimdışı ol"
     * diyemeden gidiyor. Son görülme damgası tazeyse çevrimiçi sayılıyor.
     */
    cevrimici:
      s.cevrimici && Date.now() - new Date(s.guncelleme).getTime() < CEVRIMICI_SAYILMA_SURESI_MS,
    arac: (s.arac as AracTuru | null) ?? null,
    konum:
      s.enlem !== null && s.boylam !== null
        ? {
            enlem: s.enlem,
            boylam: s.boylam,
            ...(s.dogruluk !== null ? { dogruluk: s.dogruluk } : {}),
            ...(s.yon !== null ? { yon: s.yon } : {}),
            ...(s.hiz !== null ? { hiz: s.hiz } : {}),
          }
        : null,
    konumTarihi: s.konum_tarihi ? new Date(s.konum_tarihi).toISOString() : null,
    guncellemeTarihi: new Date(s.guncelleme).toISOString(),
  };
}

/** Kuryenin çevrimiçi/çevrimdışı durumunu ve aracını yazar. */
export async function durumYaz(
  eposta: string,
  girdi: { cevrimici: boolean; arac?: AracTuru | null },
): Promise<KuryeDurumu> {
  if (!dagitimAcikMi()) throw new Error("Dağıtım için veritabanı gerekiyor.");
  await semayiHazirla();

  const satirlar = await sql()<DurumSatiri[]>`
    INSERT INTO kurye_durumu (eposta, cevrimici, arac, guncelleme)
    VALUES (${kucuk(eposta)}, ${girdi.cevrimici}, ${girdi.arac ?? null}, now())
    ON CONFLICT (eposta) DO UPDATE SET
      cevrimici  = EXCLUDED.cevrimici,
      /* Araç yalnızca gönderildiyse değişiyor; konum güncellemesi onu silmesin. */
      arac       = COALESCE(EXCLUDED.arac, kurye_durumu.arac),
      guncelleme = now()
    RETURNING *
  `;
  return satirdanDurum(satirlar[0]);
}

/**
 * Konum bildirimi.
 *
 * `guncelleme` de tazeleniyor: konum akışı sürüyorsa kurye ayakta demektir
 * ve ayrıca bir "hayattayım" isteği atmasına gerek kalmıyor.
 */
export async function konumYaz(
  eposta: string,
  konum: { enlem: number; boylam: number; dogruluk?: number; yon?: number; hiz?: number },
): Promise<void> {
  if (!dagitimAcikMi()) return;
  await semayiHazirla();

  await sql()`
    INSERT INTO kurye_durumu (eposta, cevrimici, enlem, boylam, dogruluk, yon, hiz, konum_tarihi, guncelleme)
    VALUES (${kucuk(eposta)}, true, ${konum.enlem}, ${konum.boylam},
            ${konum.dogruluk ?? null}, ${konum.yon ?? null}, ${konum.hiz ?? null}, now(), now())
    ON CONFLICT (eposta) DO UPDATE SET
      enlem        = EXCLUDED.enlem,
      boylam       = EXCLUDED.boylam,
      dogruluk     = EXCLUDED.dogruluk,
      yon          = EXCLUDED.yon,
      hiz          = EXCLUDED.hiz,
      konum_tarihi = now(),
      guncelleme   = now()
  `;
}

export async function durumOku(eposta: string): Promise<KuryeDurumu | null> {
  if (!dagitimAcikMi()) return null;
  await semayiHazirla();
  const satirlar = await sql()<DurumSatiri[]>`
    SELECT * FROM kurye_durumu WHERE eposta = ${kucuk(eposta)} LIMIT 1
  `;
  return satirlar[0] ? satirdanDurum(satirlar[0]) : null;
}

/** Yönetici paneli için: şu an sahada olan kuryeler. */
export async function cevrimiciKuryeler(): Promise<KuryeDurumu[]> {
  if (!dagitimAcikMi()) return [];
  await semayiHazirla();
  const satirlar = await sql()<DurumSatiri[]>`
    SELECT * FROM kurye_durumu
    WHERE cevrimici = true
      AND guncelleme > now() - ${`${Math.round(CEVRIMICI_SAYILMA_SURESI_MS / 1000)} seconds`}::interval
    ORDER BY guncelleme DESC
  `;
  return satirlar.map(satirdanDurum);
}

/* --------------------------------------------------------------------------
 * Teklifler
 * ----------------------------------------------------------------------- */

const epostaEsit = (a: string | undefined, b: string) =>
  (a ?? "").trim().toLocaleLowerCase("tr") === b.trim().toLocaleLowerCase("tr");

/**
 * Sipariş bu kuryeye teklif edilebilir mi?
 *
 * ELLE ATAMA DA TEKLİF. Yönetici bir kurye seçtiğinde iş o kurye için
 * AYRILIYOR (`teklifEdilenKurye`) ama üstüne binmiyor: teklif ekranına
 * düşüyor, kabul edene kadar kimsenin teslimat listesinde görünmüyor.
 * Ayrılan işi başka kurye göremiyor — yönetici bilerek bir kişi seçti;
 * herkese açılsaydı seçim anlamsız olurdu.
 *
 * Kabul edilmiş iş (`atananKurye`) de yalnızca sahibine görünüyor.
 */
function teklifEdilebilir(s: KayitliSiparis, simdi: number, kime: string): boolean {
  const kilitli = s.atananKurye ?? s.teklifEdilenKurye;
  if (kilitli && !epostaEsit(kilitli, kime)) return false;
  /*
   * `hazir` BEKLENMİYOR: kurye mutfağa yola çıkıp orada bekleyebilsin. Yalnızca
   * hazır siparişler teklif edilseydi, yemek bittikten sonra kuryenin yola
   * çıkması gerekir ve teslimat her siparişte kurye yolu kadar gecikirdi.
   *
   * Kapıda ödemeli siparişler de burada: parası kapıda alınacağı için ömrü
   * boyunca `odeme-bekliyor` kalıyorlar (bkz. lib/siparis → calismayaAcikMi).
   */
  if (!calismayaAcikMi(s)) return false;
  return simdi - new Date(s.olusturmaTarihi).getTime() < TEKLIF_YAS_SINIRI_MS;
}

/**
 * Süresi dolan tekliflerin AYIRMASINI çözer — iş havuza döner.
 *
 * RET DÜĞMESİ KALDIRILDIĞI İÇİN ŞART. Kurye artık bir teklifi reddedemiyor
 * (bkz. gorunum/TeklifKati): istemediği işe dokunmuyor ve süre doluyor.
 * Yöneticinin elle ayırdığı sipariş bu durumda sonsuza kadar o kuryenin
 * üstünde asılı kalırdı: teklif kaydı "zaman aşımı" olduğu için ona bir daha
 * düşmez, ayırma durduğu için de başka kimseye teklif edilmezdi. Sipariş
 * kimsenin göremediği bir yerde ölürdü.
 *
 * Yalnızca AYIRMA kalkıyor; kabul edilmiş atamaya (`atananKurye`)
 * dokunulmuyor — o iş gerçekten kuryenin ve yolda olabilir.
 */
async function ayirmalariCoz(siparisNolar: string[], kim: string): Promise<void> {
  if (siparisNolar.length === 0) return;
  try {
    const depo = await depoAl();
    await Promise.all(
      siparisNolar.map(async (no) => {
        const siparis = await depo.bul(no);
        if (siparis && epostaEsit(siparis.teklifEdilenKurye, kim)) {
          await depo.atamaGuncelle(no, { teklifEdilenKurye: null });
        }
      }),
    );
  } catch {
    /* Depo susarsa teklif yine kapandı; yönetici panelden görüp devralır. */
  }
}

type TeklifSatiri = {
  siparis_no: string;
  durum: string;
  ucret: string;
  olusturma: Date;
  son_gecerlilik: Date;
};

/**
 * Kuryenin bekleyen tekliflerini döner; bu arada yeni teklifleri üretir ve
 * geçersizleri kapatır.
 *
 * TEK ÇAĞRIDA ÜÇ İŞ olmasının sebebi: uygulamanın yoklama döngüsü tek bir
 * istek atıyor. Üretme/temizleme ayrı uçlara bölünseydi, uygulama sırayla üç
 * istek atmak zorunda kalır ve arada geçen sürede tutarsız bir ekran görünürdü.
 */
export async function teklifleriTazele(eposta: string): Promise<Teklif[]> {
  if (!dagitimAcikMi()) return [];
  await semayiHazirla();

  const q = sql();
  const kim = kucuk(eposta);
  const simdi = Date.now();

  /* 1. Süresi dolanlar. */
  const dolanlar = await q<{ siparis_no: string }[]>`
    UPDATE kurye_teklifleri SET durum = 'zaman-asimi'
    WHERE eposta = ${kim} AND durum = 'bekliyor' AND son_gecerlilik < now()
    RETURNING siparis_no
  `;
  await ayirmalariCoz(dolanlar.map((s) => s.siparis_no), kim);

  const durum = await durumOku(kim);
  if (!durum?.cevrimici) {
    /* Çevrimdışı kuryeye teklif ÜRETİLMİYOR ve bekleyenler de kapanıyor. */
    const kapananlar = await q<{ siparis_no: string }[]>`
      UPDATE kurye_teklifleri SET durum = 'zaman-asimi'
      WHERE eposta = ${kim} AND durum = 'bekliyor'
      RETURNING siparis_no
    `;
    await ayirmalariCoz(kapananlar.map((s) => s.siparis_no), kim);
    return [];
  }

  /* 2. Sahipsiz siparişler için yeni teklif. */
  const depo = await depoAl();
  const adaylar = (await depo.listele({ limit: 200 })).filter((s) =>
    teklifEdilebilir(s, simdi, kim),
  );

  if (adaylar.length > 0) {
    const sonGecerlilik = new Date(simdi + TEKLIF_SURESI_MS).toISOString();
    const satirlar = adaylar.map((s) => ({
      id: crypto.randomUUID(),
      siparis_no: s.siparisNo,
      eposta: kim,
      durum: "bekliyor",
      ucret: kuryeHakedisi(s.tutarlar),
      son_gecerlilik: sonGecerlilik,
    }));

    /*
     * ÇAKIŞMADA HİÇBİR ŞEY YAPMA. Kurye bu işi daha önce reddettiyse ya da
     * teklifin süresi dolduysa kayıt zaten var; `DO UPDATE` yazsaydık
     * reddedilen iş her yoklamada yeniden ekrana düşerdi.
     */
    await q`
      INSERT INTO kurye_teklifleri ${q(
        satirlar,
        "id",
        "siparis_no",
        "eposta",
        "durum",
        "ucret",
        "son_gecerlilik",
      )}
      ON CONFLICT (siparis_no, eposta) DO NOTHING
    `;
  }

  /* 3. Bekleyenleri oku ve sipariş bilgisiyle birleştir. */
  const bekleyenler = await q<TeklifSatiri[]>`
    SELECT siparis_no, durum, ucret, olusturma, son_gecerlilik
    FROM kurye_teklifleri
    WHERE eposta = ${kim} AND durum = 'bekliyor' AND son_gecerlilik >= now()
    ORDER BY olusturma ASC
  `;
  if (bekleyenler.length === 0) return [];

  const siparisler = new Map(adaylar.map((s) => [s.siparisNo, s]));
  const sonuc: Teklif[] = [];
  const kapatilacak: string[] = [];

  for (const satir of bekleyenler) {
    const siparis = siparisler.get(satir.siparis_no);
    /*
     * Aday listesinde yoksa sipariş bu arada başkasına atanmış ya da iptal
     * edilmiş demektir. Teklif KAÇIRILDI olarak kapanıyor — kuryenin reddi
     * sayılmadığı için kabul oranını düşürmüyor.
     */
    if (!siparis) {
      kapatilacak.push(satir.siparis_no);
      continue;
    }

    sonuc.push({
      siparisNo: siparis.siparisNo,
      restoranAdi: siparis.restoranAdi,
      /* Alım semti mutfağın kendi semti; teslim ilçesi müşterininki. */
      alimSemti: (await restoranCoz(siparis.restoranSlug))?.semt ?? "",
      teslimIlcesi: siparis.adres.ilce,
      teslimMahallesi: siparis.adres.mahalle,
      kalemSayisi: siparis.kalemler.reduce((t, k) => t + k.adet, 0),
      tahsilat: siparis.odemeYontemi === "iyzico" ? 0 : siparis.tutarlar.toplam,
      mesafeKm: siparisMesafesiKm(siparis.adres),
      ucret: kuryeUcretDokumu(siparis.tutarlar),
      olusturmaTarihi: new Date(satir.olusturma).toISOString(),
      sonGecerlilik: new Date(satir.son_gecerlilik).toISOString(),
      kalanSaniye: Math.max(
        0,
        Math.round((new Date(satir.son_gecerlilik).getTime() - simdi) / 1000),
      ),
    });
  }

  if (kapatilacak.length > 0) {
    await q`
      UPDATE kurye_teklifleri SET durum = 'kacirildi'
      WHERE eposta = ${kim} AND durum = 'bekliyor' AND siparis_no = ANY(${kapatilacak})
    `;
  }

  return sonuc;
}

export type KabulSonucu = { tamam: true } | { tamam: false; sebep: string };

/**
 * Teklifi kabul eder — yarışı kazanan tek kurye alır.
 *
 * SIRA ÖNEMLİ: önce sipariş koşullu olarak atanıyor, sonra teklif kaydı
 * güncelleniyor. Ters sırada yazılsaydı, teklifi "kabul" işaretleyip atamayı
 * kaybeden kurye ekranında kabul edilmiş ama kendisine ait olmayan bir iş
 * görürdü.
 */
export async function teklifKabul(eposta: string, siparisNo: string): Promise<KabulSonucu> {
  if (!dagitimAcikMi()) return { tamam: false, sebep: "Dağıtım şu an kapalı." };
  await semayiHazirla();

  const q = sql();
  const kim = kucuk(eposta);

  const teklifler = await q<TeklifSatiri[]>`
    SELECT siparis_no, durum, ucret, olusturma, son_gecerlilik
    FROM kurye_teklifleri
    WHERE eposta = ${kim} AND siparis_no = ${siparisNo}
    LIMIT 1
  `;
  const teklif = teklifler[0];

  if (!teklif) return { tamam: false, sebep: "Bu teklif sana düşmemiş." };
  if (teklif.durum === "kabul") return { tamam: true };
  if (teklif.durum !== "bekliyor") {
    return { tamam: false, sebep: "Bu teklifin süresi doldu." };
  }
  if (new Date(teklif.son_gecerlilik).getTime() < Date.now()) {
    await q`
      UPDATE kurye_teklifleri SET durum = 'zaman-asimi'
      WHERE eposta = ${kim} AND siparis_no = ${siparisNo} AND durum = 'bekliyor'
    `;
    return { tamam: false, sebep: "Bu teklifin süresi doldu." };
  }

  const depo = await depoAl();
  const kazandi = await depo.kuryeyeAtaKosullu(siparisNo, kim);

  if (!kazandi) {
    await q`
      UPDATE kurye_teklifleri SET durum = 'kacirildi'
      WHERE eposta = ${kim} AND siparis_no = ${siparisNo}
    `;
    return { tamam: false, sebep: "Bu işi başka bir kurye aldı." };
  }

  await q`
    UPDATE kurye_teklifleri SET durum = 'kabul'
    WHERE eposta = ${kim} AND siparis_no = ${siparisNo}
  `;
  /* Aynı işi bekleyen diğer kuryelerin ekranından düşsün. */
  await q`
    UPDATE kurye_teklifleri SET durum = 'kacirildi'
    WHERE siparis_no = ${siparisNo} AND eposta <> ${kim} AND durum = 'bekliyor'
  `;

  return { tamam: true };
}

/**
 * Teklifi reddeder. Aynı iş bu kuryeye bir daha düşmüyor.
 *
 * ELLE ATANMIŞ İŞ REDDEDİLİRSE ATAMA DA KALKIYOR. Kalksaydı ne olurdu diye
 * değil, kalkmasaydı ne olurdu diye düşünmek gerekiyor: sipariş reddeden
 * kuryenin üstünde asılı kalır, ona bir daha teklif edilmez (ret kaydı var)
 * ve başka hiçbir kuryeye de gitmez (atama duruyor). Yani sipariş sessizce
 * ölürdü. Atama kalkınca iş havuza dönüyor ve sıradaki çevrimiçi kuryeye
 * düşüyor.
 */
export async function teklifRet(eposta: string, siparisNo: string): Promise<void> {
  if (!dagitimAcikMi()) return;
  await semayiHazirla();

  const kim = kucuk(eposta);
  await sql()`
    UPDATE kurye_teklifleri SET durum = 'ret'
    WHERE eposta = ${kim} AND siparis_no = ${siparisNo} AND durum = 'bekliyor'
  `;

  try {
    const depo = await depoAl();
    const siparis = await depo.bul(siparisNo);
    if (!siparis) return;
    /*
     * Hem kabul edilmiş atama hem yöneticinin ayırması kalkıyor. İkincisi
     * özellikle önemli: yönetici işi bu kuryeye ayırdıysa başka kimseye teklif
     * edilmiyordu — ayırma durmaya devam etseydi reddedilen sipariş kimsenin
     * göremediği bir yerde asılı kalırdı.
     */
    const atama: { atananKurye?: null; teklifEdilenKurye?: null } = {};
    if (epostaEsit(siparis.atananKurye, kim)) atama.atananKurye = null;
    if (epostaEsit(siparis.teklifEdilenKurye, kim)) atama.teklifEdilenKurye = null;
    if (Object.keys(atama).length > 0) await depo.atamaGuncelle(siparisNo, atama);
  } catch {
    /* Atama kaldırılamazsa ret yine geçerli; yönetici panelden görüp devralır. */
  }
}

/**
 * Bir siparişin bu kuryeye açılmış teklif kaydını siler.
 *
 * YÖNETİCİ ELLE ATADIĞINDA ŞART. Teklif üretimi `ON CONFLICT DO NOTHING` ile
 * çalışıyor: kurye bu işi daha önce reddettiyse ya da teklifin süresi
 * dolduysa kayıt zaten var ve yenisi AÇILMIYOR. Kayıt silinmeseydi yönetici
 * atamayı yapar, ekranda "kaydedildi" yazar, kuryenin telefonunda hiçbir şey
 * olmazdı.
 *
 * Eski sonucun (ret / zaman aşımı) kabul oranından düşmesi bilinçli: yönetici
 * kararı o teklifin yerine geçiyor, aynı iş için iki kayıt tutulamıyor
 * (siparis_no + eposta tekil).
 */
export async function teklifiYenidenAc(eposta: string, siparisNo: string): Promise<void> {
  if (!dagitimAcikMi()) return;
  await semayiHazirla();
  await sql()`
    DELETE FROM kurye_teklifleri
    WHERE eposta = ${kucuk(eposta)} AND siparis_no = ${siparisNo} AND durum <> 'kabul'
  `;
}

export type SiparisTeklifi = {
  eposta: string;
  durum: TeklifDurumu;
  ucret: number;
  olusturmaTarihi: string;
  sonGecerlilik: string;
};

/**
 * Bir siparişin teklif geçmişi — yönetici paneli için.
 *
 * "Bu sipariş neden kimseye gitmedi?" sorusunun cevabı burada: hiç teklif
 * yoksa o saatte çevrimiçi kurye yoktu; hepsi `ret` ise kuryeler işi
 * istemiyor; `zaman-asimi` ise kimse telefona bakmamış. Bu ayrım olmadan
 * yönetici yalnızca "sipariş bekliyor" görür ve nedenini tahmin ederdi.
 */
export async function siparisTeklifleri(siparisNo: string): Promise<SiparisTeklifi[]> {
  if (!dagitimAcikMi()) return [];
  try {
    await semayiHazirla();
    const satirlar = await sql()<
      {
        eposta: string;
        durum: string;
        ucret: string;
        olusturma: Date;
        son_gecerlilik: Date;
      }[]
    >`
      SELECT eposta, durum, ucret, olusturma, son_gecerlilik
      FROM kurye_teklifleri
      WHERE siparis_no = ${siparisNo}
      ORDER BY olusturma DESC
      LIMIT 50
    `;
    return satirlar.map((s) => ({
      eposta: s.eposta,
      durum: s.durum as TeklifDurumu,
      ucret: Number(s.ucret),
      olusturmaTarihi: new Date(s.olusturma).toISOString(),
      sonGecerlilik: new Date(s.son_gecerlilik).toISOString(),
    }));
  } catch {
    /* Dağıtım deposu susarsa sipariş sayfası yine açılsın. */
    return [];
  }
}

export type KabulOrani = {
  /** 0–100 arası yüzde; hiç teklif almadıysa null. */
  yuzde: number | null;
  kabul: number;
  toplam: number;
};

/**
 * Kabul oranı — son 30 günün teklif kayıtlarından.
 *
 * `kacirildi` PAYDAYA GİRMİYOR: iş başkası tarafından alındığı için kapanan
 * teklifin kuryeyle ilgisi yok. Sayılsaydı, kalabalık saatte çalışan kuryenin
 * oranı hiç yavaşlamadığı hâlde düşerdi.
 */
export async function kabulOrani(eposta: string): Promise<KabulOrani> {
  if (!dagitimAcikMi()) return { yuzde: null, kabul: 0, toplam: 0 };
  await semayiHazirla();

  const satirlar = await sql()<{ durum: string; adet: number }[]>`
    SELECT durum, COUNT(*)::int AS adet
    FROM kurye_teklifleri
    WHERE eposta = ${kucuk(eposta)}
      AND durum IN ('kabul','ret','zaman-asimi')
      AND olusturma > now() - ${`${KABUL_ORANI_PENCERESI_GUN} days`}::interval
    GROUP BY durum
  `;

  const say = (d: string) => satirlar.find((s) => s.durum === d)?.adet ?? 0;
  const kabul = say("kabul");
  const toplam = kabul + say("ret") + say("zaman-asimi");

  return { yuzde: toplam === 0 ? null : Math.round((kabul / toplam) * 100), kabul, toplam };
}
