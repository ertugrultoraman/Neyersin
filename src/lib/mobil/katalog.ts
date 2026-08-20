import { kategoriler, kategoriSayisi } from "@/content/kategoriler";
import type { Restoran } from "@/content/restoranlar";
import { acikMi } from "../calisma-saatleri";
import { saatleriAl, saatleriTopluAl } from "../calisma-saatleri-depo";
import { sefProfiliCoz } from "../hesaplar";
import { gorselCoz } from "../images";
import { mutfakMenusu } from "../mutfak-menusu";
import { restoranCoz, tumRestoranlar } from "../restoran-listesi";
import { BASAMAKLAR } from "../sef-rozetleri";
import { sozluk } from "../sozluk";
import { restoranYorumlari } from "../yorum-ozeti";
import type {
  KategoriDto,
  MenuBolumuDto,
  RestoranDetayDto,
  RestoranOzetDto,
  UrunDto,
  YorumDto,
} from "./tipler";

/** Detay cevabında taşınan en fazla yorum sayısı. */
const YORUM_SINIRI = 30;

/**
 * KATALOG — domain kayıtlarını mobil sözleşmesine çeviren tek yer.
 *
 * Uçların kendisi (app/api/mobil/v1/katalog/…) yalnızca istek çözümleyip
 * burayı çağırıyor. Ayrım şundan: liste ucu ile detay ucu AYNI özet gövdeyi
 * dönüyor (`RestoranDetayDto`, `RestoranOzetDto`'yu genişletiyor). İki uçta
 * ayrı ayrı kurulsaydı, biri "açık mı" hesabını düzeltip diğeri unuttuğunda
 * kullanıcı listede açık görünen bir mutfağın detayında kapalı yazısı görürdü.
 *
 * DİL: cevaplar şimdilik yalnızca TÜRKÇE. Web iki dilli ama uygulamanın
 * ekranları henüz tek dilde yazıldı; `?dil=` desteği eklenecekse ürün adları
 * (`adEn`), bölüm açıklamaları (`aciklamaEn`) ve rozet adları BİRLİKTE
 * çevrilmeli — yarısı çevrilmiş bir cevap hiç çevirmemekten kötü.
 */

/** Rozet adları sözlükten okunuyor; ekranda görünen metnin tek kaynağı orası. */
const trMetin = (anahtar: string) => sozluk[anahtar]?.tr ?? anahtar;

/**
 * Mutfağın kapak görseli.
 *
 * Manifestte kaydı yoksa `undefined` dönüyor ve uygulama kendi marka yer
 * tutucusunu çiziyor (web'de `RestoranKapak` aynısını yapıyor). Buraya bir
 * yer tutucu ADRESİ koymak, ağdan indirilen boş bir kutu demek olurdu.
 */
function kapakUrl(slug: string): string | undefined {
  const gorsel = gorselCoz(`restoran/${slug}`, { oran: "16/9" });
  return gorsel.tur === "uzak" ? gorsel.src : undefined;
}

/**
 * Şef şapkası rozeti. `sefRozeti` alanını `tumRestoranlar()` çalışma anında
 * dolduruyor (ilk üç satış), bu yüzden burada ek sorgu gerekmiyor.
 */
function rozetler(r: Restoran): string[] {
  return r.sefRozeti ? [trMetin(BASAMAKLAR[r.sefRozeti.basamak].adAnahtari)] : [];
}

function ozet(r: Restoran, acik: boolean): RestoranOzetDto {
  return {
    slug: r.slug,
    ad: r.ad,
    /*
     * Web kartı da mutfakları " • " ile birleştirip tek satırda gösteriyor
     * (bkz. components/anasayfa/RestoranKarti.tsx). Yalnızca ilki gönderilseydi
     * "Ev Yemekleri • Ev Yapımı" olan mutfak uygulamada yarım görünürdü.
     */
    mutfak: r.mutfaklar.join(" • "),
    semt: r.semt,
    puan: r.puan,
    yorumSayisi: r.yorum,
    teslimatSuresi: `${r.sureDk[0]}-${r.sureDk[1]} dk`,
    teslimatUcreti: r.teslimatUcreti,
    minSepet: r.minSepet,
    ...(kapakUrl(r.slug) ? { gorselUrl: kapakUrl(r.slug) } : {}),
    acik,
    rozetler: rozetler(r),
    sefTuru: r.evSefi ? r.sefTuru : "isletme",
  };
}

