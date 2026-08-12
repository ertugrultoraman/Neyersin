/**
 * MOBIL API — oturum + katalog katmani
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
 *  - Katalog uclari JETONSUZ calisiyor (menuye bakmak icin hesap gerekmiyor)
 *  - Taninmayan kategori bos liste, olmayan mutfak 404 + `bulunamadi`
 *  - Detay cevabi ozetin alanlarini da tasiyor (DTO genislemesi)
 *  - Sepet tutari SUNUCUDA hesaplaniyor; istemcinin yolladigi fiyat yok
 *    sayiliyor, satilmayan urun dusuruluyor
 *  - Siparis uclari giris istiyor; baskasinin siparisi 404
 *  - Kayit: zayif parola ve kayitli e-posta reddediliyor, yanlis dogrulama
 *    kodu 400 donuyor (401 degil)
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

  /* --- Katalog ----------------------------------------------------------- */
  /*
   * Katalog uclari JETONSUZ cagriliyor. Sozlesmenin ta kendisi bu: menuye
   * bakmak icin hesap gerekmiyor, giris ancak siparis aninda isteniyor. Uclar
   * bir gun `acik` yerine `korumali` ile sarilirsa uygulamayi indiren herkes
   * once kayit ekranina carpar — buradaki jetonsuz cagri onu yakaliyor.
   */
  const kategoriler = await cagir("/katalog/kategoriler");
  if (kategoriler.durum !== 200 || kategoriler.cevap?.tamam !== true) {
    bad(`kategoriler: 200 bekleniyordu, ${kategoriler.durum} geldi`);
  } else {
    const liste = kategoriler.cevap.veri;
    Array.isArray(liste) && liste.length > 0
      ? ok(`kategoriler jetonsuz geldi (${liste.length} kategori)`)
      : bad("kategoriler bos dondu");

    liste.every((k) => k.slug && k.ad && k.ikon && typeof k.adet === "number")
      ? ok("kategori kayitlarinda slug/ad/ikon/adet dolu")
      : bad("bir kategoride slug, ad, ikon ya da adet eksik");
  }

  const restoranlar = await cagir("/katalog/restoranlar");
  let ornekSlug = null;
  if (restoranlar.durum !== 200 || restoranlar.cevap?.tamam !== true) {
    bad(`restoranlar: 200 bekleniyordu, ${restoranlar.durum} geldi`);
  } else {
    const liste = restoranlar.cevap.veri;
    if (!Array.isArray(liste) || liste.length === 0) {
      bad("restoran listesi bos dondu");
    } else {
      ornekSlug = liste[0].slug;
      ok(`restoran listesi jetonsuz geldi (${liste.length} mutfak)`);

      liste.every((r) => typeof r.acik === "boolean" && Array.isArray(r.rozetler))
        ? ok("ozet kayitlarinda acik/rozetler alanlari var")
        : bad("bir ozet kaydinda acik ya da rozetler eksik");
    }
  }

  /*
   * TANINMAYAN KATEGORI BOS LISTE DONDURUYOR, tum listeyi degil. Suzgeci
   * sessizce yok saymak, uygulamada yanlis yazilmis bir baglantiyi "her seyi
   * gosteren kategori" gibi gosterirdi.
   */
  const olmayanKategori = await cagir("/katalog/restoranlar?kategori=boyle-bir-sey-yok");
  olmayanKategori.durum === 200 && olmayanKategori.cevap?.veri?.length === 0
    ? ok("taninmayan kategori -> bos liste")
    : bad("taninmayan kategori tum listeyi dondurdu");

  const olmayanMutfak = await cagir("/katalog/restoran/boyle-bir-mutfak-yok");
  olmayanMutfak.durum === 404 && olmayanMutfak.cevap?.hata?.kod === "bulunamadi"
    ? ok("olmayan mutfak -> 404 bulunamadi")
    : bad(`olmayan mutfak: 404/bulunamadi bekleniyordu, ${olmayanMutfak.durum} geldi`);

  if (ornekSlug) {
    const detay = await cagir(`/katalog/restoran/${ornekSlug}`);
    if (detay.durum !== 200 || detay.cevap?.tamam !== true) {
      bad(`detay: 200 bekleniyordu, ${detay.durum} geldi`);
    } else {
      const d = detay.cevap.veri;
      d.slug === ornekSlug && Array.isArray(d.menu) && Array.isArray(d.teslimatBolgeleri)
        ? ok("detay menu + teslimat bolgeleriyle geldi")
        : bad("detay eksik alanlarla dondu");

      /*
       * Detay, ozetin alanlarini da tasimak ZORUNDA: RestoranDetayDto,
       * RestoranOzetDto'yu genisletiyor. Uygulama listeden detaya gecerken
       * ayni karti yeniden ciziyor; eksik alan basligi bos birakirdi.
       */
      typeof d.acik === "boolean" && typeof d.minSepet === "number" && d.mutfak
        ? ok("detay ozet alanlarini da tasiyor")
        : bad("detayda ozet alanlari eksik");

      d.yorumOzeti && typeof d.yorumOzeti.adet === "number"
        ? ok("detayda yorum ozeti var")
        : bad("detayda yorum ozeti eksik");

      /* --- Sepet ozeti --------------------------------------------------- */
      /*
       * SEPETIN PARASINI SUNUCU HESAPLIYOR. Uygulama yalnizca urun kimligi ve
       * adet yolluyor; fiyat gonderilmiyor. Asagidaki kontroller bunun boyle
       * kaldigini dogruluyor -- uc bir gun istemciden fiyat kabul etmeye
       * baslarsa odenecek tutar kullanicinin degistirebildigi bir sayiya
       * baglanmis olurdu.
       */
      const urun = d.menu.flatMap((b) => b.urunler).find((u) => u.fiyat > 0);

      if (!urun) {
        ok("sepet testi atlandi: bu mutfakta fiyati girilmis urun yok");
      } else {
        const tek = await cagir("/sepet/ozet", {
          yontem: "POST",
          govde: { restoranSlug: ornekSlug, kalemler: [{ urunId: urun.id, adet: 2 }] },
        });

        if (tek.durum !== 200 || tek.cevap?.tamam !== true) {
          bad(`sepet ozeti: 200 bekleniyordu, ${tek.durum} geldi`);
        } else {
          const o = tek.cevap.veri;
          o.tutarlar.araToplam === urun.fiyat * 2
            ? ok("sepet ara toplami menudeki fiyattan hesaplandi")
            : bad(
                `ara toplam ${o.tutarlar.araToplam}, beklenen ${urun.fiyat * 2}`,
              );

          typeof o.tutarlar.minSepetKarsilandi === "boolean" && o.tutarlar.minSepet > 0
            ? ok("min sepet bilgisi geliyor")
            : bad("min sepet bilgisi eksik");
        }

        /*
         * ISTEMCININ GONDERDIGI FIYAT YOK SAYILIYOR. Govdeye fiyat alani
         * eklemek cevabi degistirmemeli; degistirseydi indirimli tutar
         * uydurmak icin tek yapilacak sey bu alani yollamak olurdu.
         */
        const sahte = await cagir("/sepet/ozet", {
          yontem: "POST",
          govde: {
            restoranSlug: ornekSlug,
            kalemler: [{ urunId: urun.id, adet: 2, fiyat: 1 }],
          },
        });
        sahte.durum === 200 && sahte.cevap?.veri?.tutarlar?.araToplam === urun.fiyat * 2
          ? ok("istemciden gelen fiyat yok sayiliyor")
          : bad("istemcinin gonderdigi fiyat tutari etkiledi");

        /* Olmayan urun sepetten dusuyor ve dusenler bildiriliyor. */
        const dusen = await cagir("/sepet/ozet", {
          yontem: "POST",
          govde: {
            restoranSlug: ornekSlug,
            kalemler: [{ urunId: "boyle-bir-urun-yok", adet: 1 }],
          },
        });
        dusen.durum === 200 &&
        dusen.cevap?.veri?.dusenKalemler?.includes("boyle-bir-urun-yok") &&
        dusen.cevap.veri.kalemler.length === 0
          ? ok("satilmayan urun dusuyor ve bildiriliyor")
          : bad("satilmayan urun sessizce yok sayildi");
      }

      /* Bos sepet 400 DEGIL: son kalem silinince ekran tutarlari sifirliyor. */
      const bosSepet = await cagir("/sepet/ozet", {
        yontem: "POST",
        govde: { restoranSlug: ornekSlug, kalemler: [] },
      });
      bosSepet.durum === 200 && bosSepet.cevap?.veri?.tutarlar?.toplam === 0
        ? ok("bos sepet gecerli sorgu -> toplam 0")
        : bad(`bos sepet: 200/toplam 0 bekleniyordu, ${bosSepet.durum} geldi`);
    }
  }

  const bozukSepet = await cagir("/sepet/ozet", { yontem: "POST", govde: {} });
  bozukSepet.durum === 400 && bozukSepet.cevap?.hata?.kod === "gecersiz_istek"
    ? ok("govdesiz sepet ozeti -> 400 gecersiz_istek")
    : bad(`govdesiz sepet ozeti: 400 bekleniyordu, ${bozukSepet.durum} geldi`);

  /* --- Siparis uclari ----------------------------------------------------- */
  /*
   * BU BOLUM GERCEK SIPARIS OLUSTURMUYOR. Kayit acmak, testi calistiran her
   * seferinde musterinin siparis gecmisine ve yonetici paneline sahte bir
   * satir birakirdi. Asagidaki cagrilar dogrulamaya takilip donuyor; hicbiri
   * `siparisiKaydet`e ulasmiyor.
   */
  const siparisJetonsuz = await cagir("/siparisler");
  siparisJetonsuz.durum === 401 && siparisJetonsuz.cevap?.hata?.kod === "oturum_gecersiz"
    ? ok("siparis listesi jetonsuz -> 401 (katalogdan farkli, giris zorunlu)")
    : bad(`siparis listesi jetonsuz: 401 bekleniyordu, ${siparisJetonsuz.durum} geldi`);

  const listem = await cagir("/siparisler", { jeton: erisimJetonu });
  listem.durum === 200 && Array.isArray(listem.cevap?.veri)
    ? ok(`siparis listesi geldi (${listem.cevap.veri.length} kayit)`)
    : bad(`siparis listesi: 200 + dizi bekleniyordu, ${listem.durum} geldi`);

  const olmayanSiparis = await cagir("/siparis/BOYLE-BIR-SIPARIS-YOK", { jeton: erisimJetonu });
  olmayanSiparis.durum === 404 && olmayanSiparis.cevap?.hata?.kod === "bulunamadi"
    ? ok("baskasinin/olmayan siparisi -> 404 (403 degil: numara taranamasin)")
    : bad(`olmayan siparis: 404 bekleniyordu, ${olmayanSiparis.durum} geldi`);

  const olmayanIptal = await cagir("/siparis/BOYLE-BIR-SIPARIS-YOK/iptal", {
    yontem: "POST",
    jeton: erisimJetonu,
  });
  olmayanIptal.durum === 409
    ? ok("olmayan siparisi iptal -> 409")
    : bad(`olmayan siparis iptali: 409 bekleniyordu, ${olmayanIptal.durum} geldi`);

  const bosSiparis = await cagir("/siparis", {
    yontem: "POST",
    jeton: erisimJetonu,
    govde: {},
  });
  bosSiparis.durum === 400 && bosSiparis.cevap?.hata?.kod === "gecersiz_istek"
    ? ok("govdesiz siparis -> 400 gecersiz_istek")
    : bad(`govdesiz siparis: 400 bekleniyordu, ${bosSiparis.durum} geldi`);

  const olmayanMutfaga = await cagir("/siparis", {
    yontem: "POST",
    jeton: erisimJetonu,
    govde: {
      restoranSlug: "boyle-bir-mutfak-yok",
      kalemler: [{ urunId: "x", adet: 1 }],
      musteri: { adSoyad: "Test Kullanici", telefon: "05001112233" },
      adres: {
        ilce: "Beylikdüzü",
        mahalle: "Test",
        acikAdres: "Test sokak",
        binaNo: "1",
        daireNo: "1",
        tarif: "",
      },
      odemeYontemi: "havale",
    },
  });
  olmayanMutfaga.durum === 400 && olmayanMutfaga.cevap?.hata?.alanlar?.restoran
    ? ok("olmayan mutfaga siparis -> 400 + alanlar.restoran")
    : bad(
        `olmayan mutfaga siparis: 400 + alan hatasi bekleniyordu, ${olmayanMutfaga.durum} geldi`,
      );

  /* --- Hesap uclari ------------------------------------------------------- */
  /*
   * BU BOLUM DE GERCEK HESAP ACMIYOR ve E-POSTA GONDERMIYOR. Her cagri
   * dogrulamaya takilip donuyor; kod uretimine ulasan tek yol gecerli bir
   * kayit istegi olurdu ve o bilerek denenmiyor -- her test calistirmasi
   * hesap tablosuna ve posta kuyruguna is birakirdi.
   */
  const bosKayit = await cagir("/hesap/kayit", { yontem: "POST", govde: {} });
  bosKayit.durum === 400
    ? ok("govdesiz kayit -> 400")
    : bad(`govdesiz kayit: 400 bekleniyordu, ${bosKayit.durum} geldi`);

  const kisaParola = await cagir("/hesap/kayit", {
    yontem: "POST",
    govde: { ad: "Test Kullanici", eposta: `test-${Date.now()}@ornek.test`, parola: "123" },
  });
  kisaParola.durum === 400
    ? ok("kisa parolayla kayit -> 400 (hesap acilmadi)")
    : bad(`kisa parola: 400 bekleniyordu, ${kisaParola.durum} geldi`);

  /*
   * ZATEN KAYITLI e-posta reddediliyor. Yonetici hesabinin adresi kullaniliyor
   * cunku varligi kesin; kayit `hesapBul` denetiminde duruyor, posta asamasina
   * hic ulasmiyor.
   */
  const mevcutEposta = ben.cevap?.veri?.eposta;
  if (mevcutEposta) {
    const varOlan = await cagir("/hesap/kayit", {
      yontem: "POST",
      govde: {
        ad: "Test Kullanici",
        eposta: mevcutEposta,
        parola: "CokUzunVeGuclu-Parola-2026",
        parolayiKabulEt: true,
      },
    });
    varOlan.durum === 400
      ? ok("kayitli e-postayla ikinci hesap acilmiyor -> 400")
      : bad(`kayitli e-posta: 400 bekleniyordu, ${varOlan.durum} geldi`);
  }

  /*
   * Yanlis kod 400 donuyor, 401 DEGIL: 401 istemcide "jetonu tazele, tekrar
   * dene" anlamina geliyor ve ortada tazelenecek jeton yok -- kayit akisi
   * sonsuz donguye girerdi.
   */
  const bozukKod = await cagir("/hesap/dogrula", {
    yontem: "POST",
    govde: { eposta: "yok@ornek.test", kod: "000000", cihaz: CIHAZ },
  });
  bozukKod.durum === 400 && bozukKod.cevap?.hata?.kod === "gecersiz_istek"
    ? ok("yanlis dogrulama kodu -> 400 gecersiz_istek (401 degil)")
    : bad(`yanlis kod: 400 bekleniyordu, ${bozukKod.durum} geldi`);

  const bozukSifirlama = await cagir("/hesap/parola-sifirla", {
    yontem: "POST",
    govde: {
      eposta: "yok@ornek.test",
      kod: "000000",
      yeniParola: "YeniParola-2026",
      yeniParolaTekrar: "YeniParola-2026",
    },
  });
  bozukSifirlama.durum === 400
    ? ok("yanlis kodla parola sifirlama -> 400")
    : bad(`yanlis kodla sifirlama: 400 bekleniyordu, ${bozukSifirlama.durum} geldi`);

  const epostasizKod = await cagir("/hesap/kod", { yontem: "POST", govde: {} });
  epostasizKod.durum === 400
    ? ok("e-postasiz kod istegi -> 400")
    : bad(`e-postasiz kod: 400 bekleniyordu, ${epostasizKod.durum} geldi`);
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
