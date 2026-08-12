import * as Location from "expo-location";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import {
  ApiHatasi,
  kurye as kuryeUclari,
  type AracTuru,
  type KuryeTeslimatiDto,
  type TeklifDto,
} from "ortak";
import { useOturum } from "ortak/oturum";

import { api } from "@/altyapi/api";

const uclar = kuryeUclari(api);

/**
 * VARDİYA — çevrimiçi olmak, konum bildirmek ve teklif almak.
 *
 * ÜÇÜ TEK YERDE çünkü üçü tek bir şeyin parçası: kurye çevrimiçi olduğu an
 * konum akmaya ve teklifler düşmeye başlıyor, çevrimdışı olduğu an ikisi de
 * duruyor. Ekranlara dağıtılsaydı, "Özet" sekmesine geçen kuryenin konumu
 * susar, teklif ekranı kapanınca teklifler kaybolurdu — oysa vardiya
 * ekrandan bağımsız.
 *
 * YOKLAMA (polling), SOKET DEĞİL. Kalıcı bağlantı, kuryenin asansörde ve
 * bodrumda sürekli kopan şebekesinde durmadan yeniden kurulmaya çalışırdı
 * ve sunucu tarafında Vercel'de kalıcı soket zaten yok. Birkaç saniyede bir
 * atılan küçük bir istek, kopan bağlantıdan sonra kendiliğinden toparlıyor.
 */

/** Teklif yoklama sıklığı. Teklif ömrü 45 sn; bu aralık ~9 kez soruyor. */
const YOKLAMA_MS = 5_000;

/** Konum bildirimi sıklığı ve en küçük hareket. */
const KONUM_ARALIGI_MS = 10_000;
const KONUM_MESAFESI_M = 25;

export type Konum = { enlem: number; boylam: number };

type VardiyaDegeri = {
  /** Sunucudaki durum okundu mu — ilk açılışta ekran boş beklemesin. */
  hazir: boolean;
  cevrimici: boolean;
  arac: AracTuru | null;
  konum: Konum | null;
  /** Konum izni reddedildiyse dolu; ekran bunu kullanıcıya söylüyor. */
  konumHatasi: string | null;

  /** Şu an ekrana çıkması gereken teklif — en YENİSİ. */
  teklif: TeklifDto | null;
  /** Teklifin kalan süresi (sn). Sunucudan gelen değerden sayılıyor. */
  kalanSaniye: number;
  /** Ekranda olmayan diğer bekleyen teklif sayısı. */
  bekleyenSayisi: number;

  islemde: boolean;
  /** Teslimat listelerinin tazelenmesi için artan sayaç. */
  degisim: number;

  cevrimiciOl: (arac: AracTuru) => Promise<void>;
  cevrimdisiOl: () => Promise<void>;
  teklifKabul: () => Promise<KuryeTeslimatiDto | null>;
  teklifReddet: () => Promise<void>;
  tazele: () => void;
};

const Baglam = createContext<VardiyaDegeri | null>(null);

export function useVardiya(): VardiyaDegeri {
  const deger = useContext(Baglam);
  if (!deger) throw new Error("useVardiya, VardiyaSaglayici içinde çağrılmalı.");
  return deger;
}

