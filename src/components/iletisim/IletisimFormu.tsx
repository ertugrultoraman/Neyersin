"use client";

import { useState, useTransition, type ReactNode } from "react";

import { basvuruGonder, type BasvuruKonusu, type BasvuruSonucu } from "@/app/iletisim/actions";
import { ilceAdlari } from "@/content/istanbul";
import { cn } from "@/lib/utils";
import { Buton, ButonBaglanti, OkIkon } from "../ui/Buton";
import { DukkanIkon, KontrolIkon, KullaniciIkon, ScooterIkon, VeriIkon } from "../ui/Ikonlar";

const KONULAR: { id: BasvuruKonusu; etiket: string; Ikon: typeof DukkanIkon; aciklama: string }[] = [
  {
    id: "restoran",
    etiket: "Restoranını ekle",
    Ikon: DukkanIkon,
    aciklama: "İşletmeni Ne Yersin?'e ekle — ilk 3 ay komisyonsuz.",
  },
  {
    id: "kurye",
    etiket: "Kurye ol",
    Ikon: ScooterIkon,
    aciklama: "Kendi saatini seç, haftalık ödeme al.",
  },
  {
    id: "kurumsal",
    etiket: "Kurumsal çözüm",
    Ikon: VeriIkon,
    aciklama: "Sektörüne özel otomasyon ve veri değerlendirme.",
  },
  {
    id: "destek",
    etiket: "Sipariş desteği",
    Ikon: KullaniciIkon,
    aciklama: "Mevcut siparişin veya hesabınla ilgili yardım.",
  },
];

export function IletisimFormu({ baslangicKonusu }: { baslangicKonusu: BasvuruKonusu }) {
  const [konu, setKonu] = useState<BasvuruKonusu>(baslangicKonusu);
  const [form, setForm] = useState({
    adSoyad: "",
    telefon: "",
    eposta: "",
    isletme: "",
    ilce: "",
    mesaj: "",
  });
  const [hatalar, setHatalar] = useState<Record<string, string | undefined>>({});
  const [referansNo, setReferansNo] = useState<string | null>(null);
  const [gonderiliyor, basla] = useTransition();

  function guncelle(alan: keyof typeof form, deger: string) {
    setForm((o) => ({ ...o, [alan]: deger }));
    setHatalar((o) => ({ ...o, [alan]: undefined }));
  }

  function gonder(e: React.FormEvent) {
    e.preventDefault();
    basla(async () => {
      const cevap: BasvuruSonucu = await basvuruGonder({ konu, ...form });
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
                setForm({ adSoyad: "", telefon: "", eposta: "", isletme: "", ilce: "", mesaj: "" });
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
                      {k.etiket}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-kahve-500">
                      {k.aciklama}
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
            {seciliKonu.etiket} formu
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="Ad Soyad" hata={hatalar.adSoyad} className="sm:col-span-2">
              <input
                value={form.adSoyad}
                onChange={(e) => guncelle("adSoyad", e.target.value)}
                autoComplete="name"
                className={girdi(hatalar.adSoyad)}
              />
            </Alan>

            <Alan etiket="Telefon" hata={hatalar.telefon}>
              <input
                value={form.telefon}
                onChange={(e) => guncelle("telefon", e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="5XX XXX XX XX"
                className={girdi(hatalar.telefon)}
              />
            </Alan>

            <Alan etiket="E-posta" hata={hatalar.eposta}>
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
                etiket={konu === "restoran" ? "İşletme adı" : "Şirket adı"}
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

            <Alan etiket="İlçe" ipucu="Zorunlu değil">
              <select
                value={form.ilce}
                onChange={(e) => guncelle("ilce", e.target.value)}
                className={girdi()}
              >
                <option value="">Seçiniz</option>
                {ilceAdlari.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Alan>

            <Alan etiket="Mesajın" hata={hatalar.mesaj} className="sm:col-span-2">
              <textarea
                value={form.mesaj}
                onChange={(e) => guncelle("mesaj", e.target.value)}
                rows={5}
                placeholder={
                  konu === "restoran"
                    ? "Kaç şubeniz var, hangi mutfak, günlük kaç sipariş bekliyorsunuz?"
                    : konu === "kurye"
                      ? "Hangi ilçede, hangi araçla ve hangi saatlerde çalışmak istiyorsun?"
                      : "Kısaca ihtiyacını anlat."
                }
                className={cn(girdi(hatalar.mesaj), "resize-y")}
              />
            </Alan>
          </div>

          <Buton
            type="submit"
            boyut="lg"
            className="w-full"
            disabled={gonderiliyor}
            ikon={gonderiliyor ? undefined : <OkIkon />}
          >
            {gonderiliyor ? "Gönderiliyor…" : "Başvuruyu gönder"}
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
