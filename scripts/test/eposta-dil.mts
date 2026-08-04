/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { kodPostasi } from "../../src/lib/eposta";

/**
 * DOGRULAMA POSTASI IKI DILDE
 *
 * Tarayici testleri postayi goremiyor; sablonun kendisi burada dogrudan
 * cagrilip iki dilde de dogru metni urettigi kontrol ediliyor.
 *
 * Ayrica kullanicinin acik istegiyle duran "Bu millet icin yola cikmis..."
 * ibaresinin Turkce metninin AYNEN durdugu dogrulaniyor — ceviri sirasinda
 * kazara degistirilmesin.
 */
const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (n: number, m: string) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n: number, m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${String(n).padStart(2)}. ${m}`);
};

const tr = kodPostasi("123456", "kayit", "tr");
const en = kodPostasi("123456", "kayit", "en");
const trSifre = kodPostasi("999999", "sifre", "tr");
const enEposta = kodPostasi("555555", "eposta", "en");

/* 1-2) Konu satiri dile gore */
tr.konu.includes("E-posta doğrulama kodun")
  ? ok(1, "TR konu satiri dogru")
  : bad(1, `TR konu: ${tr.konu}`);
en.konu.includes("Your email verification code")
  ? ok(2, "EN konu satiri dogru")
  : bad(2, `EN konu: ${en.konu}`);

/* 3) Konuda KOD YOK (onizlemede okunup spam'e dusmesin) */
!tr.konu.includes("123456") && !en.konu.includes("123456")
  ? ok(3, "konu satirinda kod yok")
  : bad(3, "kod konu satirina sizmis");

/* 4-5) Govde dile gore */
tr.metin.includes("Kodun: 123456") ? ok(4, "TR govdede kod var") : bad(4, "TR govde yanlis");
en.metin.includes("Your code: 123456") ? ok(5, "EN govdede kod var") : bad(5, "EN govde yanlis");

/* 6-7) Gecerlilik uyarisi */
tr.metin.includes("Kod 15 dakika geçerlidir.")
  ? ok(6, "TR gecerlilik uyarisi")
  : bad(6, "TR gecerlilik uyarisi yok");
en.metin.includes("The code is valid for 15 minutes.")
  ? ok(7, "EN gecerlilik uyarisi")
  : bad(7, "EN gecerlilik uyarisi yok");

/* 8) Kullanicinin istedigi ibare TURKCE AYNEN duruyor */
tr.metin.includes(
  "Bu millet için yola çıkmış, istihdama katkı sağlamaya çalışan bir girişimiz. Yorumlarınızı bekliyoruz.",
)
  ? ok(8, "girisim ibaresi Turkce aynen duruyor")
  : bad(8, "girisim ibaresi degismis!");

/* 9) Ayni ibarenin Ingilizcesi de var */
en.metin.includes("young venture") ? ok(9, "girisim ibaresi Ingilizce") : bad(9, "EN ibare yok");

/* 10) Kalp isareti duruyor (kullanici istegi) */
tr.metin.includes("♥") && en.metin.includes("♥")
  ? ok(10, "kalp isareti iki dilde de duruyor")
  : bad(10, "kalp kaybolmus");

/* 11-12) Diger amaclar */
trSifre.konu.includes("Parola sıfırlama kodun")
  ? ok(11, "TR parola sifirlama konusu")
  : bad(11, `TR sifre konu: ${trSifre.konu}`);
enEposta.konu.includes("Verification code for your new email address")
  ? ok(12, "EN adres degistirme konusu")
  : bad(12, `EN eposta konu: ${enEposta.konu}`);

/* 13) HTML govdesinde de dil dogru */
en.html.includes("The code is valid for 15 minutes") && !en.html.includes("Kod 15 dakika")
  ? ok(13, "EN HTML govdesinde Turkce kalinti yok")
  : bad(13, "EN HTML govdesinde Turkce kalinti var");

/* 14) Dil verilmezse Turkceye dusuyor */
kodPostasi("111111", "kayit").konu.includes("E-posta doğrulama kodun")
  ? ok(14, "dil verilmezse Turkce")
  : bad(14, "varsayilan dil yanlis");

console.log(cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
