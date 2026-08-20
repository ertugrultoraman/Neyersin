import type { OturumCevabi } from "../tipler";

/**
 * API İSTEMCİSİ — iki uygulamanın sunucuyla tek konuşma kanalı.
 *
 * Sorumlulukları:
 *  - Cevap zarfını (`{ tamam, veri | hata }`) açmak, hatayı istisnaya çevirmek
 *  - Her isteğe `Authorization: Bearer …` eklemek
 *  - Erişim jetonu süresi dolduğunda SESSİZCE tazeleyip isteği tekrarlamak
 *  - Ağ hatası ve zaman aşımını da aynı hata tipine indirgemek
 *
 * Ekranlar bu sınıfın altındaki hiçbir ayrıntıyı bilmiyor: `await api.get(...)`
 * ya veriyi döner ya `ApiHatasi` atar.
 */

/* --------------------------------------------------------------------------
 * Hata
 * ----------------------------------------------------------------------- */

/** Sunucudaki `HataKodu` + yalnızca istemcide oluşan durumlar. */
export type HataKodu =
  | "oturum_gecersiz"
  | "yetki_yok"
  | "bulunamadi"
  | "gecersiz_istek"
  | "cok_fazla_istek"
  | "bakimda"
  | "sunucu_hatasi"
  /** Sunucuya hiç ulaşılamadı (uçak modu, kapsama yok, DNS). */
  | "ag_hatasi"
  /** Sunucu zamanında cevap vermedi. */
  | "zaman_asimi";

export class ApiHatasi extends Error {
  constructor(
    readonly kod: HataKodu,
    mesaj: string,
    readonly durum = 0,
    /** Alan bazlı doğrulama hataları — form altına yazılıyor. */
    readonly alanlar?: Record<string, string>,
  ) {
    super(mesaj);
    this.name = "ApiHatasi";
  }

  /** Kullanıcıya "tekrar dene" düğmesi göstermeye değer mi? */
  get tekrarDenenebilir(): boolean {
    return this.kod === "ag_hatasi" || this.kod === "zaman_asimi" || this.kod === "sunucu_hatasi";
  }
}

/* --------------------------------------------------------------------------
 * Jeton deposu
 * ----------------------------------------------------------------------- */

export type JetonCifti = { erisimJetonu: string; yenilemeJetonu: string };

/**
 * Jetonların nerede saklandığı UYGULAMANIN kararı.
 *
 * Ortak paket `expo-secure-store`a bağlanmıyor: bağımlılık ters yönde olurdu
 * (paylaşılan katman, uygulamanın altyapı seçimini dayatır) ve testte gerçek
 * Keychain'e gitmek zorunda kalırdık. Uygulama Keychain/Keystore uygulamasını
 * geçiyor, test bellekte tutan bir sahte geçiyor.
 */
export type JetonDeposu = {
  oku(): Promise<JetonCifti | null>;
  yaz(cifti: JetonCifti): Promise<void>;
  sil(): Promise<void>;
};

export type IstemciAyari = {
  /** Sunucu kökü, sonunda eğik çizgi olmadan: "https://neyersin.net" */
  taban: string;
  /** Cihaz kimliği — yenileme isteğinde doğrulanıyor. */
  cihaz: string;
  depo: JetonDeposu;
  /**
   * Oturum kurtarılamayacak şekilde düştüğünde çağrılır.
   * Uygulama bunu görünce kullanıcıyı giriş ekranına atıyor.
   */
  oturumDustu?: () => void;
  /** Milisaniye. Kurye uygulaması zayıf şebekede daha uzun bekleyebilir. */
  zamanAsimiMs?: number;
};

type IstekSecenegi = {
  yontem?: "GET" | "POST" | "PATCH" | "DELETE";
  govde?: unknown;
  /** Oturum gerektirmeyen uçlarda jeton eklenmesin (giriş, katalog). */
  jetonsuz?: boolean;
  sorgu?: Record<string, string | number | boolean | undefined>;
  /** Dışarıdan iptal — ekran kapanınca istek düşsün. */
  isaret?: AbortSignal;
};

const VARSAYILAN_ZAMAN_ASIMI = 15_000;

export class ApiIstemcisi {
  #ayar: IstemciAyari;

