# Ne Yersin? — Web Sitesi

Yemek siparişi, kurye yönetimi ve teslimat takibini tek sistemde birleştiren **Ne Yersin?**
markasının kurumsal web sitesi. Yemeksepeti'nin bilgi mimarisi referans alındı; tasarım,
renk paleti ve tüm içerik özgün olarak üretildi.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · framer-motion
· Vercel Blob

---

## Hızlı başlangıç

```bash
npm install
npm run dev          # http://localhost:3000
```

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run start` | Build çıktısını servis eder |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run images:generate` | AI görsellerini üretip Vercel Blob'a yükler |
| `npm run images:generate:dry` | Hiçbir çağrı yapmadan üretim planını gösterir |

---

## Sayfalar

| Rota | İçerik |
| --- | --- |
| `/` | Ana sayfa — 13 bölüm: hero + adres/arama, kategoriler, kampanyalar, öne çıkan restoranlar, nasıl çalışır, **Kullanıcı/Kurye/Restoran ekranları**, **canlı teslimat takibi**, tüm restoranlar (ilçe + filtre + arama + sıralama), sektör önizleme, mobil uygulama, blog önizleme, SSS, çağrı bandı |
| `/restoran/[slug]` | **16 restoran detay sayfası** — menü (kategoriler + ~110 ürün), sepete ekle, yapışkan sepet özeti, teslimat bölgeleri, Restaurant JSON-LD |
| `/odeme` | **Sipariş oluşturma** — iletişim + teslimat adresi + ödeme yöntemi (kart/iyzico veya havale/EFT) |
| `/siparis/sonuc` | Kart ödemesi dönüş sayfası (başarılı/başarısız) |
| `/api/odeme/iyzico/callback` | iyzico callback'i — ödemeyi sunucuda doğrular |
| `/admin` | **Yönetim paneli** — sipariş listesi, özet, filtre/arama (girişli) |
| `/admin/siparis/[no]` | Sipariş detayı + durum güncelleme |
| `/admin/giris` | Yönetici girişi |
| `/iletisim` | Başvuru formu: restoran ekle / kurye ol / kurumsal / destek (`?konu=` ile ön seçim) |
| `/blog` | Kategori filtreli yazı listesi + öne çıkan yazı |
| `/blog/[slug]` | 5 uzun-form yazı; içindekiler (scroll-spy), okuma çubuğu, blok tabanlı içerik, Article JSON-LD |
| `/sektorler` | 8 sektör kartı |
| `/sektorler/[slug]` | Sektör detayı: zorluklar, otomasyon senaryoları, çözüm bileşenleri, metrikler, entegrasyonlar, SSS |
| `/veri-degerlendirme` | "Şirketlerin datasını değerlendiriyoruz" hizmet sayfası — tanı, 5 adımlı süreç, kapsam, teslimler, SSS |
| `/sitemap.xml`, `/robots.txt` | Otomatik üretiliyor (41 sayfa) |

---

## Sipariş akışı ve ödeme (havale / EFT)

Akış: **ilçe seç → restoran → menüden sepete ekle → /odeme → sipariş no + IBAN**

### Hizmet alanı: yalnızca İstanbul

Adres girişi serbest metin değil, [`src/content/istanbul.ts`](src/content/istanbul.ts)
içindeki 39 ilçeden seçim. Seçilen ilçe:

- restoran listesini o ilçeye teslimat yapanlarla sınırlar (`teslimat` alanı),
- restoran sayfasında "buraya geliyor / gelmiyor" uyarısı üretir,
- ödeme formundaki ilçe alanını önceden doldurur,
- sunucu tarafında da doğrulanır — teslimat alanı dışına sipariş açılamaz.

Seçim `localStorage`'da saklanır (`ny-adres-v1`).

### Sepet

[`SepetBaglami`](src/components/saglayici/SepetBaglami.tsx) — context + `localStorage`
(`ny-sepet-v1`). Gerçek platformlarda olduğu gibi **sepet tek restorana ait**; başka
restorandan ürün eklenmek istenirse onay modalı çıkar ve sepet sıfırlanır.

### Ödeme yöntemleri

İki yöntem var; hangisinin görüneceğine ortam değişkenleri karar verir. Kapıda ödeme yok.

