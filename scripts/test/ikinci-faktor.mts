import { ikinciFaktorAcikMi, ikinciFaktorDogrula } from "../../src/lib/ikinci-faktor";

/**
 * İKİNCİ FAKTÖR — RFC 6238 test vektörleriyle doğrulama.
 *
 * NEDEN AYRI BİR TEST: TOTP elle yazıldı (kütüphane eklenmedi) ve yanlış
 * yazılmış bir uygulama SESSİZCE çalışır gibi görünür — kendi ürettiği kodu
 * kendi doğrular, ama telefondaki Google Authenticator başka bir kod
 * gösterir. Hata ancak yönetici içeri giremediğinde, üstelik canlıda
 * anlaşılırdı. RFC'nin resmî vektörü bunu baştan yakalıyor.
 *
 * Vektör: gizli anahtar ASCII "12345678901234567890" (Base32 karşılığı
 * aşağıda), SHA-1, 6 hane, 30 saniyelik dilim.
 *
 *   npx tsx scripts/test/ikinci-faktor.mts
 */

const GIZLI_BASE32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

/** RFC 6238 Appendix B — SHA-1 satırları. */
const VEKTORLER = [
  { zamanSn: 59, kod: "287082" },
  { zamanSn: 1_111_111_109, kod: "081804" },
  { zamanSn: 1_111_111_111, kod: "050471" },
  { zamanSn: 1_234_567_890, kod: "005924" },
  { zamanSn: 2_000_000_000, kod: "279037" },
];

const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (m: string) => cikti.push(`  OK  ${m}`);
const bad = (m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${m}`);
};

const gercekSimdi = Date.now;
process.env.ADMIN_TOTP_SECRET = GIZLI_BASE32;

if (!ikinciFaktorAcikMi()) bad("anahtar tanimli ama ikinci faktor kapali gorunuyor");
else ok("anahtar okundu, ikinci faktor acik");

for (const v of VEKTORLER) {
  Date.now = () => v.zamanSn * 1000;
  if (ikinciFaktorDogrula(v.kod)) ok(`t=${v.zamanSn} icin ${v.kod} kabul edildi`);
  else bad(`t=${v.zamanSn} icin ${v.kod} REDDEDILDI (RFC vektoru)`);

  /* Bir hane degistirilmis kod kabul edilmemeli. */
  const bozuk = String((Number(v.kod) + 1) % 1_000_000).padStart(6, "0");
  if (ikinciFaktorDogrula(bozuk)) bad(`t=${v.zamanSn} icin yanlis kod ${bozuk} KABUL EDILDI`);
  else ok(`t=${v.zamanSn} icin yanlis kod reddedildi`);
}

/*
 * Saat kayması payı: bir onceki ve bir sonraki dilim kabul, iki dilim oncesi
 * RED. Pay olmasaydi gecis aninda yazilan dogru kod reddedilirdi; pay fazla
 * genis olsaydi ele gecirilmis kodun omru uzardi.
 */
Date.now = () => (59 + 30) * 1000;
if (ikinciFaktorDogrula("287082")) ok("bir onceki dilimin kodu pay icinde kabul edildi");
else bad("bir onceki dilimin kodu reddedildi (pay calismiyor)");

Date.now = () => (59 + 90) * 1000;
if (ikinciFaktorDogrula("287082")) bad("uc dilim onceki kod KABUL EDILDI (pay cok genis)");
else ok("pay disindaki eski kod reddedildi");

/* Bicimsiz girdiler sessizce gecmemeli. */
Date.now = () => 59 * 1000;
for (const bicimsiz of ["", "abc", "12345", "1234567", "28708"]) {
  if (ikinciFaktorDogrula(bicimsiz)) bad(`bicimsiz girdi kabul edildi: "${bicimsiz}"`);
}
ok("bicimsiz girdiler reddedildi");

/* Anahtar yokken ikinci faktor kapali ve hicbir kod gecerli degil. */
delete process.env.ADMIN_TOTP_SECRET;
if (ikinciFaktorAcikMi()) bad("anahtar silindi ama acik gorunuyor");
else ok("anahtar yokken kapali");
if (ikinciFaktorDogrula("287082")) bad("anahtar yokken kod kabul edildi");
else ok("anahtar yokken hicbir kod gecerli degil");

Date.now = gercekSimdi;

console.log(cikti.join("\n"));
console.log(
  "\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`),
);
process.exit(hatalar.length === 0 ? 0 : 1);
