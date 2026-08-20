import { basvuruTuruEtiketi, hesapDepoAl } from "../hesaplar";
import { depoAl } from "../depo";
import { restoranCoz } from "../restoran-listesi";
import { tamamlandiMi } from "../siparis";
import type {
  YonetimBasvurusuDto,
  YonetimDestekDto,
  YonetimFiyatTalebiDto,
  YonetimOzetiDto,
} from "./tipler";

/**
 * YÖNETİM — yöneticinin telefondaki ekranı.
 *
 * Web'deki /admin çok geniş (hesaplar, günlük, rozetler, kategoriler,
 * vardiyalar, anketler…). Buraya yalnızca SAHADA GEREKENİ alıyoruz: bekleyen
 * başvurular, fiyat onayları, destek talepleri ve günün durumu. Hepsi
 * "birinin karar vermesini bekleyen" işler — telefonda açılan bir yönetim
 * ekranının tek işi bu.
 *
 * Kararların KENDİSİ web'le aynı çekirdekten geçiyor (basvuruOnayla,
 * basvuruReddet, urunKaydet); burada yalnızca listeleme ve dönüştürme var.
 */

/**
 * İstanbul saatiyle bir tarihin günü (YYYY-MM-DD).
 *
 * BOZUK TARİH BOŞ DÖNÜYOR: `Intl.format` geçersiz bir tarihte istisna
 * fırlatıyor ve tek bir bozuk kayıt bütün yönetim ekranını çökertirdi.
 * Boş dizge hiçbir günle eşleşmiyor, o kayıt yalnızca bugünün sayımından
 * düşüyor.
 */
function bugunIstanbul(tarih = new Date()): string {
  if (Number.isNaN(tarih.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tarih);
}

export async function yonetimOzeti(): Promise<YonetimOzetiDto> {
  const [hesapDepo, siparisDepo] = await Promise.all([hesapDepoAl(), depoAl()]);

  const [basvurular, urunler, destekler, siparisler] = await Promise.all([
    hesapDepo.basvurulariListele("bekliyor"),
    hesapDepo.urunleriListele(),
    hesapDepo.destekListele("acik"),
    siparisDepo.listele({ limit: 300 }),
  ]);

  const bugun = bugunIstanbul();
  const bugunkuler = siparisler.filter(
    (s) => bugunIstanbul(new Date(s.olusturmaTarihi)) === bugun,
  );

  return {
    bekleyenBasvuru: basvurular.length,
    bekleyenFiyat: urunler.filter((u) => typeof u.bekleyenFiyat === "number").length,
    acikDestek: destekler.length,
    /* Açık sipariş = teslim edilmemiş ve iptal edilmemiş; hâlâ birinin işi. */
    acikSiparis: siparisler.filter(
      (s) => !tamamlandiMi(s.durum) && s.durum !== "iptal" && s.durum !== "odeme-basarisiz",
    ).length,
    bugunSiparis: bugunkuler.length,
    bugunCiro: bugunkuler
      .filter((s) => s.durum !== "iptal" && s.durum !== "odeme-basarisiz")
      .reduce((t, s) => t + s.tutarlar.toplam, 0),
  };
}

export async function bekleyenBasvurular(): Promise<YonetimBasvurusuDto[]> {
  const liste = await (await hesapDepoAl()).basvurulariListele("bekliyor");
  return liste
    .sort((a, b) => a.olusturmaTarihi.localeCompare(b.olusturmaTarihi))
    .map((b) => ({
      id: b.id,
      ad: b.ad,
      telefon: b.telefon,
      eposta: b.eposta,
      tur: b.tur,
      turAdi: basvuruTuruEtiketi(b.tur),
      ...(b.mesaj ? { mesaj: b.mesaj } : {}),
      olusturmaTarihi: b.olusturmaTarihi,
    }));
}

export async function bekleyenFiyatTalepleri(): Promise<YonetimFiyatTalebiDto[]> {
  const urunler = await (await hesapDepoAl()).urunleriListele();
  const bekleyenler = urunler.filter((u) => typeof u.bekleyenFiyat === "number");

  /*
   * Mutfak ADI tek tek çözülüyor ama liste kısa (onay bekleyen talepler) ve
   * `restoranCoz` kendi içinde önbellekli. Slug göstermek yöneticiye hangi
   * mutfağın istediğini söylemezdi.
   */
  return Promise.all(
    bekleyenler.map(async (u): Promise<YonetimFiyatTalebiDto> => {
      const restoran = await restoranCoz(u.restoranSlug);
      return {
        urunId: u.id,
        urunAdi: u.ad,
        restoranSlug: u.restoranSlug,
        restoranAdi: restoran?.ad ?? u.restoranSlug,
        mevcutFiyat: u.fiyat,
        istenenFiyat: u.bekleyenFiyat ?? 0,
        ...(u.bekleyenTarih ? { tarih: u.bekleyenTarih } : {}),
      };
    }),
  );
}

export async function destekTalepleri(): Promise<YonetimDestekDto[]> {
  const liste = await (await hesapDepoAl()).destekListele();
  return liste
    /* Açık talepler önce; içlerinde en yeni üstte. */
    .sort(
      (a, b) =>
        (a.durum === "acik" ? 0 : 1) - (b.durum === "acik" ? 0 : 1) ||
        b.olusturmaTarihi.localeCompare(a.olusturmaTarihi),
    )
    .map((t) => ({
      id: t.id,
      no: t.no,
      konu: t.konu,
      mesaj: t.mesaj,
      ad: t.ad,
      eposta: t.eposta,
      ...(t.telefon ? { telefon: t.telefon } : {}),
      ...(t.siparisNo ? { siparisNo: t.siparisNo } : {}),
      durum: t.durum,
      ...(t.yanit ? { yanit: t.yanit } : {}),
      olusturmaTarihi: t.olusturmaTarihi,
    }));
}
