# Güvenlik duvarı (Vercel Firewall) — kurulum adımları

Bu dosya **elle yapılması gereken** işi anlatıyor. Kod tarafında yapılabilecek
her şey yapıldı; aşağıdaki kurallar Vercel panelinden tanımlanıyor ve depodan
yönetilemiyor.

## Kodda hâlihazırda ne var

| Katman | Ne yapıyor | Nerede |
|---|---|---|
| Yoklama yolu engeli | `.env`, `.git`, `wp-admin` gibi yolları uygulama koduna hiç ulaştırmadan 404'lüyor | `src/middleware.ts` → `YOKLAMA_YOLLARI` |
| Giriş kaba kuvvet sayacı | Aynı kimlik + IP için 5 hatada 15 dk kilit; sayaç **veritabanında**, yani sunucu örnekleri arasında paylaşılıyor | `src/lib/giris-sinirlayici.ts` |
| Bot kapısı | Formu 900 ms'den hızlı gönderen ya da bal küpünü dolduran IP'yi 6 ay engelliyor | `src/lib/bot-engeli.ts` |
| Mobil uç hız sınırı | Kimlik başına sınıf bazlı bütçe (yoklama 90/dk, yazma 40/dk, ağır 5/dk) | `src/lib/mobil/hiz-siniri.ts` |
| İkinci faktör | Yönetici girişinde TOTP (kuruluysa) | `src/lib/ikinci-faktor.ts` |

## Kodun yapamadığı: dağıtık oran sınırı

Mobil hız sınırı **bellekte** tutuluyor. Vercel'de her istek ayrı bir sunucu
örneğine düşebiliyor ve her örnek kendi sayacını tutuyor; yani gerçek sınır,
yazılı sayının örnek sayısıyla çarpımı. Bu bilinçli bir denge — teklif
yoklaması 5 saniyede bir geliyor ve her yoklamaya bir veritabanı yazması
eklemek, korumaya çalıştığımız yükü kendi elimizle üretmek olurdu.

Gerçek ve dağıtık sınır kenar katmanının işi. Aşağıdaki kurallar tam olarak
o boşluğu kapatıyor.

## Panelden tanımlanacak kurallar

Vercel → proje `uygulama` → **Firewall** → **Custom Rules**.

### 1. Yönetici paneline oran sınırı

- **If**: Request Path `starts with` `/admin`
- **Then**: Rate Limit — `20` istek / `60` saniye, anahtar: IP
- **Action**: Challenge (mümkünse), yoksa Deny

Neden: yönetici girişindeki sayaç kimlik+IP başına çalışıyor. Farklı
kullanıcı adları deneyen bir betik her denemede yeni bir sayaç açıyor;
yol bazlı sınır bunu kesiyor.

### 2. Mobil API'ye oran sınırı

- **If**: Request Path `starts with` `/api/mobil/`
- **Then**: Rate Limit — `600` istek / `60` saniye, anahtar: IP
- **Action**: Deny

Neden: uygulamanın normal ritmi kimlik başına dakikada ~20 istek. 600, tek
IP arkasındaki bir avuç kuryeye rahat pay bırakırken çalınmış bir jetonla
yapılan seli kesiyor. **Dikkat:** mobil operatörler CGNAT kullanıyor, yani
tek IP'nin arkasında çok sayıda gerçek kurye olabilir — sınırı buradan
aşağı çekmeden önce gerçek trafiğe bakmak gerekir.

### 3. Ödeme dönüşü dışarıya kapalı değil

`/api/odeme/iyzico/callback` yoluna **oran sınırı koyma**. iyzico kendi
sunucularından POST atıyor; sınırlanırsa ödeme dönüşü kaybolur ve müşteri
parayı ödediği hâlde siparişi düşmez.

### 4. Ülke kuralı (isteğe bağlı)

Teslimat yalnızca İstanbul/Beylikdüzü. Yönetici paneli için:

- **If**: Request Path `starts with` `/admin` **AND** Country `is not` `TR`
- **Then**: Challenge

Neden yalnızca panel: müşteri tarafını ülkeye kapatmak, yurt dışından siteye
bakan birini (turist, gurbetçi, yatırımcı) dışarıda bırakırdı.

## Kurduktan sonra doğrulama

```bash
# Yoklama yolu engeli (kod tarafı, hemen sınanabilir)
curl -s -o /dev/null -w "%{http_code}\n" https://neyersin.net/.env      # 404 beklenir
curl -s -o /dev/null -w "%{http_code}\n" https://neyersin.net/wp-admin  # 404 beklenir

# Oran sınırı (panel kuralı kurulduktan sonra)
for i in $(seq 1 30); do curl -s -o /dev/null -w "%{http_code} " https://neyersin.net/admin; done
# son isteklerde 429 ya da challenge beklenir
```

## Neden bunları kod yazarak yapmadık

Vercel'in güvenlik duvarı kuralları depoya yazılamıyor; panelden ya da
hesap belirteci gerektiren REST API'den yönetiliyor. Kuralları ara katmana
taşımak teknik olarak mümkün ama yanlış olurdu: ara katman her isteği bir
sunucu çağrısına çeviriyor, yani engellemeye çalıştığın selin faturasını
yine sen ödüyorsun. Kenar katmanı isteği uygulamaya hiç ulaştırmadan kesiyor.
