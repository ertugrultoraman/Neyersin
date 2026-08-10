/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { gunAnahtari, raporCikar } from "../../src/lib/isletme-rapor";
import type { KayitliSiparis } from "../../src/lib/depo";

/**
 * ISLETME RAPORU — ciro dogru mu?
 *
 * Yanlis bir ciro sayisi sessizce yanlis kalir: kimse "bu rakam tutmuyor"
 * diye fark etmez, isletme de kazanmadigi parayi kazanmis sanir. O yuzden
 * asil kontroller SAYMAMASI GEREKENLER uzerinde:
 *
 *  - IPTAL edilen siparis hicbir ciroya girmemeli.
 *  - "odendi" (parasi alinmis ama mutfakta duran) siparis TESLIM EDILEN
 *    ciroya girmemeli. lib/siparis.ts'teki `tamamlandiMi` ikisini tek sayida
 *    topluyor; rapor bilerek onu kullanmiyor.
 *  - Ekstralar urun cirosuna girmeli, yoksa toplam siparis tutarlariyla
 *    uyusmaz.
 *
 * Gun ayrimi Istanbul'a gore; sunucu UTC calisiyor.
 */
const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (n: number, m: string) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n: number, m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${String(n).padStart(2)}. ${m}`);
};

let no = 0;
const SIMDI = new Date("2026-08-10T12:00:00+03:00");
const gunOnce = (g: number) =>
  new Date(SIMDI.getTime() - g * 24 * 60 * 60 * 1000).toISOString();

type Kalem = { ad: string; fiyat: number; adet: number; ekstraFiyat?: number };

let sayac = 0;
const siparis = (
  durum: string,
  toplam: number,
  tarih: string,
  kalemler: Kalem[] = [{ ad: "Lahmacun", fiyat: 100, adet: 1 }],
): KayitliSiparis =>
  ({
    siparisNo: `T-${(sayac += 1)}`,
    durum,
    olusturmaTarihi: tarih,
    guncellemeTarihi: tarih,
    tutarlar: { toplam },
    kalemler: kalemler.map((k, i) => ({
      satirId: `${k.ad}-${i}`,
      urunId: k.ad,
      ad: k.ad,
      fiyat: k.fiyat,
      adet: k.adet,
      ekstralar: k.ekstraFiyat ? [{ id: "e", ad: "Ekstra", fiyat: k.ekstraFiyat }] : undefined,
    })),
  }) as unknown as KayitliSiparis;

/* ════════════ 1. BOS LISTE ════════════ */
{
  const r = raporCikar([], SIMDI);
  r.bugun.ciro === 0 && r.iptalOrani === 0 && r.enCokSatan.length === 0
    ? ok((no += 1), "bos listede rapor sifirlarla donuyor")
    : bad((no += 1), "bos listede rapor bozuk");

  r.bugun.ortalama === 0
    ? ok((no += 1), "siparis yokken ortalama sepet 0 (sifira bolme yok)")
    : bad((no += 1), "sifira bolme kacagi");
}

/* ════════════ 2. IPTAL CIROYA GIRMIYOR ════════════ */
{
  const r = raporCikar(
    [
      siparis("teslim-edildi", 200, gunOnce(0)),
      siparis("iptal", 5000, gunOnce(0)),
    ],
    SIMDI,
  );
  r.bugun.ciro === 200
    ? ok((no += 1), "iptal edilen siparis ciroya GIRMIYOR")
    : bad((no += 1), `iptal ciroya girmis: ${r.bugun.ciro}`);

  r.iptal === 1 && r.iptalOrani === 50
    ? ok((no += 1), "iptal sayisi ve orani dogru (1/2 = %50)")
    : bad((no += 1), `iptal orani yanlis: ${r.iptal} / %${r.iptalOrani}`);
}

/* ════════════ 3. "ODENDI" TESLIM EDILEN CIROYA GIRMIYOR ════════════ */
/*
 * ASIL AYRIM. Parasi alinmis ama mutfakta duran siparis "kazanilmis" degil;
 * `tamamlandiMi` ikisini toplasa da rapor ayiriyor.
 */
{
  const r = raporCikar(
    [
      siparis("teslim-edildi", 300, gunOnce(0)),
      siparis("odendi", 700, gunOnce(0)),
      siparis("yolda", 500, gunOnce(0)),
    ],
    SIMDI,
  );
  r.bugun.ciro === 300
    ? ok((no += 1), "teslim edilmemis siparis bugunku ciroya girmiyor")
    : bad((no += 1), `yoldaki siparis ciroya karismis: ${r.bugun.ciro}`);

  r.yoldakiCiro === 1200 && r.yoldakiSiparis === 2
    ? ok((no += 1), "yoldaki is ayri sayida gosteriliyor (1200 / 2 siparis)")
    : bad((no += 1), `yoldaki toplam yanlis: ${r.yoldakiCiro} / ${r.yoldakiSiparis}`);

  /* Devam edenler iptal oranina PAYDA olarak girmemeli. */
  r.iptalOrani === 0
    ? ok((no += 1), "devam eden siparisler iptal oranini bozmuyor")
    : bad((no += 1), `iptal orani yanlis: %${r.iptalOrani}`);
}

/* ════════════ 4. DONEMLER ════════════ */
{
  const r = raporCikar(
    [
      siparis("teslim-edildi", 100, gunOnce(0)),
      siparis("teslim-edildi", 200, gunOnce(3)),
      siparis("teslim-edildi", 400, gunOnce(20)),
      siparis("teslim-edildi", 800, gunOnce(60)),
    ],
    SIMDI,
  );

  r.bugun.ciro === 100
    ? ok((no += 1), "bugunku ciro yalnizca bugunu sayiyor")
    : bad((no += 1), `bugun yanlis: ${r.bugun.ciro}`);

  r.sonYediGun.ciro === 300
    ? ok((no += 1), "son 7 gun: 100 + 200")
    : bad((no += 1), `son 7 gun yanlis: ${r.sonYediGun.ciro}`);

  r.sonOtuzGun.ciro === 700
    ? ok((no += 1), "son 30 gun: 100 + 200 + 400")
    : bad((no += 1), `son 30 gun yanlis: ${r.sonOtuzGun.ciro}`);

  /* 60 gun oncesi hicbir donemde olmamali. */
  r.sonOtuzGun.ciro !== 1500
    ? ok((no += 1), "30 gunden eski siparis donemlere sizmiyor")
    : bad((no += 1), "eski siparis 30 gune girmis");

  r.sonYediGun.ortalama === 150
    ? ok((no += 1), "ortalama sepet dogru (300/2)")
    : bad((no += 1), `ortalama yanlis: ${r.sonYediGun.ortalama}`);
}

/* ════════════ 5. EN COK SATANLAR ════════════ */
{
  const r = raporCikar(
    [
      siparis("teslim-edildi", 500, gunOnce(0), [
        { ad: "Lahmacun", fiyat: 100, adet: 3 },
        { ad: "Ayran", fiyat: 30, adet: 1 },
      ]),
      siparis("teslim-edildi", 300, gunOnce(1), [{ ad: "Ayran", fiyat: 30, adet: 5 }]),
      /* Iptal edilen sepet satis degil — sayilara girmemeli. */
      siparis("iptal", 900, gunOnce(0), [{ ad: "Lahmacun", fiyat: 100, adet: 50 }]),
    ],
    SIMDI,
  );

  r.enCokSatan[0]?.ad === "Ayran" && r.enCokSatan[0]?.adet === 6
    ? ok((no += 1), "en cok satan adete gore siralaniyor (Ayran 6)")
    : bad((no += 1), `siralama yanlis: ${JSON.stringify(r.enCokSatan[0])}`);

  r.enCokSatan.find((u) => u.ad === "Lahmacun")?.adet === 3
    ? ok((no += 1), "iptal edilen sepetin urunleri satisa sayilmiyor")
    : bad((no += 1), "iptal edilen urunler en cok satana karismis");
}

/* ════════════ 6. EKSTRALAR URUN CIROSUNA GIRIYOR ════════════ */
{
  const r = raporCikar(
    [
      siparis("teslim-edildi", 260, gunOnce(0), [
        { ad: "Burger", fiyat: 100, adet: 2, ekstraFiyat: 30 },
      ]),
    ],
    SIMDI,
  );
  /* (100 + 30) * 2 = 260 */
  r.enCokSatan[0]?.ciro === 260
    ? ok((no += 1), "ekstralar urun cirosuna dahil ((100+30)x2 = 260)")
    : bad((no += 1), `ekstra hesaba katilmamis: ${r.enCokSatan[0]?.ciro}`);
}

/* ════════════ 7. GUN AYRIMI ISTANBUL'A GORE ════════════ */
/*
 * UTC 2026-08-10 22:00 = Istanbul'da 11 Agustos 01:00. Sunucunun kendi
 * saatiyle ayrilsaydi siparis bir onceki gune yazilirdi.
 */
gunAnahtari(new Date("2026-08-10T22:00:00Z")) === "2026-08-11"
  ? ok((no += 1), "gun ayrimi Istanbul'a gore (UTC 22:00 = ertesi gun)")
  : bad((no += 1), `gun ayrimi UTC'de kalmis: ${gunAnahtari(new Date("2026-08-10T22:00:00Z"))}`);

console.log(cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
