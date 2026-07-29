# Ne Yersin? — Proje Brief'i (Claude Code için)

## 1. Genel Amaç

Yemeksepeti.com'un konsept olarak referans alındığı, ancak **"Ne Yersin?"** markası ve kimliğiyle
sıfırdan geliştirilecek, **çok kaliteli ve profesyonel** bir web sitesi oluşturulacak.

Referans materyaller:
- Yemeksepeti.com ana sayfasının PDF çıktısı (layout / bilgi mimarisi referansı olarak)
- "Ne Yersin?" logosu (`ne_yersin_pp.jpeg`)
- "Ne Yersin?" için hazırlanmış örnek/mockup tasarım (`neyersin_app.png`) — kullanıcı ekranı,
  kurye ekranı, restoran paneli ve teslimat takibi bölümlerini gösteriyor

> Not: Yemeksepeti'nin birebir kopyası **istenmiyor**. Yemeksepeti'nin sunduğu bilgi mimarisi ve
> kullanıcı akışı referans alınacak, ama **"Ne Yersin?" marka kimliği, logosu ve renk paleti
> (sarı/kahve tonları) ile özgün bir tasarım** kurulacak.

---

## 2. Marka & Tasarım Yönergeleri

- **Marka adı:** Ne Yersin?
- **Logo:** Verilen logo dosyaları kullanılacak (`ne_yersin_pp.jpeg`, `neyersin_app.png`)
- **Stil:** Sarı ana renk + koyu kahve/siyah vurgular; sıcak, samimi, hızlı-teslimat hissi veren bir görsel dil
- **Animasyon ve geçişler:**
  - Sayfa içi scroll animasyonları
  - Hover/buton geçişleri
  - Yükleme (loading) durumları için akıcı mikro-etkileşimler
  - Genel olarak "gayet güzel" ve profesyonel hissettiren geçişler — kaba/ani geçişler olmayacak
- Tasarım referans mockup'taki (`neyersin_app.png`) bölümleme mantığına benzer şekilde:
  - Kullanıcı Ekranı
  - Kurye Ekranı
  - Restoran Ekranı
  - Teslimat Takibi

---

## 3. Ana Sayfa Kapsamı (Yemeksepeti referanslı ama özgün)

