import crypto from "node:crypto";
import postgres from "postgres";

/**
 * KURYE ↔ MÜŞTERİ MESAJLAŞMASI — telefon numarası paylaşmadan.
 *
 * NEDEN: kurye kartında müşterinin gerçek cep numarası yazıyordu ve müşteri
 * de kuryeninkini görüyordu. Teslimat bittikten sonra da o numara kuryenin
 * telefonunda kalıyor; bu bir teslimatın gerektirdiğinden fazlası.
 *
 * Mesajlaşma numarayı hiç devreye sokmuyor: iki taraf da SİPARİŞ ÜZERİNDEN
 * yazışıyor, kimse kimsenin numarasını görmüyor. Gerçek numara maskeleme
 * (operatörden kiralanan havuz) ayrı bir katmanda ve bir sağlayıcı bağlanana
 * kadar kapalı — bkz. lib/telefon-maskeleme.ts.
 *
 * Mesajlar SİPARİŞE bağlı, kişiye değil: teslimat bitince yazışma da kapanıyor
 * (bkz. `mesajlasmaAcikMi`). Kalıcı bir sohbet kanalı açmak, numaraları
 * gizlemenin amacını boşa çıkarırdı — kurye ile müşteri arasında teslimattan
 * sonra da süren bir bağ kurulmasını istemiyoruz.
 */

/** Teslimattan sonra yazışma bu kadar süre daha açık kalıyor — iki saat. */
const TESLIMAT_SONRASI_SURE = 2 * 60 * 60 * 1000;

export type MesajTarafi = "kurye" | "musteri" | "admin";

export type SiparisMesaji = {
  id: string;
  siparisNo: string;
  gonderen: MesajTarafi;
  gonderenAdi: string;
  metin: string;
  olusturmaTarihi: string;
};

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
      CREATE TABLE IF NOT EXISTS siparis_mesajlari (
        id          TEXT PRIMARY KEY,
        siparis_no  TEXT NOT NULL,
        gonderen    TEXT NOT NULL,
        gonderen_adi TEXT NOT NULL,
        metin       TEXT NOT NULL,
        olusturma   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    /* Her açılışta siparişin bütün mesajları çekiliyor; indeks olmadan tablo taranırdı. */
    await sql()`
      CREATE INDEX IF NOT EXISTS siparis_mesajlari_siparis_no
      ON siparis_mesajlari (siparis_no, olusturma)
    `;
  })().catch((hata) => {
    semaSozu = null;
    throw hata;
  });
  return semaSozu;
}

/**
 * Bu siparişte hâlâ yazışılabilir mi?
 *
 * İptal edilmiş siparişte yazışma açılmıyor; teslim edilmiş siparişte iki saat
 * daha açık kalıyor ki "kapıya bıraktım, bulamadım" gibi konular çözülebilsin.
 */
export function mesajlasmaAcikMi(durum: string, guncellemeTarihi?: string): boolean {
  if (durum === "iptal") return false;
  if (durum !== "teslim-edildi") return true;
  if (!guncellemeTarihi) return false;
  return Date.now() - new Date(guncellemeTarihi).getTime() < TESLIMAT_SONRASI_SURE;
}

/** Siparişin bütün mesajları — eskiden yeniye. */
export async function mesajlariListele(siparisNo: string): Promise<SiparisMesaji[]> {
  if (!siparisNo || !veritabaniVarMi()) return [];
  try {
    await semayiHazirla();
    const satirlar = await sql()<
      {
        id: string;
        siparis_no: string;
        gonderen: string;
        gonderen_adi: string;
        metin: string;
        olusturma: Date;
      }[]
    >`
      SELECT id, siparis_no, gonderen, gonderen_adi, metin, olusturma
      FROM siparis_mesajlari
      WHERE siparis_no = ${siparisNo}
      ORDER BY olusturma ASC
      LIMIT 200
    `;
    return satirlar.map((s) => ({
      id: s.id,
      siparisNo: s.siparis_no,
      gonderen: s.gonderen as MesajTarafi,
      gonderenAdi: s.gonderen_adi,
      metin: s.metin,
      olusturmaTarihi: new Date(s.olusturma).toISOString(),
    }));
  } catch {
    /* Depo susarsa kart yine açılsın; yazışma geçici olarak boş görünür. */
    return [];
  }
}

/** Mesaj yazar. Yetki denetimi ÇAĞIRANDA (bkz. app/panel/mesaj-actions.ts). */
export async function mesajEkle(girdi: {
  siparisNo: string;
  gonderen: MesajTarafi;
  gonderenAdi: string;
  metin: string;
}): Promise<SiparisMesaji> {
  const metin = girdi.metin.trim().slice(0, 1000);
  if (!metin) throw new Error("Boş mesaj.");
  if (!veritabaniVarMi()) throw new Error("Mesajlaşma için veritabanı gerekiyor.");

  await semayiHazirla();
  const kayit: SiparisMesaji = {
    id: crypto.randomUUID(),
    siparisNo: girdi.siparisNo,
    gonderen: girdi.gonderen,
    gonderenAdi: girdi.gonderenAdi,
    metin,
    olusturmaTarihi: new Date().toISOString(),
  };

  await sql()`
    INSERT INTO siparis_mesajlari (id, siparis_no, gonderen, gonderen_adi, metin, olusturma)
    VALUES (${kayit.id}, ${kayit.siparisNo}, ${kayit.gonderen}, ${kayit.gonderenAdi},
            ${kayit.metin}, ${kayit.olusturmaTarihi})
  `;
  return kayit;
}
