import Link from "next/link";

import { DurumRozeti } from "@/components/admin/DurumRozeti";
import type { KayitliSiparis } from "@/lib/depo";
import { kalemBirimFiyati } from "@/lib/siparis";
import { paraFormatla } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Sipariş kartı — hangi alanların görüneceği role göre belirlenir.
 *
 * `musteriBilgisi` KASITLI olarak varsayılan `false`: şef paneli müşterinin
 * adını, telefonunu ve adresini GÖRMEZ. Şefin işi yemeği hazırlamak; kişisel
 * veri yalnızca teslimatı yapan kurye ve yöneticide durur.
 */
export async function SiparisKarti({
  siparis,
  musteriBilgisi = false,
  telefon = false,
  kalemler = true,
  detayYolu,
  ekAlan,
}: {
  siparis: KayitliSiparis;
  musteriBilgisi?: boolean;
  /**
   * Müşterinin telefonu gösterilsin mi? `musteriBilgisi` açıkken bile ayrıca
   * isteniyor: kurye adresi görmeli ama numarayı görmemeli.
   */
  telefon?: boolean;
  kalemler?: boolean;
  /**
   * Verilirse sipariş numarası detay sayfasına bağlantı olur.
   *
   * Yalnızca MUTFAK sekmesinde doluyor: kartta ekstralar tek satıra sıkışıyor
   * ve uzun bir müşteri notu kırpılıyor, yemeği hazırlayanın tamamını
   * görebileceği bir yer gerekiyordu. Diğer rollerde boş — müşteri kendi
   * siparişinin zaten her ayrıntısını bu kartta görüyor.
   */
  detayYolu?: string;
  ekAlan?: React.ReactNode;
}) {
  const dil = await aktifDil();
  const c = ceviri(dil);
  const tarih = new Date(siparis.olusturmaTarihi).toLocaleString(dil === "en" ? "en-GB" : "tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {detayYolu ? (
            <Link
              href={detayYolu}
              className="font-mono text-sm font-bold text-kahve-900 underline underline-offset-4
                transition-colors duration-300 hover:text-sari-700"
            >
              {siparis.siparisNo}
            </Link>
          ) : (
            <p className="font-mono text-sm font-bold text-kahve-900">{siparis.siparisNo}</p>
          )}
          <p className="mt-0.5 text-xs text-kahve-500">
            {tarih} ·{" "}
            {/*
              Sipariş verilen mutfağın profiline doğrudan geçiş. Kart müşteri,
              şef, kurye ve yönetici panellerinin HEPSİNDE bu bileşenden
              geldiği için bağlantı tek yerden tüm hesaplarda açılıyor.
            */}
            <Link
              href={`/restoran/${siparis.restoranSlug}`}
              className="font-bold text-sari-700 underline underline-offset-2
                transition-colors duration-300 hover:text-kahve-900"
            >
              {siparis.restoranAdi}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DurumRozeti durum={siparis.durum} />
          <span className="font-display text-lg font-extrabold text-kahve-900">
            {paraFormatla(siparis.tutarlar.toplam)}
          </span>
        </div>
      </header>

      {kalemler && (
        <ul className="mt-4 space-y-2 border-t border-kahve-900/8 pt-4">
          {siparis.kalemler.map((k) => (
            <li key={k.satirId} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-kahve-900">
                  {k.adet}× {k.ad}
                </span>
                <span className="shrink-0 font-bold text-kahve-700">
                  {paraFormatla(kalemBirimFiyati(k) * k.adet)}
                </span>
              </div>
              {k.ekstralar && k.ekstralar.length > 0 && (
                <p className="mt-0.5 text-xs text-kahve-500">
                  + {k.ekstralar.map((e) => e.ad).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {siparis.not && (
        <p className="mt-3 rounded-2xl bg-sari-500/10 px-3.5 py-2.5 text-sm leading-relaxed text-kahve-800">
          <span className="font-bold">{c("siparis.notEtiketi")}</span> {siparis.not}
        </p>
      )}

      {musteriBilgisi ? (
        <div className="mt-4 border-t border-kahve-900/8 pt-4 text-sm">
          <p className="font-bold text-kahve-900">{siparis.musteri.adSoyad}</p>
          {/*
            Telefon KURYEDE gizli. Kurye adresi ve adı görmeli — kapıyı bulup
            doğru kişiye teslim edecek — ama numara teslimattan sonra da
            telefonunda kalıyordu. İletişim sipariş yazışmasından yürüyor
            (bkz. SiparisMesajlari). Müşteri kendi kartında kendi numarasını
            görmeye devam ediyor, yönetici de görüyor.
          */}
          {telefon ? (
            <p className="mt-0.5 text-kahve-600">{siparis.musteri.telefon}</p>
          ) : (
            <p className="mt-0.5 text-xs text-kahve-500">{c("siparis.telefonGizli")}</p>
          )}
          <p className="mt-1.5 leading-relaxed text-kahve-700">
            {siparis.adres.mahalle}, {siparis.adres.acikAdres} No: {siparis.adres.binaNo}
            {siparis.adres.daireNo ? ` D: ${siparis.adres.daireNo}` : ""} — {siparis.adres.ilce}
          </p>
          {siparis.adres.tarif && (
            <p className="mt-1 text-xs text-kahve-500">{siparis.adres.tarif}</p>
          )}
        </div>
      ) : (
        /*
          Sipariş numarası zaten bağlantı ama kartın en üstünde ve küçük;
          "içeriği gör" burada ikinci bir kapı. Mutfak siparişi ilk gördüğü
          anda ekstraları ve notu açmak istiyor.
        */
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-kahve-900/8 pt-3">
          <p className="text-xs text-kahve-400">{c("siparis.musteriGizli")}</p>
          {detayYolu && (
            <Link
              href={detayYolu}
              className="text-xs font-bold text-sari-700 transition-colors duration-300
                hover:text-kahve-900"
            >
              {c("siparis.icerigiGor")} →
            </Link>
          )}
        </div>
      )}

      {ekAlan && <div className="mt-4 border-t border-kahve-900/8 pt-4">{ekAlan}</div>}
    </article>
  );
}
