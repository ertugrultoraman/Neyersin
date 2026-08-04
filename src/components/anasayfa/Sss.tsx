import { Akordiyon } from "../ui/Akordiyon";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { Reveal } from "../ui/Reveal";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

const SORULAR = [
  {
    soru: "Ne Yersin? hangi bölgelerde hizmet veriyor?",
    cevap:
      "Şu an yalnızca İstanbul / Beylikdüzü'ne teslimat yapıyoruz. Adres seçiminde teslimat " +
      "yaptığımız ilçeler listelenir; teslimat ücreti tüm restoranlarda ücretsizdir. " +
      "Yeni ilçeler açıldıkça adres listesine kendiliğinden eklenecek.",
  },
  {
    soru: "Nasıl ödeme yapabiliyorum?",
    cevap:
      "Ödemeyi kapıda yapıyorsun: kurye geldiğinde nakit verebilir ya da IBAN'a havale " +
      "yapabilirsin. Havaleyi seçersen açıklama alanına yalnızca sipariş numaranı yazman " +
      "ve dekontu kuryeye göstermen yeterli. Önceden ödeme yapmana gerek yok.",
  },
  {
    soru: "Teslimat ücreti var mı?",
    cevap:
      "Yok. Şu an tüm siparişlerde teslimat ücretsiz — ne müşteriden ne de yemeği yapandan " +
      "alınıyor. Ödeme ekranında sepet tutarını kalem kalem görürsün, sürpriz kalem çıkmaz.",
  },
  {
    soru: "Siparişim gecikirse ne olur?",
    cevap:
      "Sipariş durumunu hesabından takip edersin; hazırlık başlamadan iptal etme hakkın var. " +
      "Bir aksaklık olursa iletişim sayfasından bize yaz, siparişi tek tek inceleyip çözüyoruz.",
  },
  {
    soru: "Mutfağımı veya restoranımı nasıl eklerim?",
    cevap:
      "Başvuru formunu doldurursun; başvurun yöneticiye düşer ve onaylandığı anda hesabın " +
      "açılıp kendi adına bir mutfak sayfan oluşur. Evinde pişirenler için ayrıntılar " +
      "Ev Hanımları sayfasında.",
  },
  {
    soru: "Kurye olmak için ne gerekiyor?",
    cevap:
      "Ehliyet, kendi aracın (motosiklet, bisiklet veya elektrikli scooter) ve akıllı telefon. " +
      "Başvurunu gönderdikten sonra yönetici onayıyla kurye paneline erişirsin; sana atanan " +
      "siparişi yalnızca sen görürsün.",
  },
  {
    soru: "Sipariş verilerim nasıl kullanılıyor?",
    /*
     * Bu cevap BİLEREK sade. Önceki metin "analiz ve raporlamada yalnızca
     * anonimleştirilmiş toplu veriler kullanılır" diyordu; ortada öyle bir
     * analiz sistemi yok, yani karşılığı olmayan bir taahhüttü. Yalnızca
     * gerçekten yaptığımız şey yazılı.
     */
    cevap:
      "Siparişini alabilmek ve teslim edebilmek için gereken bilgileri (ad, telefon, " +
      "adres) alıyoruz. Bu bilgiler siparişini hazırlayan mutfağa ve teslimatı yapan " +
      "kuryeye, yalnızca işlerini yapabilecekleri kadarıyla gösterilir. Parolan geri " +
      "döndürülemez biçimde şifrelenerek saklanır. Ayrıntılı aydınlatma metnimiz " +
      "hazırlanıyor; yayımlandığında bu sayfadan ulaşabileceksin.",
  },
];

export async function Sss() {
  const c = ceviri(await aktifDil());

  return (
    <Bolum id="sss">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <BolumBasligi
          ustBaslik={c("sss.ustBaslik")}
          baslik={c("sss.baslik")}
          aciklama={c("sss.aciklama")}
          className="lg:flex-col lg:items-start"
        />

        <Reveal gecikme={0.08}>
          <Akordiyon ogeler={SORULAR} />
        </Reveal>
      </div>
    </Bolum>
  );
}
