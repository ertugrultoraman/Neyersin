"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

import {
  urunKaydetAction,
  urunSilAction,
  urunYayinAction,
  type UrunDurumu,
} from "@/app/panel/urun-actions";
import { mutfakBolumleri, bolumCoz } from "@/content/mutfak-bolumleri";
import type { MutfakUrunu } from "@/lib/hesaplar";
import { paraFormatla } from "@/lib/utils";
import { Alan, Girdi, MetinAlani, Secim, Uyari } from "../hesap/Alan";
import { Buton } from "../ui/Buton";
import { Rozet } from "../ui/Rozet";

const BASLANGIC: UrunDurumu = {};

/**
 * Şefin / ev hanımının kendi ürünlerini yönettiği ekran.
 *
 * Tek bir form var; "Düzenle" denince form o ürünle dolar, "Vazgeç" denince
 * boşalır. Her ürün için ayrı açılır form yerine bu tercih edildi: telefonda
 * on beş açık form arasında kaybolmak yerine tek yerde çalışılıyor.
 */
export function UrunYonetimi({
  restoranSlug,
  urunler,
  adminMi = false,
  sahipsizMi = false,
}: {
  restoranSlug: string;
  urunler: MutfakUrunu[];
  /** Yönetici başka bir mutfağı düzenliyorsa slug forma gizli alan olarak eklenir. */
  adminMi?: boolean;
  /** Profilin bağlı bir şef hesabı yok — yalnızca yönetici düzenleyebilir. */
  sahipsizMi?: boolean;
}) {
  const [kayitDurumu, kaydet, kaydediliyor] = useActionState(urunKaydetAction, BASLANGIC);
  const [silmeDurumu, sil] = useActionState(urunSilAction, BASLANGIC);
  const [yayinDurumu, yayinDegistir] = useActionState(urunYayinAction, BASLANGIC);

  const [duzenlenen, setDuzenlenen] = useState<MutfakUrunu | null>(null);
  /**
   * Seçili bölüm ayrı tutuluyor: ipucu metni, yer tutucu ve "birim önemli mi"
   * uyarısı bölüm değiştiği anda güncellensin diye.
   */
  const [bolumId, setBolumId] = useState<string>(mutfakBolumleri[0].id);
  /** Kaydettikten sonra formu sıfırlamak için — key değişince alanlar boşalır. */
  const [formAnahtari, setFormAnahtari] = useState(0);

  useEffect(() => {
    if (kayitDurumu.basari) {
      setDuzenlenen(null);
      setBolumId(mutfakBolumleri[0].id);
      setFormAnahtari((n) => n + 1);
    }
  }, [kayitDurumu.basari]);

  /** Düzenlemeye geçince form o ürünle dolar ve forma kaydırılır. */
  function duzenlemeyeAl(urun: MutfakUrunu) {
    setDuzenlenen(urun);
    setBolumId(urun.bolum);
    document.getElementById("urun-formu")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const seciliBolum = bolumCoz(bolumId);

  /** Ürünler bölümlerine göre, her yerde aynı sırada. */
  const gruplar = mutfakBolumleri
    .map((bolum) => ({ bolum, liste: urunler.filter((u) => u.bolum === bolum.id) }))
    .filter((g) => g.liste.length > 0);

  const fiyatsiz = urunler.filter((u) => u.fiyat <= 0).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-kahve-900">Ürünlerim</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-kahve-600">
            Pişirdiğin yemekleri ve ev yapımı ürünlerini (tereyağı, yoğurt, reçel, turşu…)
            buradan ekle. Eklediğin her ürün, seçtiğin bölümün altında profilinde görünür.
          </p>
        </div>
        <Rozet ton={urunler.length > 0 ? "kahve" : "acik"}>{urunler.length} ürün</Rozet>
      </div>

      {sahipsizMi && (
        <p className="mt-4 rounded-2xl bg-sari-500/12 px-4 py-3 text-xs leading-relaxed text-kahve-800">
          Bu profile bağlı bir şef hesabı yok. Ürünleri şimdilik yalnızca yönetici girebilir;
          profil bir hesaba bağlandığında şef kendi ürünlerini kendisi yönetir.
        </p>
      )}

      {fiyatsiz > 0 && (
        <p className="mt-4 rounded-2xl bg-domates/10 px-4 py-3 text-xs leading-relaxed text-domates-koyu">
          <strong>{fiyatsiz} ürünün fiyatı girilmemiş.</strong> Menüde &quot;fiyat yakında&quot;
          görünüyorlar ve sipariş edilemiyorlar. Fiyatı sen belirlersin — hazır olduğunda
          düzenleyip yaz.
        </p>
      )}

      {/* --- Ekleme / düzenleme formu --- */}
      <form
        id="urun-formu"
        key={`${formAnahtari}-${duzenlenen?.id ?? "yeni"}`}
        action={kaydet}
        className="mt-6 scroll-mt-24 rounded-[1.75rem] border border-sari-500/30 bg-sari-500/6 p-5 md:p-6"
      >
        {kayitDurumu.hata && <Uyari tur="hata">{kayitDurumu.hata}</Uyari>}
        {kayitDurumu.basari && <Uyari tur="basari">{kayitDurumu.basari}</Uyari>}

        <h3 className="mt-1 font-display text-base font-extrabold text-kahve-900">
          {duzenlenen ? `"${duzenlenen.ad}" düzenleniyor` : "Yeni ürün ekle"}
        </h3>

        {adminMi && <input type="hidden" name="restoranSlug" value={restoranSlug} />}
        {duzenlenen && <input type="hidden" name="id" value={duzenlenen.id} />}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Alan etiket="Bölüm" ipucu={seciliBolum.aciklama}>
            <Secim name="bolum" value={bolumId} onChange={(e) => setBolumId(e.target.value)}>
              {mutfakBolumleri.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.ad}
                </option>
              ))}
            </Secim>
          </Alan>

          <Alan etiket="Ürün adı">
            <Girdi
              type="text"
              name="ad"
              required
              maxLength={80}
              defaultValue={duzenlenen?.ad ?? ""}
              placeholder={seciliBolum.ornek}
            />
          </Alan>

          <Alan etiket="Fiyat (TL)" ipucu="Boş bırakırsan menüde 'fiyat yakında' görünür.">
            <Girdi
              type="text"
              inputMode="decimal"
              name="fiyat"
              maxLength={7}
              defaultValue={duzenlenen && duzenlenen.fiyat > 0 ? String(duzenlenen.fiyat) : ""}
              placeholder="Örn. 180"
            />
          </Alan>

          <Alan
            etiket="Birim / ambalaj"
            ipucu={
              seciliBolum.birimliMi
                ? "Bu bölümde önemli: kaç gram, kaç litre?"
                : "İstersen porsiyon bilgisi yazabilirsin."
            }
          >
            <Girdi
              type="text"
              name="birim"
              maxLength={40}
              defaultValue={duzenlenen?.birim ?? ""}
              placeholder={seciliBolum.birimliMi ? "Örn. 500 g cam kavanoz" : "Örn. 2 kişilik"}
            />
          </Alan>
        </div>

        <div className="mt-4">
          <Alan etiket="Açıklama" ipucu="Neyle yaptığını kısaca anlat.">
            <MetinAlani
              name="aciklama"
              maxLength={240}
              defaultValue={duzenlenen?.aciklama ?? ""}
              placeholder="Örn. Köy sütünden, yayıkta çalkalanmış, katkısız."
              className="min-h-24"
            />
          </Alan>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-semibold text-kahve-800">
          <input
            type="checkbox"
            name="yayinda"
            defaultChecked={duzenlenen ? duzenlenen.yayinda : true}
            className="mt-0.5 size-4.5 shrink-0 accent-sari-500"
          />
          <span>
            Menüde görünsün
            <span className="mt-0.5 block text-xs font-medium text-kahve-500">
              Kapatırsan ürün yalnızca burada kalır, müşteriler göremez.
            </span>
          </span>
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <Buton type="submit" disabled={kaydediliyor}>
            {kaydediliyor ? "Kaydediliyor…" : duzenlenen ? "Değişikliği kaydet" : "Ürünü ekle"}
          </Buton>
          {duzenlenen && (
            <Buton type="button" tur="hayalet" onClick={() => setDuzenlenen(null)}>
              Vazgeç
            </Buton>
          )}
        </div>
      </form>

      {/* --- Mevcut ürünler --- */}
      {(silmeDurumu.hata || silmeDurumu.basari || yayinDurumu.hata || yayinDurumu.basari) && (
        <div className="mt-6 space-y-2">
          {silmeDurumu.hata && <Uyari tur="hata">{silmeDurumu.hata}</Uyari>}
          {silmeDurumu.basari && <Uyari tur="basari">{silmeDurumu.basari}</Uyari>}
          {yayinDurumu.hata && <Uyari tur="hata">{yayinDurumu.hata}</Uyari>}
          {yayinDurumu.basari && <Uyari tur="basari">{yayinDurumu.basari}</Uyari>}
        </div>
      )}

      {gruplar.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-10 text-center text-sm text-kahve-500">
          Henüz ürün eklemedin. Yukarıdaki formla ilk ürününü ekleyebilirsin.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {gruplar.map(({ bolum, liste }) => (
            <section key={bolum.id}>
              <h3 className="font-display text-base font-extrabold text-kahve-900">
                {bolum.ad}
                <span className="ml-2 text-xs font-bold text-kahve-400">{liste.length}</span>
              </h3>

              <ul className="mt-3 space-y-2.5">
                {liste.map((u) => (
                  <li
                    key={u.id}
                    className={`flex flex-wrap items-start gap-x-4 gap-y-3 rounded-2xl border p-4 ${
                      u.yayinda
                        ? "border-kahve-900/8 bg-white"
                        : "border-kahve-900/8 bg-kahve-900/4"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-extrabold text-kahve-900">
                          {u.ad}
                        </span>
                        {!u.yayinda && <Rozet ton="acik">Menüde değil</Rozet>}
                        {u.fiyat <= 0 && <Rozet ton="domates">Fiyat girilmedi</Rozet>}
                      </div>
                      {u.aciklama && (
                        <p className="mt-1 text-xs leading-relaxed text-kahve-600">{u.aciklama}</p>
                      )}
                      <p className="mt-1.5 text-sm font-extrabold text-kahve-900">
                        {u.fiyat > 0 ? paraFormatla(u.fiyat) : "—"}
                        {u.birim && (
                          <span className="ml-1.5 text-xs font-semibold text-kahve-500">
                            / {u.birim}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Buton
                        type="button"
                        tur="hayalet"
                        boyut="sm"
                        onClick={() => duzenlemeyeAl(u)}
                      >
                        Düzenle
                      </Buton>

                      <form action={yayinDegistir}>
                        {adminMi && (
                          <input type="hidden" name="restoranSlug" value={restoranSlug} />
                        )}
                        <input type="hidden" name="id" value={u.id} />
                        <Buton type="submit" tur="sade" boyut="sm">
                          {u.yayinda ? "Menüden kaldır" : "Menüye koy"}
                        </Buton>
                      </form>

                      <form action={sil}>
                        {adminMi && (
                          <input type="hidden" name="restoranSlug" value={restoranSlug} />
                        )}
                        <input type="hidden" name="id" value={u.id} />
                        <Buton
                          type="submit"
                          tur="sade"
                          boyut="sm"
                          className="text-domates-koyu hover:bg-domates/10"
                        >
                          Sil
                        </Buton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
