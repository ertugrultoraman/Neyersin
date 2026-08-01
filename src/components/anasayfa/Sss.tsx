import { Akordiyon } from "../ui/Akordiyon";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { Reveal } from "../ui/Reveal";

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
    cevap:
      "Kişisel verileriniz KVKK kapsamında işlenir. Analiz ve raporlamada yalnızca " +
      "anonimleştirilmiş, toplu veriler kullanılır; restoranlar bireysel müşteri " +
      "kimliklerine değil, kendi sipariş performans raporlarına erişir.",
  },
];

export function Sss() {
  return (
    <Bolum id="sss">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <BolumBasligi
          ustBaslik="Sıkça sorulan sorular"
          baslik="Merak edilenler"
          aciklama="Aradığın cevabı bulamadıysan iletişim sayfasından bize yazabilirsin."
          className="lg:flex-col lg:items-start"
        />

        <Reveal gecikme={0.08}>
          <Akordiyon ogeler={SORULAR} />
        </Reveal>
      </div>
    </Bolum>
  );
}