Yemeksepeti PDF'inden çıkarılan bilgi mimarisi doğrultusunda ana sayfada şunlar bulunacak:
- Adres/konum seçimi
- Restoran/yemek arama çubuğu
- Kategori kısayolları (Burger, Pizza, Tatlılar vb.)
- Öne çıkan / popüler restoranlar bölümü
- Kampanyalar / indirim bantları
- Mobil uygulama tanıtım bölümü (QR kod + App Store / Play Store)
- Tüm restoranlar listesi (kart görünümü: puan, süre, min. sepet tutarı, teslimat ücreti, kampanya rozetleri)
- Şehir/mutfak bazlı alt bağlantılar (footer'da)
- Footer: kurumsal bağlantılar, sosyal medya, yasal sayfalar

---

## 4. Blog Sayfası

- Ayrı bir **Blog** bölümü/sayfası oluşturulacak.
- Blog yazıları **çok detaylı** olacak (yüzeysel değil, derinlemesine, SEO uyumlu, uzun-form içerik).
- Her blog yazısı için **konuya özel, profesyonel görsel(ler)** üretilecek.
- Görsel üretimi için **AI görsel üretim API'si** kullanılacak (kullanıcı tarafından API anahtarı sağlanacak).
  - Görseller yüksek kalite, konuyla doğrudan alakalı ve profesyonel görünümlü olacak.
  - Aynı görsel üretim sistemi, web sitesinin diğer bölümlerindeki (ör. ana sayfa, endüstri sayfaları)
    görseller için de kullanılabilir; mockup'takine benzer bir görsel/layout dili korunacak.
  - **Üretilen görseller cloud'da (Vercel) barındırılacak** — detaylar için bkz. Bölüm 8.
- Blog kategorileri örnek olarak: sektörel otomasyon, yemek/restoran teknolojileri, teslimat lojistiği,
  veri kullanımı vb. (detaylandırılacak).

---

## 5. Endüstri / Sektör Sayfaları

- Site içinde **sektöre göre ayrılmış** sayfalar/bölümler oluşturulacak.
- Her sektör için:
  - O sektöre özel yapılabilecek otomasyonlar
  - O sektöre özel çözüm/hizmet detayları
- Sistem, **birçok farklı sektöre uygun otomasyon senaryolarını** kapsayacak şekilde kurgulanacak
  (yemek/restoran sektörüyle sınırlı kalınmayacak — genel bir "sektörlere göre otomasyon" yaklaşımı).

---

## 6. "Veri Değerlendirme" Sayfası

- Şirketin sunduğu şu hizmeti anlatan ayrı bir sayfa:
  > "Şirketlerin datasını değerlendiriyoruz, veriyi kullanılabilir hale getiriyoruz."
- Bu sayfa; hizmetin ne olduğunu, sürecini ve faydalarını profesyonel şekilde anlatacak.

---

## 7. Kullanılacak Claude Code Skill'leri

Arayüz kalitesinin yüksek olması için geliştirmeye başlamadan önce aşağıdaki skill'ler kurulmalı ve
kullanılmalı:

```bash
npx claude-code-templates@latest --skill creative-design/frontend-design
npx claude-code-templates@latest --skill development/code-reviewer
```

- **frontend-design** skill'i: Arayüzün (renk, tipografi, spacing, animasyon/geçiş kalitesi dahil)
  profesyonel ve "şablon gibi görünmeyen" bir tasarımla çıkmasını sağlamak için kullanılacak.
  Marka kimliği (bkz. Bölüm 2) bu skill üzerinden uygulanacak.
- **code-reviewer** skill'i: Yazılan kodun kalitesini ve sürdürülebilirliğini kontrol etmek için
  geliştirme sürecinde düzenli olarak kullanılacak.

---

## 8. Deploy (Vercel) & Görsel Barındırma — ZORUNLU

Site **Vercel üzerinden deploy edilecek**. Bu nedenle proje baştan Vercel'de sorunsuz çalışacak
şekilde kurulacak (öneri: **Next.js App Router**, Vercel'in birinci sınıf desteklediği stack).

### 8.1 Görsellerin cloud'da görüntülenebilmesi (kritik gereksinim)

Deploy sonrası **AI ile üretilen tüm görseller Vercel/cloud üzerinden servis edilip
tarayıcıda görüntülenebilir olacak**. Yani görseller lokalde kalmayacak, production URL'de
de birebir aynı şekilde açılacak.

- **Vercel'in dosya sistemi kalıcı değildir** (serverless/read-only, ephemeral). Bu yüzden
  AI'dan dönen görseller **runtime'da diske yazılmayacak**.
- Üretilen görseller bir **object storage**'a yüklenecek ve public URL'i kullanılacak:
  - **Birincil tercih: Vercel Blob** (`@vercel/blob`) — Vercel ile aynı ekosistem, ekstra
    servis kurulumu yok, public URL doğrudan CDN'den servis edilir.
  - Alternatifler (gerekirse): Cloudinary, Supabase Storage, AWS S3 + CloudFront.
- **Akış:** AI görsel üretimi → object storage'a upload → dönen **public HTTPS URL**
  içerik metadata'sına yazılır (MDX frontmatter / JSON içerik dosyası / DB) → sayfada
  `next/image` ile bu URL render edilir.
- Görsel üretimi **build/authoring zamanında bir script ile** yapılacak (her istekte
  yeniden üretilmeyecek) — maliyet ve gecikme kontrolü için. Üretilen URL'ler içerikle
  birlikte commit'lenecek/saklanacak.
- Storage key'leri **slug bazlı ve deterministik** olacak (aynı yazı tekrar üretilirse
  aynı key'e yazılsın, çöp dosya birikmesin).
- `next.config` içinde uzak görsel host'ları **`images.remotePatterns`** ile izinli hale
  getirilecek (ör. `*.public.blob.vercel-storage.com`). Aksi halde production'da
  `next/image` görselleri **hata verir** — bu adım atlanmayacak.
- Statik marka varlıkları (logo, ikon vb.) `public/` altında kalabilir; **AI ile üretilen
  görseller `public/` altına yazılmayacak** (repo'yu şişirir ve yeni görsel için yeniden
  build gerektirir).
- Her görsel için **anlamlı `alt` metni** zorunlu; görsel üretimi/yüklemesi başarısız olursa
  markaya uygun bir **fallback/placeholder** görsel gösterilecek (sayfa asla kırılmayacak).
- Performans: `next/image` ile responsive `sizes`, AVIF/WebP çıktı, hero görselde `priority`,
  diğerlerinde lazy loading; storage tarafında uzun `Cache-Control` (immutable).

### 8.2 Environment variable'lar

- AI görsel API anahtarı ve storage token'ı (`BLOB_READ_WRITE_TOKEN` vb.) **koda gömülmeyecek**.
- Lokalde `.env.local`, Vercel'de **Project Settings → Environment Variables**
  (Production / Preview / Development) üzerinden tanımlanacak.
- `.env*` dosyaları `.gitignore`'da olacak; repo'ya secret commit edilmeyecek.
- Görsel üretim/upload işlemleri **sadece sunucu tarafında** (server action / route handler /
  build script) çalışacak; anahtarlar client bundle'a sızmayacak (`NEXT_PUBLIC_` kullanılmayacak).

### 8.3 Deploy sonrası doğrulama (checklist)

- [ ] `npm run build` lokalde hatasız (production build'de kırılan bir şey kalmadı)
- [ ] Vercel Preview deploy'unda tüm sayfalar açılıyor
- [ ] **Blog ve diğer sayfalardaki AI görselleri production URL'de yükleniyor** (404 / mixed
      content / `next/image` host hatası yok)
- [ ] Görseller CDN'den HTTPS ile geliyor, mobil ve masaüstünde responsive
- [ ] Lighthouse'da görsel kaynaklı belirgin performans/CLS problemi yok

---

## 9. Teknik / Süreç Notları

- Proje bir **Git branch** üzerinde geliştirilecek (branch bilgisi ayrıca iletilecek).
- **Şu an için GitHub'a push/branch işlemi yapılmayacak** — sadece geliştirme ortamında ilerlenecek.
  (Vercel deploy'u bu adım netleştikten sonra yapılacak; kod yine Vercel'e uyumlu kurulacak.)
- Depoda (repo) bir **MR (Merge Request) dosyası** mevcut; bu dosyada sistem promptları ve
  proje ile ilgili tüm talimatlar bulunuyor. **Geliştirmeye başlamadan önce bu MR dosyası
  incelenmeli ve talimatlar buna göre takip edilmeli.**

---

## 10. Teslim Edilecekler (Özet Checklist)

- [ ] `frontend-design` ve `code-reviewer` skill'leri kurulmuş ve süreç boyunca kullanılıyor
- [ ] "Ne Yersin?" marka kimliğiyle tasarlanmış, animasyonlu/geçişli ana sayfa
- [ ] Kullanıcı / Kurye / Restoran ekranlarını yansıtan bölümler
- [ ] Detaylı, AI görselli Blog sayfası ve yazı altyapısı
- [ ] Sektöre göre ayrılmış otomasyon/çözüm sayfaları
- [ ] "Veri değerlendirme" hizmet sayfası
- [ ] **Vercel'e deploy edilebilir yapı; AI görselleri cloud (Vercel Blob/CDN) üzerinden
      production'da görüntüleniyor** (bkz. Bölüm 8)
- [ ] Repo içindeki MR dosyasının incelenip talimatlara uyulması
- [ ] (İleride) Belirtilecek branch'e yükleme — **şimdilik yapılmayacak**