  /**
   * Süren tazeleme işlemi.
   *
   * Neden tek promise: ekran açılışında paralel giden 4-5 istek aynı anda 401
   * alıyor. Her biri ayrı tazeleme başlatsaydı sunucuya 5 yenileme isteği
   * giderdi ve jeton rotasyonu yüzünden ilk cevap dışındakiler ARTIK GEÇERSİZ
   * bir yenileme jetonu kullanmış olurdu — kullanıcı sebepsiz yere giriş
   * ekranına düşerdi. Hepsi aynı promise'i bekliyor.
   */
  #tazeleme: Promise<string | null> | null = null;

  constructor(ayar: IstemciAyari) {
    this.#ayar = { ...ayar, taban: ayar.taban.replace(/\/+$/, "") };
  }

  /** Giriş/çıkış sonrası çağrılıyor. */
  cihazDegistir(cihaz: string) {
    this.#ayar = { ...this.#ayar, cihaz };
  }

  /** Giriş ve kayıt gövdelerinde de gerekiyor; tek kaynak burası kalsın. */
  get cihaz(): string {
    return this.#ayar.cihaz;
  }

  /**
   * "Oturum düştü" geri çağrısını sonradan bağlar.
   *
   * İstemci modül düzeyinde tek örnek olarak kuruluyor; oturum durumunu tutan
   * React bağlamı ise ondan SONRA doğuyor. Geri çağrı yalnızca yapıcıda
   * verilebilseydi, istemci kullanıcıyı giriş ekranına atacak fonksiyona
   * hiçbir zaman ulaşamazdı.
   */
  oturumDustuAyarla(geriCagri: () => void) {
    this.#ayar = { ...this.#ayar, oturumDustu: geriCagri };
  }

  get<T>(yol: string, secenek: Omit<IstekSecenegi, "yontem" | "govde"> = {}) {
    return this.istek<T>(yol, { ...secenek, yontem: "GET" });
  }

  post<T>(yol: string, govde?: unknown, secenek: Omit<IstekSecenegi, "yontem"> = {}) {
    return this.istek<T>(yol, { ...secenek, yontem: "POST", govde });
  }

  patch<T>(yol: string, govde?: unknown, secenek: Omit<IstekSecenegi, "yontem"> = {}) {
    return this.istek<T>(yol, { ...secenek, yontem: "PATCH", govde });
  }

  async istek<T>(yol: string, secenek: IstekSecenegi = {}): Promise<T> {
    const cevap = await this.#gonder(yol, secenek);

    /*
     * 401 + `oturum_gecersiz` → jetonu tazele ve BİR KEZ tekrar dene.
     *
     * Yalnızca bu kodda tazeleniyor. Hatalı paroladan dönen 401 de vardı
     * (bkz. oturum/giris ucu) ve o `gecersiz_istek` kodunu taşıyor — ona
     * tazeleme denenseydi giriş ekranı sonsuz döngüye girerdi.
     */
    if (cevap.hata?.kod === "oturum_gecersiz" && !secenek.jetonsuz) {
      const yeni = await this.#tazele();
      if (!yeni) {
        this.#ayar.oturumDustu?.();
        throw new ApiHatasi("oturum_gecersiz", cevap.hata.mesaj, 401);
      }
      const tekrar = await this.#gonder(yol, secenek);
      if (tekrar.hata) throw this.#istisna(tekrar.hata, tekrar.durum);
      return tekrar.veri as T;
    }

    if (cevap.hata) throw this.#istisna(cevap.hata, cevap.durum);
    return cevap.veri as T;
  }

  /* --- İç işleyiş ------------------------------------------------------ */