/* --------------------------------------------------------------------------
 * Liste
 * ----------------------------------------------------------------------- */

export type ListeSuzgeci = {
  /** `content/kategoriler.ts` slug'ı. Tanınmayan değer BOŞ liste döndürüyor. */
  kategori?: string;
  /** Ad, mutfak ve semt üzerinde geçen arama. */
  ara?: string;
  tur?: "sef" | "isletme";
};

/** Türkçe'ye duyarlı karşılaştırma — "İZMİR" ile "izmir" eşleşmeli. */
const kucult = (metin: string) => metin.toLocaleLowerCase("tr");

export async function restoranListesi(suzgec: ListeSuzgeci): Promise<RestoranOzetDto[]> {
  let liste = await tumRestoranlar();

  if (suzgec.kategori) {
    const kategori = kategoriler.find((k) => k.slug === suzgec.kategori);
    /*
     * Tanınmayan kategori BOŞ liste döndürüyor, tüm listeyi değil. Süzgeci
     * sessizce yok saymak, uygulamada yanlış yazılmış bir bağlantının "her şeyi
     * gösteren bir kategori" gibi görünmesine yol açardı.
     */
    liste = kategori
      ? liste.filter((r) => r.mutfaklar.some((m) => kategori.mutfaklar.includes(m)))
      : [];
  }

  if (suzgec.tur) {
    const sefMi = suzgec.tur === "sef";
    liste = liste.filter((r) => Boolean(r.evSefi) === sefMi);
  }

  const aranan = kucult(suzgec.ara?.trim() ?? "");
  if (aranan) {
    liste = liste.filter((r) =>
      [r.ad, r.semt, ...r.mutfaklar, ...r.etiketler].some((alan) =>
        kucult(alan).includes(aranan),
      ),
    );
  }

  /* Tek sorguda: bkz. saatleriTopluAl — döngüde okumak havuzu tıkıyordu. */
  const saatler = await saatleriTopluAl(liste.map((r) => r.slug));
  const simdi = new Date();

  return liste.map((r) => ozet(r, acikMi(saatler.get(r.slug) ?? null, simdi).acik));
}

/* --------------------------------------------------------------------------
 * Detay
 * ----------------------------------------------------------------------- */

/** Bölüm başlığından kararlı bir kimlik — liste anahtarı ve derin bağlantı için. */
function bolumKimligi(baslik: string): string {
  return (
    kucult(baslik)
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "bolum"
  );
}

