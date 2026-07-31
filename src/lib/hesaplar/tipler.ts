/** Oturum açan kişinin yetki düzeyi. */
export type Rol = "admin" | "sef";

export type Hesap = {
  /** Benzersiz kimlik — her zaman küçük harfe indirgenmiş e-posta. */
  eposta: string;
  ad: string;
  /** scrypt ile türetilmiş `tuz:ozet` — düz parola hiçbir yerde saklanmaz. */
  parolaHash: string;
  rol: Rol;
  /**
   * Şef hesabının sahibi olduğu restoran slug'ı. Bir şef YALNIZCA bu profili
   * düzenleyebilir; diğerlerini sadece görüntüler.
   */
  restoranSlug?: string;
  olusturmaTarihi: string;
};

/**
 * Şefin kendi düzenlediği profil alanları. İçerik dosyalarındaki (restoranlar.ts)
 * statik veriyi EZMEZ, üzerine biner — böylece şef bir alanı boş bırakırsa
 * sitedeki varsayılan metin görünmeye devam eder.
 */
export type SefProfili = {
  restoranSlug: string;
  /** Özgeçmiş / hikaye. */
  biyografi?: string;
  /** Sertifikalar, kurslar, belgeler — serbest metin, satır satır girilir. */
  sertifikalar?: string;
  /** "Ev usulü mantı ve hamur işleri" gibi kısa uzmanlık cümlesi. */
  uzmanlik?: string;
  /** Profilin üstünde görünen kısa slogan. */
  slogan?: string;
  /** Şefin paylaşmak istediği iletişim notu (telefon/instagram vb.). */
  iletisim?: string;
  guncellemeTarihi: string;
};

export type HesapDepo = {
  ad: string;
  kalici: boolean;
  hazirla(): Promise<void>;

  hesapBul(eposta: string): Promise<Hesap | null>;
  hesapEkle(hesap: Hesap): Promise<void>;
  hesaplariListele(): Promise<Hesap[]>;
  /** Bir restoranın şef hesabı zaten var mı? (aynı profil iki kez sahiplenilemez) */
  restoranSahibi(restoranSlug: string): Promise<Hesap | null>;

  profilAl(restoranSlug: string): Promise<SefProfili | null>;
  profilleriListele(): Promise<SefProfili[]>;
  profilKaydet(profil: SefProfili): Promise<void>;
};