  #istisna(
    hata: { kod: HataKodu; mesaj: string; alanlar?: Record<string, string> },
    durum: number,
  ) {
    return new ApiHatasi(hata.kod, hata.mesaj, durum, hata.alanlar);
  }

  async #gonder(
    yol: string,
    secenek: IstekSecenegi,
  ): Promise<{
    veri?: unknown;
    hata?: { kod: HataKodu; mesaj: string; alanlar?: Record<string, string> };
    durum: number;
  }> {
    const adres = new URL(`${this.#ayar.taban}${yol}`);
    for (const [anahtar, deger] of Object.entries(secenek.sorgu ?? {})) {
      if (deger !== undefined) adres.searchParams.set(anahtar, String(deger));
    }

    /*
     * DOSYA GÖNDERİMİ (FormData) JSON'a çevrilmiyor ve Content-Type ELLE
     * YAZILMIYOR: multipart gövdesinin sınır dizesini (boundary) fetch
     * kendisi üretiyor. Başlık elle konsaydı boundary eksik kalır, sunucu
     * gövdeyi ayrıştıramaz ve "fotoğraf okunamadı" derdi.
     */
    const dosyaGovdesi = secenek.govde instanceof FormData;

    const basliklar: Record<string, string> = { Accept: "application/json" };
    if (secenek.govde !== undefined && !dosyaGovdesi) {
      basliklar["Content-Type"] = "application/json";
    }

    if (!secenek.jetonsuz) {
      const jetonlar = await this.#ayar.depo.oku();
      if (jetonlar) basliklar.Authorization = `Bearer ${jetonlar.erisimJetonu}`;
    }

    /*
     * Zaman aşımı elle kuruluyor. `AbortSignal.timeout` Hermes'te her sürümde
     * yok; ayrıca dışarıdan gelen iptal işaretiyle birleştirmek gerekiyor —
     * ekran kapandığında istek de düşmeli.
     */
    const kontrolcu = new AbortController();
    const sayac = setTimeout(() => kontrolcu.abort("zaman_asimi"), this.#ayar.zamanAsimiMs ?? VARSAYILAN_ZAMAN_ASIMI);
    const disaridanIptal = () => kontrolcu.abort("disaridan");
    secenek.isaret?.addEventListener("abort", disaridanIptal);

    try {
      const yanit = await fetch(adres.toString(), {
        method: secenek.yontem ?? "GET",
        headers: basliklar,
        body:
          secenek.govde === undefined
            ? undefined
            : dosyaGovdesi
              ? (secenek.govde as FormData)
              : JSON.stringify(secenek.govde),
        signal: kontrolcu.signal,
      });

      const govde = (await yanit.json().catch(() => null)) as
        | { tamam: true; veri: unknown }
        | { tamam: false; hata: { kod: HataKodu; mesaj: string; alanlar?: Record<string, string> } }
        | null;

      if (!govde) {
        /*
         * Gövde JSON değil. Ara katman ya da bir vekil araya girmiş demektir
         * (bkz. src/middleware.ts — kapalı site HTML dönüyor). Sunucunun
         * durumu hakkında güvenilir bir şey söyleyemiyoruz.
         */
        return {
          durum: yanit.status,
          hata: {
            kod: yanit.status === 503 ? "bakimda" : "sunucu_hatasi",
            mesaj: "Sunucudan beklenmeyen bir cevap geldi.",
          },
        };
      }

      if (govde.tamam) return { veri: govde.veri, durum: yanit.status };
      return { hata: govde.hata, durum: yanit.status };
    } catch (e) {
      const iptalNedeni = kontrolcu.signal.reason;
      if (iptalNedeni === "zaman_asimi") {
        return { durum: 0, hata: { kod: "zaman_asimi", mesaj: "Sunucu zamanında cevap vermedi." } };
      }
      // Dışarıdan iptal edildiyse ekran zaten kapanmış; sessizce yukarı taşı.
      if (iptalNedeni === "disaridan") throw e;

      return {
        durum: 0,
        hata: { kod: "ag_hatasi", mesaj: "İnternet bağlantısı kurulamadı." },
      };
    } finally {
      clearTimeout(sayac);
      secenek.isaret?.removeEventListener("abort", disaridanIptal);
    }
  }

  /** Yeni erişim jetonu alır; başarısızsa jetonları siler ve null döner. */
  #tazele(): Promise<string | null> {
    this.#tazeleme ??= this.#tazelemeyiYurut().finally(() => {
      this.#tazeleme = null;
    });
    return this.#tazeleme;
  }

  async #tazelemeyiYurut(): Promise<string | null> {
    const mevcut = await this.#ayar.depo.oku();
    if (!mevcut) return null;

    const sonuc = await this.#gonder("/api/mobil/v1/oturum/yenile", {
      yontem: "POST",
      jetonsuz: true,
      govde: { yenilemeJetonu: mevcut.yenilemeJetonu, cihaz: this.#ayar.cihaz },
    });

    if (sonuc.hata || !sonuc.veri) {
      /*
       * Ağ hatasında jetonları SİLMİYORUZ: kullanıcı metroda tünele girdiği
       * için oturumundan olmamalı. Yalnızca sunucu "bu jeton geçersiz" dediyse
       * siliniyor.
       */
      if (sonuc.hata && sonuc.hata.kod !== "ag_hatasi" && sonuc.hata.kod !== "zaman_asimi") {
        await this.#ayar.depo.sil();
      }
      return null;
    }

    const yeni = sonuc.veri as OturumCevabi;
    await this.#ayar.depo.yaz({
      erisimJetonu: yeni.erisimJetonu,
      yenilemeJetonu: yeni.yenilemeJetonu,
    });
    return yeni.erisimJetonu;
  }
}
