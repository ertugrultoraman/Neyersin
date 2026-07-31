export type Ekstra = {
  id: string;
  ad: string;
  /** TL cinsinden ek ücret. */
  fiyat: number;
  /** "icecek" ise seçenek "İçecek eklemek ister misin?" bölümünde gösterilir. */
  tur?: "icecek";
};

export type Urun = {
  id: string;
  ad: string;
  aciklama: string;
  /** TL cinsinden, tam sayı. */
  fiyat: number;
  populer?: boolean;
  /** Fiyatı henüz belirlenmedi — menüde görünür ama sepete eklenemez. */
  taslak?: boolean;
  /** Müşterinin seçebileceği ekstra malzeme / içecek seçenekleri. */
  ekstralar?: Ekstra[];
};

export type MenuKategorisi = {
  ad: string;
  urunler: Urun[];
};

// Ortak ekstra/içecek seçenekleri — birden çok üründe tekrar kullanılır.
const KANAT_EKSTRALARI: Ekstra[] = [
  { id: "ekstra-sos", ad: "Ekstra Sos", fiyat: 15 },
  { id: "ekstra-peynir-sos", ad: "Ekstra Peynir Sos", fiyat: 18 },
  { id: "icecek-kola", ad: "Kola (330 ml)", fiyat: 25, tur: "icecek" },
  { id: "icecek-ayran", ad: "Ayran", fiyat: 20, tur: "icecek" },
  { id: "icecek-su", ad: "Su", fiyat: 10, tur: "icecek" },
];

const PIZZA_EKSTRALARI: Ekstra[] = [
  { id: "ekstra-peynir", ad: "Ekstra Peynir", fiyat: 25 },
  { id: "ekstra-sucuk", ad: "Ekstra Sucuk", fiyat: 30 },
  { id: "ekstra-sarimsak-sos", ad: "Sarımsak Sos", fiyat: 15 },
  { id: "icecek-kola", ad: "Kola (330 ml)", fiyat: 25, tur: "icecek" },
  { id: "icecek-salgam", ad: "Şalgam", fiyat: 22, tur: "icecek" },
  { id: "icecek-su", ad: "Su", fiyat: 10, tur: "icecek" },
];

const KEBAP_EKSTRALARI: Ekstra[] = [
  { id: "ekstra-pilav", ad: "Ekstra Pilav", fiyat: 35 },
  { id: "ekstra-lavas", ad: "Ekstra Lavaş", fiyat: 15 },
  { id: "ekstra-ezme", ad: "Acılı Ezme", fiyat: 20 },
  { id: "icecek-ayran", ad: "Ayran", fiyat: 20, tur: "icecek" },
  { id: "icecek-salgam", ad: "Şalgam", fiyat: 22, tur: "icecek" },
  { id: "icecek-kola", ad: "Kola (330 ml)", fiyat: 25, tur: "icecek" },
];

const BURGER_EKSTRALARI: Ekstra[] = [
  { id: "ekstra-peynir", ad: "Ekstra Peynir", fiyat: 20 },
  { id: "ekstra-kofte", ad: "Ekstra Köfte", fiyat: 45 },
  { id: "ekstra-cheddar-sos", ad: "Cheddar Sos", fiyat: 15 },
  { id: "icecek-kola", ad: "Kola (330 ml)", fiyat: 25, tur: "icecek" },
  { id: "icecek-milkshake", ad: "Milkshake", fiyat: 40, tur: "icecek" },
  { id: "icecek-su", ad: "Su", fiyat: 10, tur: "icecek" },
];

const DONER_EKSTRALARI: Ekstra[] = [
  { id: "ekstra-et", ad: "Ekstra Et", fiyat: 40 },
  { id: "ekstra-peynir", ad: "Ekstra Peynir", fiyat: 20 },
  { id: "ekstra-sos", ad: "Bol Sos", fiyat: 10 },
  { id: "icecek-ayran", ad: "Ayran", fiyat: 20, tur: "icecek" },
  { id: "icecek-kola", ad: "Kola (330 ml)", fiyat: 25, tur: "icecek" },
  { id: "icecek-salgam", ad: "Şalgam", fiyat: 22, tur: "icecek" },
];

