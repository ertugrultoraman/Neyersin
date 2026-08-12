/**
 * MOBIL API — oturum katmani
 *
 * Test edilen kurallar:
 *  - Giris ucu bos/eksik govdeyi 400 ile reddediyor
 *  - Hatali parola 401 donuyor ama kodu `gecersiz_istek` (oturum_gecersiz DEGIL)
 *  - Dogru kimlikle erisim + yenileme jetonu ciftini veriyor
 *  - Jetonsuz istek 401 + `oturum_gecersiz`
 *  - Erisim jetonuyla /ben calisiyor ve dogru kullaniciyi donuyor
 *  - Yenileme jetonuyla yeni cift aliniyor (rotasyon)
 *  - BASKA cihaz kimligiyle yenileme reddediliyor
 *  - ALAN AYRIMI: erisim jetonu yenileme yerine, yenileme jetonu Bearer
 *    olarak kullanilamiyor
 *
 * NEDEN AYRI BIR TEST: bu uclarin hepsi durum tutmayan imzali jetonlarla
 * calisiyor. Imza anahtari turetmesindeki bir degisiklik derlemeden de
 * typecheck'ten de gecer, yalnizca calisma aninda "oturum acilamiyor" olarak
 * ortaya cikar. Ozellikle alan ayrimi (son iki kontrol) sessizce kirilirsa
 * uzun omurlu yenileme jetonu her istekte kabul edilir hale gelirdi.
 *
 * Calistirmak icin sunucu ayakta olmali:
 *   npm run build && npm run start
 *   npm run test:mobil
 * Baska bir adres icin: MOBIL_KOK=http://127.0.0.1:3100 npm run test:mobil
 */

const KOK = process.env.MOBIL_KOK ?? "http://127.0.0.1:3000";
const TABAN = `${KOK}/api/mobil/v1`;

const KIMLIK = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) {
  console.error("ADMIN_PASSWORD yok — .env.local ile calistirin.");
  process.exit(2);
}

const CIHAZ = `test-cihaz-${Date.now()}`;
const BASKA_CIHAZ = `test-cihaz-baska-${Date.now()}`;

const cikti = [];
const hatalar = [];
let sira = 0;
const ok = (m) => cikti.push(`  OK  ${String(++sira).padStart(2)}. ${m}`);
const bad = (m) => {
  hatalar.push(m);
  cikti.push(`  X   ${String(++sira).padStart(2)}. ${m}`);
};

/** Uca istek atar; zarfi acmadan ham durum + govde doner. */
async function cagir(yol, { yontem = "GET", govde, jeton } = {}) {
  const basliklar = { Accept: "application/json" };
  if (govde !== undefined) basliklar["Content-Type"] = "application/json";
  if (jeton) basliklar.Authorization = `Bearer ${jeton}`;

  const yanit = await fetch(`${TABAN}${yol}`, {
    method: yontem,
    headers: basliklar,
    body: govde === undefined ? undefined : JSON.stringify(govde),
  });
  const cevap = await yanit.json().catch(() => null);
  return { durum: yanit.status, cevap };
}

/** `durum` ve hata `kod` birlikte dogrulanir — ikisi ayri anlam tasiyor. */
function beklenenHata(baslik, sonuc, durum, kod) {
  if (sonuc.durum !== durum) return bad(`${baslik}: durum ${durum} bekleniyordu, ${sonuc.durum} geldi`);
  if (sonuc.cevap?.tamam !== false) return bad(`${baslik}: hata zarfi bekleniyordu`);
  if (sonuc.cevap.hata?.kod !== kod) {
    return bad(`${baslik}: kod "${kod}" bekleniyordu, "${sonuc.cevap.hata?.kod}" geldi`);
  }
  ok(`${baslik} -> ${durum} ${kod}`);
}

