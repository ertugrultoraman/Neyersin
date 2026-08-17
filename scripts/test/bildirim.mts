/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { destekTalebiBildir, saatYaz, yoneticiyeBildir } from "../../src/lib/yonetici-bildirim";

/**
 * YÖNETİCİ BİLDİRİMİ — gerçekten posta gidiyor mu?
 *
 * NEDEN AYRI TEST: bu postalar hiçbir kullanıcı akışını kesmiyor; gönderim
 * başarısız olsa da kayıt açılıyor, sipariş kaydediliyor (bkz.
 * lib/yonetici-bildirim). Bu bilinçli bir karar ama bir yan etkisi var:
 * bildirim SESSİZCE çalışmayı bırakabilir ve haftalarca fark edilmez —
 * yönetici yalnızca "bugün kimse kaydolmamış" sanır.
 *
 * `--gonder` verilmezse yalnızca yapılandırma denetleniyor; verilirse
 * yönetici adresine gerçek bir örnek posta gidiyor.
 *
 *   npx tsx --env-file=.env.local scripts/test/bildirim.mts
 *   npx tsx --env-file=.env.local scripts/test/bildirim.mts --gonder
 */

const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (m: string) => cikti.push(`  OK  ${m}`);
const bad = (m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${m}`);
};

const gonder = process.argv.includes("--gonder");

/* --- 1. Alıcı adresi çözülüyor mu? --- */
const ham = process.env.ADMIN_EMAILS;
const alicilar = ham
  ? ham.split(",").map((e) => e.trim()).filter(Boolean)
  : ["ertugrultoraman@hotmail.com (varsayilan)"];
alicilar.length > 0
  ? ok(`bildirim alicisi: ${alicilar.join(", ")}`)
  : bad("bildirim alicisi cozulemedi");

/* --- 2. SMTP yapılandırılmış mı? --- */
const smtpVar = Boolean(process.env.SMTP_KULLANICI && process.env.SMTP_PAROLA);
smtpVar
  ? ok("SMTP yapilandirilmis")
  : bad("SMTP eksik (SMTP_KULLANICI / SMTP_PAROLA) — bildirim gonderilemez");

/* --- 3. Gerçek gönderim (istenirse) --- */
if (gonder && smtpVar) {
  await yoneticiyeBildir(
    "Ornek bildirim",
    [
      { etiket: "Ad", deger: "Ornek Kullanici" },
      { etiket: "E-posta", deger: "ornek@ornek.test" },
      { etiket: "Saat", deger: saatYaz() },
    ],
    "Bu bir deneme postasidir; sistemde boyle bir kayit acilmadi.",
  );
  ok("ornek bildirim gonderildi (posta kutunu kontrol et)");

  destekTalebiBildir({
    no: "DT-DENEME-0000",
    konu: "Ornek destek talebi",
    mesaj: "Bu bir deneme talebidir; destek listesine kaydedilmedi.",
    ad: "Ornek Kurye",
    eposta: "ornek@ornek.test",
    telefon: "0500 000 00 00",
  });
  /* Bildirim `void` ile gidiyor; kısa bir bekleme gönderimin bitmesini sağlıyor. */
  await new Promise((c) => setTimeout(c, 4000));
  ok("ornek destek bildirimi gonderildi");
} else if (gonder) {
  bad("gonderim istendi ama SMTP eksik");
} else {
  cikti.push("  ·   gercek gonderim icin: --gonder");
}

console.log(cikti.join("\n"));
console.log(
  "\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`),
);
process.exit(hatalar.length === 0 ? 0 : 1);
