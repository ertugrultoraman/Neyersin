import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Siparis, SiparisDurumu } from "../siparis";
import {
  epostaEsit,
  filtreUygula,
  gecerliSiparisler,
  ozetHesapla,
  type KayitliSiparis,
  type Ozet,
  type SiparisDepo,
  type SiparisFiltresi,
} from "./tipler";

/**
 * Dosya tabanlı sipariş deposu.
 *
 * Nerede çalışır: yerel geliştirme, VPS, Docker, kalıcı diski olan her Node
 * sunucusu.
 * Nerede ÇALIŞMAZ: Vercel ve benzeri serverless platformlar — dosya sistemi
 * salt-okunur ve geçicidir. Orada DATABASE_URL tanımlayıp Postgres adaptörü
 * kullanılmalı (bkz. depo/postgres.ts).
 */
const KLASOR = process.env.VERI_KLASORU ?? ".veri";
const DOSYA = path.join(process.cwd(), KLASOR, "siparisler.json");

type Icerik = { surum: 1; siparisler: KayitliSiparis[] };

/** Eşzamanlı yazmaların birbirini ezmemesi için basit bir yazma kuyruğu. */
let kuyruk: Promise<unknown> = Promise.resolve();
function siraya<T>(is: () => Promise<T>): Promise<T> {
  const sonuc = kuyruk.then(is, is);
  kuyruk = sonuc.catch(() => {});
  return sonuc;
}

async function oku(): Promise<Icerik> {
  try {
    const metin = await readFile(DOSYA, "utf8");
    const cozulen = JSON.parse(metin) as Icerik;
    if (Array.isArray(cozulen?.siparisler)) return cozulen;
  } catch {
    // dosya yok veya bozuk — boş içerikle devam
  }
  return { surum: 1, siparisler: [] };
}

async function yaz(icerik: Icerik): Promise<void> {
  await mkdir(path.dirname(DOSYA), { recursive: true });
  // Atomik yazma: geçici dosyaya yaz, sonra taşı. Yarıda kesilme dosyayı bozmaz.
  const gecici = `${DOSYA}.${process.pid}.tmp`;
  await writeFile(gecici, `${JSON.stringify(icerik, null, 2)}\n`, "utf8");
  await rename(gecici, DOSYA);
}

export const dosyaDepo: SiparisDepo = {
  ad: "dosya",
  kalici: false,

  async hazirla() {
    await mkdir(path.dirname(DOSYA), { recursive: true });
  },

  async ekle(siparis: Siparis) {
    await siraya(async () => {
      const icerik = await oku();
      const simdi = new Date().toISOString();
      const kayit: KayitliSiparis = { ...siparis, guncellemeTarihi: simdi };
      // Aynı sipariş no varsa üzerine yaz (idempotent)
      const index = icerik.siparisler.findIndex((s) => s.siparisNo === siparis.siparisNo);
      if (index >= 0) icerik.siparisler[index] = kayit;
      else icerik.siparisler.push(kayit);
      await yaz(icerik);
    });
  },

  async durumGuncelle(siparisNo, durum: SiparisDurumu, ek) {
    await siraya(async () => {
      const icerik = await oku();
      const kayit = icerik.siparisler.find((s) => s.siparisNo === siparisNo);
      if (!kayit) return;
      kayit.durum = durum;
      kayit.guncellemeTarihi = new Date().toISOString();
      if (ek?.saglayiciOdemeId) kayit.saglayiciOdemeId = ek.saglayiciOdemeId;
      if (ek?.odenenTutar) kayit.odenenTutar = ek.odenenTutar;
      if (ek?.odemeMesaji) kayit.odemeMesaji = ek.odemeMesaji;
      await yaz(icerik);
    });
  },

  async atamaGuncelle(siparisNo, atama) {
    await siraya(async () => {
      const icerik = await oku();
      const kayit = icerik.siparisler.find((s) => s.siparisNo === siparisNo);
      if (!kayit) return;
      if (atama.atananSef !== undefined) {
        kayit.atananSef = atama.atananSef ?? undefined;
      }
      if (atama.atananKurye !== undefined) {
        kayit.atananKurye = atama.atananKurye ?? undefined;
      }
      kayit.guncellemeTarihi = new Date().toISOString();
      await yaz(icerik);
    });
  },

  async listele(filtre?: SiparisFiltresi) {
    const icerik = await oku();
    return filtreUygula(icerik.siparisler, filtre);
  },

  async bul(siparisNo: string) {
    const icerik = await oku();
    return icerik.siparisler.find((s) => s.siparisNo === siparisNo) ?? null;
  },

  async ozet(): Promise<Ozet> {
    const icerik = await oku();
    return ozetHesapla(icerik.siparisler);
  },

  async epostaSiparisSayisi(eposta: string) {
    const icerik = await oku();
    return gecerliSiparisler(icerik.siparisler).filter((s) =>
      epostaEsit(s.musteri?.eposta, eposta),
    ).length;
  },

  async kuponKullanildiMi(eposta: string, kod: string) {
    const icerik = await oku();
    const aranan = kod.trim().toLocaleUpperCase("tr-TR");
    return gecerliSiparisler(icerik.siparisler).some(
      (s) =>
        epostaEsit(s.musteri?.eposta, eposta) &&
        (s.tutarlar?.kuponKodu ?? "").toLocaleUpperCase("tr-TR") === aranan,
    );
  },
};
