"use client";

import { useActionState, useState } from "react";

import {
  altinSefAction,
  hesapSilAction,
  mutfakBaglaAction,
  rolDegistirAction,
  type YonetimDurumu,
} from "@/app/admin/yonetim-actions";
import { Secim, Uyari } from "@/components/hesap/Alan";
import { Rozet } from "@/components/ui/Rozet";
import type { Hesap } from "@/lib/hesaplar";

const BASLANGIC: YonetimDurumu = {};

const ROLLER = [
  { deger: "sef", etiket: "Şef / Ev Hanımı" },
  { deger: "isletme", etiket: "İşletme" },
  { deger: "kurye", etiket: "Kurye" },
  { deger: "musteri", etiket: "Müşteri" },
];

const ROL_TONU = {
  sef: "sari",
  isletme: "acik",
  kurye: "nane",
  musteri: "kahve",
  admin: "domates",
} as const;

/** Tek hesabın yönetim kartı: rol değiştir, mutfağa bağla veya hesabı sil. */
export function HesapKarti({
  hesap,
  mutfakAdi,
  mutfaklar = [],
  altinSef = false,
}: {
  hesap: Hesap;
  mutfakAdi?: string;
  /** Bağlanabilecek mutfaklar — sabit içerik + onayla açılanlar. */
  mutfaklar?: { slug: string; ad: string; sahibi?: string }[];
  /** Bu şefin mutfağı Altın Şef unvanına sahip mi? */
  altinSef?: boolean;
}) {
  const [rolDurumu, rolDegistir, rolBekliyor] = useActionState(rolDegistirAction, BASLANGIC);
  const [baglaDurumu, bagla, baglaBekliyor] = useActionState(mutfakBaglaAction, BASLANGIC);
  const [altinDurumu, altinDegistir, altinBekliyor] = useActionState(altinSefAction, BASLANGIC);
  const [silDurumu, sil, silBekliyor] = useActionState(hesapSilAction, BASLANGIC);
  const [silOnayi, setSilOnayi] = useState(false);

  const tarih = new Date(hesap.olusturmaTarihi).toLocaleDateString("tr-TR");

  return (
    <article className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-extrabold text-kahve-900">{hesap.ad}</h3>
            <Rozet ton={ROL_TONU[hesap.rol]}>
              {ROLLER.find((r) => r.deger === hesap.rol)?.etiket ?? hesap.rol}
            </Rozet>
            {/* Hesabın nasıl açıldığı ve adresin doğrulanıp doğrulanmadığı. */}
            {hesap.saglayici === "google" && <Rozet ton="acik">Google</Rozet>}
            {hesap.epostaDogrulandi === false && (
              <Rozet ton="domates">E-posta doğrulanmadı</Rozet>
            )}
            {altinSef && <Rozet ton="sari">Altın Şef</Rozet>}
          </div>
          <p className="mt-1 truncate text-sm text-kahve-600">{hesap.eposta}</p>
          {hesap.telefon && (
            <a
              href={`tel:${hesap.telefon}`}
              className="tiklanabilir text-sm font-bold text-kahve-700 underline"
            >
              {hesap.telefon}
            </a>
          )}
          <p className="mt-0.5 text-xs text-kahve-400">
            Kayıt: {tarih}
            {mutfakAdi ? ` · Mutfak: ${mutfakAdi}` : ""}
          </p>
        </div>
      </header>

      {rolDurumu.hata && (
        <div className="mt-3">
          <Uyari tur="hata">{rolDurumu.hata}</Uyari>
        </div>
      )}
      {rolDurumu.basari && (
        <div className="mt-3">
          <Uyari tur="basari">{rolDurumu.basari}</Uyari>
        </div>
      )}
      {baglaDurumu.hata && (
        <div className="mt-3">
          <Uyari tur="hata">{baglaDurumu.hata}</Uyari>
        </div>
      )}
      {baglaDurumu.basari && (
        <div className="mt-3">
          <Uyari tur="basari">{baglaDurumu.basari}</Uyari>
        </div>
      )}
      {silDurumu.hata && (
        <div className="mt-3">
          <Uyari tur="hata">{silDurumu.hata}</Uyari>
        </div>
      )}

      <div className="mt-4 space-y-3 border-t border-kahve-900/8 pt-4">
        <form action={rolDegistir} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="eposta" value={hesap.eposta} />
          <label className="flex-1">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
              Rolü değiştir
            </span>
            <Secim name="rol" defaultValue={hesap.rol}>
              {ROLLER.map((r) => (
                <option key={r.deger} value={r.deger}>
                  {r.etiket}
                </option>
              ))}
            </Secim>
          </label>
          <button
            type="submit"
            disabled={rolBekliyor}
            className="tiklanabilir rounded-2xl bg-kahve-900 px-4 py-3 text-sm font-bold text-sari-300
              transition-colors hover:bg-kahve-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rolBekliyor ? "…" : "Kaydet"}
          </button>
        </form>

        {/*
          Mutfağa bağlama. Rol değiştirme bunu yapamıyor: var olan bağlantıyı
          koruyor ama yeni bağlantı kuramıyordu. İçerik dosyasında tanımlı bir
          mutfağı gerçek bir hesaba bağlamanın başka yolu yoktu.
        */}
        {mutfaklar.length > 0 && (
          <form action={bagla} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="eposta" value={hesap.eposta} />
            <label className="flex-1">
              <span className="mb-1.5 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
                Mutfağa bağla
              </span>
              <Secim name="restoranSlug" defaultValue={hesap.restoranSlug ?? ""}>
                <option value="">— bağlı değil —</option>
                {mutfaklar.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.ad}
                    {m.sahibi && m.sahibi !== hesap.eposta ? ` (${m.sahibi})` : ""}
                  </option>
                ))}
              </Secim>
            </label>
            <button
              type="submit"
              disabled={baglaBekliyor}
              className="tiklanabilir rounded-2xl bg-kahve-900 px-4 py-3 text-sm font-bold text-sari-300
                transition-colors hover:bg-kahve-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {baglaBekliyor ? "…" : "Bağla"}
            </button>
          </form>
        )}

        {/*
          ALTIN ŞEF — Şef Kaşığı atma yetkisi.
          Yalnızca bir mutfağa bağlı şef hesabında çıkıyor: unvan mutfağa
          bağlı, kaşık kayıtları da mutfaktan mutfağa tutuluyor.
        */}
        {(hesap.rol === "sef" || hesap.rol === "isletme") && hesap.restoranSlug && (
          <form action={altinDegistir} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="restoranSlug" value={hesap.restoranSlug} />
            <input type="hidden" name="ver" value={altinSef ? "0" : "1"} />
            <div className="flex-1">
              <span className="block text-xs font-bold tracking-wide text-kahve-700 uppercase">
                Altın Şef
              </span>
              <span className="text-xs text-kahve-500">
                {altinSef
                  ? "Şef Kaşığı atabiliyor."
                  : "Kaşık atamaz. Unvanı gerçek mesleği şeflik olan, özgeçmişi güçlü şeflere ver."}
              </span>
            </div>
            <button
              type="submit"
              disabled={altinBekliyor}
              className={`tiklanabilir rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors
                disabled:cursor-not-allowed disabled:opacity-50 ${
                  altinSef
                    ? "bg-kahve-900/6 text-kahve-700 hover:bg-kahve-900/12"
                    : "bg-sari-500 text-kahve-900 hover:bg-sari-400"
                }`}
            >
              {altinBekliyor ? "…" : altinSef ? "Unvanı geri al" : "Altın Şef yap"}
            </button>
          </form>
        )}
        {altinDurumu.hata && <Uyari tur="hata">{altinDurumu.hata}</Uyari>}
        {altinDurumu.basari && <Uyari tur="basari">{altinDurumu.basari}</Uyari>}

        {silOnayi ? (
          <form action={sil} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="eposta" value={hesap.eposta} />
            <p className="w-full text-xs font-semibold text-domates-koyu">
              {hesap.restoranSlug
                ? "Hesap ve mutfak sayfası kalıcı olarak silinecek. Emin misin?"
                : "Hesap kalıcı olarak silinecek. Emin misin?"}
            </p>
            <button
              type="submit"
              disabled={silBekliyor}
              className="tiklanabilir rounded-2xl bg-domates px-4 py-2.5 text-sm font-bold text-white
                transition-colors hover:bg-domates-koyu disabled:cursor-not-allowed disabled:opacity-50"
            >
              {silBekliyor ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button
              type="button"
              onClick={() => setSilOnayi(false)}
              className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
                font-bold text-kahve-700"
            >
              Vazgeç
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setSilOnayi(true)}
            className="tiklanabilir rounded-2xl border border-domates/40 px-4 py-2.5 text-sm
              font-bold text-domates-koyu transition-colors hover:bg-domates/10"
          >
            Hesabı sil
          </button>
        )}
      </div>
    </article>
  );
}
