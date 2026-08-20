/**
 * MOBIL PANEL UCLARI — mutfak, yonetim ve yeni katalog bolumleri
 *
 * Test edilen kurallar:
 *  - Katalog uclari JETONSUZ calisiyor: anasayfa, siralama, hakkinda
 *  - Anasayfa cevabi butun bolumleri tasiyor (kampanya, one cikan, adim, sss)
 *  - Siralama taninmayan olcutte sessizce "siparis"e dusuyor (400 DEGIL)
 *  - Mutfak ve yonetim uclarinin hepsi jetonsuz istekte 401 + `oturum_gecersiz`
 *  - Yonetici girisiyle yonetim uclari 200 ve beklenen sekli donuyor
 *  - Yoneticinin MUTFAGI YOK: mutfak uclari 400 `gecersiz_istek` donuyor
 *    (500 degil) — hesaba bagli mutfak olmadigi acikca soyleniyor
 *
 * NEDEN AYRI BIR TEST: mobil.mjs oturum ve katalog katmanini olcuyor; bu
 * dosya PANEL yuzeyini olcuyor. Yeni yuzeyin tamami rol kontrolune bagli ve
 * rol kontrolundeki bir gevseme ne typecheck'te ne derlemede gorunur —
 * yalnizca yanlis kisinin veri gormesi olarak ortaya cikar.
 *
 * Hicbir kayit OLUSTURMUYOR ya da degistirmiyor: yalnizca okuma ve yetki
 * kontrolu. Istenildigi zaman calistirilabilir.
 *
 * Calistirmak icin sunucu ayakta olmali:
 *   npm run build && npm run start
 *   npm run test:mobil-panel
 * Baska bir adres icin: MOBIL_KOK=http://127.0.0.1:3100 npm run test:mobil-panel
 */

const KOK = process.env.MOBIL_KOK ?? "http://127.0.0.1:3000";
const TABAN = `${KOK}/api/mobil/v1`;

const KIMLIK = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;

const cikti = [];
const hatalar = [];
let sayac = 0;

const ok = (mesaj) => cikti.push(`  OK  ${String(++sayac).padStart(2)}. ${mesaj}`);
const bad = (mesaj) => {
  hatalar.push(mesaj);
  cikti.push(`  X   ${String(++sayac).padStart(2)}. ${mesaj}`);
};

async function cagir(yol, { yontem = "GET", jeton } = {}) {
  const yanit = await fetch(`${TABAN}${yol}`, {
    method: yontem,
    headers: {
      Accept: "application/json",
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
    },
  });
  const cevap = await yanit.json().catch(() => null);
  return { durum: yanit.status, cevap };
}

/** 401 + `oturum_gecersiz` bekleyen kisa yardimci. */
async function jetonsuzKapali(yol) {
  const { durum, cevap } = await cagir(yol);
  if (durum === 401 && cevap?.hata?.kod === "oturum_gecersiz") {
    ok(`${yol} jetonsuz 401 donuyor`);
  } else {
    bad(`${yol}: jetonsuz 401/oturum_gecersiz bekleniyordu, ${durum} geldi`);
  }
}

/* ─────────────────────────  KATALOG (jetonsuz)  ───────────────────────── */

const anasayfa = await cagir("/katalog/anasayfa");
if (anasayfa.durum === 200 && anasayfa.cevap?.tamam) {
  const v = anasayfa.cevap.veri;
  const eksik = [
    !v.istatistik && "istatistik",
    !Array.isArray(v.kampanyalar) && "kampanyalar",
    !Array.isArray(v.oneCikanlar) && "oneCikanlar",
    !Array.isArray(v.ayinHanimlari) && "ayinHanimlari",
    !Array.isArray(v.nasilCalisir) && "nasilCalisir",
    !Array.isArray(v.sss) && "sss",
  ].filter(Boolean);

  if (eksik.length === 0) ok("anasayfa: butun bolumler cevapta");
  else bad(`anasayfa: eksik alanlar — ${eksik.join(", ")}`);

  if (v.nasilCalisir.length === 4) ok("anasayfa: nasil calisir dort adim");
  else bad(`anasayfa: dort adim bekleniyordu, ${v.nasilCalisir.length} geldi`);

  if (v.sss.length > 0) ok(`anasayfa: ${v.sss.length} sik sorulan soru`);
  else bad("anasayfa: sss bos geldi (sozlukten okunuyor olmali)");
} else {
  bad(`anasayfa: 200 bekleniyordu, ${anasayfa.durum} geldi`);
}

