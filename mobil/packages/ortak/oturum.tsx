import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiHatasi, type ApiIstemcisi } from "./src/api/istemci";
import type { KullaniciDto, OturumCevabi, Rol } from "./src/tipler";
import { guvenliJetonDeposu } from "./native";

/**
 * OTURUM DURUMU — uygulamanın en üst seviyedeki "kim var" bilgisi.
 *
 * İKİ UYGULAMA DA BUNU KULLANIYOR. Kopyalanmadı çünkü buradaki asıl değer
 * ekran değil, KARAR TABLOSU: hangi hata oturumu düşürür, hangisi düşürmez.
 * İki kopya olsaydı biri düzeltilip diğeri unutulduğunda kurye uygulaması
 * tünelde oturumdan atılır, müşteri uygulaması atılmazdı.
 *
 * Dört aşama, her biri ayrı bir ekrana karşılık geliyor:
 *  - `yukleniyor`  : cihazdaki jeton doğrulanıyor. Açılış ekranı duruyor.
 *  - `misafir`     : jeton yok ya da sunucu geçersiz dedi. Giriş ekranı.
 *  - `girisli`     : rolüne göre sekmeler.
 *  - `baglantiYok` : jeton VAR ama doğrulanamadı (uçak modu, kapsama yok).
 *
 * "yukleniyor" ayrı tutuluyor: başlangıç `misafir` kabul edilseydi, jetonu
 * geçerli olan kullanıcı her açılışta bir anlık giriş ekranı görüp sonra ana
 * ekrana atlardı.
 *
 * `baglantiYok` da ayrı, çünkü diğer iki seçenek de yanlış olurdu: `misafir`
 * yapmak parolayı yeniden sordururdu (sunucuya ulaşılamadığı için o da işe
 * yaramazdı); uydurma bir kullanıcıyla `girisli` saymak rolü bilmediğimiz
 * için yöneticiyi müşteri sekmelerine düşürürdü.
 */
export type OturumDurumu =
  | { asama: "yukleniyor" }
  | { asama: "misafir" }
  | { asama: "girisli"; kullanici: KullaniciDto }
  | { asama: "baglantiYok" };

type OturumBaglami = {
  durum: OturumDurumu;
  girisYap(kimlik: string, parola: string): Promise<void>;
  /**
   * Giriş ucundan GEÇMEYEN akışlar için: kayıt doğrulaması gibi, oturumu
   * kendisi açan uçların cevabını alıp içeri alıyor.
   *
   * Ayrı bir yol olmasının sebebi, kayıt biten kişiyi bir de giriş ekranına
   * uğratmamak — parolayı bir dakika önce kendisi belirledi. Rol denetimi
   * `girisYap` ile aynı: kabul edilmeyen rol için jeton HİÇ yazılmıyor.
   */
  oturumaGec(cevap: OturumCevabi): Promise<void>;
  cikisYap(): Promise<void>;
  /** Profil güncellendikten sonra ve "tekrar dene" düğmesinde. */
  tazele(): Promise<void>;
};

const Baglam = createContext<OturumBaglami | null>(null);

