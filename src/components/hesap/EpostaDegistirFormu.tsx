"use client";

import { useActionState } from "react";

import {
  epostaDegistirDogrulaAction,
  epostaDegistirIsteAction,
  type KodDurumu,
} from "@/app/hesap/actions";
import { Buton, OkIkon } from "../ui/Buton";
import { Alan, Girdi, Uyari } from "./Alan";
import { KodGirdisi, KoduTekrarGonder, PostaGitmediUyarisi } from "./KodAlani";
import { useDil } from "../saglayici/DilBaglami";

const BASLANGIC: KodDurumu = {};

/**
 * E-posta adresini değiştirme — iki adım.
 *
 *  1. Yeni adres + MEVCUT PAROLA. Parola isteniyor çünkü oturumu açık
 *     bırakılmış bir cihaza oturan biri adresi kendine çevirip hesabı ele
 *     geçirebilirdi.
 *  2. Kod YENİ adrese gidiyor; kişi o adrese eriştiğini kanıtlıyor.
 *
 * Geçmiş siparişler de yeni adrese taşınıyor — hem geçmiş kaybolmasın hem de
 * "ilk siparişe özel" kupon adres değiştirilerek tekrar kullanılamasın.
 */
export function EpostaDegistirFormu({ mevcutEposta }: { mevcutEposta: string }) {
  const { c } = useDil();
  const [durum, kodIste, bekliyor] = useActionState(epostaDegistirIsteAction, BASLANGIC);

  if (durum.adim === "kod" && durum.eposta) {
    return <KodAdimi durum={durum} />;
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-kahve-900">E-postamı değiştir</h2>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-kahve-600">
        Şu anki adresin <strong className="text-kahve-900">{mevcutEposta}</strong>. Yeni adresine
        bir doğrulama kodu göndereceğiz; kodu girene kadar adresin değişmez.
      </p>

      <form action={kodIste} className="mt-5 max-w-md space-y-4">
        {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}

        <Alan etiket="Yeni e-posta">
          <Girdi type="email" name="yeniEposta" required autoComplete="email" />
        </Alan>

        <Alan etiket={c("parola.mevcut")} ipucu={c("parola.mevcutIpucu")}>
          <Girdi type="password" name="parola" required autoComplete="current-password" />
        </Alan>

        <Buton type="submit" disabled={bekliyor} ikon={bekliyor ? undefined : <OkIkon />}>
          {bekliyor ? c("form.gonderiliyor") : c("parola.kodGonder")}
        </Buton>
      </form>

      <p className="mt-5 max-w-xl rounded-2xl bg-kahve-900/4 px-4 py-3 text-xs leading-relaxed text-kahve-600">
        Adresin değiştiğinde geçmiş siparişlerin de yeni adresine taşınır — sipariş geçmişini
        kaybetmezsin.
      </p>
    </div>
  );
}

function KodAdimi({ durum }: { durum: KodDurumu }) {
  const { c } = useDil();
  const [sonDurum, dogrula, bekliyor] = useActionState(epostaDegistirDogrulaAction, durum);
  const yeniAdres = sonDurum.eposta ?? durum.eposta ?? "";

  // Değişiklik tamamlandı: form yerine sonuç gösteriliyor.
  if (sonDurum.basari && !sonDurum.adim) {
    return (
      <div>
        <h2 className="font-display text-xl font-extrabold text-kahve-900">E-postamı değiştir</h2>
        <div className="mt-4 max-w-xl">
          <Uyari tur="basari">{sonDurum.basari}</Uyari>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-kahve-900">Yeni adresini doğrula</h2>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-kahve-600">
        <strong className="text-kahve-900">{yeniAdres}</strong> adresine 6 haneli bir kod
        gönderdik. Kodu girmeden adresin değişmez.
      </p>

      <form action={dogrula} className="mt-5 max-w-xs space-y-4">
        {sonDurum.hata && <Uyari tur="hata">{sonDurum.hata}</Uyari>}
        {sonDurum.postaGitmedi && <PostaGitmediUyarisi />}

        <input type="hidden" name="eposta" value={yeniAdres} />

        <Alan etiket={c("hesap.dogrulamaKodu")}>
          <KodGirdisi />
        </Alan>

        <Buton type="submit" disabled={bekliyor} ikon={bekliyor ? undefined : <OkIkon />}>
          {bekliyor ? c("form.dogrulaniyor") : c("parola.adresimiDegistir")}
        </Buton>
      </form>

      <div className="max-w-xs">
        <KoduTekrarGonder eposta={yeniAdres} amac="eposta" />
      </div>
    </div>
  );
}
