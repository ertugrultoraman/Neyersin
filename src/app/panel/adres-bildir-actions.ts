"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import { epostaGonder } from "@/lib/eposta";
import { hataMetni } from "@/lib/hata-metni";
import { hesapDepoAl } from "@/lib/hesaplar";
import type { DestekTalebi } from "@/lib/hesaplar/tipler";
import { oturumAl } from "@/lib/oturum";
import { destekTalebiBildir } from "@/lib/yonetici-bildirim";

export type AdresBildirDurumu = { hata?: string; basari?: string };

const KONU_ONEKI = "Alım adresi eksik";

/** DT-260801-4821 — yöneticinin listede kolayca ayırt edebileceği kısa numara. */
function talepNoUret(): string {
  const t = new Date();
  const g = `${String(t.getFullYear()).slice(2)}${String(t.getMonth() + 1).padStart(2, "0")}${String(
    t.getDate(),
  ).padStart(2, "0")}`;
  return `DT-${g}-${crypto.randomInt(1000, 9999)}`;
}

/**
 * KURYE "MUTFAK ADRESİNİ GİRMEMİŞ" DİYOR.
 *
 * Eskiden kartta yalnızca "Yöneticiye bildir" yazıyordu ama basılacak bir şey
 * yoktu — kurye ya kendi telefonundan yöneticiyi arıyor ya da siparişi öylece
 * bırakıyordu.
 *
 * Bildirim İKİ YERE gidiyor:
 *  - MUTFAĞA e-posta: adresi girecek olan o. Yönetici araya girmeden
 *    düzeltebilsin.
 *  - YÖNETİCİYE destek talebi: kimse ilgilenmezse sipariş askıda kalmasın,
 *    /admin/destek'te görünsün.
 *
 * Adresin gerçekten boş olduğu SUNUCUDA tekrar okunuyor; kartın gördüğü
 * bilgiyle yetinilmiyor. Şef bu arada adresi girmiş olabilir.
 */
export async function alimAdresiBildirAction(
  _oncekiDurum: AdresBildirDurumu,
  formVerisi: FormData,
): Promise<AdresBildirDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: await hataMetni("oturum.gerekli") };

  const siparisNo = String(formVerisi.get("siparisNo") ?? "").trim();
  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: await hataMetni("teslimat.siparisYok") };

  /*
   * Yalnızca siparişe ATANMIŞ kurye (ya da yönetici). Başka bir kurye sipariş
   * numarasını bilse bile bildirim açamıyor — atama sipariş kaydından okunuyor,
   * formdan gelen bilgiye güvenilmiyor.
   */
  const yetkili =
    oturum.rol === "admin" ||
    (oturum.rol === "kurye" && siparis.atananKurye === oturum.eposta);
  if (!yetkili) return { hata: await hataMetni("teslimat.sanaAtanmamis") };

  const hesapDepo = await hesapDepoAl();
  const profil = await hesapDepo.profilAl(siparis.restoranSlug).catch(() => null);
  if (profil?.alimAdresi?.trim()) {
    return { basari: await hataMetni("teslimat.adresBuArada") };
  }

  /*
   * AYNI SİPARİŞ İÇİN İKİNCİ TALEP AÇILMIYOR. Kurye düğmeye üst üste basınca
   * yönetici listesi aynı şikâyetin kopyalarıyla dolar ve gerçek talepler
   * arasında kaybolurdu.
   */
  const acikTalepler = await hesapDepo.destekListele("acik").catch(() => []);
  const zatenVar = acikTalepler.some(
    (t) => t.siparisNo === siparisNo && t.konu.startsWith(KONU_ONEKI),
  );
  if (zatenVar) return { basari: await hataMetni("teslimat.bildirimZatenAcik") };

  const sahip = await hesapDepo.restoranSahibi(siparis.restoranSlug).catch(() => null);
  const simdi = new Date().toISOString();

  const talep: DestekTalebi = {
    id: crypto.randomUUID(),
    no: talepNoUret(),
    konu: `${KONU_ONEKI} — ${siparis.restoranAdi}`,
    mesaj:
      `${siparis.restoranAdi} (${siparis.restoranSlug}) mutfağı alım adresini girmemiş; ` +
      `kurye ${oturum.ad} (${oturum.eposta}) ${siparisNo} numaralı siparişi alamıyor.` +
      (sahip ? `\n\nMutfak hesabı: ${sahip.eposta}` : `\n\nBu mutfağın bağlı bir hesabı yok.`),
    siparisNo,
    ad: oturum.ad,
    eposta: oturum.eposta,
    durum: "acik",
    olusturmaTarihi: simdi,
    guncellemeTarihi: simdi,
  };

  try {
    await hesapDepo.destekEkle(talep);
    destekTalebiBildir(talep);
  } catch {
    return { hata: await hataMetni("teslimat.bildirimKaydedilemedi") };
  }

  /*
   * Posta EN SON ve hatası yutuluyor: talep zaten kaydedildi, yönetici
   * görüyor. SMTP susuyor diye kuryeye "bildirim gitmedi" demek yanlış olurdu
   * — gitti, yalnızca bir kanalı eksik gitti.
   */
  if (sahip?.eposta) {
    await epostaGonder({
      alici: sahip.eposta,
      konu: `Alım adresin eksik — ${siparisNo} numaralı sipariş bekliyor`,
      metin:
        `Merhaba ${sahip.ad},\n\n` +
        `${siparisNo} numaralı siparişi almaya gelen kurye mutfağının adresini göremiyor; ` +
        `profilinde "Alım adresi" alanı boş görünüyor.\n\n` +
        `Panelinden doldurabilirsin: ${process.env.SITE_ADRESI ?? "https://neyersin.com"}/panel\n\n` +
        `Adres yalnızca o teslimatı yapan kuryeye ve yöneticiye gösteriliyor; ` +
        `müşteri hiçbir yerde görmüyor.\n\n` +
        `Ne Yersin?`,
    }).catch(() => undefined);
  }

  revalidatePath("/admin/destek");
  revalidatePath("/panel");
  return {
    basari: await hataMetni(
      sahip?.eposta ? "teslimat.bildirildiIkisine" : "teslimat.bildirildiYonetici",
    ),
  };
}