export function OturumSaglayici({
  api,
  hazirla,
  rolKabul,
  rolRedMesaji,
  children,
}: {
  api: ApiIstemcisi;
  /** Cihaz kimliğini okuyup istemciye yazan açılış adımı. */
  hazirla: () => Promise<unknown>;
  /**
   * Bu uygulamanın kabul ettiği roller. Verilmezse herkes girebilir.
   *
   * Giriş ucu rol AYRIMI YAPMIYOR (bkz. api/mobil/v1/oturum/giris): aynı
   * kişinin hem müşteri hem kurye olabilmesi gerekiyor ve bunu sunucuda
   * kısıtlamak, ileride tek uygulamaya dönülürse geri alınması gereken bir
   * karar olurdu. Ayrım burada: kurye uygulaması yalnızca kuryeyi içeri
   * alıyor, müşteri uygulaması kuryeyi de kabul ediyor (kurye de yemek
   * söyleyebilir).
   */
  rolKabul?: (rol: Rol) => boolean;
  /** `rolKabul` reddettiğinde giriş ekranında gösterilecek metin. */
  rolRedMesaji?: string;
  children: ReactNode;
}) {
  const [durum, setDurum] = useState<OturumDurumu>({ asama: "yukleniyor" });

  const oturumuCoz = useCallback(async (): Promise<OturumDurumu> => {
    const jetonlar = await guvenliJetonDeposu.oku();
    if (!jetonlar) return { asama: "misafir" };

    try {
      /*
       * Jeton süresi dolmuşsa uç 401 döner; istemci bunu görüp yenileme
       * jetonuyla sessizce tazeler ve isteği tekrarlar. Yani bu tek çağrı
       * "jeton geçerli mi" ve "tazelenebiliyor mu" sorularının ikisini
       * birden cevaplıyor.
       */
      const kullanici = await api.get<KullaniciDto>("/api/mobil/v1/oturum/ben");
      /*
       * Rol AÇILIŞTA da denetleniyor, sadece girişte değil: kişi kurye
       * uygulamasına girdikten sonra yöneticisi rolünü değiştirmiş olabilir.
       * Yalnızca giriş anında bakılsaydı, eski jetonla uygulamayı açan kişi
       * artık sahip olmadığı ekranlarda gezmeye devam ederdi.
       */
      if (rolKabul && !rolKabul(kullanici.rol)) {
        await guvenliJetonDeposu.sil();
        return { asama: "misafir" };
      }
      return { asama: "girisli", kullanici };
    } catch (e) {
      /*
       * Ağ hatasında jeton SİLİNMİYOR ve kullanıcı dışarı atılmıyor —
       * bağlantı gelince oturum kaldığı yerden devam edecek. Yalnızca sunucu
       * jetonu reddettiyse misafire düşülüyor.
       */
      if (e instanceof ApiHatasi && e.tekrarDenenebilir) return { asama: "baglantiYok" };
      return { asama: "misafir" };
    }
  }, [api, rolKabul]);

  useEffect(() => {
    let iptal = false;

    /*
     * "Oturum kurtarılamadı" geri çağrısı İLK istekten önce bağlanıyor.
     * Sonra bağlansaydı açılıştaki çağrı sırasında düşen bir oturum
     * yakalanamaz, kullanıcı boş ekranda kalırdı.
     */
    api.oturumDustuAyarla(() => setDurum({ asama: "misafir" }));

    (async () => {
      await hazirla();
      const sonuc = await oturumuCoz();
      if (!iptal) setDurum(sonuc);
    })();

    return () => {
      iptal = true;
    };
  }, [api, hazirla, oturumuCoz]);

  const oturumaGec = useCallback(
    async (cevap: OturumCevabi) => {
      /*
       * Rol uymuyorsa jeton HİÇ YAZILMIYOR. Önce yazıp sonra silmek, arada
       * uygulamanın kapanması hâlinde kabul edilmeyen bir rolü cihazda
       * bırakırdı.
       */
      if (rolKabul && !rolKabul(cevap.kullanici.rol)) {
        throw new ApiHatasi(
          "yetki_yok",
          rolRedMesaji ?? "Bu hesap bu uygulamayı kullanamaz.",
          403,
        );
      }

      await guvenliJetonDeposu.yaz({
        erisimJetonu: cevap.erisimJetonu,
        yenilemeJetonu: cevap.yenilemeJetonu,
      });
      setDurum({ asama: "girisli", kullanici: cevap.kullanici });
    },
    [rolKabul, rolRedMesaji],
  );

  const girisYap = useCallback(
    async (kimlik: string, parola: string) => {
      const cevap = await api.post<OturumCevabi>(
        "/api/mobil/v1/oturum/giris",
        { kimlik, parola, cihaz: api.cihaz },
        { jetonsuz: true },
      );
      await oturumaGec(cevap);
    },
    [api, oturumaGec],
  );

  const cikisYap = useCallback(async () => {
    await guvenliJetonDeposu.sil();
    setDurum({ asama: "misafir" });
  }, []);

  const tazele = useCallback(async () => {
    setDurum(await oturumuCoz());
  }, [oturumuCoz]);

  const deger = useMemo(
    () => ({ durum, girisYap, oturumaGec, cikisYap, tazele }),
    [durum, girisYap, oturumaGec, cikisYap, tazele],
  );

  return <Baglam value={deger}>{children}</Baglam>;
}

export function useOturum(): OturumBaglami {
  const baglam = use(Baglam);
  if (!baglam) throw new Error("useOturum, OturumSaglayici içinde çağrılmalı.");
  return baglam;
}
