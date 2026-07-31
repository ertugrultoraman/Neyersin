import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Hesap, HesapDepo, SefProfili } from "./tipler";

/**
 * Dosya tabanlı hesap deposu — yerel geliştirme içindir.
 * Vercel'de dosya sistemi geçici olduğu için orada Postgres adaptörü devreye
 * girer (bkz. hesaplar/index.ts).
 */
const KLASOR = process.env.VERI_KLASORU ?? ".veri";
const DOSYA = path.join(process.cwd(), KLASOR, "hesaplar.json");

type Icerik = { surum: 1; hesaplar: Hesap[]; profiller: SefProfili[] };

let kuyruk: Promise<unknown> = Promise.resolve();
function siraya<T>(is: () => Promise<T>): Promise<T> {
  const sonuc = kuyruk.then(is, is);
  kuyruk = sonuc.catch(() => {});
  return sonuc;
}

async function oku(): Promise<Icerik> {
  try {
    const cozulen = JSON.parse(await readFile(DOSYA, "utf8")) as Icerik;
    if (Array.isArray(cozulen?.hesaplar)) {
      return { surum: 1, hesaplar: cozulen.hesaplar, profiller: cozulen.profiller ?? [] };
    }
  } catch {
    // dosya yok veya bozuk — boş içerikle devam
  }
  return { surum: 1, hesaplar: [], profiller: [] };
}

async function yaz(icerik: Icerik): Promise<void> {
  await mkdir(path.dirname(DOSYA), { recursive: true });
  const gecici = `${DOSYA}.${process.pid}.tmp`;
  await writeFile(gecici, `${JSON.stringify(icerik, null, 2)}\n`, "utf8");
  await rename(gecici, DOSYA);
}

export const dosyaHesapDepo: HesapDepo = {
  ad: "dosya",
  kalici: false,

  async hazirla() {
    await mkdir(path.dirname(DOSYA), { recursive: true });
  },

  async hesapBul(eposta) {
    const icerik = await oku();
    const aranan = eposta.trim().toLowerCase();
    return icerik.hesaplar.find((h) => h.eposta === aranan) ?? null;
  },

  async hesapEkle(hesap) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.hesaplar.findIndex((h) => h.eposta === hesap.eposta);
      if (index >= 0) icerik.hesaplar[index] = hesap;
      else icerik.hesaplar.push(hesap);
      await yaz(icerik);
    });
  },

  async hesaplariListele() {
    return (await oku()).hesaplar;
  },

  async restoranSahibi(restoranSlug) {
    const icerik = await oku();
    return icerik.hesaplar.find((h) => h.restoranSlug === restoranSlug) ?? null;
  },

  async profilAl(restoranSlug) {
    const icerik = await oku();
    return icerik.profiller.find((p) => p.restoranSlug === restoranSlug) ?? null;
  },

  async profilleriListele() {
    return (await oku()).profiller;
  },

  async profilKaydet(profil) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.profiller.findIndex((p) => p.restoranSlug === profil.restoranSlug);
      if (index >= 0) icerik.profiller[index] = profil;
      else icerik.profiller.push(profil);
      await yaz(icerik);
    });
  },
};