**1. Kredi / banka kartı — iyzico Checkout Form**

`IYZICO_API_KEY` + `IYZICO_SECRET_KEY` tanımlıysa arayüzde görünür ve varsayılan seçenek
olur. Akış:

```
/odeme → siparis oluştur (durum: odeme-bekliyor)
       → iyzico checkoutFormInitialize  → paymentPageUrl'e yönlendir
       → müşteri kartıyla öder (3D Secure)
       → iyzico POST /api/odeme/iyzico/callback  { token }
       → sunucuda checkoutForm.retrieve(token) + HMAC imza doğrulama
       → durum: odendi   → /siparis/sonuc
```

Neden Checkout Form? **Kart bilgisi bizim sunucumuza hiç ulaşmaz** — iyzico'nun barındırdığı
formda girilir. Bu, PCI-DSS kapsamını ciddi biçimde daraltır. Kart verisini kendimiz
toplayan Non-3DS/3DS-direct akışı bilinçli olarak tercih edilmedi.

Güvenlik notları ([`src/lib/iyzico.ts`](src/lib/iyzico.ts)):

- Ödeme "başarılı" kararı **yalnızca** sunucudaki `retrieve` çağrısıyla verilir; istemciden
  veya callback gövdesinden gelen hiçbir başarı bilgisine güvenilmez.
- iyzico yanıtlarının HMAC-SHA256 imzası doğrulanır (`timingSafeEqual`) — sahte bir callback
  kabul edilmez.
- Tutar sunucuda menüden hesaplanır; `basketItems` toplamı `price` ile eşleşir (iyzico şartı),
  teslimat ücreti ayrı sepet kalemi olarak gönderilir.
- Taksit kapalı (`enabledInstallments: [1]`).

**2. Havale / EFT**

Her zaman açık, altyapı gerektirmez. Sipariş numarası (`NY-260730-5646`), IBAN, tutar ve
açıklama kuralı gösterilir. Banka bilgileri: [`src/content/odeme.ts`](src/content/odeme.ts)

> ⚠️ Dosyadaki hesap **örnektir** (`ornekMi: true`). Bu işaret durdukça arayüzde kırmızı
> "ÖRNEK HESAP — gerçek IBAN ile değiştirilmeli" uyarısı görünür. Canlıya çıkmadan gerçek
> IBAN girip `ornekMi` alanını kaldırın.

### Güvenlik: fiyat istemciden alınmaz

[`src/app/odeme/actions.ts`](src/app/odeme/actions.ts) istemciden yalnızca `urunId` ve
`adet` kabul eder; **fiyatları sunucuda menüden yeniden okur**. Aksi hâlde sepet tutarı
tarayıcıdan değiştirilebilirdi. Minimum sepet ve teslimat bölgesi kontrolü de sunucuda
tekrarlanır — istemci doğrulaması yalnızca kullanıcı deneyimi içindir.

### Siparişler nereye kaydediliyor?

[`src/lib/siparis-deposu.ts`](src/lib/siparis-deposu.ts) üç hedefe birlikte yazar:

1. **Kalıcı depo** ([`src/lib/depo/`](src/lib/depo/)) — admin paneli buradan okur.
2. `SIPARIS_WEBHOOK_URL` tanımlıysa sipariş bu adrese POST edilir (n8n / Zapier / kendi API'niz).
3. Her durumda sunucu günlüğüne yazılır (Vercel → Logs).

Depoya yazma hatası siparişi düşürmez — müşteri numarasını yine alır, hata günlüğe yazılır.
Veritabanı arızası yüzünden ödeme akışını kesmek, siparişi tamamen kaybetmekten daha kötü
bir sonuç üretirdi.

#### Depo adaptörleri

| Ortam | Adaptör | Kalıcı mı? |
| --- | --- | --- |
| `DATABASE_URL` tanımlı | [`depo/postgres.ts`](src/lib/depo/postgres.ts) — Vercel Postgres / Neon / Supabase | ✅ Evet |
| Tanımsız | [`depo/dosya.ts`](src/lib/depo/dosya.ts) — `.veri/siparisler.json` | ⚠️ Yalnızca kalıcı diskli sunucuda |

Şema ilk kullanımda otomatik oluşur (`CREATE TABLE IF NOT EXISTS`), migration gerekmez.
Sipariş gövdesi `JSONB` olarak saklanır; listelenen/filtrelenen alanlar ayrı indeksli
kolonlarda. Böylece sipariş modeli değiştiğinde şema değişmez.

> ⚠️ **Vercel'de `DATABASE_URL` zorunludur.** Serverless dosya sistemi salt-okunur ve
> geçicidir; dosya adaptörü orada veri tutmaz. Admin paneli bu durumda kırmızı uyarı
> gösterir. Vercel Blob bilinçli kullanılmadı: yalnızca public erişim sunuyor ve sipariş
> kaydı ad/telefon/adres içeriyor — kişisel veri tahmin edilmesi zor bir URL'in arkasına
> konulamaz.

`.veri/` klasörü `.gitignore`'da — müşteri kişisel verisi asla commit edilmez.

---

## Admin paneli (`/admin`)

Sipariş listesi, özet kartları (toplam / bugün / ödeme bekleyen / ödenen ciro), duruma göre
filtre, metin arama; sipariş detayında tüm kalemler, müşteri ve adres bilgisi, iyzico
`paymentId` ve **durum güncelleme** (havale dekontu eşleştiğinde "Ödendi" işaretlemek için).

### Erişim

| Değişken | Açıklama |
| --- | --- |
| `ADMIN_EMAILS` | Virgülle ayrılmış yönetici e-postaları. Varsayılan: `ertugrultoraman@hotmail.com` |
| `ADMIN_PASSWORD` | **Zorunlu.** Tanımsızsa panel tamamen kapalıdır |
| `ADMIN_SESSION_SECRET` | Opsiyonel. Verilmezse paroladan türetilir (parola değişince oturumlar düşer) |

Parola üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

### Güvenlik kararları ([`src/lib/admin.ts`](src/lib/admin.ts))

- **Varsayılan parola yok.** `ADMIN_PASSWORD` tanımlanmadan panel açılmaz; giriş sayfası
  bunu açıkça söyler. Tahmin edilebilir bir parolayla açık bırakmak kabul edilemezdi.
- Oturum, sunucuda durum tutmayan **HMAC-SHA256 imzalı çerez** (httpOnly, sameSite=lax,
  production'da secure, 8 saat).
- Parola ve imza karşılaştırmaları **sabit zamanlı** (`timingSafeEqual`).
- Giriş hatasında e-posta mı parola mı yanlış bilgisi **verilmez** — tek mesaj döner.
- Yetki kontrolü hem sayfada hem **server action içinde** tekrar yapılır; sayfa korumasına
  güvenilmez.
- `/admin`, `/odeme`, `/siparis/`, `/api/` → `robots.txt`'te `Disallow` + sayfa bazında
  `noindex`.

---

## Görsel altyapısı — Vercel Blob (kritik)

Site Vercel'de çalışacak şekilde kurgulandı. Vercel'in dosya sistemi **kalıcı değildir**
(serverless, salt-okunur, geçici), bu yüzden AI ile üretilen görseller runtime'da diske
yazılmaz. Akış şöyle:

```
prompt kaydı → AI görsel API'si → PNG buffer → Vercel Blob (public CDN)
            → src/content/generated/images.json manifestine public URL yazılır
            → next/image bu URL'i CDN'den servis eder
```

### Dosyalar

| Dosya | Görevi |
| --- | --- |
| `src/content/image-prompts.json` | 27 görselin anahtarı, oranı, `alt` metni ve prompt'u (elle düzenlenir) |
| `src/content/generated/images.json` | Üretim çıktısı: anahtar → Blob CDN URL'i (**commit edilir**) |
| `scripts/generate-images.mjs` | Üretim + yükleme betiği (OpenAI / Google / Replicate) |
| `src/lib/images.ts` | Manifestte kayıt varsa uzak URL, yoksa placeholder döndürür |
| `src/components/ui/AkilliGorsel.tsx` | Tek görsel bileşeni — iki durumu da yönetir |
| `src/components/ui/MarkaPlaceholder.tsx` | Anahtardan türeyen kararlı marka SVG'si |

### Neden placeholder var?

Manifest boşken site **kırık görsel göstermez**: anahtardan türetilen, her build'de aynı
görünen marka desenli bir SVG çizilir. Böylece API anahtarı olmadan da site eksiksiz
görünür. Anahtar geldiğinde tek komutla gerçek görsellere geçilir.

### Görselleri üretmek

```bash
cp .env.example .env.local        # anahtarları doldur
npm run images:generate:dry       # planı gör (API çağrısı yapmaz)
npm run images:generate           # üret + Blob'a yükle + manifesti yaz
npm run images:generate -- --only=home/hero,veri/hero
npm run images:generate -- --force        # hepsini yenile
```

Üretim sonrası **`src/content/generated/images.json` dosyasını commit et** — Vercel build'i
görselleri bu manifestten okur, yeniden üretim yapmaz (maliyet doğmaz).

Betik `addRandomSuffix: false` kullanır: aynı anahtar her zaman aynı Blob URL'ine yazılır,
yani tekrar çalıştırmak çöp dosya biriktirmez.

### `next.config.ts` uyarısı

Uzak görsel host'u `images.remotePatterns` içinde izinli olmalı; aksi hâlde `next/image`
production'da hata verir. `*.public.blob.vercel-storage.com` zaten tanımlı — başka bir
storage'a geçilirse buraya eklenmeli.

> `public/` altına **AI görseli yazılmaz** (repo şişer, her yeni görsel yeniden build
> gerektirir). `public/brand/` yalnızca statik marka varlıklarını tutar.

---

## Ortam değişkenleri

Tamamı yalnızca sunucu tarafında kullanılır — hiçbiri `NEXT_PUBLIC_` değil, client
bundle'a sızmaz. Şablon: [`.env.example`](.env.example)

| Değişken | Zorunlu | Not |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | hayır | Kanonik adres. Yoksa Vercel'in `VERCEL_PROJECT_PRODUCTION_URL`'i kullanılır |
| `DATABASE_URL` | **Vercel'de evet** | Postgres bağlantı dizesi. Yoksa yerel dosya deposu (serverless'ta veri tutmaz) |
| `ADMIN_PASSWORD` | admin paneli için | Tanımsızsa `/admin` tamamen kapalı |
| `ADMIN_EMAILS` | hayır | Yönetici e-postaları. Varsayılan: `ertugrultoraman@hotmail.com` |
| `ADMIN_SESSION_SECRET` | hayır | Oturum imza anahtarı; yoksa paroladan türetilir |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | kart ödemesi için | Tanımsızsa kart seçeneği arayüzde görünmez |
| `IYZICO_URI` | hayır | Varsayılan sandbox. Canlı: `https://api.iyzipay.com` |
| `IYZICO_IDENTITY_NUMBER` | hayır | iyzico alıcı kimlik no; varsayılan `11111111111` |
| `SIPARIS_WEBHOOK_URL` | hayır | Sipariş bu adrese de POST edilir |
| `BASVURU_WEBHOOK_URL` | hayır | İletişim/başvuru formu hedefi. Yoksa `SIPARIS_WEBHOOK_URL` kullanılır |
| `BLOB_READ_WRITE_TOKEN` | görsel üretimi için | Vercel Blob store bağlanınca otomatik enjekte edilir |
| `IMAGE_PROVIDER` | görsel üretimi için | `openai` \| `google` \| `replicate` |
| `OPENAI_API_KEY` / `GOOGLE_API_KEY` / `REPLICATE_API_TOKEN` | seçilen sağlayıcı için | |

`.env*` dosyaları `.gitignore`'da — secret commit edilmez.

---

## Klasör yapısı

```
src/
  app/                     # rotalar, layout, sitemap, robots, icon
  components/
    anasayfa/              # ana sayfa bölümleri
    blog/                  # yazı kartı, blok render, içindekiler, okuma çubuğu
    site/                  # Header, Footer, duyuru bandı, sayfa başlığı, logo
    ui/                    # Buton, Rozet, Bolum, Reveal, Akordiyon, ikonlar, görsel
  content/                 # tüm içerik (TypeScript veri dosyaları)
    blog/yazilar/          # 5 uzun-form yazı
    sektorler.ts           # 8 sektör
    restoranlar.ts         # 16 restoran
  lib/                     # görsel çözümleme, yardımcılar
scripts/generate-images.mjs
public/brand/              # logo ve mockup dosyaları
```

İçerik tamamı `src/content/` altında ve tip güvenli — yeni blog yazısı veya sektör eklemek
için yalnızca ilgili veri dosyası düzenlenir, JSX'e dokunulmaz.

---

## Tasarım sistemi

Tokenlar `src/app/globals.css` içindeki `@theme` bloğunda.

- **Sarı `#FDC806`** — logo dosyasından pikselden örneklendi (`sari-500`)
- **Espresso kahve `#241608`** — `kahve-900`; krem yüzey `#FFF9EF`
- Vurgular: domates `#E4452C`, nane `#12A67A`
- Tipografi: **Baloo 2** (başlık, logodaki yuvarlak dile yakın) + **Manrope** (gövde),
  ikisi de `latin-ext` ile Türkçe karakter desteği
- Easing tokenları: `--ease-yumusak`, `--ease-cikis`, `--ease-yayli` — hiçbir geçiş `linear`
  veya varsayılan `ease` değil
- Yardımcılar: `kap`, `metin-sari`, `doku`, `isik`, `parlayan`, `kart-kalk`, `gizli-scroll`

### Erişilebilirlik ve hareket

- `prefers-reduced-motion` hem CSS'te hem `useReducedMotion` ile JS tarafında karşılanıyor;
  dekoratif animasyonlar tamamen susuyor
- Klavye ile görünen "İçeriğe geç" bağlantısı, `:focus-visible` ring'i, `aria-live` sonuç
  duyurusu, native `<details>` akordiyon
- Renk tek başına bilgi taşımıyor (ör. teslimat takibinde ikon + kalınlık da değişiyor)

---

## Bilinen eksikler / sonraki adımlar

| Konu | Durum |
| --- | --- |
| **iyzico canlı testi** | Kod tamam ama **canlı/sandbox API'ye karşı test edilmedi** — geliştirme sırasında iyzico anahtarı yoktu. Sandbox anahtarlarıyla bir test siparişi geçirilmeli |
| **Postgres adaptörü testi** | Aynı şekilde canlı bir Postgres'e karşı test edilmedi. İlk deploy sonrası `/admin`'de bir sipariş görebildiğinizi doğrulayın |
| **Gerçek IBAN** | `src/content/odeme.ts` içindeki hesap örnek. `ornekMi` durduğu sürece arayüzde uyarı çıkar |
| Müşteri bildirimi | Sipariş/ödeme sonrası e-posta ve SMS gönderimi yok. Resend/Postmark + bir SMS sağlayıcısı eklenmeli |
| Sipariş durum akışı | Üç durum var (ödeme bekliyor / ödendi / başarısız). Mutfak-kurye akışı (hazırlanıyor, yolda, teslim edildi) henüz modellenmedi |
| İade | iyzico `paymentId` saklanıyor ama iade/iptal çağrısı arayüze bağlanmadı |
| AI görselleri | Pipeline hazır, manifest boş — API anahtarı verilince `npm run images:generate`. O zamana kadar ana logo gösteriliyor |
| Mobil uygulama QR kodu | `MobilUygulama.tsx` içindeki desen **taranabilir gerçek QR değil**, marka yer tutucusu. Mağaza bağlantıları yayına girince `qrcode` benzeri bir paketle gerçek kod üretilmeli |
| App Store / Play Store bağlantıları | Yer tutucu (`#mobil-uygulama`) — gerçek mağaza URL'leri gelince güncellenmeli |
| Restoran kart görselleri | Bilinçli tercih: isimden türeyen marka gradyanı (`RestoranKapak.tsx`). Gerçek fotoğraf istenirse `AkilliGorsel` ile değiştirilebilir |
| Kullanıcı hesabı | Giriş/kayıt yok — sipariş misafir olarak veriliyor. Sipariş geçmişi için kimlik doğrulama gerekli |
| Restoran/menü verisi | Statik içerik (`src/content/`). Gerçek API'ye bağlanacaksa veri katmanı eklenir; bileşen arayüzleri aynı kalabilir |
| Diğer şehirler | Şu an yalnızca İstanbul. Genişletme için `content/istanbul.ts` yerine il+ilçe modeli ve restoranların `teslimat` alanı güncellenir |

---

## Deploy

Vercel adımları için: [`DEPLOY.md`](DEPLOY.md)
