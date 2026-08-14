# Sunucu bölgesi — neden `fra1`

`vercel.json` içindeki `regions: ["fra1"]` ayarı burada anlatılıyor: JSON'a
yorum yazılamıyor ve bu tek satırın sebebi kendiliğinden anlaşılmıyor.

## Sorun

Veritabanı (Neon) **Frankfurt**'ta: `eu-central-1`.
Sunucu fonksiyonları ise Vercel'in varsayılanıyla **Washington DC**'de
(`iad1`) çalışıyordu.

Yani her veritabanı sorgusu Atlantik'i geçip geri dönüyordu. Tek gidiş-dönüş
~90–100 ms ve sayfalar tek sorgu atmıyor: yönetici paneli, sipariş listesi ve
mutfak ekranı sayfa başına birkaç sorgu yapıyor. Kod içindeki "veritabanı uzak
bölgede olduğu için her gidiş-dönüş ~150 ms" notları (bkz.
`lib/restoran-listesi.ts`, `app/panel/page.tsx`) tam olarak bunun sonucuydu —
o yorumlar yazılırken sorguların paralelleştirilmesiyle sonuç iyileştirilmişti
ama asıl mesafe duruyordu.

## Karar

Fonksiyonlar veritabanının yanına, Frankfurt'a alındı.

- **Neden Frankfurt:** veritabanı orada. Sunucu ile veritabanı arasındaki
  mesafe, kullanıcı ile sunucu arasındaki mesafeden daha önemli — kullanıcı
  bir sayfa için tek gidiş-dönüş yapıyor, sunucu ise onlarca.
- **Kullanıcı tarafı da kazandı:** teslimat bölgesi Beylikdüzü, yani bütün
  trafik Türkiye'den geliyor. Frankfurt, İstanbul'a Washington'dan çok daha
  yakın.
- **Statik sayfalar etkilenmiyor:** onlar zaten Vercel'in kenar ağından (CDN)
  dünyanın her yerinden yakın olarak servis ediliyor. Bu ayar yalnızca sunucu
  tarafında çalışan kodu (server component, server action, API uçları)
  ilgilendiriyor.

## Geri almak

`vercel.json` dosyasındaki `regions` satırı silinip yeniden dağıtılırsa
Vercel varsayılana döner. Veritabanı bir gün başka bölgeye taşınırsa burası da
onunla birlikte değişmeli — ikisinin ayrı bölgede olması bu dosyanın var olma
sebebi.
