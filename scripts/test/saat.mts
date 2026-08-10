/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import {
  VARSAYILAN_PROGRAM,
  acikMi,
  type HaftaProgrami,
  type IsletmeSaatleri,
} from "../../src/lib/calisma-saatleri";

/**
 * CALISMA SAATLERI — acik mi kapali mi?
 *
 * Bu mantigin tamami ZAMANA ve SAAT DILIMINE bagli. Tarayiciyla olcmek icin
 * ya sunucunun saatini kandirmak ya da gece yarisini beklemek gerekirdi;
 * fonksiyon saf oldugu icin istedigimiz ani verip sorabiliyoruz.
 *
 * IKI TUZAK burada kayit altinda:
 *
 *  1. GECEYI ASAN PROGRAM (18:00-02:00). Duz bir `acilis <= simdi < kapanis`
 *     karsilastirmasi gece yarisindan sonra calisan HER isletmeyi kapali
 *     sayar. Saat 01:00'de acik olmasi gerekiyor.
 *
 *  2. SAAT DILIMI. Sunucu Vercel'de UTC calisiyor; Istanbul UTC+3. Saatler
 *     sunucunun kendi saatiyle okunsaydi isletme uc saat erken kapanirdi.
 */
const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (n: number, m: string) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n: number, m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${String(n).padStart(2)}. ${m}`);
};

let no = 0;

/** Istanbul saatiyle verilen ani UTC Date'e cevirir (kis saati: UTC+3). */
const ist = (isoYerel: string) => new Date(`${isoYerel}+03:00`);

const program = (deger: Partial<HaftaProgrami[number]>, gunler?: number[]): HaftaProgrami =>
  VARSAYILAN_PROGRAM.map((g, i) =>
    !gunler || gunler.includes(i) ? { ...g, ...deger } : { ...g },
  );

/* ════════════ 1. KAYIT YOKSA HEP ACIK ════════════ */
/*
 * Sistemdeki butun mevcut mutfaklar saatsiz calisiyor; bir goc betigi olmadan
 * hepsinin kapanmasi kabul edilemezdi.
 */
acikMi(null).acik === true
  ? ok((no += 1), "saat kaydi olmayan mutfak hep acik")
  : bad((no += 1), "kayitsiz mutfak kapali sayildi — mevcut mutfaklar siparis alamaz");

/* ════════════ 2. DUZ PROGRAM (10:00-22:00) ════════════ */
{
  const s: IsletmeSaatleri = { program: VARSAYILAN_PROGRAM };
  /* 2026-08-10 pazartesi. */
  acikMi(s, ist("2026-08-10T14:00")).acik === true
    ? ok((no += 1), "calisma saati icinde acik (14:00)")
    : bad((no += 1), "calisma saatinde kapali gorundu");

  acikMi(s, ist("2026-08-10T09:00")).acik === false
    ? ok((no += 1), "acilistan once kapali (09:00)")
    : bad((no += 1), "acilistan once acik gorundu");

  acikMi(s, ist("2026-08-10T23:00")).acik === false
    ? ok((no += 1), "kapanistan sonra kapali (23:00)")
    : bad((no += 1), "kapanistan sonra acik gorundu");

  /* Sinirlar: acilis DAHIL, kapanis HARIC. */
  acikMi(s, ist("2026-08-10T10:00")).acik === true
    ? ok((no += 1), "tam acilis saatinde acik")
    : bad((no += 1), "acilis aninda kapali");

  acikMi(s, ist("2026-08-10T22:00")).acik === false
    ? ok((no += 1), "tam kapanis saatinde kapali")
    : bad((no += 1), "kapanis aninda hala acik");
}

/* ════════════ 3. GECEYI ASAN PROGRAM (18:00-02:00) ════════════ */
{
  const s: IsletmeSaatleri = { program: program({ acilis: "18:00", kapanis: "02:00" }) };

  acikMi(s, ist("2026-08-10T20:00")).acik === true
    ? ok((no += 1), "gece programi: 20:00'de acik")
    : bad((no += 1), "gece programi aksam kapali gorundu");

  /* ASIL KONTROL: gece yarisindan SONRA hala acik olmali. */
  acikMi(s, ist("2026-08-11T01:00")).acik === true
    ? ok((no += 1), "gece programi: 01:00'de HALA ACIK (gece yarisini asiyor)")
    : bad((no += 1), "geceyi asan program gece yarisinda kapanmis");

  acikMi(s, ist("2026-08-11T03:00")).acik === false
    ? ok((no += 1), "gece programi: 03:00'te kapali")
    : bad((no += 1), "gece programi kapanmiyor");

  acikMi(s, ist("2026-08-10T15:00")).acik === false
    ? ok((no += 1), "gece programi: ogleden sonra kapali")
    : bad((no += 1), "gece programi gunduz acik gorundu");
}

/* ════════════ 4. SAAT DILIMI ════════════ */
/*
 * 2026-08-10 21:00 UTC = Istanbul'da 11 Agustos 00:00. Program 10:00-22:00
 * oldugu icin KAPALI olmali. Sunucu kendi UTC saatini okusaydi 21:00 gorup
 * "acik" derdi.
 */
{
  const s: IsletmeSaatleri = { program: VARSAYILAN_PROGRAM };
  acikMi(s, new Date("2026-08-10T21:00:00Z")).acik === false
    ? ok((no += 1), "saatler Istanbul'a gore okunuyor (UTC 21:00 = IST 00:00, kapali)")
    : bad((no += 1), "saat dilimi yok sayilmis — sunucu UTC'de yanlis sonuc veriyor");

  acikMi(s, new Date("2026-08-10T08:00:00Z")).acik === true
    ? ok((no += 1), "UTC 08:00 = IST 11:00, acik")
    : bad((no += 1), "saat dilimi cevrimi ters calisiyor");
}

/* ════════════ 5. KAPALI GUN ════════════ */
{
  /* Pazartesi (indeks 0) kapali. */
  const s: IsletmeSaatleri = { program: program({ kapali: true }, [0]) };
  const durum = acikMi(s, ist("2026-08-10T14:00"));
  durum.acik === false && durum.sebep === "program"
    ? ok((no += 1), "hafta tatilinde kapali")
    : bad((no += 1), "kapali gun sayilmadi");

  acikMi(s, ist("2026-08-11T14:00")).acik === true
    ? ok((no += 1), "ertesi gun normal aciliyor")
    : bad((no += 1), "kapali gun ertesi gune tasti");
}

/* ════════════ 6. ELDEN KAPATMA VE KENDILIGINDEN ACILMA ════════════ */
{
  const birSaatSonra = new Date(ist("2026-08-10T14:00").getTime() + 60 * 60 * 1000);
  const s: IsletmeSaatleri = {
    program: VARSAYILAN_PROGRAM,
    elleKapaliBitis: birSaatSonra.toISOString(),
  };

  const durum = acikMi(s, ist("2026-08-10T14:00"));
  durum.acik === false && durum.sebep === "elle"
    ? ok((no += 1), "elden kapatma calisma saati icinde de kapatiyor")
    : bad((no += 1), "elden kapatma islemedi");

  /*
   * ASIL KONTROL: sure dolunca KENDILIGINDEN aciliyor. Duz bir ac/kapa
   * dugmesi olsaydi, bir aksam kapatan isletme ertesi gun acmayi unutup
   * sebebini anlamadan siparissiz kalirdi.
   */
  acikMi(s, ist("2026-08-10T16:00")).acik === true
    ? ok((no += 1), "elden kapatma suresi dolunca KENDILIGINDEN aciliyor")
    : bad((no += 1), "elden kapatma kalici olmus — isletme kapali kalir");

  /* Elden kapatma bitse bile program disindaysa yine kapali. */
  acikMi(s, ist("2026-08-10T23:00")).acik === false
    ? ok((no += 1), "elden kapatma bitse de program disinda kapali")
    : bad((no += 1), "elden kapatma bitince program yok sayildi");
}

/* ════════════ 7. BOZUK KAYIT SIPARISI KESMIYOR ════════════ */
/*
 * Okunamayan bir saat degeri yuzunden isletmenin siparis alamaz hale gelmesi,
 * bicim hatasindan cok daha buyuk bir zarar olurdu.
 */
{
  const s: IsletmeSaatleri = { program: program({ acilis: "abc", kapanis: "yy:zz" }) };
  acikMi(s, ist("2026-08-10T14:00")).acik === true
    ? ok((no += 1), "bozuk saat kaydinda siparis kesilmiyor")
    : bad((no += 1), "bozuk kayit isletmeyi kapatti");
}

console.log(cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
