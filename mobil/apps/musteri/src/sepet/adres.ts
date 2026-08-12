import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Son kullanılan teslimat adresi.
 *
 * Sunucuda değil CİHAZDA saklanıyor. Adres defteri (birden çok kayıtlı adres,
 * "Ev"/"İş" etiketleri) sunucu tarafında henüz yok; onu beklerken kullanıcıyı
 * her siparişte aynı on alanı yeniden doldurmaya zorlamak, ikinci siparişi
 * vermeme sebebi olur.
 *
 * Adres defteri geldiğinde burası ona devredilecek — o zaman bu kayıt yalnızca
 * "en son seçilen adres" işaretine dönüşür.
 */

const ANAHTAR = "ny-adres-v1";

export type KayitliAdres = {
  adSoyad: string;
  telefon: string;
  ilce: string;
  mahalle: string;
  acikAdres: string;
  binaNo: string;
  daireNo: string;
  tarif: string;
};

export const BOS_ADRES: KayitliAdres = {
  adSoyad: "",
  telefon: "",
  ilce: "",
  mahalle: "",
  acikAdres: "",
  binaNo: "",
  daireNo: "",
  tarif: "",
};

export async function adresOku(): Promise<KayitliAdres | null> {
  try {
    const kayit = await AsyncStorage.getItem(ANAHTAR);
    if (!kayit) return null;
    const cozulen = JSON.parse(kayit) as Partial<KayitliAdres>;
    /* Eksik alan gelirse boşla tamamlanıyor; eski bir biçim formu patlatmasın. */
    return { ...BOS_ADRES, ...cozulen };
  } catch {
    return null;
  }
}

export async function adresYaz(adres: KayitliAdres): Promise<void> {
  try {
    await AsyncStorage.setItem(ANAHTAR, JSON.stringify(adres));
  } catch {
    /* Disk doluysa sipariş yine de verilebilsin — yalnızca hatırlanmaz. */
  }
}
