"use client";

import { useState, useTransition, type ReactNode } from "react";

import { basvuruGonder, type BasvuruKonusu, type BasvuruSonucu } from "@/app/iletisim/actions";
import { ilceAdlari } from "@/content/istanbul";
import { cn } from "@/lib/utils";
import { Buton, ButonBaglanti, OkIkon } from "../ui/Buton";
import { DukkanIkon, KontrolIkon, ScooterIkon, VeriIkon } from "../ui/Ikonlar";
import { useDil } from "../saglayici/DilBaglami";
import { BelgeYukle } from "../hesap/BelgeYukle";

/**
 * KURYE ARAÇLARI. Motorlu olanlarda ehliyet ve SRC soruluyor, bisiklet ve
 * elektrikli scooterda sorulmuyor — olmayan belgeyi zorunlu tutmak, o araçla
 * çalışacak kişiyi formun ortasında durdururdu.
 */
const ARACLAR = [
  { id: "motosiklet", etiket: "iletisim.aracMotosiklet", motorlu: true },
  { id: "moped", etiket: "iletisim.aracMoped", motorlu: true },
  { id: "otomobil", etiket: "iletisim.aracOtomobil", motorlu: true },
  { id: "scooter", etiket: "iletisim.aracScooter", motorlu: false },
  { id: "bisiklet", etiket: "iletisim.aracBisiklet", motorlu: false },
] as const;

/** Türkiye'de motosiklet sınıfları A1/A2/A; otomobil için B. */
const EHLIYET_SINIFLARI = ["A1", "A2", "A", "B"];

const KONULAR: { id: BasvuruKonusu; etiket: string; Ikon: typeof DukkanIkon; aciklama: string }[] = [
  {
    id: "restoran",
    etiket: "iletisim.restoranEkle",
    Ikon: DukkanIkon,
    aciklama: "iletisim.restoranAciklama",
  },
  {
    id: "kurye",
    etiket: "basvuru.kurye",
    Ikon: ScooterIkon,
    aciklama: "iletisim.kuryeAciklama",
  },
  {
    id: "kurumsal",
    etiket: "iletisim.kurumsal",
    Ikon: VeriIkon,
    aciklama: "iletisim.kurumsalAciklama",
  },
];

