/**
 * ÇALIŞMA SAATLERİ VE "ŞU AN KAPALIYIM".
 *
 * BU DOSYA SAF: veritabanına dokunmuyor, `postgres` paketini içeri almıyor.
 * Sebep zorunluluk — saat formu bir istemci bileşeni ve buradaki sabitleri
 * okuyor; depo kodu burada dursaydı `postgres` tarayıcı paketine girer ve
 * derleme patlardı. Okuma/yazma ayrı dosyada: calisma-saatleri-depo.ts.
 *
 * Şeflerde saat kavramı yoktu: ürünü yayından kaldırmak yetiyordu. İşletme
 * ise sabit bir programla çalışıyor ve akşam kapandığında bütün menüsünü tek
 * tek kaldıramaz.
 *
 * İKİ AYRI ŞEY:
 *  - PROGRAM (`gunler`): her günün açılış/kapanış saati. Kalıcı.
 *  - ELDEN KAPATMA (`elleKapaliBitis`): "bugün yoğunuz, sipariş almayalım".
 *    Geçici ve KENDİLİĞİNDEN AÇILIYOR. Düz bir aç/kapa düğmesi olsaydı, bir
 *    akşam kapatan işletme ertesi gün açmayı unutup siparişsiz kalırdı —
 *    üstelik sebebini de anlamadan.
 *
 * KAYIT YOKSA HEP AÇIK: sistemdeki bütün mevcut mutfaklar saatsiz çalışıyor
 * ve bir göç betiği olmadan hepsinin kapanması kabul edilemezdi.
 */

/** Saatler İstanbul'a göre okunuyor — sunucu UTC'de çalışıyor olabilir. */
const BOLGE = "Europe/Istanbul";

export type GunProgrami = {
  /** Kapalı gün — hafta tatili. Açıksa saatlere bakılıyor. */
  kapali: boolean;
  /** "09:00" biçiminde. */
  acilis: string;
  kapanis: string;
};

/** Pazartesi'den pazara, yedi gün. */
export type HaftaProgrami = GunProgrami[];

export const GUN_ADLARI = [
  "hafta.pazartesi",
  "hafta.sali",
  "hafta.carsamba",
  "hafta.persembe",
  "hafta.cuma",
  "hafta.cumartesi",
  "hafta.pazar",
] as const;

export const VARSAYILAN_PROGRAM: HaftaProgrami = Array.from({ length: 7 }, () => ({
  kapali: false,
  acilis: "10:00",
  kapanis: "22:00",
}));

/**
 * Elden kapatmanın seçilebilir süreleri — saat cinsinden.
 *
 * BURADA DURMAK ZORUNDA, saat-actions.ts'te DEĞİL. Orası `"use server"` bir
 * modül ve öyle bir modülün her export'u sunucu eylemi sayılıyor: istemci
 * tarafında dizi değil, eylem referansı hâline geliyor. Sabit orada dururken
 * işletme paneli açılır açılmaz `KAPATMA_SURELERI.map is not a function`
 * diyip komple beyaz ekrana düşüyordu — tip denetimi de derleme de temiz
 * geçtiği için hata yalnızca tarayıcıda görünüyordu.
 *
 * Hem istemci bileşeni (düğmeleri çizerken) hem sunucu eylemi (gelen değeri
 * doğrularken) aynı listeyi okuyor; ikisinin de girebildiği tek yer burası.
 */
export const KAPATMA_SURELERI = [1, 2, 4] as const;

export type IsletmeSaatleri = {
  program: HaftaProgrami;
  /** Elden kapatmanın bittiği an (ISO); yoksa elden kapatma yok. */
  elleKapaliBitis?: string;
};

export type AcikDurumu =
  | { acik: true }
  | { acik: false; sebep: "elle" | "program"; bitis?: string };

/** "09:30" → 570. Bozuk değerde `null`. */
function dakikayaCevir(saat: string): number | null {
  const eslesme = /^(\d{1,2}):(\d{2})$/.exec(saat.trim());
  if (!eslesme) return null;
  const s = Number(eslesme[1]);
  const d = Number(eslesme[2]);
  if (s > 23 || d > 59) return null;
  return s * 60 + d;
}

/**
 * Verilen anın İstanbul'daki gün indeksi (0 = pazartesi) ve dakikası.
 *
 * `toLocaleString` ile yeni bir Date kurmak yerine parçalar tek tek okunuyor:
 * o yöntem sunucunun kendi saat diliminde ikinci bir kayma yaratıyordu.
 */
function istanbulZamani(simdi: Date): { gun: number; dakika: number } {
  const bicim = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOLGE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parcalar = Object.fromEntries(
    bicim.formatToParts(simdi).map((p) => [p.type, p.value]),
  );
  const gunler = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const gun = gunler.indexOf(String(parcalar.weekday));
  /* 24:00 gece yarısını gösteriyor; sıfıra çekilmezse gün sonu taşardı. */
  const saat = Number(parcalar.hour) % 24;
  return { gun: gun < 0 ? 0 : gun, dakika: saat * 60 + Number(parcalar.minute) };
}

/**
 * Şu an sipariş alıyor mu?
 *
 * GECEYİ AŞAN PROGRAM destekleniyor: kapanış açılıştan küçükse (18:00–02:00)
 * aralık ertesi güne sarkıyor. Düz bir `acilis <= simdi < kapanis`
 * karşılaştırması gece yarısından sonra çalışan her işletmeyi kapalı sayardı.
 */
export function acikMi(saatler: IsletmeSaatleri | null, simdi: Date = new Date()): AcikDurumu {
  if (!saatler) return { acik: true };

  if (saatler.elleKapaliBitis) {
    const bitis = new Date(saatler.elleKapaliBitis).getTime();
    if (Number.isFinite(bitis) && bitis > simdi.getTime()) {
      return { acik: false, sebep: "elle", bitis: saatler.elleKapaliBitis };
    }
  }

  const { gun, dakika } = istanbulZamani(simdi);
  const bugun = saatler.program[gun];
  const dun = saatler.program[(gun + 6) % 7];

  /*
   * Önce DÜNÜN geceyi aşan aralığı: saat 01:00'de bugünün programı henüz
   * başlamamış olabilir ama dün 18:00'de açılan işletme hâlâ açıktır.
   */
  if (dun && !dun.kapali) {
    const a = dakikayaCevir(dun.acilis);
    const k = dakikayaCevir(dun.kapanis);
    if (a !== null && k !== null && k <= a && dakika < k) return { acik: true };
  }

  if (!bugun || bugun.kapali) return { acik: false, sebep: "program" };

  const a = dakikayaCevir(bugun.acilis);
  const k = dakikayaCevir(bugun.kapanis);
  /* Saat okunamıyorsa kapatmıyoruz: bozuk bir kayıt yüzünden sipariş kesilmesin. */
  if (a === null || k === null) return { acik: true };

  if (k <= a) return dakika >= a ? { acik: true } : { acik: false, sebep: "program" };
  return dakika >= a && dakika < k ? { acik: true } : { acik: false, sebep: "program" };
}
