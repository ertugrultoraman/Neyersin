import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { JetonCifti, JetonDeposu } from "./src/api/istemci";

/**
 * CİHAZA BAĞLI KATMAN — Keychain / Keystore erişimi.
 *
 * Ayrı bir giriş noktası (`ortak/native`) olmasının sebebi: `ortak` paketinin
 * çekirdeği (API istemcisi, tipler, tasarım) bilerek platformdan bağımsız.
 * `ApiIstemcisi` jetonu nerede sakladığını bilmiyor, `JetonDeposu` arayüzünü
 * alıyor — böylece testte belleğe yazan sahte bir depo verilebiliyor ve
 * çekirdeği içe aktaran hiçbir dosya `expo-secure-store`u yüklemek zorunda
 * kalmıyor. Bu dosya o arayüzün GERÇEK uygulaması.
 */

const ERISIM_ANAHTARI = "ny_erisim_jetonu";
const YENILEME_ANAHTARI = "ny_yenileme_jetonu";
const CIHAZ_ANAHTARI = "ny_cihaz_kimligi";

/**
 * Web'de SecureStore YOK — çağrılırsa istisna atıyor.
 *
 * Uygulamaların hedefi native; web yalnızca `expo start --web` ile hızlı
 * bakmak için açık. Orada bellekte tutan bir yedek kullanılıyor: sayfa
 * yenilenince oturum düşer ama en azından uygulama açılır. Gerçek bir web
 * sürümü yapılacaksa burada `localStorage` DEĞİL, sunucu tarafı çerez
 * kullanılmalı — jetonu `localStorage`a yazmak XSS'e açık bırakır.
 */
const webBellegi = new Map<string, string>();
const webMi = Platform.OS === "web";

async function yaz(anahtar: string, deger: string): Promise<void> {
  if (webMi) {
    webBellegi.set(anahtar, deger);
    return;
  }
  await SecureStore.setItemAsync(anahtar, deger, {
    /*
     * Cihaz kilidi açıldıktan SONRA erişilebilir olsun; yedeklemeyle başka
     * bir cihaza taşınmasın. Kurye uygulaması arka planda da okuyacağı için
     * "AFTER_FIRST_UNLOCK" gerekli — "WHEN_UNLOCKED" olsaydı ekran kilitliyken
     * konum bildirimi jetonu okuyamayıp sessizce başarısız olurdu.
     */
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

async function oku(anahtar: string): Promise<string | null> {
  if (webMi) return webBellegi.get(anahtar) ?? null;
  return SecureStore.getItemAsync(anahtar);
}

async function sil(anahtar: string): Promise<void> {
  if (webMi) {
    webBellegi.delete(anahtar);
    return;
  }
  await SecureStore.deleteItemAsync(anahtar);
}

export const guvenliJetonDeposu: JetonDeposu = {
  async oku() {
    const [erisimJetonu, yenilemeJetonu] = await Promise.all([
      oku(ERISIM_ANAHTARI),
      oku(YENILEME_ANAHTARI),
    ]);
    /*
     * İkisi birden olmalı. Yalnızca erişim jetonu varsa tazelenemez ve
     * süresi dolduğunda kullanıcı sebebini anlamadan dışarı atılırdı;
     * yarım kalmış kaydı yok saymak daha dürüst.
     */
    if (!erisimJetonu || !yenilemeJetonu) return null;
    return { erisimJetonu, yenilemeJetonu };
  },

  async yaz(cifti: JetonCifti) {
    await Promise.all([
      yaz(ERISIM_ANAHTARI, cifti.erisimJetonu),
      yaz(YENILEME_ANAHTARI, cifti.yenilemeJetonu),
    ]);
  },

  async sil() {
    await Promise.all([sil(ERISIM_ANAHTARI), sil(YENILEME_ANAHTARI)]);
  },
};

/**
 * Cihaz kimliği — ilk açılışta üretilip kalıcı olarak saklanıyor.
 *
 * Sunucu yenileme jetonunu bu kimliğe bağlıyor (bkz. lib/mobil/jeton.ts):
 * jeton bir cihaza yazıldıysa başka cihazdan gelen aynı jeton reddediliyor.
 *
 * DONANIM KİMLİĞİ KULLANILMIYOR (Android ID, IDFV vb.): ikisi de kalıcı
 * takip kimliği sayılıyor, mağaza gizlilik formlarında beyan gerektiriyor ve
 * iOS'ta zaten uygulama silinince değişiyor. Rastgele üretilen bir UUID hem
 * aynı işi görüyor hem kişiyle ilişkilendirilemiyor.
 *
 * Çıkışta SİLİNMİYOR: aynı telefondan tekrar giriş yapan kişi aynı cihaz
 * kaydını kullansın, her girişte yeni bir "cihaz" birikmesin.
 */
export async function cihazKimligiAl(): Promise<string> {
  const mevcut = await oku(CIHAZ_ANAHTARI);
  if (mevcut) return mevcut;

  const yeni = uuidUret();
  await yaz(CIHAZ_ANAHTARI, yeni);
  return yeni;
}

/**
 * UUID üretimi — üç kaynak, sırayla.
 *
 * `Crypto.randomUUID()` tek başına kullanılıyordu ve WEB'DE PATLIYORDU:
 * expo-crypto o ortamda tarayıcının `crypto` nesnesine devrediyor, güvensiz
 * bağlamda (http:// üzerinden açılan geliştirme sunucusu) `randomUUID`
 * tanımsız oluyor ve uygulama daha ilk açılışta "randomUUID is not a function"
 * ile duruyordu — cihaz kimliği açılış adımının ilk işi.
 *
 * Web hedefi ürünün kendisi değil, ama geliştirirken ekranlara tarayıcıdan
 * bakabilmek hızlı bir geri bildirim yolu; o yol tek satırlık bir yedekle
 * açık kalıyor. Son çare olan elle üretim de rastgele BAYTLARDAN kuruluyor,
 * `Math.random`dan değil: cihaz kimliği tahmin edilebilir olmamalı.
 */
function uuidUret(): string {
  const yerlesik = globalThis.crypto;
  if (typeof yerlesik?.randomUUID === "function") return yerlesik.randomUUID();

  const baytlar = Crypto.getRandomBytes(16);
  /* RFC 4122 sürüm 4 ve varyant bitleri. */
  baytlar[6] = (baytlar[6] & 0x0f) | 0x40;
  baytlar[8] = (baytlar[8] & 0x3f) | 0x80;

  const onalti = [...baytlar].map((b) => b.toString(16).padStart(2, "0")).join("");
  return [
    onalti.slice(0, 8),
    onalti.slice(8, 12),
    onalti.slice(12, 16),
    onalti.slice(16, 20),
    onalti.slice(20),
  ].join("-");
}