export function IletisimFormu({ baslangicKonusu }: { baslangicKonusu: BasvuruKonusu }) {
  const { c } = useDil();
  const [konu, setKonu] = useState<BasvuruKonusu>(baslangicKonusu);
  const [form, setForm] = useState({
    adSoyad: "",
    telefon: "",
    eposta: "",
    isletme: "",
    ilce: "",
    mesaj: "",
    /* Yalnızca kurye başvurusunda doldurulanlar. */
    arac: "",
    ehliyet: "",
    src: "",
  });
  const [hatalar, setHatalar] = useState<Record<string, string | undefined>>({});
  const [referansNo, setReferansNo] = useState<string | null>(null);
  const [belgeler, setBelgeler] = useState<File[]>([]);
  const [gonderiliyor, basla] = useTransition();

  function guncelle(alan: keyof typeof form, deger: string) {
    setForm((o) => ({ ...o, [alan]: deger }));
    setHatalar((o) => ({ ...o, [alan]: undefined }));
  }

  function gonder(e: React.FormEvent) {
    e.preventDefault();
    basla(async () => {
      const cevap: BasvuruSonucu = await basvuruGonder({ konu, ...form, belgeler });
      if (cevap.basarili) {
        setReferansNo(cevap.referansNo);
        setHatalar({});
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setHatalar(cevap.hatalar);
      }
    });
  }

  if (referansNo) {
    return (
      <div className="kap py-12 md:py-16">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-nane/25 bg-nane/8 p-8 text-center md:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-4xl bg-nane text-white">
            <KontrolIkon className="size-8" strokeWidth="2.6" />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold">Başvurun bize ulaştı</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-kahve-700">
            Ekibimiz en geç 1 iş günü içinde dönüş yapacak. Referans numaranı saklayabilirsin.
          </p>
          <p className="mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-white px-6 py-4 shadow-yumusak">
            <span className="text-2xs font-bold tracking-[0.16em] text-kahve-400 uppercase">
              Referans no
            </span>
            <span className="font-display text-xl font-extrabold text-kahve-900">
              {referansNo}
            </span>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButonBaglanti href="/" boyut="lg">
              Ana sayfaya dön
              <OkIkon />
            </ButonBaglanti>
            <Buton
              type="button"
              tur="hayalet"
              boyut="lg"
              onClick={() => {
                setReferansNo(null);
                setForm({
                  adSoyad: "",
                  telefon: "",
                  eposta: "",
                  isletme: "",
                  ilce: "",
                  mesaj: "",
                  arac: "",
                  ehliyet: "",
                  src: "",
                });
              }}
            >
              Yeni başvuru
            </Buton>
          </div>
        </div>
      </div>
    );
  }

  const seciliKonu = KONULAR.find((k) => k.id === konu) ?? KONULAR[0];
  const motorluArac = ARACLAR.find((a) => a.id === form.arac)?.motorlu ?? false;

  return (
    <div className="kap py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Konu seçimi */}
        <fieldset>
          <legend className="text-xs font-bold tracking-wide text-kahve-700 uppercase">
            Konu
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {KONULAR.map((k) => {
              const secili = k.id === konu;
              return (
                <label
                  key={k.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4",
                    "transition-[border-color,background-color] duration-300",
                    secili
                      ? "border-sari-500 bg-sari-500/8"
                      : "border-kahve-900/10 bg-white hover:border-kahve-900/25",
                  )}
                >
                  <input
                    type="radio"
                    name="konu"
                    value={k.id}
                    checked={secili}
                    onChange={() => setKonu(k.id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl transition-colors duration-300",
                      secili ? "bg-sari-500 text-kahve-900" : "bg-kahve-900/6 text-kahve-500",
                    )}
                  >
                    <k.Ikon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-display text-sm font-extrabold text-kahve-900">
                      {c(k.etiket)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-kahve-500">
                      {c(k.aciklama)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <form
          onSubmit={gonder}
          noValidate
          className="mt-8 space-y-5 rounded-[2rem] border border-kahve-900/8 bg-white/70 p-5 md:p-8"
        >
          <p className="flex items-center gap-2.5 text-sm font-semibold text-kahve-700">
            <seciliKonu.Ikon className="size-4.5 text-sari-700" />
            {c("iletisim.formu", { konu: c(seciliKonu.etiket) })}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket={c("odeme.adSoyad")} hata={hatalar.adSoyad} className="sm:col-span-2">
              <input
                value={form.adSoyad}
                onChange={(e) => guncelle("adSoyad", e.target.value)}
                autoComplete="name"
                className={girdi(hatalar.adSoyad)}
              />
            </Alan>

            <Alan etiket={c("hesap.telefon")} hata={hatalar.telefon}>
              <input
                value={form.telefon}
                onChange={(e) => guncelle("telefon", e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="5XX XXX XX XX"
                className={girdi(hatalar.telefon)}
              />
            </Alan>

            <Alan etiket={c("hesap.eposta")} hata={hatalar.eposta}>
              <input
                value={form.eposta}
                onChange={(e) => guncelle("eposta", e.target.value)}
                autoComplete="email"
                inputMode="email"
                className={girdi(hatalar.eposta)}
              />
            </Alan>

            {(konu === "restoran" || konu === "kurumsal") && (
              <Alan
                etiket={konu === "restoran" ? c("iletisim.isletmeAdi") : c("iletisim.sirketAdi")}
                hata={hatalar.isletme}
              >
                <input
                  value={form.isletme}
                  onChange={(e) => guncelle("isletme", e.target.value)}
                  autoComplete="organization"
                  className={girdi(hatalar.isletme)}
                />
              </Alan>
            )}

            <Alan etiket={c("odeme.ilce")} ipucu={c("odeme.zorunluDegil")}>
              <select
                value={form.ilce}
                onChange={(e) => guncelle("ilce", e.target.value)}
                className={girdi()}
              >
                <option value="">{c("iletisim.seciniz")}</option>
                {ilceAdlari.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Alan>

            {/*
              KURYENİN KENDİ SORULARI. Önceden herkese aynı üç alan soruluyor,
              araç ve ehliyet yalnızca serbest mesaj kutusunda geçiyordu:
              başvuruyu değerlendiren kişi "bu kişi motorlu mu, ehliyeti var mı"
              sorusunu her seferinde e-postayla tekrar sormak zorunda kalıyordu.

              Ehliyet ve SRC yalnızca MOTORLU araçta çıkıyor — bisikletli
              kuryeden olmayan belgeyi istemenin anlamı yok.
            */}
            {konu === "kurye" && (
              <>
                <Alan etiket={c("iletisim.arac")} hata={hatalar.arac}>
                  <select
                    value={form.arac}
                    onChange={(e) => {
                      guncelle("arac", e.target.value);
                      /* Araç motorsuza dönerse eski ehliyet/SRC cevabı kalmasın. */
                      if (!ARACLAR.find((a) => a.id === e.target.value)?.motorlu) {
                        setForm((o) => ({ ...o, ehliyet: "", src: "" }));
                      }
                    }}
                    className={girdi(hatalar.arac)}
                  >
                    <option value="">{c("iletisim.seciniz")}</option>
                    {ARACLAR.map((a) => (
                      <option key={a.id} value={a.id}>
                        {c(a.etiket)}
                      </option>
                    ))}
                  </select>
                </Alan>

                {motorluArac && (
                  <>
                    <Alan
                      etiket={c("iletisim.ehliyet")}
                      ipucu={c("iletisim.ehliyetIpucu")}
                      hata={hatalar.ehliyet}
                    >
                      <select
                        value={form.ehliyet}
                        onChange={(e) => guncelle("ehliyet", e.target.value)}
                        className={girdi(hatalar.ehliyet)}
                      >
                        <option value="">{c("iletisim.seciniz")}</option>
                        {EHLIYET_SINIFLARI.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        <option value="yok">{c("iletisim.ehliyetYok")}</option>
                      </select>
                    </Alan>

                    <Alan etiket={c("iletisim.src")} hata={hatalar.src}>
                      <select
                        value={form.src}
                        onChange={(e) => guncelle("src", e.target.value)}
                        className={girdi(hatalar.src)}
                      >
                        <option value="">{c("iletisim.seciniz")}</option>
                        <option value="var">{c("iletisim.belgeVar")}</option>
                        <option value="yok">{c("iletisim.belgeYok")}</option>
                      </select>
                    </Alan>
                  </>
                )}

                <p className="text-xs leading-relaxed text-kahve-500 sm:col-span-2">
                  {c("iletisim.kuryeNot")}
                </p>
              </>
            )}

            <Alan etiket="Mesajın" hata={hatalar.mesaj} className="sm:col-span-2">
              <textarea
                value={form.mesaj}
                onChange={(e) => guncelle("mesaj", e.target.value)}
                rows={5}
                placeholder={
                  konu === "restoran"
                    ? c("iletisim.restoranMesajYer")
                    : konu === "kurye"
                      ? c("iletisim.kuryeMesajYer")
                      : c("iletisim.genelMesajYer")
                }
                className={cn(girdi(hatalar.mesaj), "resize-y")}
              />
            </Alan>
          </div>

          {/*
            RESMÎ EVRAK — istenen belge KONUYA göre değişiyor: restoranda ruhsat
            ve gıda sicili, kuryede araca uygun ehliyet ve SRC, kurumsalda şirket
            evrakı. Kurye ve kurumsalda ipucu HİÇ verilmiyordu; BelgeYukle kendi
            varsayılanına düşüyor ve ikisi de "Tarım ve Orman Bakanlığı belgeni
            ekle" yazısını görüyordu — ne kuryenin ne de şirketin işi olan bir
            evrak.
          */}
          <div className="mt-4">
            <BelgeYukle
              ipucu={
                konu === "restoran"
                  ? c("belge.ipucuIsletme")
                  : konu === "kurye"
                    ? c("belge.ipucuKurye")
                    : c("belge.ipucuKurumsal")
              }
              onDegisti={setBelgeler}
            />
          </div>

          <Buton
            type="submit"
            boyut="lg"
            className="w-full"
            disabled={gonderiliyor}
            ikon={gonderiliyor ? undefined : <OkIkon />}
          >
            {gonderiliyor ? c("form.gonderiliyor") : c("basvuru.basvuruyuGonder")}
          </Buton>
        </form>
      </div>
    </div>
  );
}

function girdi(hata?: string) {
  return cn(
    "w-full rounded-2xl border bg-white px-4 py-3 text-[0.9375rem] font-medium text-kahve-900",
    "transition-[border-color] duration-300 placeholder:text-kahve-400",
    "focus:outline-none focus:ring-2 focus:ring-sari-500/40",
    hata ? "border-domates" : "border-kahve-900/12 focus:border-sari-500/60",
  );
}

function Alan({
  etiket,
  hata,
  ipucu,
  children,
  className,
}: {
  etiket: string;
  hata?: string;
  ipucu?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold tracking-wide text-kahve-700 uppercase">{etiket}</span>
        {ipucu && !hata && <span className="text-2xs font-medium text-kahve-400">{ipucu}</span>}
      </span>
      {children}
      {hata && (
        <span role="alert" className="mt-1.5 block text-xs font-semibold text-domates-koyu">
          {hata}
        </span>
      )}
    </label>
  );
}