async function calistir() {
  /* --- Sunucu ayakta mi -------------------------------------------------- */
  try {
    await fetch(KOK, { method: "HEAD" });
  } catch {
    console.error(`Sunucuya ulasilamadi: ${KOK}\nOnce "npm run start" ile ayaga kaldirin.`);
    process.exit(2);
  }

  /* --- Girdi dogrulamasi ------------------------------------------------- */
  beklenenHata("bos govde", await cagir("/oturum/giris", { yontem: "POST", govde: {} }), 400, "gecersiz_istek");

  beklenenHata(
    "cihazsiz giris",
    await cagir("/oturum/giris", { yontem: "POST", govde: { kimlik: KIMLIK, parola: PAROLA } }),
    400,
    "gecersiz_istek",
  );

  /*
   * Hatali parola 401 donuyor ama kodu `gecersiz_istek`. Kod `oturum_gecersiz`
   * olsaydi istemci "jetonu tazele ve tekrar dene" diye yorumlar, tazelenecek
   * jeton olmadigi icin giris ekraninda sonsuz donguye girerdi.
   */
  beklenenHata(
    "hatali parola",
    await cagir("/oturum/giris", {
      yontem: "POST",
      govde: { kimlik: KIMLIK, parola: `${PAROLA}-yanlis`, cihaz: CIHAZ },
    }),
    401,
    "gecersiz_istek",
  );

  /* --- Jetonsuz erisim --------------------------------------------------- */
  beklenenHata("jetonsuz /ben", await cagir("/oturum/ben"), 401, "oturum_gecersiz");
  beklenenHata("bozuk jetonla /ben", await cagir("/oturum/ben", { jeton: "abc.def" }), 401, "oturum_gecersiz");

  /* --- Basarili giris ---------------------------------------------------- */
  const giris = await cagir("/oturum/giris", {
    yontem: "POST",
    govde: { kimlik: KIMLIK, parola: PAROLA, cihaz: CIHAZ },
  });
  if (giris.durum !== 200 || giris.cevap?.tamam !== true) {
    bad(`giris: 200 bekleniyordu, ${giris.durum} geldi (${JSON.stringify(giris.cevap)?.slice(0, 120)})`);
    return;
  }
  const { erisimJetonu, yenilemeJetonu, erisimSuresi, kullanici } = giris.cevap.veri;

  erisimJetonu && yenilemeJetonu
    ? ok("giris -> erisim + yenileme jetonu geldi")
    : bad("giris: jeton cifti eksik");

  erisimJetonu === yenilemeJetonu
    ? bad("giris: iki jeton AYNI — alan ayrimi yok")
    : ok("erisim ve yenileme jetonlari farkli");

  erisimSuresi > 0 && erisimSuresi <= 3600
    ? ok(`erisim jetonu omru makul (${erisimSuresi} sn)`)
    : bad(`erisim jetonu omru beklenmedik: ${erisimSuresi}`);

  kullanici?.rol === "admin"
    ? ok(`kullanici rolu dogru (${kullanici.rol})`)
    : bad(`kullanici rolu "admin" bekleniyordu, "${kullanici?.rol}" geldi`);

  /* --- Jetonla erisim ---------------------------------------------------- */
  const ben = await cagir("/oturum/ben", { jeton: erisimJetonu });
  ben.durum === 200 && ben.cevap?.veri?.eposta === kullanici.eposta
    ? ok("/ben erisim jetonuyla dogru kullaniciyi donuyor")
    : bad(`/ben basarisiz: durum ${ben.durum}, eposta ${ben.cevap?.veri?.eposta}`);

  /* --- ALAN AYRIMI ------------------------------------------------------- */
  /*
   * Iki jeton FARKLI anahtarlarla imzalaniyor (bkz. lib/imza.ts -> alanAnahtari).
   * Ayrim kalkarsa 180 gun omurlu yenileme jetonu her istekte gecerli hale
   * gelir; calinan bir jetonun zarari 1 saatten 6 aya cikardi.
   */
  beklenenHata(
    "yenileme jetonu Bearer olarak kullanilamaz",
    await cagir("/oturum/ben", { jeton: yenilemeJetonu }),
    401,
    "oturum_gecersiz",
  );

  beklenenHata(
    "erisim jetonu yenileme yerine kullanilamaz",
    await cagir("/oturum/yenile", {
      yontem: "POST",
      govde: { yenilemeJetonu: erisimJetonu, cihaz: CIHAZ },
    }),
    401,
    "oturum_gecersiz",
  );

  /* --- Cihaz baglama ----------------------------------------------------- */
  beklenenHata(
    "baska cihazdan yenileme reddediliyor",
    await cagir("/oturum/yenile", {
      yontem: "POST",
      govde: { yenilemeJetonu, cihaz: BASKA_CIHAZ },
    }),
    401,
    "oturum_gecersiz",
  );

  /* --- Yenileme + rotasyon ----------------------------------------------- */
  const yenile = await cagir("/oturum/yenile", {
    yontem: "POST",
    govde: { yenilemeJetonu, cihaz: CIHAZ },
  });
  if (yenile.durum !== 200 || yenile.cevap?.tamam !== true) {
    bad(`yenileme: 200 bekleniyordu, ${yenile.durum} geldi`);
  } else {
    ok("yenileme -> yeni jeton cifti geldi");

    const taze = yenile.cevap.veri.erisimJetonu;
    const benTaze = await cagir("/oturum/ben", { jeton: taze });
    benTaze.durum === 200
      ? ok("yenilenen erisim jetonu calisiyor")
      : bad(`yenilenen jeton calismadi: durum ${benTaze.durum}`);

    yenile.cevap.veri.kullanici?.rol === "admin"
      ? ok("yenilemede rol veritabanindan tazelendi")
      : bad("yenilemede rol dogrulanamadi");
  }
}

try {
  await calistir();
} catch (patlama) {
  hatalar.push(String(patlama));
  cikti.push(`  !   test yarida kesildi: ${String(patlama).split("\n")[0]}`);
}

console.log(cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
