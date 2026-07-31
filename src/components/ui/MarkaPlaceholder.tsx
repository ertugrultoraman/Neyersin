import { cn } from "@/lib/utils";

/**
 * AI görseli henüz üretilmemiş anahtarlar için düz marka rengi zemin gösterir.
 * Logo fotoğrafı burada kasıtlı olarak kullanılmıyor — tekrarlanan bir dolgu
 * görseli olarak her kartta görünmesi istenmiyor, marka logosu yalnızca
 * başlıkta ve footer'da yer alıyor.
 */
export function MarkaPlaceholder({ className }: { className?: string }) {
  return <span className={cn("block bg-sari-500", className)} aria-hidden="true" />;
}
