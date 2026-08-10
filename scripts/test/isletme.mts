/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import {
  duzenleyebilirMi,
  isletmeSahibiMi,
  mutfakSahibiMi,
  rolAnaSayfasi,
} from "../../src/lib/oturum";
import type { Oturum } from "../../src/lib/oturum";
import { kasikAtabilirMi } from "../../src/lib/sef-kasigi";
import { mutfagiRestoranaCevir } from "../../src/lib/restoran-listesi";
import { BASVURU_TURLERI } from "../../src/lib/hesaplar";

/**
 * ISLETME ROLUNUN SINIRLARI.
 *
 * Yeni bir rol eklemenin asil riski yetki kontrollerinin YARISININ
 * guncellenmesi: isletme ya mutfak isini yapamaz (gelen siparisi goremez,
 * "hazir" diyemez) ya da yapmamasi gereken seye erisir (Altin Sef unvani,
 * Sef Kasigi). Ikisi de sessizce olur, kimse fark etmez.
 *
 * Bu test o cizgiyi kayit altina aliyor:
 *   MUTFAK ISI   -> isletme DAHIL
 *   BIREYSEL TAKDIR -> yalnizca sef
 *
 * Hepsi saf fonksiyon; sunucu da veritabani da gerekmiyor.
 */
const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (n: number, m: string) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n: number, m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${String(n).padStart(2)}. ${m}`);
};

let no = 0;
const oturum = (
  rol: Oturum["rol"],
  slug?: string,
  yetki?: Oturum["isletmeYetkisi"],
): Oturum =>
  ({ rol, eposta: "t@t.test", ad: "Test", restoranSlug: slug, isletmeYetkisi: yetki }) as Oturum;

/* ════════════ 1. MUTFAK ISI — ISLETME DAHIL ════════════ */
mutfakSahibiMi("isletme") === true
  ? ok((no += 1), "isletme mutfak sahibi sayiliyor")
  : bad((no += 1), "isletme mutfak sahibi sayilmiyor — gelen siparisleri goremez");

mutfakSahibiMi("sef") === true
  ? ok((no += 1), "sef mutfak sahibi sayiliyor")
  : bad((no += 1), "sef mutfak sahibi sayilmiyor");

mutfakSahibiMi("kurye") === false && mutfakSahibiMi("musteri") === false
  ? ok((no += 1), "kurye ve musteri mutfak sahibi degil")
  : bad((no += 1), "kurye/musteri mutfak yetkisi kazanmis");

duzenleyebilirMi(oturum("isletme", "lezzet-restoran"), "lezzet-restoran") === true
  ? ok((no += 1), "isletme KENDI profilini duzenleyebiliyor")
  : bad((no += 1), "isletme kendi profilini duzenleyemiyor");

/*
 * ASIL KONTROL: baskasinin mutfagina dokunamamak. Slug karsilastirmasi
 * dusseydi her isletme butun mutfaklarin profilini duzenleyebilirdi.
 */
duzenleyebilirMi(oturum("isletme", "lezzet-restoran"), "baska-mutfak") === false
  ? ok((no += 1), "isletme BASKASININ profilini duzenleyemiyor")
  : bad((no += 1), "isletme baska mutfagin profiline erisiyor");

duzenleyebilirMi(oturum("isletme"), "lezzet-restoran") === false
  ? ok((no += 1), "mutfagi olmayan isletme profil duzenleyemiyor")
  : bad((no += 1), "mutfaksiz isletme profil duzenleyebiliyor");

/* ════════════ 2. BIREYSEL TAKDIR — ISLETMEYE KAPALI ════════════ */
/*
 * Bir kuruma "Altin Sef" unvani vermek unvanin anlamini bosaltirdi; Sef
 * Kasigi da seflerin KENDI ARALARINDAKI takdiri.
 */
{
  const sonuc = kasikAtabilirMi({
    rol: "isletme",
    kendiSlug: "lezzet-restoran",
    altinSef: true,
    hedefSlug: "baska-mutfak",
  });
  sonuc.olur === false && sonuc.sebep === "kasik.yalnizcaSef"
    ? ok((no += 1), "isletme Altin Sef olsa bile kasik atamiyor")
    : bad((no += 1), `isletme kasik atabiliyor: ${JSON.stringify(sonuc)}`);
}

{
  const sonuc = kasikAtabilirMi({
    rol: "sef",
    kendiSlug: "sef-mutfagi",
    altinSef: true,
    hedefSlug: "baska-mutfak",
  });
  sonuc.olur === true
    ? ok((no += 1), "Altin Sef unvanli sef kasik atabiliyor (yol bozulmamis)")
    : bad((no += 1), `sef kasik atamiyor: ${JSON.stringify(sonuc)}`);
}

/* ════════════ 3. GIRIS YONLENDIRMESI ════════════ */
rolAnaSayfasi("isletme") === "/isletme"
  ? ok((no += 1), "isletme kendi paneline yonlendiriliyor")
  : bad((no += 1), `isletme yanlis yere gidiyor: ${rolAnaSayfasi("isletme")}`);

rolAnaSayfasi("sef") === "/panel" && rolAnaSayfasi("kurye") === "/panel"
  ? ok((no += 1), "sef ve kurye /panel'de kaliyor")
  : bad((no += 1), "mevcut rollerin yonlendirmesi bozulmus");

rolAnaSayfasi("admin") === "/admin" && rolAnaSayfasi("musteri") === "/hesabim"
  ? ok((no += 1), "admin ve musteri yonlendirmesi bozulmamis")
  : bad((no += 1), "admin/musteri yonlendirmesi bozulmus");

/* ════════════ 4. BASVURU TURU ════════════ */
BASVURU_TURLERI.some((t) => t.deger === "isletme")
  ? ok((no += 1), "isletme basvuru turu listede")
  : bad((no += 1), "isletme basvurusu yapilamiyor");

/* ════════════ 5. LISTELERDE ISLETME BIREYSEL SAYILMIYOR ════════════ */
/*
 * `evSefi` ve `sefTuru` "Seflerin Elinden" ve "Ayin Hanimlari" bolumlerinin
 * suzgeci. Isletme oralara girseydi kurumsal bir restoran ev hanimi listesinde
 * gorunurdu.
 */
{
  const temel = { semt: "Beylikduzu", sahipEposta: "t@t.test", olusturmaTarihi: "2026-01-01" };
  const r = mutfagiRestoranaCevir({ slug: "lezzet", ad: "Lezzet", sefTuru: "isletme", ...temel });
  r.evSefi === false && r.sefTuru === undefined
    ? ok((no += 1), "isletme ev sefi listelerine girmiyor")
    : bad((no += 1), `isletme bireysel sayiliyor: evSefi=${r.evSefi} sefTuru=${r.sefTuru}`);

  const h = mutfagiRestoranaCevir({ slug: "gonul", ad: "Gonul", sefTuru: "ev-hanimi", ...temel });
  h.evSefi === true && h.sefTuru === "ev-hanimi"
    ? ok((no += 1), "ev hanimi listelerdeki yerini koruyor")
    : bad((no += 1), "ev hanimi listeden dusmus");
}

/* ════════════ 6. CALISAN vs SAHIP ════════════ */
/*
 * Cok kullanicili isletmenin asil riski: kasadaki kisinin fiyat
 * degistirebilmesi, calisma saatlerini kaydirabilmesi ya da ciroyu gormesi.
 * `duzenleyebilirMi` urun, fiyat, profil ve yorum yanitlarinin ORTAK kapisi —
 * calisan oradan gecerse dordu birden acilir.
 */
{
  const sahip = oturum("isletme", "lezzet", "sahip");
  const calisan = oturum("isletme", "lezzet", "calisan");

  isletmeSahibiMi(sahip) === true
    ? ok((no += 1), "sahip yetkisi taniniyor")
    : bad((no += 1), "sahip yetkisi taninmiyor");

  isletmeSahibiMi(calisan) === false
    ? ok((no += 1), "calisan sahip sayilmiyor")
    : bad((no += 1), "calisan sahip sayiliyor — fiyatlara ve ciroya erisir");

  /*
   * YETKISI BOS OLAN ISLETME SAHIP SAYILMALI: alan sonradan eklendi, mevcut
   * butun isletme hesaplarinda bos. Varsayilan "calisan" olsaydi hepsi kendi
   * panelinden kilitlenirdi.
   */
  isletmeSahibiMi(oturum("isletme", "lezzet")) === true
    ? ok((no += 1), "yetkisi bos eski isletme hesabi sahip sayiliyor")
    : bad((no += 1), "eski isletme hesaplari kendi panelinden kilitlenmis");

  duzenleyebilirMi(sahip, "lezzet") === true
    ? ok((no += 1), "sahip urun/fiyat/profil kapisindan geciyor")
    : bad((no += 1), "sahip kendi mutfagini duzenleyemiyor");

  duzenleyebilirMi(calisan, "lezzet") === false
    ? ok((no += 1), "calisan urun/fiyat/profil kapisindan GECEMIYOR")
    : bad((no += 1), "calisan fiyat degistirebiliyor — ortak kapi acik kalmis");

  /* Sef hesaplarinda bu alan hic kullanilmiyor; yolu bozmamis olmali. */
  duzenleyebilirMi(oturum("sef", "sef-mutfagi"), "sef-mutfagi") === true
    ? ok((no += 1), "sef yolu bozulmamis")
    : bad((no += 1), "sef kendi mutfagini duzenleyemez olmus");

  isletmeSahibiMi(oturum("kurye")) === false && isletmeSahibiMi(null) === false
    ? ok((no += 1), "kurye ve oturumsuz ziyaretci sahip sayilmiyor")
    : bad((no += 1), "isletme disindan sahip yetkisi sizmis");

  isletmeSahibiMi(oturum("admin")) === true
    ? ok((no += 1), "yonetici sahip yetkisiyle isliyor")
    : bad((no += 1), "yonetici isletme ekranlarini yonetemiyor");
}

console.log(cikti.join("\n"));
console.log("\n" + (hatalar.length === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${hatalar.length} SORUN`));
process.exit(hatalar.length === 0 ? 0 : 1);
