import crypto from "node:crypto";

/**
 * TOTP — zaman tabanlı tek kullanımlık kod (RFC 6238).
 *
 * NEDEN GEREKİYOR: yönetici girişi tek bir `ADMIN_PASSWORD` ortam
 * değişkenine dayanıyor. O parola sızarsa — bir ekran görüntüsü, paylaşılan
 * bir bilgisayar, sızmış bir yedek — panelin tamamı gider: bütün siparişler,
 * bütün hesaplar, rol yükseltme, hesaba vekâlet. İkinci faktör, parolayı bilen
 * ama telefonu elinde olmayan birini kapıda tutuyor.
 *
 * KÜTÜPHANE YOK, node:crypto YETİYOR. TOTP otuz satırlık bir algoritma:
 * paylaşılan gizli anahtar + zaman dilimi → HMAC → 6 hane. Bir bağımlılık
 * eklemek, kimlik doğrulama yoluna bakımını üstlenmediğimiz üçüncü taraf kod
 * sokmak olurdu — üstelik bu projede zaten bağımlılık açıklarıyla uğraşıldı.
 *
 * KAPALI VARSAYILAN. `ADMIN_TOTP_SECRET` tanımlı değilse ikinci faktör
 * sorulmuyor. Zorunlu yapılsaydı, anahtarı kurmadan dağıtım yapan kişi kendi
 * panelinden kilitlenirdi ve geri dönüşü yalnızca ortam değişkeni eklemek
 * olurdu — üretimde kimsenin içeri giremediği bir pencere demek.
 */

/** Kod uzunluğu ve dilim süresi — Google Authenticator varsayılanları. */
const HANE = 6;
const DILIM_SN = 30;

/**
 * Saat kayması payı: bir önceki ve bir sonraki dilim de kabul ediliyor.
 *
 * Telefon saatiyle sunucu saati birkaç saniye ayrışabiliyor ve kodun tam
 * geçiş anında yazılması sık. Pay olmasaydı doğru kod "yanlış" görünürdü.
 * Pencere ±1 dilimle sınırlı: daha geniş tutmak, ele geçirilmiş bir kodun
 * kullanılabildiği süreyi uzatırdı.
 */
const PAY = 1;

const BASE32_ALFABE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Base32 (RFC 4648) çözer — kimlik doğrulayıcı uygulamalarının biçimi. */
function base32Coz(metin: string): Buffer | null {
  const temiz = metin.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  if (!temiz || /[^A-Z2-7]/.test(temiz)) return null;

  let bit = 0;
  let deger = 0;
  const baytlar: number[] = [];

  for (const harf of temiz) {
    deger = (deger << 5) | BASE32_ALFABE.indexOf(harf);
    bit += 5;
    if (bit >= 8) {
      baytlar.push((deger >>> (bit - 8)) & 0xff);
      bit -= 8;
    }
  }
  return Buffer.from(baytlar);
}

/** Verilen dilim için 6 haneli kodu üretir. */
function kodUret(gizli: Buffer, dilim: number): string {
  const sayac = Buffer.alloc(8);
  /* Dilim numarası 64 bit; JS'te güvenli tamsayı sınırında kaldığı için ikiye bölünüyor. */
  sayac.writeUInt32BE(Math.floor(dilim / 2 ** 32), 0);
  sayac.writeUInt32BE(dilim >>> 0, 4);

  const ozet = crypto.createHmac("sha1", gizli).update(sayac).digest();
  const kayma = ozet[ozet.length - 1] & 0x0f;
  const ikili =
    ((ozet[kayma] & 0x7f) << 24) |
    ((ozet[kayma + 1] & 0xff) << 16) |
    ((ozet[kayma + 2] & 0xff) << 8) |
    (ozet[kayma + 3] & 0xff);

  return String(ikili % 10 ** HANE).padStart(HANE, "0");
}

/** İkinci faktör yapılandırılmış mı? Değilse kod sorulmuyor. */
export function ikinciFaktorAcikMi(): boolean {
  return Boolean(base32Coz(process.env.ADMIN_TOTP_SECRET ?? ""));
}

/**
 * Kodu doğrular.
 *
 * KARŞILAŞTIRMA SABİT ZAMANLI: kod kısa ve tahmin edilebilir bir uzayda
 * (bir milyon ihtimal); erken çıkan bir karşılaştırma, hane hane ölçerek
 * daraltmaya izin verirdi.
 */
export function ikinciFaktorDogrula(kod: string): boolean {
  const gizli = base32Coz(process.env.ADMIN_TOTP_SECRET ?? "");
  if (!gizli) return false;

  const temiz = (kod ?? "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(temiz)) return false;

  const suanki = Math.floor(Date.now() / 1000 / DILIM_SN);
  for (let fark = -PAY; fark <= PAY; fark++) {
    const beklenen = kodUret(gizli, suanki + fark);
    if (
      beklenen.length === temiz.length &&
      crypto.timingSafeEqual(Buffer.from(beklenen), Buffer.from(temiz))
    ) {
      return true;
    }
  }
  return false;
}

/** Kurulum betiği için: yeni bir gizli anahtar üretir (Base32). */
export function gizliAnahtarUret(): string {
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

/** Kimlik doğrulayıcı uygulamasına elle ya da QR ile girilecek adres. */
export function otpauthAdresi(gizli: string, hesap: string): string {
  const yayinci = encodeURIComponent("Ne Yersin");
  return `otpauth://totp/${yayinci}:${encodeURIComponent(hesap)}?secret=${gizli}&issuer=${yayinci}&digits=${HANE}&period=${DILIM_SN}`;
}