const siralama = await cagir("/katalog/siralama?olcut=uydurma");
if (siralama.durum === 200 && siralama.cevap?.veri?.olcut === "siparis") {
  ok("siralama: taninmayan olcut sessizce siparise dusuyor");
} else {
  bad(`siralama: taninmayan olcutte siparis bekleniyordu (${siralama.durum})`);
}

const hakkinda = await cagir("/katalog/hakkinda");
if (hakkinda.durum === 200 && hakkinda.cevap?.veri?.telefon) {
  ok("hakkinda: marka ve iletisim bilgisi geliyor");
} else {
  bad(`hakkinda: telefon tasiyan 200 bekleniyordu, ${hakkinda.durum} geldi`);
}

/* ─────────────────────────  KORUMA (jetonsuz)  ───────────────────────── */

for (const yol of [
  "/mutfak/ozet",
  "/mutfak/siparisler",
  "/mutfak/urunler",
  "/mutfak/profil",
  "/mutfak/saatler",
  "/mutfak/yorumlar",
  "/yonetim/ozet",
  "/yonetim/basvurular",
  "/yonetim/fiyatlar",
  "/yonetim/destek",
  "/destek",
]) {
  await jetonsuzKapali(yol);
}

/* ─────────────────────────  YONETICI GIRISI  ───────────────────────── */

if (!PAROLA) {
  bad("ADMIN_PASSWORD yok — yonetim kontrolleri atlandi");
} else {
  const giris = await fetch(`${TABAN}/oturum/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kimlik: KIMLIK, parola: PAROLA, cihaz: "test-mobil-panel" }),
  });
  const g = await giris.json().catch(() => null);

  if (giris.status !== 200 || !g?.tamam) {
    bad(`yonetici girisi basarisiz (${giris.status}) — yonetim kontrolleri atlandi`);
  } else {
    ok("yonetici girisi: jeton alindi");
    const jeton = g.veri.erisimJetonu;

    const ozet = await cagir("/yonetim/ozet", { jeton });
    const sayilar = ozet.cevap?.veri;
    if (
      ozet.durum === 200 &&
      typeof sayilar?.bekleyenBasvuru === "number" &&
      typeof sayilar?.acikSiparis === "number"
    ) {
      ok(
        `yonetim/ozet: ${sayilar.bekleyenBasvuru} basvuru, ${sayilar.bekleyenFiyat} fiyat, ` +
          `${sayilar.acikDestek} destek bekliyor`,
      );
    } else {
      bad(`yonetim/ozet: sayilari tasiyan 200 bekleniyordu, ${ozet.durum} geldi`);
    }

    for (const yol of ["/yonetim/basvurular", "/yonetim/fiyatlar", "/yonetim/destek"]) {
      const { durum, cevap } = await cagir(yol, { jeton });
      if (durum === 200 && Array.isArray(cevap?.veri)) {
        ok(`${yol}: ${cevap.veri.length} kayit`);
      } else {
        bad(`${yol}: dizi tasiyan 200 bekleniyordu, ${durum} geldi`);
      }
    }

    /*
     * YONETICININ MUTFAGI YOK. Uc bunu 400 ile ve acik bir cumleyle
     * soylemeli; 500 donmesi ya da bos cevap, "mutfak yok" ile "sunucu
     * bozuldu" ayrimini kaybettirirdi.
     */
    const mutfak = await cagir("/mutfak/ozet", { jeton });
    if (mutfak.durum === 400 && mutfak.cevap?.hata?.kod === "gecersiz_istek") {
      ok("mutfak/ozet: mutfagi olmayan yonetici icin 400 (500 degil)");
    } else if (mutfak.durum === 200) {
      ok("mutfak/ozet: yoneticinin bagli mutfagi var, ozet geldi");
    } else {
      bad(`mutfak/ozet: 400 ya da 200 bekleniyordu, ${mutfak.durum} geldi`);
    }
  }
}

/* ─────────────────────────  SONUC  ───────────────────────── */

console.log(cikti.join("\n"));
if (hatalar.length > 0) {
  console.log(`\n${hatalar.length} KONTROL BASARISIZ`);
  process.exit(1);
}
console.log(`\nTUMU GECTI (${sayac} kontrol)`);