export function VardiyaSaglayici({ children }: { children: ReactNode }) {
  const { durum: oturum } = useOturum();
  const girisli = oturum.asama === "girisli";

  const [hazir, setHazir] = useState(false);
  const [cevrimici, setCevrimici] = useState(false);
  const [arac, setArac] = useState<AracTuru | null>(null);
  const [konum, setKonum] = useState<Konum | null>(null);
  const [konumHatasi, setKonumHatasi] = useState<string | null>(null);
  const [teklifler, setTeklifler] = useState<TeklifDto[]>([]);
  const [islemde, setIslemde] = useState(false);
  const [degisim, setDegisim] = useState(0);

  /**
   * Tekliflerin alındığı an.
   *
   * Geri sayım sunucunun verdiği `kalanSaniye`den başlıyor ama yoklama
   * arasında (5 sn) yerel olarak azalıyor. Telefonun saati kullanılmıyor:
   * yanlış kurulmuş bir saatte `sonGecerlilik` karşılaştırması teklifi ya
   * anında bitirir ya hiç bitirmezdi.
   */
  const alimAni = useRef(Date.now());
  const [tik, setTik] = useState(0);

  /* --- Sunucudaki durumu oku ------------------------------------------- */

  useEffect(() => {
    if (!girisli) {
      setHazir(true);
      return;
    }
    let iptal = false;
    uclar
      .durum()
      .then((d) => {
        if (iptal) return;
        setCevrimici(d.cevrimici);
        setArac(d.arac);
      })
      .catch(() => {
        /* Durum okunamazsa çevrimdışı varsayılıyor — teklif beklemek yerine. */
      })
      .finally(() => !iptal && setHazir(true));
    return () => {
      iptal = true;
    };
  }, [girisli]);

  /* --- Konum akışı ------------------------------------------------------ */

  useEffect(() => {
    if (!cevrimici || !girisli) return;

    let abone: Location.LocationSubscription | null = null;
    let kapandi = false;
    const kontrolcu = new AbortController();

    (async () => {
      const izin = await Location.requestForegroundPermissionsAsync();
      if (kapandi) return;

      if (!izin.granted) {
        setKonumHatasi(
          "Konum izni verilmedi. Teklif alabilmek ve müşterinin seni görebilmesi için gerekiyor.",
        );
        return;
      }
      setKonumHatasi(null);

      /*
       * ARKA PLAN KONUMU HENÜZ YOK. İzinler yapılandırmada tanımlı ama görev
       * (TaskManager) müşterinin canlı takip ekranıyla birlikte açılacak;
       * şimdi eklemek, tüketicisi olmayan bir ön plan servisi ve kalıcı bir
       * bildirim demek olurdu. Uygulama açıkken konum akıyor.
       */
      abone = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: KONUM_ARALIGI_MS,
          distanceInterval: KONUM_MESAFESI_M,
        },
        (o) => {
          const yeni = { enlem: o.coords.latitude, boylam: o.coords.longitude };
          setKonum(yeni);
          uclar
            .konum(
              {
                ...yeni,
                dogruluk: o.coords.accuracy ?? undefined,
                yon: o.coords.heading ?? undefined,
                hiz: o.coords.speed ?? undefined,
              },
              kontrolcu.signal,
            )
            /* Tek bir bildirimin düşmesi vardiyayı bozmuyor; sonraki gider. */
            .catch(() => {});
        },
      );
    })();

    return () => {
      kapandi = true;
      kontrolcu.abort();
      abone?.remove();
    };
  }, [cevrimici, girisli]);

  /* --- Teklif yoklaması -------------------------------------------------- */

  const teklifleriCek = useCallback(async (isaret?: AbortSignal) => {
    try {
      const gelen = await uclar.teklifler(isaret);
      alimAni.current = Date.now();
      setTeklifler(gelen);
    } catch {
      /* Ağ kesildi: eldeki teklifler geri sayıma devam ediyor, süresi dolunca düşüyor. */
    }
  }, []);

  useEffect(() => {
    if (!cevrimici || !girisli) {
      setTeklifler([]);
      return;
    }

    const kontrolcu = new AbortController();
    void teklifleriCek(kontrolcu.signal);

    const sayac = setInterval(() => {
      /*
       * Uygulama arka plandayken yoklama YAPILMIYOR: kabul edilemeyecek bir
       * teklif için pil ve şebeke harcanmış olurdu. Öne geldiğinde ilk
       * yoklama hemen atılıyor (aşağıdaki AppState dinleyicisi).
       */
      if (AppState.currentState !== "active") return;
      void teklifleriCek(kontrolcu.signal);
    }, YOKLAMA_MS);

    const dinleyici = AppState.addEventListener("change", (yeniDurum) => {
      if (yeniDurum === "active") void teklifleriCek(kontrolcu.signal);
    });

    return () => {
      kontrolcu.abort();
      clearInterval(sayac);
      dinleyici.remove();
    };
  }, [cevrimici, girisli, teklifleriCek]);

  /** Geri sayım için saniyelik tik — yalnızca ekranda teklif varken. */
  useEffect(() => {
    if (teklifler.length === 0) return;
    const sayac = setInterval(() => setTik((t) => t + 1), 1000);
    return () => clearInterval(sayac);
  }, [teklifler.length]);

  /* --- Öne çıkan teklif -------------------------------------------------- */

  const { teklif, kalanSaniye, bekleyenSayisi } = useMemo(() => {
    const gecen = (Date.now() - alimAni.current) / 1000;

    /*
     * Süresi dolanlar eleniyor, sonra EN YENİSİ öne alınıyor: kurye bir
     * teklife bakarken yeni bir iş düşerse, yeni olan öne çıkıyor. Eskisi
     * kaybolmuyor — sırada bekliyor ve yenisi kapandığında geri geliyor.
     */
    const canli = teklifler
      .map((t) => ({ t, kalan: Math.round(t.kalanSaniye - gecen) }))
      .filter((k) => k.kalan > 0)
      .sort((a, b) => a.t.olusturmaTarihi.localeCompare(b.t.olusturmaTarihi));

    const on = canli[canli.length - 1];
    return {
      teklif: on?.t ?? null,
      kalanSaniye: on?.kalan ?? 0,
      bekleyenSayisi: Math.max(0, canli.length - 1),
    };
    // `tik` bilerek bağımlılıkta: saniyede bir yeniden hesaplansın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teklifler, tik]);

  /* --- Eylemler ---------------------------------------------------------- */

  const cevrimiciOl = useCallback(async (secilenArac: AracTuru) => {
    setIslemde(true);
    try {
      const d = await uclar.durumYaz({ cevrimici: true, arac: secilenArac });
      setCevrimici(d.cevrimici);
      setArac(d.arac);
    } finally {
      setIslemde(false);
    }
  }, []);

  const cevrimdisiOl = useCallback(async () => {
    setIslemde(true);
    try {
      const d = await uclar.durumYaz({ cevrimici: false });
      setCevrimici(d.cevrimici);
      setTeklifler([]);
    } finally {
      setIslemde(false);
    }
  }, []);

  const teklifKabul = useCallback(async (): Promise<KuryeTeslimatiDto | null> => {
    const suan = teklif;
    if (!suan) return null;

    setIslemde(true);
    try {
      const teslimat = await uclar.teklifKabul(suan.siparisNo);
      /* Kabul edilen iş listeden hemen düşüyor; yoklamayı beklemiyoruz. */
      setTeklifler((eski) => eski.filter((t) => t.siparisNo !== suan.siparisNo));
      setDegisim((d) => d + 1);
      return teslimat;
    } catch (e) {
      /*
       * 409 = işi başkası kapmış ya da süre dolmuş. Teklif ekrandan
       * kaldırılıyor; kuryeye mesajı çağıran ekran gösteriyor.
       */
      if (e instanceof ApiHatasi && e.durum === 409) {
        setTeklifler((eski) => eski.filter((t) => t.siparisNo !== suan.siparisNo));
      }
      throw e;
    } finally {
      setIslemde(false);
    }
  }, [teklif]);

  const teklifReddet = useCallback(async () => {
    const suan = teklif;
    if (!suan) return;

    /*
     * ÖNCE EKRANDAN KALDIRILIYOR, sonra sunucuya söyleniyor. Kurye "Reddet"e
     * bastığında kartın gitmesi için ağı beklemek, zayıf şebekede saniyelerce
     * donmuş bir ekran demekti; ret zaten geri alınabilir bir şey değil.
     */
    setTeklifler((eski) => eski.filter((t) => t.siparisNo !== suan.siparisNo));
    await uclar.teklifRet(suan.siparisNo).catch(() => {});
  }, [teklif]);

  const tazele = useCallback(() => {
    setDegisim((d) => d + 1);
    void teklifleriCek();
  }, [teklifleriCek]);

  const deger = useMemo<VardiyaDegeri>(
    () => ({
      hazir,
      cevrimici,
      arac,
      konum,
      konumHatasi,
      teklif,
      kalanSaniye,
      bekleyenSayisi,
      islemde,
      degisim,
      cevrimiciOl,
      cevrimdisiOl,
      teklifKabul,
      teklifReddet,
      tazele,
    }),
    [
      hazir,
      cevrimici,
      arac,
      konum,
      konumHatasi,
      teklif,
      kalanSaniye,
      bekleyenSayisi,
      islemde,
      degisim,
      cevrimiciOl,
      cevrimdisiOl,
      teklifKabul,
      teklifReddet,
      tazele,
    ],
  );

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}
