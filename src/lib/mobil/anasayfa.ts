import {
  gunleriYaz,
  kampanyaBugunGecerliMi,
  kampanyalar as kampanyaListesi,
} from "@/content/kampanyalar";
import { TESLIMAT_SURESI } from "@/content/restoranlar";
import { anketSonuclari } from "@/app/anket-actions";
import { sozluk } from "../sozluk";
import { restoranListesi } from "./katalog";
import type { AdimDto, AnasayfaDto, AnketDto, KampanyaDto, SoruCevapDto } from "./tipler";

/**
 * KEŞFET EKRANININ ÜST BÖLÜMÜ — web ana sayfasının uygulamadaki karşılığı.
 *
 * METİNLER SÖZLÜKTEN, kampanyalar içerik dosyasından, mutfaklar katalogdan:
 * hiçbiri uygulamanın içine kopyalanmıyor. Kopyalansaydı web'de düzeltilen
 * bir cümle uygulamada eski hâliyle kalır ve bunu ancak iki ekranı yan yana
 * koyan biri fark ederdi.
 *
 * DİL: cevap şimdilik yalnızca Türkçe — uygulamanın ekranları da öyle
 * (bkz. lib/mobil/katalog.ts, aynı not).
 */
const tr = (anahtar: string) => sozluk[anahtar]?.tr ?? anahtar;

/** Web ana sayfasında da dört adım var; başlık ve metin aynı anahtarlardan. */
function adimlar(): AdimDto[] {
  return [1, 2, 3, 4].map((n) => ({
    baslik: tr(`nasil.adim${n}`),
    metin: tr(`nasil.adim${n}Metin`),
  }));
}

/**
 * Sıkça sorulan sorular.
 *
 * SAYI SÖZLÜKTEN OKUNUYOR, sabit değil: web'e sekizinci soru eklendiğinde
 * uygulamada da kendiliğinden görünsün. Sabit bir 7 yazılsaydı yeni soru
 * yalnızca sitede kalır, kimse fark etmezdi.
 */
function sikSorulanlar(): SoruCevapDto[] {
  const liste: SoruCevapDto[] = [];
  for (let n = 1; sozluk[`sss.s${n}`]; n += 1) {
    liste.push({ soru: tr(`sss.s${n}`), cevap: tr(`sss.c${n}`) });
  }
  return liste;
}

function kampanyalar(): KampanyaDto[] {
  return kampanyaListesi.map((k): KampanyaDto => {
    const gunKisiti = k.gecerliGunler && k.gecerliGunler.length > 0;
    return {
      slug: k.slug,
      baslik: k.baslik,
      aciklama: k.aciklama,
      vurgu: k.vurgu,
      ton: k.ton,
      ...(k.kod ? { kod: k.kod } : {}),
      ...(gunKisiti ? { gunler: gunleriYaz(k.gecerliGunler ?? []) } : {}),
      bugunGecerli: kampanyaBugunGecerliMi(k),
    };
  });
}

/**
 * Yayındaki anket.
 *
 * Depo susarsa anket YOK sayılıyor ve ekran onsuz çiziliyor: bir anket
 * uğruna açılış ekranının hiç gelmemesi kabul edilebilir bir takas değil.
 */
async function anket(): Promise<AnketDto | null> {
  try {
    const sonuclar = await anketSonuclari();
    const ilk = sonuclar[0];
    if (!ilk) return null;
    return {
      id: ilk.anketId,
      soru: ilk.soru,
      secenekler: ilk.dagilim.map((d) => ({ id: d.id, etiket: d.etiket, oy: d.adet })),
      toplamOy: ilk.toplam,
    };
  } catch {
    return null;
  }
}

export async function anasayfaVerisi(): Promise<AnasayfaDto> {
  const [liste, yayindakiAnket] = await Promise.all([restoranListesi({}), anket()]);

  const puanlilar = liste.filter((r) => r.puan > 0);
  const ortalamaPuan =
    puanlilar.length > 0
      ? Math.round((puanlilar.reduce((t, r) => t + r.puan, 0) / puanlilar.length) * 10) / 10
      : 0;

  /*
   * ÖNE ÇIKANLAR ve AYIN HANIMLARI aynı listeden süzülüyor — ikisi için ayrı
   * sorgu açmak, aynı veriyi iki kez okumak olurdu. Sıralama puana göre;
   * eşitlikte yorum sayısı ayırıyor (10 yorumla 4,8 ile tek yorumla 4,8 aynı
   * güveni vermiyor).
   */
  const enIyiler = [...liste].sort(
    (a, b) => b.puan - a.puan || b.yorumSayisi - a.yorumSayisi,
  );

  return {
    istatistik: {
      mutfakSayisi: liste.length,
      ortalamaPuan,
      teslimatSuresi: `${TESLIMAT_SURESI[0]}-${TESLIMAT_SURESI[1]} dk`,
    },
    kampanyalar: kampanyalar(),
    oneCikanlar: enIyiler.slice(0, 6),
    ayinHanimlari: enIyiler.filter((r) => r.sefTuru !== "isletme").slice(0, 3),
    nasilCalisir: adimlar(),
    sss: sikSorulanlar(),
    anket: yayindakiAnket,
  };
}
