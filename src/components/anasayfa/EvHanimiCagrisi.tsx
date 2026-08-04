import { AkilliGorsel } from "../ui/AkilliGorsel";
import { Bolum } from "../ui/Bolum";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { KalkanIkon, ScooterIkon, YildizIkon } from "../ui/Ikonlar";
import { Kademeli, KademeliOge, Reveal } from "../ui/Reveal";
import { UstBaslik } from "../ui/Rozet";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Anasayfadaki ev hanımı/şef çağrısı. "Ayın Hanımları" şeridi mevcut profilleri
 * gösterirken bu bölüm henüz katılmamış kişilere sesleniyor ve /ev-hanimlari
 * sayfasına götürüyor.
 */
const MADDELER = [
  {
    Ikon: ScooterIkon,
    baslik: "Kuryeyi biz ayarlıyoruz",
    metin: "Her sipariş tek bir kuryeye atanır, teslimat ücreti alınmaz.",
  },
  {
    Ikon: YildizIkon,
    baslik: "Üç ayrı puan",
    metin: "Sıcaklık, teslimat hızı ve tad ayrı ayrı — emeğin tek yıldıza sıkışmaz.",
  },
  {
    Ikon: KalkanIkon,
    baslik: "Numaran gizli kalır",
    metin: "İletişim sipariş üzerinden yürür; adres ve telefon paylaşılmaz.",
  },
];

export async function EvHanimiCagrisi() {
  const c = ceviri(await aktifDil());

  return (
    <Bolum id="ev-hanimlari" className="bant-sari">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <Reveal>
            <UstBaslik className="mb-4">Ev Hanımları & Şefler</UstBaslik>
            <h2 className="text-3xl leading-[1.06] font-extrabold sm:text-4xl md:text-[2.75rem]">
              {"Mutfağın zaten var — "}
              <span className="metin-sari">dükkânın da olsun</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-kahve-600 md:text-lg">
              Evinde pişirip satmak istiyorsan başvur, onaylandığın gün kendi adınla bir mutfak
              sayfan açılsın. Sen yemeğine bak; müşteriyi, kuryeyi ve tahsilatı biz üstlenelim.
            </p>
          </Reveal>

          <Kademeli etiket="ul" aralik={0.07} className="mt-8 space-y-3.5">
            {MADDELER.map((m) => (
              <KademeliOge key={m.baslik} etiket="li" className="flex gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-sari-500/16 text-sari-700">
                  <m.Ikon className="size-4.5" />
                </span>
                <span>
                  <span className="block font-display text-sm font-extrabold text-kahve-900">
                    {m.baslik}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-kahve-600">
                    {m.metin}
                  </span>
                </span>
              </KademeliOge>
            ))}
          </Kademeli>

          <Reveal gecikme={0.12} className="mt-9 flex flex-wrap gap-3">
            <ButonBaglanti href="/hesap/basvuru" boyut="lg">
              {c("evHanimi.basvuruYap")}
              <OkIkon />
            </ButonBaglanti>
            <ButonBaglanti href="/ev-hanimlari" tur="hayalet" boyut="lg">
              {c("evHanimi.nasilIsliyor")}
            </ButonBaglanti>
          </Reveal>
        </div>

        <Reveal gecikme={0.1}>
          <AkilliGorsel
            anahtar="restoran/anne-sofrasi"
            alt="Ev mutfağında hazırlanan yemek"
            oran="4/3"
            sizes="(min-width: 1024px) 30rem, 92vw"
            className="overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgb(59_36_18/0.14)]"
          />
        </Reveal>
      </div>
    </Bolum>
  );
}
