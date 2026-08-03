import { anketSonucu } from "@/app/anket-actions";
import { ANKET_SORUSU } from "@/content/anket";
import { Anket } from "./Anket";

/**
 * Anketi sayfanın SAĞINDA konumlandıran sarmalayıcı.
 *
 * Geniş ekranda sağa yaslanıp dar bir sütunda duruyor, telefonda tam genişliğe
 * yayılıyor — dar ekranda yan yana koymak ikisini de okunmaz yapardı.
 *
 * Sunucu bileşeni: sonuç veritabanından burada okunuyor, oy verme etkileşimi
 * içerideki istemci bileşeninde.
 */
export async function AnketSeridi() {
  const sonuc = await anketSonucu();

  return (
    <section className="kap py-8">
      <div className="flex justify-end">
        <div className="w-full max-w-sm">
          <Anket sonuc={sonuc} baslik={ANKET_SORUSU} />
        </div>
      </div>
    </section>
  );
}
