import { useCallback, useEffect, useRef, useState } from "react";

import { ApiHatasi } from "./src/api/istemci";

/**
 * VERİ ÇEKME KANCASI.
 *
 * Neden elle yazıldı: react-query gibi bir kütüphane bu uygulamanın ihtiyacı
 * olmayan bir sürü şey getiriyor (önbellek geçersizleştirme grafiği, sonsuz
 * sorgular, mutation kuyruğu) ve paket boyutuna ilk açılış süresi olarak
 * yansıyor. Buradaki ekranlar "aç, göster, aşağı çekince tazele" kalıbından
 * ibaret; ihtiyaç büyürse geçiş yapılır.
 *
 * Dört durum ayrı ayrı taşınıyor çünkü ekranda dördü ayrı görünüyor:
 *  - `yukleniyor`: ilk açılış. İskelet gösteriliyor.
 *  - `tazeleniyor`: veri EKRANDA ama yeniden isteniyor (aşağı çekme, süzgeç
 *    değişimi). Liste yerinde kalıyor, yalnızca dönen halka görünüyor.
 *  - `hata`: gösterilecek veri yok.
 *  - `veri`: dolu.
 *
 * `yukleniyor` ile `tazeleniyor` ayrımı olmasaydı, kategoriye her dokunuşta
 * liste boşalıp iskelete dönerdi — süzgeç gezinmek ekranı sürekli zıplatırdı.
 */

export type VeriDurumu<T> = {
  veri: T | null;
  yukleniyor: boolean;
  tazeleniyor: boolean;
  hata: ApiHatasi | null;
  tazele: () => void;
};

export function useVeri<T>(
  getir: () => Promise<T>,
  /**
   * Değiştiğinde istek yeniden atılıyor. Süzgeç nesnesi değil DİZGE
   * bekleniyor: nesne her render'da yeniden kurulduğu için bağımlılık
   * karşılaştırması hep "değişti" derdi ve istek sonsuz döngüye girerdi.
   */
  anahtar: string,
): VeriDurumu<T> {
  const [veri, setVeri] = useState<T | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tazeleniyor, setTazeleniyor] = useState(false);
  const [hata, setHata] = useState<ApiHatasi | null>(null);

  /*
   * `getir` çağrı yerinde ok fonksiyonu olarak yazılıyor ve her render'da
   * kimliği değişiyor. Bağımlılığa konulsaydı istek durmadan tekrarlanırdı;
   * ref'te tutulup yalnızca `anahtar` değişince kullanılıyor.
   */
  const getirRef = useRef(getir);
  getirRef.current = getir;

  /** Sıra numarası: eski istek geç dönerse yeni sonucu EZMESİN. */
  const sira = useRef(0);

  const calistir = useCallback(async (tazelemeMi: boolean) => {
    const benim = ++sira.current;
    tazelemeMi ? setTazeleniyor(true) : setYukleniyor(true);

    try {
      const sonuc = await getirRef.current();
      if (benim !== sira.current) return;
      setVeri(sonuc);
      setHata(null);
    } catch (e) {
      if (benim !== sira.current) return;
      setHata(
        e instanceof ApiHatasi
          ? e
          : new ApiHatasi("sunucu_hatasi", "Beklenmeyen bir hata oluştu.", 0),
      );
    } finally {
      if (benim === sira.current) {
        setYukleniyor(false);
        setTazeleniyor(false);
      }
    }
  }, []);

  useEffect(() => {
    /*
     * İlk yükleme mi tazeleme mi: ekranda veri varsa (süzgeç değişti) liste
     * yerinde kalsın diye tazeleme sayılıyor. `veri` bağımlılığa KONULMUYOR —
     * konulsaydı her başarılı istek yeni bir istek tetiklerdi.
     */
    void calistir(veri !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anahtar, calistir]);

  const tazele = useCallback(() => {
    void calistir(true);
  }, [calistir]);

  return { veri, yukleniyor, tazeleniyor, hata, tazele };
}