export async function restoranDetayi(slug: string): Promise<RestoranDetayDto | null> {
  const restoran = await restoranCoz(slug);
  if (!restoran) return null;

  /*
   * Dördü birbirinden bağımsız; sırayla beklenirse detay ekranı en yavaş
   * sorgunun değil, dördünün TOPLAMI kadar gecikirdi.
   */
  const [menu, yorumlar, profil, saatler] = await Promise.all([
    mutfakMenusu(slug),
    restoranYorumlari(slug),
    sefProfiliCoz(slug),
    saatleriAl(slug),
  ]);

  const bolumler: MenuBolumuDto[] = menu.map((bolum) => {
    const id = bolumKimligi(bolum.ad);
    return {
      id,
      baslik: bolum.ad,
      urunler: bolum.urunler.map(
        (u): UrunDto => ({
          id: u.id,
          ad: u.ad,
          aciklama: u.aciklama,
          /*
           * Taslak ürünün fiyatı 0 gidiyor. Sözleşme "0 → sepete eklenemez"
           * diyor; gerçek fiyatı gönderip ayrıca bir bayrak taşımak, bayrağı
           * okumayan bir ekranda ürünü satılabilir gösterirdi.
           */
          fiyat: u.taslak ? 0 : u.fiyat,
          ...(u.birim ? { birim: u.birim } : {}),
          ...(u.gorselUrl ? { gorselUrl: u.gorselUrl } : {}),
          bolum: id,
          /*
           * Ekstralar taslak üründe de gönderiliyor: ürün zaten sepete
           * eklenemiyor, ama menüde "yanında ne var" bilgisi görünür kalıyor.
           */
          ...(u.ekstralar && u.ekstralar.length > 0
            ? {
                ekstralar: u.ekstralar.map((e) => ({
                  id: e.id,
                  ad: e.ad,
                  fiyat: e.fiyat,
                  ...(e.tur ? { tur: e.tur } : {}),
                })),
              }
            : {}),
        }),
      ),
    };
  });

  const altinSefRozeti = profil.altinSef ? [trMetin("kasik.altinSef")] : [];

  return {
    ...ozet(restoran, acikMi(saatler).acik),
    rozetler: [...rozetler(restoran), ...altinSefRozeti],
    ...(profil.biyografi ? { hikaye: profil.biyografi } : {}),
    ...(profil.uzmanlik ? { uzmanlik: profil.uzmanlik } : {}),
    ...(profil.slogan ? { slogan: profil.slogan } : {}),
    ...(profil.sertifikalar ? { sertifikalar: profil.sertifikalar } : {}),
    /*
     * KİŞİSEL ALANLAR — web'deki mutfak sayfasında ne varsa uygulamada da o.
     * Boş olanlar hiç GÖNDERİLMİYOR (alan atlanıyor): `undefined` bir alanı
     * cevaba koymak, uygulamanın "var ama boş" ile "yok" arasında ayrım
     * yapmasını gerektirirdi.
     */
    ...(profil.deneyimYili ? { deneyimYili: profil.deneyimYili } : {}),
    ...(profil.memleket ? { memleket: profil.memleket } : {}),
    ...(profil.imzaYemegi ? { imzaYemegi: profil.imzaYemegi } : {}),
    ...(profil.galeri && profil.galeri.length > 0 ? { galeri: profil.galeri } : {}),
    teslimatBolgeleri: restoran.teslimat,
    menu: bolumler,
    yorumOzeti: yorumlar.ozet,
    /*
     * YORUMLAR: en yenisi başta, en fazla YORUM_SINIRI tane. Tamamı
     * gönderilseydi çok yorum almış bir mutfağın detay cevabı yüzlerce
     * kayıtla şişer, telefon ilk ekranı çizmek için hepsini beklerdi.
     * Müşteri e-postası HİÇ gönderilmiyor — yorum herkese açık, adres değil.
     */
    yorumlar: [...yorumlar.yorumlar]
      .sort((a, b) => b.tarih.localeCompare(a.tarih))
      .slice(0, YORUM_SINIRI)
      .map(
        (y): YorumDto => ({
          id: y.id,
          musteriAdi: y.musteriAdi,
          sicaklik: y.sicaklik,
          teslimatHizi: y.teslimatHizi,
          tad: y.tad,
          ...(y.metin?.trim() ? { metin: y.metin.trim() } : {}),
          ...(y.yanit?.trim() ? { yanit: y.yanit.trim() } : {}),
          tarih: y.tarih,
        }),
      ),
  };
}

/* --------------------------------------------------------------------------
 * Kategoriler
 * ----------------------------------------------------------------------- */

/**
 * Kategori rayı.
 *
 * Boş kategoriler LİSTEDE KALIYOR, `adet: 0` ile. Uygulama onları "yakında"
 * diye gösteriyor — web'in yaptığının aynısı (bkz. kategoriNotuParcalari).
 * Gizlenselerdi ray platform büyüdükçe habersiz değişir, kullanıcı dün
 * gördüğü sekmeyi bugün bulamazdı.
 */
export function kategoriListesi(): KategoriDto[] {
  return kategoriler.map((k) => ({
    slug: k.slug,
    ad: k.ad,
    ikon: k.ikon,
    adet: kategoriSayisi(k),
  }));
}
