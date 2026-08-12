import fs from "node:fs";

/**
 * MOBIL SOZLESME AYNASI — iki tipler.ts dosyasi ayristi mi?
 *
 * Sunucu (src/lib/mobil/tipler.ts) ile mobil paket
 * (mobil/packages/ortak/src/tipler.ts) ayni DTO'lari tarif ediyor ama
 * BIRBIRINDEN IMPORT EDEMIYORLAR: mobil taraf ayri bir npm calisma alani,
 * ayri tsconfig; Metro `next/server`e dokunan bir dosyayi paketlemeye
 * calisirsa derleme patlar. Bu yuzden tanimlar elle kopyalaniyor.
 *
 * NEDEN AYRI BIR TEST: kopyanin ayrismasini BASKA HICBIR SEY yakalamiyor.
 * Iki taraf da kendi icinde tutarli oldugu icin typecheck temiz gecer,
 * derleme sorunsuz biter; hata ancak telefonda, sunucudan gelen alanin
 * `undefined` okunmasi olarak gorulur. Bir alanin adini sunucuda
 * degistirip mobilde unutmak tam olarak bu sekilde sessizce gecer.
 *
 * Ayrica AYNALAR: mobil tarafin satir icine yazmak zorunda kaldigi domain
 * tipleri (Rol, SiparisDurumu, Tutarlar, KategoriIkonAdi) burada asil
 * kaynaklariyla da karsilastiriliyor. Bu kopyalar iki adim uzakta: sunucunun
 * kendi sozlesme dosyasi onlari import ettigi icin ilk kontrol onlara hic
 * bakmaz, oysa siparis akisina yeni bir durum eklendiginde mobil listenin
 * eskimesi en olasi kopma noktasi.
 *
 * Tarayici da veritabani da acmiyor; kaynak okuyup karsilastiriyor.
 *   npm run test:mobil-sozlesme
 */

const SUNUCU = "src/lib/mobil/tipler.ts";
const MOBIL = "mobil/packages/ortak/src/tipler.ts";

/**
 * Mobil tarafta SATIR ICINE yazilan domain tipleri.
 *
 * Sunucu bunlari `lib/hesaplar` ve `lib/siparis`ten import ediyor; mobil taraf
 * edemedigi icin kopyaliyor. Sunucu sozlesme dosyasinda tanimlari olmadigindan
 * "mobilde fazladan tip var" diye isaretlenmemeleri gerekiyor — onun yerine
 * asil kaynaklariyla karsilastiriliyorlar.
 */
const AYNALAR = [
  { ad: "Rol", dosya: "src/lib/hesaplar/tipler.ts", sembol: "ROLLER", tur: "dizi" },
  { ad: "SiparisDurumu", dosya: "src/lib/siparis.ts", sembol: "SiparisDurumu", tur: "birlesim" },
  { ad: "Tutarlar", dosya: "src/lib/siparis.ts", sembol: "Tutarlar", tur: "govde" },
  {
    ad: "KategoriIkonAdi",
    dosya: "src/content/kategoriler.ts",
    sembol: "KategoriIkonAdi",
    tur: "birlesim",
  },
];

/** Ayni sekilde kopyalanan sabitler. */
const AYNA_SABITLER = [{ ad: "TESLIMAT_ADIMLARI", dosya: "src/lib/siparis.ts" }];

const cikti = [];
const hatalar = [];
const ok = (m) => cikti.push(`  OK  ${m}`);
const bad = (m) => {
  hatalar.push(m);
  cikti.push(`  X   ${m}`);
};

/**
 * Yorumlari siler.
 *
 * Dizge icindeki `//` dizisini de silerdi; bu dosyalarda dizgeler yalnizca
 * birlesim uyesi (`"odendi"` gibi) oldugu icin sorun cikmiyor. Sozlesmeye bir
 * gun URL yazilirsa burasi da degismeli.
 */