/** Restoran slug'ı → menü kategorileri. */
export const menuler: Record<string, MenuKategorisi[]> = {
  "ates-kanat": [
    {
      ad: "Kanatlar",
      urunler: [
        { id: "ak-1", ad: "Acılı Baget (8 adet)", aciklama: "Ev yapımı acı sos, ranch dip, patates", fiyat: 215, populer: true, ekstralar: KANAT_EKSTRALARI },
        { id: "ak-2", ad: "Ballı Soslu Kanat (10 adet)", aciklama: "Bal-hardal glaze, susam, turşu", fiyat: 235, ekstralar: KANAT_EKSTRALARI },
        { id: "ak-3", ad: "Buffalo Kanat (10 adet)", aciklama: "Klasik buffalo sos, kereviz çubukları", fiyat: 240, populer: true, ekstralar: KANAT_EKSTRALARI },
        { id: "ak-4", ad: "BBQ Baget (8 adet)", aciklama: "Odun dumanı aromalı barbekü sos", fiyat: 225, ekstralar: KANAT_EKSTRALARI },
        { id: "ak-5", ad: "Karışık Tabak (14 adet)", aciklama: "Üç farklı sos, iki kişilik", fiyat: 385, ekstralar: KANAT_EKSTRALARI },
      ],
    },
    {
      ad: "Yanında İyi Gider",
      urunler: [
        { id: "ak-6", ad: "Baharatlı Patates", aciklama: "Cajun baharat, parmesan", fiyat: 78 },
        { id: "ak-7", ad: "Soğan Halkası", aciklama: "8 adet, çıtır kaplama", fiyat: 72 },
        { id: "ak-8", ad: "Coleslaw", aciklama: "Taze lahana salatası", fiyat: 45 },
        { id: "ak-9", ad: "Limonata", aciklama: "Ev yapımı, 400 ml", fiyat: 52 },
      ],
    },
  ],

  "kirmizi-firin": [
    {
      ad: "Taş Fırın Pizzalar",
      urunler: [
        { id: "kf-1", ad: "Margherita", aciklama: "San marzano domates, fior di latte, taze fesleğen", fiyat: 245, populer: true, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-2", ad: "Diavola", aciklama: "Acı salam, mozzarella, kalabria biberi", fiyat: 295, populer: true, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-3", ad: "Quattro Formaggi", aciklama: "Mozzarella, gorgonzola, parmesan, taleggio", fiyat: 320, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-4", ad: "Prosciutto e Funghi", aciklama: "Pişmiş jambon, mantar, mozzarella", fiyat: 310, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-5", ad: "Vegetariana", aciklama: "Mevsim sebzeleri, kabak çiçeği, ricotta", fiyat: 275, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-6", ad: "Tartufo", aciklama: "Trüf kremi, mantar, parmesan", fiyat: 385, ekstralar: PIZZA_EKSTRALARI },
      ],
    },
    {
      ad: "Başlangıç & Salata",
      urunler: [
        { id: "kf-7", ad: "Bruschetta (4 dilim)", aciklama: "Domates, fesleğen, sarımsaklı ekmek", fiyat: 105 },
        { id: "kf-8", ad: "Caprese", aciklama: "Mozzarella di bufala, domates, pesto", fiyat: 165 },
        { id: "kf-9", ad: "Sezar Salata", aciklama: "Tavuk, parmesan, kruton, sezar sos", fiyat: 185 },
      ],
    },
    {
      ad: "Tatlı & İçecek",
      urunler: [
        { id: "kf-10", ad: "Tiramisu", aciklama: "Mascarpone, espresso, kakao", fiyat: 135 },
        { id: "kf-11", ad: "Panna Cotta", aciklama: "Orman meyveli sos", fiyat: 120 },
        { id: "kf-12", ad: "İtalyan Limonata", aciklama: "330 ml", fiyat: 58 },
      ],
    },
  ],

  "sef-mangal": [
    {
      ad: "Izgara & Kebap",
      urunler: [
        { id: "sm-1", ad: "Adana Kebap (1,5 porsiyon)", aciklama: "Zırh kıyma, közlenmiş domates-biber, lavaş", fiyat: 340, populer: true, ekstralar: KEBAP_EKSTRALARI },
        { id: "sm-2", ad: "Kuzu Şiş", aciklama: "Marine kuzu but, pilav, ızgara sebze", fiyat: 420, populer: true, ekstralar: KEBAP_EKSTRALARI },
        { id: "sm-3", ad: "Tavuk Şiş", aciklama: "Yoğurt marinasyonu, bulgur pilavı", fiyat: 285, ekstralar: KEBAP_EKSTRALARI },
        { id: "sm-4", ad: "Kaburga (350 g)", aciklama: "Odun ateşinde 4 saat, patates püresi", fiyat: 495, ekstralar: KEBAP_EKSTRALARI },
        { id: "sm-5", ad: "Karışık Izgara", aciklama: "Adana, kuzu şiş, tavuk şiş, kanat", fiyat: 620, ekstralar: KEBAP_EKSTRALARI },
      ],
    },
    {
      ad: "Mezeler",
      urunler: [
        { id: "sm-6", ad: "Haydari", aciklama: "Süzme yoğurt, nane, sarımsak", fiyat: 85 },
        { id: "sm-7", ad: "Acılı Ezme", aciklama: "El kıyması domates, biber, nar ekşisi", fiyat: 80 },
        { id: "sm-8", ad: "Humus", aciklama: "Tahin, zeytinyağı, kimyon", fiyat: 95 },
        { id: "sm-9", ad: "Meze Tabağı (5 çeşit)", aciklama: "Şefin seçimi", fiyat: 265 },
      ],
    },
    {
      ad: "Tatlı",
      urunler: [
        { id: "sm-10", ad: "Künefe", aciklama: "Antep fıstığı, kaymak", fiyat: 155 },
        { id: "sm-11", ad: "Fırın Sütlaç", aciklama: "Tarçın, fıstık", fiyat: 95 },
      ],
    },
  ],

  "anne-sofrasi": [
    {
      ad: "Günün Yemekleri",
      urunler: [
        { id: "as-1", ad: "Etli Türlü", aciklama: "Mevsim sebzeleri, kuzu kuşbaşı, pilav", fiyat: 195, populer: true },
        { id: "as-2", ad: "Kuru Fasulye", aciklama: "Pastırmalı, pilav ve turşu ile", fiyat: 165, populer: true },
        { id: "as-3", ad: "Karnıyarık", aciklama: "Patlıcan, kıyma, domates sos", fiyat: 185 },
        { id: "as-4", ad: "Tavuk Sote", aciklama: "Sebzeli, tereyağlı pilav", fiyat: 175 },
        { id: "as-5", ad: "İçli Köfte (3 adet)", aciklama: "El yapımı, cevizli iç", fiyat: 145 },
        { id: "as-6", ad: "Zeytinyağlı Yaprak Sarma", aciklama: "8 adet, limon", fiyat: 155 },
      ],
    },
    {
      ad: "Çorbalar",
      urunler: [
        { id: "as-7", ad: "Ezogelin", aciklama: "Kırmızı mercimek, nane yağı", fiyat: 72 },
        { id: "as-8", ad: "Mercimek", aciklama: "Kremalı, limonlu", fiyat: 68 },
        { id: "as-9", ad: "Tavuk Suyu Şehriye", aciklama: "Günlük tavuk suyu", fiyat: 75 },
      ],
    },
    {
      ad: "Tatlı",
      urunler: [
        { id: "as-10", ad: "Kazandibi", aciklama: "Ev yapımı", fiyat: 88 },
        { id: "as-11", ad: "Ayva Tatlısı", aciklama: "Kaymaklı", fiyat: 95 },
      ],
    },
  ],

  "burger-atolyesi": [
    {
      ad: "Burgerler",
      urunler: [
        { id: "ba-1", ad: "Atölye Klasik", aciklama: "160 g dana, cheddar, turşu, özel sos", fiyat: 235, populer: true, ekstralar: BURGER_EKSTRALARI },
        { id: "ba-2", ad: "Çift Katlı Cheese", aciklama: "2×140 g, çifte cheddar, karamelize soğan", fiyat: 315, populer: true, ekstralar: BURGER_EKSTRALARI },
        { id: "ba-3", ad: "Mantarlı Truffle", aciklama: "Sotelenmiş mantar, trüf mayonez, gruyere", fiyat: 295, ekstralar: BURGER_EKSTRALARI },
        { id: "ba-4", ad: "Acı Jalapeño", aciklama: "Jalapeño, pepper jack, chipotle sos", fiyat: 275, ekstralar: BURGER_EKSTRALARI },
        { id: "ba-5", ad: "Nohut Köfteli (vegan)", aciklama: "Nohut-pancar köfte, tahin sos", fiyat: 225, ekstralar: BURGER_EKSTRALARI },
      ],
    },
    {
      ad: "Yan Ürün & İçecek",
      urunler: [
        { id: "ba-6", ad: "Elma Dilim Patates", aciklama: "Kabuklu, deniz tuzu", fiyat: 82 },
        { id: "ba-7", ad: "Trüflü Patates", aciklama: "Parmesan, trüf yağı", fiyat: 115 },
        { id: "ba-8", ad: "Milkshake", aciklama: "Vanilya / çikolata / çilek", fiyat: 95 },
        { id: "ba-9", ad: "Ev Yapımı Limonata", aciklama: "400 ml", fiyat: 55 },
      ],
    },
  ],

  "doner-vadisi": [
    {
      ad: "Döner",
      urunler: [
        { id: "dv-1", ad: "Et Döner Porsiyon (150 g)", aciklama: "Pilav üstü, yeşillik", fiyat: 175, populer: true, ekstralar: DONER_EKSTRALARI },
        { id: "dv-2", ad: "Tavuk Döner Porsiyon (180 g)", aciklama: "Pilav üstü, turşu", fiyat: 145, ekstralar: DONER_EKSTRALARI },
        { id: "dv-3", ad: "Et Dürüm", aciklama: "Lavaş, domates, biber, marul", fiyat: 135, populer: true, ekstralar: DONER_EKSTRALARI },
        { id: "dv-4", ad: "Tavuk Dürüm", aciklama: "Lavaş, patates, sos", fiyat: 115, ekstralar: DONER_EKSTRALARI },
        { id: "dv-5", ad: "İskender (200 g)", aciklama: "Tereyağı, yoğurt, domates sos", fiyat: 265, ekstralar: DONER_EKSTRALARI },
      ],
    },
    {
      ad: "Ekstralar",
      urunler: [
        { id: "dv-6", ad: "Patates Kızartması", aciklama: "Orta boy", fiyat: 55 },
        { id: "dv-7", ad: "Mevsim Salata", aciklama: "Limon, zeytinyağı", fiyat: 48 },
        { id: "dv-8", ad: "Ayran", aciklama: "300 ml, ev yapımı", fiyat: 32 },
        { id: "dv-9", ad: "Şalgam", aciklama: "300 ml, acılı", fiyat: 30 },
      ],
    },
  ],

  "tatli-kacamak": [
    {
      ad: "Pastalar",
      urunler: [
        { id: "tk-1", ad: "San Sebastian (dilim)", aciklama: "Bask usulü yanık cheesecake", fiyat: 155, populer: true },
        { id: "tk-2", ad: "Çikolatalı Brownie", aciklama: "%70 bitter, ceviz", fiyat: 125 },
        { id: "tk-3", ad: "Frambuazlı Cheesecake", aciklama: "Taze frambuaz sos", fiyat: 145, populer: true },
        { id: "tk-4", ad: "Havuçlu Kek", aciklama: "Krem peynirli krema", fiyat: 115 },
        { id: "tk-5", ad: "Profiterol", aciklama: "Çikolata soslu, 6 adet", fiyat: 135 },
      ],
    },
    {
      ad: "Dondurma & İçecek",
      urunler: [
        { id: "tk-6", ad: "Kaymaklı Dondurma (3 top)", aciklama: "Antep fıstığı serpme", fiyat: 105 },
        { id: "tk-7", ad: "Çikolatalı Dondurma (3 top)", aciklama: "Belçika çikolatası", fiyat: 105 },
        { id: "tk-8", ad: "Filtre Kahve", aciklama: "250 ml", fiyat: 68 },
      ],
    },
  ],

  "cekirdek-kahve": [
    {
      ad: "Kahveler",
      urunler: [
        { id: "ck-1", ad: "Flat White", aciklama: "Çift shot, mikroköpük", fiyat: 88, populer: true },
        { id: "ck-2", ad: "Filtre Kahve", aciklama: "Günün çekirdeği, V60", fiyat: 78 },
        { id: "ck-3", ad: "Cortado", aciklama: "Espresso, az süt", fiyat: 82 },
        { id: "ck-4", ad: "Ice Latte", aciklama: "Soğuk demleme bazlı", fiyat: 95, populer: true },
        { id: "ck-5", ad: "Türk Kahvesi", aciklama: "Orta şekerli, lokumla", fiyat: 62 },
      ],
    },
    {
      ad: "Kahvaltı & Sandviç",
      urunler: [
        { id: "ck-6", ad: "Avokadolu Ekşi Maya Tost", aciklama: "Poşe yumurta, pul biber", fiyat: 165, populer: true },
        { id: "ck-7", ad: "Kaşarlı Tost", aciklama: "Ekşi maya ekmek, tereyağı", fiyat: 95 },
        { id: "ck-8", ad: "Tavuklu Wrap", aciklama: "Izgara tavuk, kaesar sos", fiyat: 145 },
        { id: "ck-9", ad: "Tereyağlı Croissant", aciklama: "Günlük üretim", fiyat: 72 },
      ],
    },
  ],

  "deniz-kenari": [
    {
      ad: "Ana Yemekler",
      urunler: [
        { id: "dk-1", ad: "Levrek Izgara", aciklama: "Günlük levrek, roka, limon", fiyat: 520, populer: true },
        { id: "dk-2", ad: "Çipura Izgara", aciklama: "Zeytinyağlı otlar", fiyat: 480 },
        { id: "dk-3", ad: "Kalamar Tava", aciklama: "Tartar sos, mısır unu", fiyat: 385, populer: true },
        { id: "dk-4", ad: "Karides Güveç", aciklama: "Kaşar, kiraz domates, tereyağı", fiyat: 445 },
        { id: "dk-5", ad: "Hamsi Tava (mevsim)", aciklama: "Mısır unu, soğan salatası", fiyat: 295 },
      ],
    },
    {
      ad: "Mezeler",
      urunler: [
        { id: "dk-6", ad: "Girit Ezmesi", aciklama: "Beyaz peynir, ceviz, dereotu", fiyat: 105 },
        { id: "dk-7", ad: "Fava", aciklama: "Zeytinyağlı, dereotu", fiyat: 95 },
        { id: "dk-8", ad: "Ahtapot Salatası", aciklama: "Kırmızı soğan, limon", fiyat: 225 },
        { id: "dk-9", ad: "Deniz Börülcesi", aciklama: "Sarımsaklı zeytinyağı", fiyat: 88 },
      ],
    },
  ],

  "yesil-kase": [
    {
      ad: "Kaseler",
      urunler: [
        { id: "yk-1", ad: "Buddha Bowl", aciklama: "Kinoa, nohut, avokado, tahin sos", fiyat: 215, populer: true },
        { id: "yk-2", ad: "Falafel Kase", aciklama: "Ev yapımı falafel, bulgur, humus", fiyat: 195, populer: true },
        { id: "yk-3", ad: "Mercimekli Köz Patlıcan", aciklama: "Yeşil mercimek, köz patlıcan, nar ekşisi", fiyat: 185 },
        { id: "yk-4", ad: "Tofu Teriyaki Kase", aciklama: "Esmer pirinç, edamame, susam", fiyat: 225 },
      ],
    },
    {
      ad: "Salata & İçecek",
      urunler: [
        { id: "yk-5", ad: "Kale Sezar (vegan)", aciklama: "Karalahana, kaju sos, kruton", fiyat: 175 },
        { id: "yk-6", ad: "Pancarlı Portakal Salata", aciklama: "Ceviz, keçi peyniri opsiyonel", fiyat: 165 },
        { id: "yk-7", ad: "Yeşil Detoks", aciklama: "Ispanak, elma, zencefil, 400 ml", fiyat: 85 },
        { id: "yk-8", ad: "Kombucha", aciklama: "Ev yapımı, 330 ml", fiyat: 78 },
      ],
    },
  ],

  "kars-cig-borek": [
    {
      ad: "Çiğ Börek",
      urunler: [
        { id: "cb-1", ad: "Kıymalı Çiğ Börek (1 adet)", aciklama: "El açması, dana kıyma", fiyat: 48, populer: true },
        { id: "cb-2", ad: "Peynirli Çiğ Börek (1 adet)", aciklama: "Kars kaşarı", fiyat: 45 },
        { id: "cb-3", ad: "Patatesli Çiğ Börek (1 adet)", aciklama: "Baharatlı patates", fiyat: 42 },
        { id: "cb-4", ad: "6'lı Karışık Tabak", aciklama: "Üç çeşit, ayran ile", fiyat: 265, populer: true },
      ],
    },
    {
      ad: "Yanında",
      urunler: [
        { id: "cb-5", ad: "Kars Ayranı", aciklama: "300 ml", fiyat: 35 },
        { id: "cb-6", ad: "Mercimek Çorbası", aciklama: "Limonlu", fiyat: 62 },
        { id: "cb-7", ad: "Sütlaç", aciklama: "Fırında", fiyat: 78 },
      ],
    },
  ],

  "pide-ustasi": [
    {
      ad: "Pideler",
      urunler: [
        { id: "pu-1", ad: "Kıymalı Pide", aciklama: "Taş fırın, tereyağlı", fiyat: 165, populer: true },
        { id: "pu-2", ad: "Kaşarlı Pide", aciklama: "Bol kaşar", fiyat: 155 },
        { id: "pu-3", ad: "Kuşbaşılı Kaşarlı", aciklama: "Dana kuşbaşı, kaşar", fiyat: 215, populer: true },
        { id: "pu-4", ad: "Sucuklu Yumurtalı", aciklama: "Kayseri sucuğu", fiyat: 185 },
        { id: "pu-5", ad: "Karışık Pide", aciklama: "Kıyma, kaşar, sucuk", fiyat: 225 },
      ],
    },
    {
      ad: "Lahmacun & Çorba",
      urunler: [
        { id: "pu-6", ad: "Lahmacun (2 adet)", aciklama: "Acılı / acısız", fiyat: 125, populer: true },
        { id: "pu-7", ad: "Ayvalık Tost Pide", aciklama: "Sucuk, kaşar, turşu", fiyat: 145 },
        { id: "pu-8", ad: "Ezogelin Çorba", aciklama: "Nane yağlı", fiyat: 68 },
        { id: "pu-9", ad: "Ayran", aciklama: "300 ml", fiyat: 32 },
      ],
    },
  ],

  "baharat-yolu": [
    {
      ad: "Hint Mutfağı",
      urunler: [
        { id: "by-1", ad: "Butter Chicken", aciklama: "Tereyağlı domates sos, basmati pilav", fiyat: 315, populer: true },
        { id: "by-2", ad: "Chicken Tikka Masala", aciklama: "Tandır tavuk, baharatlı sos", fiyat: 325, populer: true },
        { id: "by-3", ad: "Palak Paneer", aciklama: "Ispanak, taze paneer (vejetaryen)", fiyat: 275 },
        { id: "by-4", ad: "Dal Tadka", aciklama: "Sarı mercimek, kimyon tadka", fiyat: 225 },
        { id: "by-5", ad: "Lamb Rogan Josh", aciklama: "Kuzu, Keşmir baharatları", fiyat: 385 },
      ],
    },
    {
      ad: "Uzak Doğu",
      urunler: [
        { id: "by-6", ad: "Pad Thai", aciklama: "Pirinç eriştesi, yer fıstığı, tamarind", fiyat: 285 },
        { id: "by-7", ad: "Yeşil Köri", aciklama: "Hindistan cevizi sütü, Tay fesleğeni", fiyat: 295 },
        { id: "by-8", ad: "Gyoza (6 adet)", aciklama: "Tavuk, ponzu sos", fiyat: 165 },
      ],
    },
    {
      ad: "Ekmek & İçecek",
      urunler: [
        { id: "by-9", ad: "Sarımsaklı Naan", aciklama: "Tandır ekmeği", fiyat: 65 },
        { id: "by-10", ad: "Mango Lassi", aciklama: "300 ml", fiyat: 88 },
      ],
    },
  ],

  "sabah-simit": [
    {
      ad: "Kahvaltı",
      urunler: [
        { id: "ss-1", ad: "Serpme Kahvaltı (2 kişi)", aciklama: "18 çeşit, çay dahil", fiyat: 545, populer: true },
        { id: "ss-2", ad: "Simit + Çay + Peynir", aciklama: "Klasik sabah menüsü", fiyat: 95, populer: true },
        { id: "ss-3", ad: "Menemen", aciklama: "Sucuklu / sade, ekmek ile", fiyat: 155 },
        { id: "ss-4", ad: "Kaşarlı Omlet", aciklama: "3 yumurta, yeşillik", fiyat: 135 },
      ],
    },
    {
      ad: "Fırın",
      urunler: [
        { id: "ss-5", ad: "Su Böreği (dilim)", aciklama: "El açması, peynirli", fiyat: 88 },
        { id: "ss-6", ad: "Açma", aciklama: "Tereyağlı, 2 adet", fiyat: 62 },
        { id: "ss-7", ad: "Poğaça", aciklama: "Peynirli / patatesli, 2 adet", fiyat: 58 },
        { id: "ss-8", ad: "Demleme Çay", aciklama: "Bardak", fiyat: 25 },
      ],
    },
  ],

  "gece-lezzetleri": [
    {
      ad: "Tost & Sandviç",
      urunler: [
        { id: "gl-1", ad: "Kaşarlı Tost", aciklama: "Çift kaşar, tereyağlı", fiyat: 98, populer: true },
        { id: "gl-2", ad: "Karışık Tost", aciklama: "Sucuk, kaşar, domates", fiyat: 125, populer: true },
        { id: "gl-3", ad: "Ayvalık Tost", aciklama: "Sucuk, piyaz, turşu, russian sos", fiyat: 165 },
        { id: "gl-4", ad: "Tavuklu Sandviç", aciklama: "Izgara tavuk, ranch", fiyat: 145 },
      ],
    },
    {
      ad: "Gece Menüsü",
      urunler: [
        { id: "gl-5", ad: "İşkembe Çorbası", aciklama: "Sarımsaklı sirke ile", fiyat: 115 },
        { id: "gl-6", ad: "Mercimek Çorbası", aciklama: "Limonlu", fiyat: 68 },
        { id: "gl-7", ad: "Patates Kızartması", aciklama: "Büyük boy, soslu", fiyat: 72 },
        { id: "gl-8", ad: "Soda / Ayran", aciklama: "300 ml", fiyat: 28 },
      ],
    },
  ],

  "hizli-market": [
    {
      ad: "Temel İhtiyaç",
      urunler: [
        { id: "hm-1", ad: "Süt 1 L", aciklama: "Tam yağlı, günlük", fiyat: 42, populer: true },
        { id: "hm-2", ad: "Yumurta (10 adet)", aciklama: "Gezen tavuk", fiyat: 98 },
        { id: "hm-3", ad: "Ekmek", aciklama: "Ekşi maya, 500 g", fiyat: 35 },
        { id: "hm-4", ad: "Beyaz Peynir 500 g", aciklama: "Tam yağlı, inek", fiyat: 145 },
        { id: "hm-5", ad: "Tereyağı 250 g", aciklama: "Günlük üretim", fiyat: 165 },
      ],
    },
    {
      ad: "Atıştırmalık & İçecek",
      urunler: [
        { id: "hm-6", ad: "Cips (Büyük Boy)", aciklama: "Baharatlı / sade", fiyat: 58, populer: true },
        { id: "hm-7", ad: "Çikolata (70 g)", aciklama: "Bitter / sütlü", fiyat: 45 },
        { id: "hm-8", ad: "Maden Suyu (6'lı)", aciklama: "200 ml × 6", fiyat: 72 },
        { id: "hm-9", ad: "Soğuk Kahve", aciklama: "250 ml, şekersiz", fiyat: 62 },
        { id: "hm-10", ad: "Dondurma (Kutu)", aciklama: "500 ml, vanilya", fiyat: 125 },
      ],
    },
  ],

  "makbule-sef": [
    {
      ad: "Ana Yemekler",
      urunler: [
        { id: "ms-1", ad: "Ev Yapımı Hamburger", aciklama: "El açması ekmek, taze köfte harcı", fiyat: 0, taslak: true },
        { id: "ms-2", ad: "El Yapımı Mantı", aciklama: "İnce açılmış hamur, yoğurtlu sarımsak sos", fiyat: 0, taslak: true },
        { id: "ms-3", ad: "İçli Köfte", aciklama: "Bulgur kabuğu, kıymalı iç harç", fiyat: 0, taslak: true },
        { id: "ms-4", ad: "Taze Fasulye", aciklama: "Zeytinyağlı, ev usulü", fiyat: 0, taslak: true },
        { id: "ms-5", ad: "Kuru Fasulye (Pilavlı)", aciklama: "Etli kuru fasulye, yanında pirinç pilavı", fiyat: 0, taslak: true },
      ],
    },
    {
      ad: "Tatlılar",
      urunler: [
        { id: "ms-6", ad: "Sütlaç", aciklama: "Fırında kavrulmuş, ev yapımı", fiyat: 0, taslak: true },
        { id: "ms-7", ad: "Güllaç", aciklama: "Ceviz ve nar taneli, mevsimlik", fiyat: 0, taslak: true },
      ],
    },
    {
      ad: "İçecekler",
      urunler: [
        { id: "ms-8", ad: "Sarıyer Kola", aciklama: "330 ml, soğuk servis", fiyat: 0, taslak: true },
      ],
    },
  ],
};

export function menuBul(restoranSlug: string): MenuKategorisi[] {
  return menuler[restoranSlug] ?? [];
}

export function urunBul(restoranSlug: string, urunId: string): Urun | undefined {
  for (const kategori of menuBul(restoranSlug)) {
    const urun = kategori.urunler.find((u) => u.id === urunId);
    if (urun) return urun;
  }
  return undefined;
}

export function populerUrunler(restoranSlug: string): Urun[] {
  return menuBul(restoranSlug)
    .flatMap((k) => k.urunler)
    .filter((u) => u.populer && !u.taslak);
}
