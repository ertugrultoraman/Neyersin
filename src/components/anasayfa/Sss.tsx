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
    soru: "Teslimat ücreti neden değişiyor?",
    cevap:
      "Teslimat ücreti mesafe kademesi, bölgenin sipariş yoğunluğu ve sepet tutarına göre " +
      "hesaplanır. Ödeme ekranında ücretin nasıl oluştuğunu kalem kalem görürsün; ücretsiz " +
      "teslimat rozetli restoranlarda ise kurye ücreti hiç alınmaz.",
  },
  {
    soru: "Siparişim gecikirse ne olur?",
    cevap:
      "Söz verdiğimiz süre gerçek mutfak kapasitesine göre hesaplanır, bu yüzden gecikme " +
      "istisnadır. Yine de söz tutulmazsa hızlı market siparişlerinde teslimat ücreti " +
      "cüzdanına iade edilir; diğer siparişlerde destek ekibi telafi seçenekleri sunar.",
  },
  {
    soru: "Restoranımı Ne Yersin?'e nasıl eklerim?",
    cevap:
      "Menü ve şube bilgilerini paylaştıktan sonra tipik kurulum 3–5 iş günü sürer. Mevcut " +
      "POS sistemini değiştirmen gerekmez; Ne Yersin? sipariş katmanı olarak mevcut " +
      "sistemine entegre olur. İlk 3 ay komisyonsuzdur.",
  },
  {
    soru: "Kurye olmak için ne gerekiyor?",
    cevap:
      "Ehliyet, kendi aracın (motosiklet, bisiklet veya elektrikli scooter) ve akıllı " +
      "telefon yeterli. Vardiya saatlerini kendin seçersin, ödemeler haftalık yapılır. " +
      "Mutfakta belirli süreyi aşan beklemeler ayrıca ücretlendirilir.",
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
          aciklama="Aradığın cevabı bulamadıysan destek ekibimize yazabilirsin — ortalama yanıt süremiz 12 dakika."
          className="lg:flex-col lg:items-start"
        />

        <Reveal gecikme={0.08}>
          <Akordiyon ogeler={SORULAR} />
        </Reveal>
      </div>
    </Bolum>
  );
}