function yorumsuz(metin) {
  return metin.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

const sadeles = (metin) => yorumsuz(metin).replace(/\s+/g, " ").trim();

/**
 * `export type <ad> = …;` govdesini dondurur.
 *
 * Bitisi suslu parantez derinligi 0'dayken gelen ilk `;` belirliyor: govde hem
 * nesne (`{ … }`) hem birlesim (`| "a" | "b"`) hem de kesisim
 * (`RestoranOzetDto & { … }`) olabiliyor.
 */
function tipGovdesi(kaynak, ad) {
  const bas = kaynak.match(new RegExp(`export\\s+type\\s+${ad}\\s*=`));
  if (!bas) return null;
  let i = bas.index + bas[0].length;
  let derinlik = 0;
  for (; i < kaynak.length; i++) {
    const k = kaynak[i];
    if (k === "{" || k === "(" || k === "[") derinlik++;
    else if (k === "}" || k === ")" || k === "]") derinlik--;
    else if (k === ";" && derinlik === 0) break;
  }
  return sadeles(kaynak.slice(bas.index + bas[0].length, i));
}

/** Dosyadaki tum `export type` adlari. */
function tipAdlari(kaynak) {
  return [...kaynak.matchAll(/export\s+type\s+(\w+)\s*=/g)].map((e) => e[1]);
}

/** Birlesimin ya da `as const` dizisinin dizge uyeleri, sirasiyla. */
const dizgeler = (metin) => [...metin.matchAll(/"([^"]*)"/g)].map((e) => e[1]);

function sabitGovdesi(kaynak, ad) {
  const bas = kaynak.match(new RegExp(`export\\s+const\\s+${ad}\\b[^=]*=`));
  if (!bas) return null;
  const kalan = kaynak.slice(bas.index + bas[0].length);
  const kapanis = kalan.indexOf("]");
  return kapanis === -1 ? null : sadeles(kalan.slice(0, kapanis + 1));
}

const oku = (yol) => yorumsuz(fs.readFileSync(yol, "utf-8"));

const sunucu = oku(SUNUCU);
const mobil = oku(MOBIL);

/* ── 1. Sunucudaki her tip mobilde AYNI govdeyle var mi? ── */

const aynaAdlari = new Set(AYNALAR.map((a) => a.ad));
const sunucuTipleri = tipAdlari(sunucu);
const mobilTipleri = tipAdlari(mobil);

if (sunucuTipleri.length === 0) bad(`${SUNUCU} icinde hic 'export type' bulunamadi`);

for (const ad of sunucuTipleri) {
  const s = tipGovdesi(sunucu, ad);
  const m = tipGovdesi(mobil, ad);
  if (m === null) {
    bad(`${ad}: sunucuda var, mobil pakette YOK`);
    continue;
  }
  if (s !== m) {
    bad(`${ad}: govdeler ayristi\n        sunucu: ${s}\n        mobil : ${m}`);
    continue;
  }
  ok(`${ad} iki tarafta ayni`);
}

/* ── 2. Mobilde fazladan tip var mi? ── */

for (const ad of mobilTipleri) {
  if (sunucuTipleri.includes(ad) || aynaAdlari.has(ad)) continue;
  bad(`${ad}: mobil pakette var, sunucuda YOK (ayna listesine de yazilmamis)`);
}

/* ── 3. Aynalar asil kaynaklariyla ayni mi? ── */

for (const ayna of AYNALAR) {
  const kaynak = oku(ayna.dosya);
  const mobilGovde = tipGovdesi(mobil, ayna.ad);
  if (mobilGovde === null) {
    bad(`${ayna.ad}: ayna olarak bekleniyordu ama mobil pakette yok`);
    continue;
  }

  if (ayna.tur === "govde") {
    const asil = tipGovdesi(kaynak, ayna.sembol);
    asil === mobilGovde
      ? ok(`${ayna.ad} aynasi ${ayna.dosya} ile ayni`)
      : bad(
          `${ayna.ad}: ${ayna.dosya} ile ayristi\n        asil  : ${asil}\n        mobil : ${mobilGovde}`,
        );
    continue;
  }

  const asilMetin =
    ayna.tur === "dizi" ? sabitGovdesi(kaynak, ayna.sembol) : tipGovdesi(kaynak, ayna.sembol);
  if (asilMetin === null) {
    bad(`${ayna.ad}: ${ayna.dosya} icinde ${ayna.sembol} bulunamadi`);
    continue;
  }

  const asil = dizgeler(asilMetin).join("|");
  const kopya = dizgeler(mobilGovde).join("|");
  asil === kopya
    ? ok(`${ayna.ad} aynasi ${ayna.dosya} ile ayni (${dizgeler(asilMetin).length} uye)`)
    : bad(`${ayna.ad}: uyeler ayristi\n        asil  : ${asil}\n        mobil : ${kopya}`);
}

/* ── 4. Ayna sabitler ── */

for (const sabit of AYNA_SABITLER) {
  const asil = sabitGovdesi(oku(sabit.dosya), sabit.ad);
  const kopya = sabitGovdesi(mobil, sabit.ad);
  if (asil === null || kopya === null) {
    bad(`${sabit.ad}: iki taraftan birinde bulunamadi`);
    continue;
  }
  const a = dizgeler(asil).join("|");
  const k = dizgeler(kopya).join("|");
  a === k
    ? ok(`${sabit.ad} aynasi ${sabit.dosya} ile ayni`)
    : bad(`${sabit.ad}: ayristi\n        asil  : ${a}\n        mobil : ${k}`);
}

console.log(cikti.join("\n"));
console.log(
  "\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`),
);
process.exit(hatalar.length === 0 ? 0 : 1);
