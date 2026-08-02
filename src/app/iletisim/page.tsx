import type { Metadata } from "next";

import { IletisimFormu } from "@/components/iletisim/IletisimFormu";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { site } from "@/content/site";
import type { BasvuruKonusu } from "./actions";

export const metadata: Metadata = {
  title: "İletişim & Başvuru",
  description:
    "Restoranını Ne Yersin?'e ekle, kurye ol veya kurumsal çözümler için görüşme planla.",
  alternates: { canonical: "/iletisim" },
};

const GECERLI_KONULAR: BasvuruKonusu[] = ["restoran", "kurye", "kurumsal"];

export default async function IletisimSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ konu?: string }>;
}) {
  const { konu } = await searchParams;
  const baslangicKonusu: BasvuruKonusu =
    konu && GECERLI_KONULAR.includes(konu as BasvuruKonusu)
      ? (konu as BasvuruKonusu)
      : "restoran";

  return (
    <>
      <SayfaBasligi
        ustBaslik="İletişim"
        baslik={
          <>
            Konuşalım — <span className="metin-sari">1 iş günü</span> içinde dönüyoruz
          </>
        }
        aciklama="İşletmeni eklemek, kurye olmak veya kurumsal çözüm konuşmak için formu doldur. Mevcut siparişinle ilgili yardım için sağ alttaki canlı desteği kullan."
        kirintiYolu={[{ etiket: "İletişim" }]}
        cocuk={
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                Telefon
              </dt>
              <dd className="mt-0.5">
                <a
                  href={`tel:${site.telefon.replace(/\s/g, "")}`}
                  className="font-display font-extrabold text-kahve-900 transition-colors
                    duration-300 hover:text-sari-700"
                >
                  {site.telefon}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">
                E-posta
              </dt>
              <dd className="mt-0.5">
                <a
                  href={`mailto:${site.eposta}`}
                  className="font-display font-extrabold text-kahve-900 transition-colors
                    duration-300 hover:text-sari-700"
                >
                  {site.eposta}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-bold tracking-wide text-kahve-400 uppercase">Adres</dt>
              <dd className="mt-0.5 max-w-xs font-semibold text-kahve-700">{site.adres}</dd>
            </div>
          </dl>
        }
      />
      <IletisimFormu baslangicKonusu={baslangicKonusu} />
    </>
  );
}
