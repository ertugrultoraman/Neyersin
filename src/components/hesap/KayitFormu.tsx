"use client";

import { useActionState } from "react";

import { kayitDogrulaAction, musteriKayitAction, type KodDurumu } from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";
import { KodGirdisi, KoduTekrarGonder, PostaGitmediUyarisi } from "./KodAlani";

const BASLANGIC: KodDurumu = {};

/**
 * Müşteri kaydı — İKİ ADIM.
 *
 *  1. Bilgiler girilir, hesap açılır ve adrese 6 haneli kod gider.
 *  2. Kod ekrana yazılır; doğrulanınca oturum açılır.
 *
 * Kod adımı ayrı bir sayfaya gitmiyor, formun kendisi dönüşüyor — kişi
 * "kaydoldum mu olmadım mı" belirsizliğinde kalmasın.
 *
 * Şef / ev hanımı / kurye hesapları buradan AÇILMAZ: onlar başvuru formunu
 * doldurur (parolalarını orada belirler) ve yönetici onayladığı anda hesapları
 * açılır.
 */
export function KayitFormu({ donus }: { donus?: string }) {
  const [durum, gonder, bekliyor] = useActionState(musteriKayitAction, BASLANGIC);

  if (durum.adim === "kod" && durum.eposta) {
    return <DogrulamaAdimi durum={durum} donus={donus} />;
  }

  return (
    <form action={gonder} className="mt-6 space-y-4">
      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}
      {donus && <input type="hidden" name="donus" value={donus} />}

      <Alan etiket="Ad ve soyad">
        <Girdi type="text" name="ad" required autoComplete="name" minLength={3} />
      </Alan>

      <Alan etiket="E-posta" ipucu="Doğrulama kodu bu adrese gönderilecek.">
        <Girdi type="email" name="eposta" required autoComplete="email" />
      </Alan>

      <Alan etiket="Telefon" ipucu="İsteğe bağlı — sipariş formunda hazır gelir.">
        <Girdi type="tel" name="telefon" autoComplete="tel" placeholder="5XXXXXXXXX" />
      </Alan>

      <Alan etiket="Parola" ipucu="En az 8 karakter.">
        <Girdi type="password" name="parola" required autoComplete="new-password" minLength={8} />
      </Alan>

      <Buton
        type="submit"
        boyut="lg"
        className="w-full"
        disabled={bekliyor}
        ikon={bekliyor ? undefined : <OkIkon />}
      >
        {bekliyor ? "Hesap oluşturuluyor…" : "Devam et"}
      </Buton>
    </form>
  );
}

function DogrulamaAdimi({ durum, donus }: { durum: KodDurumu; donus?: string }) {
  const [kodDurumu, dogrula, bekliyor] = useActionState(kayitDogrulaAction, durum);
  const eposta = kodDurumu.eposta ?? durum.eposta ?? "";

  return (
    <div className="mt-6">
      {/* Adım göstergesi — kişi ikinci adımda olduğunu görsün */}
      <div className="mb-5 flex items-center gap-2 text-2xs font-extrabold text-kahve-500">
        <span className="grid size-6 place-items-center rounded-full bg-nane/20 text-nane-koyu">
          ✓
        </span>
        <span className="h-px flex-1 bg-kahve-900/12" />
        <span className="grid size-6 place-items-center rounded-full bg-sari-500 text-kahve-900">
          2
        </span>
      </div>

      <h2 className="font-display text-lg font-extrabold text-kahve-900">E-postanı doğrula</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-kahve-600">
        <strong className="text-kahve-900">{eposta}</strong> adresine 6 haneli bir kod gönderdik.
        Kodu aşağıya yaz.
      </p>

      <form action={dogrula} className="mt-5 space-y-4">
        {kodDurumu.hata && <Uyari tur="hata">{kodDurumu.hata}</Uyari>}
        {kodDurumu.postaGitmedi && <PostaGitmediUyarisi />}

        <input type="hidden" name="eposta" value={eposta} />
        {donus && <input type="hidden" name="donus" value={donus} />}

        <Alan etiket="Doğrulama kodu">
          <KodGirdisi />
        </Alan>

        <Buton
          type="submit"
          boyut="lg"
          className="w-full"
          disabled={bekliyor}
          ikon={bekliyor ? undefined : <OkIkon />}
        >
          {bekliyor ? "Doğrulanıyor…" : "Doğrula ve hesabımı aç"}
        </Buton>
      </form>

      <KoduTekrarGonder eposta={eposta} amac="kayit" />

      <p className="mt-3 text-center text-xs leading-relaxed text-kahve-500">
        Kod 15 dakika geçerlidir. Gelen kutunda yoksa spam klasörüne de bak.
      </p>
    </div>
  );
}
