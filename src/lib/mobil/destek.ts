import crypto from "node:crypto";

import { site } from "@/content/site";
import { hesapDepoAl } from "../hesaplar";
import type { DestekTalebi } from "../hesaplar/tipler";
import { destekTalebiBildir } from "../yonetici-bildirim";

import type { DestekDto, DestekGirdisi, DestekTalebiDto } from "./tipler";

/**
 * KURYE DESTEĞİ — sahadaki kuryenin yetkiliye ulaşma yolu.
 *
 * NEDEN AYRI DEĞİL, AYNI DEPO: talepler yöneticinin zaten baktığı listeye
 * düşüyor (bkz. app/admin/destek). Kuryeye ayrı bir kutu açılsaydı, yönetici
 * iki ayrı ekranı gezmek zorunda kalır ve er ya da geç birine bakmayı
 * unuturdu — kuryenin mesajı da orada beklerdi.
 *
 * SAHİPLİK E-POSTAYLA: talepte kuryenin kimliği zaten yazıyor; listeleme
 * yalnızca kendi adresine ait olanları döndürüyor. Başkasının talebini
 * numarayla çekmenin yolu yok.
 */

/** DT-260801-4821 — telefonda kolayca okunabilen kısa numara. */
function talepNoUret(): string {
  const t = new Date();
  const g = `${String(t.getFullYear()).slice(2)}${String(t.getMonth() + 1).padStart(2, "0")}${String(
    t.getDate(),
  ).padStart(2, "0")}`;
  return `DT-${g}-${crypto.randomInt(1000, 9999)}`;
}

function dtoyaCevir(t: DestekTalebi): DestekTalebiDto {
  return {
    no: t.no,
    konu: t.konu,
    mesaj: t.mesaj,
    durum: t.durum,
    yanit: t.yanit ?? null,
    olusturmaTarihi: t.olusturmaTarihi,
    guncellemeTarihi: t.guncellemeTarihi,
  };
}

const kendi = (t: DestekTalebi, eposta: string) =>
  t.eposta.trim().toLowerCase() === eposta.trim().toLowerCase();

/**
 * Kuryenin destek ekranı.
 *
 * Depo susarsa BOŞ LİSTE dönüyor ama telefon yine geliyor: destek ekranının
 * asıl işi yetkiliye ulaştırmak ve tam da her şeyin bozuk olduğu anda
 * "yüklenemedi" diye boş bir ekran göstermek en kötü sonuç olurdu.
 */
export async function kuryeDestegi(eposta: string): Promise<DestekDto> {
  let talepler: DestekTalebiDto[] = [];
  try {
    const hepsi = await (await hesapDepoAl()).destekListele();
    talepler = hepsi
      .filter((t) => kendi(t, eposta))
      .sort((a, b) => b.olusturmaTarihi.localeCompare(a.olusturmaTarihi))
      .slice(0, 30)
      .map(dtoyaCevir);
  } catch {
    /* sessiz — telefon yine dönüyor */
  }
  return { telefon: site.telefon, talepler };
}

export type TalepSonucu = { tamam: true; veri: DestekDto } | { tamam: false; sebep: string };

/** Yeni talep açar ve listenin güncel hâlini döndürür. */
export async function kuryeDestekAc(
  kurye: { eposta: string; ad: string },
  girdi: DestekGirdisi,
): Promise<TalepSonucu> {
  const konu = String(girdi.konu ?? "").trim().slice(0, 120) || "Kurye desteği";
  const mesaj = String(girdi.mesaj ?? "").trim().slice(0, 2000);
  const siparisNo = String(girdi.siparisNo ?? "").trim().slice(0, 40);

  /*
   * En az 10 karakter — web formundaki kuralın aynısı. "Yardım" diye tek
   * kelimelik bir talep, yöneticinin geri dönüp sormasından başka bir şey
   * üretmiyor ve kurye o sırada yolda oluyor.
   */
  if (mesaj.length < 10) {
    return { tamam: false, sebep: "Sorunu biraz daha açar mısın? En az 10 karakter yaz." };
  }

  const simdi = new Date().toISOString();
  const talep: DestekTalebi = {
    id: crypto.randomUUID(),
    no: talepNoUret(),
    konu,
    mesaj,
    siparisNo: siparisNo || undefined,
    ad: kurye.ad,
    eposta: kurye.eposta,
    durum: "acik",
    olusturmaTarihi: simdi,
    guncellemeTarihi: simdi,
  };

  try {
    await (await hesapDepoAl()).destekEkle(talep);
  } catch {
    return { tamam: false, sebep: "Talep kaydedilemedi. Acilse yetkiliyi ara." };
  }

  /* Yöneticiye anlık posta — kurye sahada, cevabı beklemesin. */
  destekTalebiBildir(talep);

  return { tamam: true, veri: await kuryeDestegi(kurye.eposta) };
}
