import { permanentRedirect } from "next/navigation";

/**
 * Eski adres. Siparişler hesap alanının altına taşındı (/hesabim/siparisler);
 * paylaşılmış bağlantılar ve yer imleri kırılmasın diye yönlendiriliyor.
 */
export default function SiparislerimYonlendirme() {
  permanentRedirect("/hesabim/siparisler");
}
