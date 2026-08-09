"use server";

import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import { epostaEsit } from "@/lib/depo/tipler";
import { hataMetni } from "@/lib/hata-metni";
import { oturumAl } from "@/lib/oturum";
import { mesajEkle, mesajlasmaAcikMi, type MesajTarafi } from "@/lib/siparis-mesajlari";

export type MesajDurumu = { hata?: string; gonderildi?: boolean };

/**
 * Sipariş üzerinden mesaj gönderir — kurye ile müşteri arasında.
 *
 * YETKİ SİPARİŞ KAYDINDAN okunuyor, formdan gelene güvenilmiyor: yalnızca
 * siparişe ATANMIŞ kurye ve siparişi VEREN müşteri yazabiliyor. Sipariş
 * numarasını bilen üçüncü biri yazışmaya giremiyor.
 *
 * Yönetici de yazabiliyor: bir sorun büyüdüğünde araya girmesi gerekiyor ve
 * yazdığı mesaj "yönetici" olarak görünüyor, kurye adına konuşmuş olmuyor.
 */
export async function mesajGonderAction(
  _oncekiDurum: MesajDurumu,
  formVerisi: FormData,
): Promise<MesajDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: await hataMetni("oturum.gerekli") };

  const siparisNo = String(formVerisi.get("siparisNo") ?? "").trim();
  const metin = String(formVerisi.get("metin") ?? "").trim();
  if (!metin) return { hata: await hataMetni("mesaj.bos") };

  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: await hataMetni("teslimat.siparisYok") };

  /*
   * `epostaEsit` kullanılıyor, düz `===` değil: adresler kayıtlarda farklı
   * harf düzeniyle durabiliyor ve müşteri kendi siparişinin yazışmasından
   * dışlanırdı.
   */
  let taraf: MesajTarafi | null = null;
  if (oturum.rol === "admin") taraf = "admin";
  else if (oturum.rol === "kurye" && epostaEsit(siparis.atananKurye, oturum.eposta)) taraf = "kurye";
  else if (epostaEsit(siparis.musteri?.eposta, oturum.eposta)) taraf = "musteri";

  if (!taraf) return { hata: await hataMetni("mesaj.yetkiYok") };

  /*
   * Teslimat bittikten sonra yazışma kapanıyor (iki saatlik pay dışında).
   * Numaraları gizlemenin amacı, teslimattan sonra süren bir bağ kurulmasını
   * önlemekti; kalıcı bir kanal bırakmak onu boşa çıkarırdı.
   */
  if (!mesajlasmaAcikMi(siparis.durum, siparis.guncellemeTarihi)) {
    return { hata: await hataMetni("mesaj.kapali") };
  }

  try {
    await mesajEkle({ siparisNo, gonderen: taraf, gonderenAdi: oturum.ad, metin });
  } catch {
    return { hata: await hataMetni("mesaj.gonderilemedi") };
  }

  revalidatePath("/panel");
  revalidatePath("/hesabim/siparisler");
  return { gonderildi: true };
}
