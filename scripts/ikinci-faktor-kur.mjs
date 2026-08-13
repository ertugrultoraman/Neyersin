import crypto from "node:crypto";

/**
 * YÖNETİCİ İKİNCİ FAKTÖRÜ — kurulum.
 *
 * Yeni bir gizli anahtar üretip kimlik doğrulayıcı uygulamasına girilecek
 * bilgileri ekrana yazar. Anahtar HİÇBİR YERE KAYDEDİLMİYOR: bu betik onu
 * yalnızca gösteriyor, saklamak Vercel ortam değişkeninin işi. Dosyaya
 * yazsaydı, depoya ya da yedeklere sızma ihtimali doğardı.
 *
 *   npm run admin:2fa
 *
 * Sonra Vercel'de `ADMIN_TOTP_SECRET` olarak tanımlanıp dağıtım yapılıyor.
 * Değişken tanımlanana kadar ikinci faktör KAPALI kalıyor — yani bu betiği
 * çalıştırmak tek başına kimseyi kilitlemiyor.
 *
 * Kodun kendisi lib/ikinci-faktor.ts içinde; burası yalnızca kurulum kabuğu.
 * (Betik `src/` içindeki TypeScript'i import edemediği için üretim mantığının
 * küçük bir kopyası burada duruyor — yalnızca anahtar üretimi, doğrulama
 * değil. Doğrulama tek yerde kalmalı.)
 */

const BASE32_ALFABE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function gizliAnahtarUret() {
  const ham = crypto.randomBytes(20);
  let bit = 0;
  let deger = 0;
  let sonuc = "";
  for (const bayt of ham) {
    deger = (deger << 8) | bayt;
    bit += 8;
    while (bit >= 5) {
      sonuc += BASE32_ALFABE[(deger >>> (bit - 5)) & 31];
      bit -= 5;
    }
  }
  if (bit > 0) sonuc += BASE32_ALFABE[(deger << (5 - bit)) & 31];
  return sonuc;
}

const hesap = process.argv[2] || "yonetici@neyersin.net";
const gizli = gizliAnahtarUret();
const yayinci = encodeURIComponent("Ne Yersin");
const adres = `otpauth://totp/${yayinci}:${encodeURIComponent(hesap)}?secret=${gizli}&issuer=${yayinci}&digits=6&period=30`;

console.log(`
YONETICI IKINCI FAKTORU — kurulum
==================================

1) Telefonunda Google Authenticator (ya da Authy / 1Password) ac,
   "elle giris" / "manuel" secenegini kullan ve su anahtari yaz:

   ${gizli}

   Hesap adi:  ${hesap}
   Yayinci:    Ne Yersin
   Tur:        Zaman tabanli (TOTP), 6 hane, 30 saniye

   Ya da bu adresi QR uretecek bir araca verebilirsin:
   ${adres}

2) Uygulamada 6 haneli bir kod belirdigini gor.

3) Anahtari Vercel'e uretim degiskeni olarak ekle:

   npx vercel@58.4.4 env add ADMIN_TOTP_SECRET production
   (istendiginde yukaridaki anahtari yapistir)

   Sonra: npm run dagit

4) Bir sonraki yonetici girisinde "Dogrulama kodu" alani zorunlu olur.

UYARI: Anahtari kaybedersen panele giremezsin. Once bir yere guvenli sekilde
kaydet (parola yoneticisi), sonra Vercel'e ekle. Geri donus yolu: Vercel'den
ADMIN_TOTP_SECRET degiskenini silip yeniden dagitmak — ikinci faktor kapanir.
`);
