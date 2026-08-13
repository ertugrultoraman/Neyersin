"use client";

import { useActionState, useState } from "react";

import {
  altinSefAction,
  hesabaGirAction,
  hesapSilAction,
  mutfakBaglaAction,
  oturumlariKesAction,
  parolaUretAction,
  rolDegistirAction,
  type YonetimDurumu,
} from "@/app/admin/yonetim-actions";
import { Secim, Uyari } from "@/components/hesap/Alan";
import { ProfilAvatari } from "@/components/hesap/ProfilAvatari";
import { ProfilFotografiAlani } from "@/components/hesap/ProfilFotografi";
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

/**
 * Tek hesabın yönetim kartı: rol değiştir, mutfağa bağla veya hesabı sil.
 *
 * Kart KAPALI açılıyor, üstüne basınca yönetim alanı iniyor. Her hesabın altı
 * formu birden açıkken liste ekranlarca uzuyordu; yönetici aradığı kişiyi
 * bulmak için sayfalarca kaydırıyordu. Kapalı hâlde bir hesap tek satır.
 *
 * `<details>` seçildi — açılıp kapanmayı, klavyeyi ve ekran okuyucuyu tarayıcı
 * hallediyor. Sunucu eylemi dönüp kart yeniden çizilse de (rol değişti, parola
 * üretildi) açıklık DOM'da durduğu için kart kapanmıyor, sonuç görünür kalıyor.
 */
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
  const [parolaDurumu, parolaUret, parolaBekliyor] = useActionState(parolaUretAction, BASLANGIC);
  const [oturumDurumu, oturumKes, oturumBekliyor] = useActionState(oturumlariKesAction, BASLANGIC);
  const [silOnayi, setSilOnayi] = useState(false);
  const [parolaOnayi, setParolaOnayi] = useState(false);

  const tarih = new Date(hesap.olusturmaTarihi).toLocaleDateString("tr-TR");

  return (
    /*
      `data-hesap`: kartı kime ait olduğundan yakalamanın TEK kesin yolu.
      Metinden bulmak işe yaramıyor — "Mutfağa bağla" listesi her kartta bütün
      mutfakları sahiplerinin adresiyle sayıyor, yani her kart her adresi
      içeriyor. Testler bu yüzden yanlış hesabı seçiyordu.
    */
    <article
      data-hesap={hesap.eposta}
      className="overflow-hidden rounded-3xl border border-kahve-900/8 bg-white shadow-yumusak"
    >
      <details className="group/hesap">
        <summary
          className="flex cursor-pointer list-none items-start justify-between gap-3 p-5
            transition-colors duration-300 hover:bg-sari-500/6
            [&::-webkit-details-marker]:hidden"
        >
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
            {/*
              Telefon kapalı kartta da duruyor: yönetici çoğu zaman kişiyi
              aramak için giriyor, bunun için kartı açtırmak gereksiz.
            */}
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

          <div className="flex shrink-0 items-center gap-3">
            {/*
              Profil görseli kapalı kartta da duruyor — listede yüzler
              adlardan daha hızlı taranıyor. Fotoğraf yoksa baş harfler.
            */}
            <ProfilAvatari
              ad={hesap.ad}
              url={hesap.fotografUrl}
              className="size-12 text-sm sm:size-14 sm:text-base"
            />

            {/* Açılır kart işareti — kapalıyken aşağı, açıkken yukarı bakıyor. */}
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-kahve-900/6
                text-kahve-700 transition-all duration-400 ease-[var(--ease-yumusak)]
                group-open/hesap:rotate-180 group-open/hesap:bg-sari-500
                group-open/hesap:text-kahve-900"
            >
              <svg viewBox="0 0 20 20" fill="none" className="size-4">
                <path
                  d="M5.5 8l4.5 4.5L14.5 8"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </summary>

        <div className="space-y-3 border-t border-kahve-900/8 px-5 pt-4 pb-5">
          {rolDurumu.hata && <Uyari tur="hata">{rolDurumu.hata}</Uyari>}
          {rolDurumu.basari && <Uyari tur="basari">{rolDurumu.basari}</Uyari>}
          {baglaDurumu.hata && <Uyari tur="hata">{baglaDurumu.hata}</Uyari>}
          {baglaDurumu.basari && <Uyari tur="basari">{baglaDurumu.basari}</Uyari>}
          {silDurumu.hata && <Uyari tur="hata">{silDurumu.hata}</Uyari>}

          {/* Profil fotoğrafı — kartın başındaki görselin geldiği yer. */}
          <div className="rounded-2xl bg-kahve-900/4 p-3.5">
            <span className="mb-2 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
              Profil fotoğrafı
            </span>
            <ProfilFotografiAlani
              ad={hesap.ad}
              url={hesap.fotografUrl}
              eposta={hesap.eposta}
              kimlik={hesap.eposta}
            />
          </div>

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

          {/*
            ERİŞİM — parolayı bilmeden hesaba girmenin iki yolu.

            "Hesap olarak gir" tercih edilen yol: kimsenin parolası değişmiyor,
            kişi sonradan parolasını değiştirse de çalışmaya devam ediyor.
            Parola üretmek yalnızca kişinin KENDİSİ giremediğinde gerekiyor.
          */}
          <div className="flex flex-wrap items-center gap-2 border-t border-kahve-900/8 pt-3">
            <form action={hesabaGirAction}>
              <input type="hidden" name="eposta" value={hesap.eposta} />
              <button
                type="submit"
                className="tiklanabilir rounded-2xl bg-kahve-900/6 px-4 py-2.5 text-sm font-bold
                  text-kahve-800 transition-colors hover:bg-kahve-900/12"
              >
                Hesap olarak gir
              </button>
            </form>

            {parolaOnayi ? (
              <form action={parolaUret} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="eposta" value={hesap.eposta} />
                <button
                  type="submit"
                  disabled={parolaBekliyor}
                  className="tiklanabilir rounded-2xl bg-sari-500 px-4 py-2.5 text-sm font-bold
                    text-kahve-900 transition-colors hover:bg-sari-400
                    disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {parolaBekliyor ? "Üretiliyor…" : "Evet, eskisini geçersiz kıl"}
                </button>
                <button
                  type="button"
                  onClick={() => setParolaOnayi(false)}
                  className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5
                    text-sm font-bold text-kahve-700"
                >
                  Vazgeç
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setParolaOnayi(true)}
                className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
                  font-bold text-kahve-700 transition-colors hover:bg-kahve-900/6"
              >
                Yeni parola üret
              </button>
            )}
          </div>

          {parolaDurumu.hata && <Uyari tur="hata">{parolaDurumu.hata}</Uyari>}
          {parolaDurumu.basari && (
            <div
              className="rounded-2xl border border-sari-500/40 bg-sari-300/25 p-3"
              data-parola-sonucu
            >
              <p className="font-mono text-sm font-bold break-all text-kahve-900 select-all">
                {parolaDurumu.basari}
              </p>
              <p className="mt-1 text-xs text-kahve-600">
                Parola KALICI: tek kullanımlık değil, süresi dolmuyor — kişi kendisi
                değiştirene (ya da buradan yenisi üretilene) kadar her girişte çalışır.
                Yalnızca EKRANDA bir kez görünüyor, sayfayı yenileyince kaybolur; parolalar
                geri okunamayan özet olarak saklandığı için sonradan gösterilemiyor. Not alın.
              </p>
            </div>
          )}

          {/*
            MOBİL OTURUMLARI KES — telefonu çalınan/kaybolan kişi için.
            Hesap silmenin yanında duruyor çünkü ikisi de "bu kişiyle bağı
            kes" işi, ama bu geri alınabilir: kişi parolasıyla tekrar
            girebiliyor. Parola değiştirmek yetmiyordu — mobil jetonlar
            parolaya bağlı değil (bkz. lib/mobil/cihazlar.ts).
          */}
          <form action={oturumKes} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="eposta" value={hesap.eposta} />
            <button
              type="submit"
              disabled={oturumBekliyor}
              className="tiklanabilir rounded-2xl border border-kahve-900/12 px-4 py-2.5 text-sm
                font-bold text-kahve-700 transition-colors hover:bg-kahve-900/5
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              {oturumBekliyor ? "Kesiliyor…" : "Mobil oturumları kes"}
            </button>
            {oturumDurumu.basari && (
              <span className="text-xs font-bold text-nane-koyu">{oturumDurumu.basari}</span>
            )}
            {oturumDurumu.hata && (
              <span className="text-xs font-bold text-domates-koyu">{oturumDurumu.hata}</span>
            )}
          </form>

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
      </details>
    </article>
  );
}
