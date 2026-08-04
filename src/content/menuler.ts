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
  /**
   * Ambalaj bilgisi: "500 g cam kavanoz", "1 L şişe".
   * Tabakta değil pakette satılan ürünlerde (tereyağı, yoğurt, reçel) fiyatın
   * yanında gösterilir — 250 g mı 1 kg mı olduğunu bilmeden fiyat anlamsız.
   */
  birim?: string;
  /** İngilizce ad; girilmemişse Türkçesi gösteriliyor. */
  adEn?: string;
  /** İngilizce açıklama; girilmemişse Türkçesi gösteriliyor. */
  aciklamaEn?: string;
  /**
   * Şefin/yöneticinin yüklediği gerçek fotoğraf (Vercel Blob adresi).
   * Yoksa yapay zekâ görseli ya da yer tutucu gösteriliyor.
   */
  gorselUrl?: string;
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
        { id: "ak-1", ad: "Acılı Baget (8 adet)", adEn: "Spicy Drumsticks (8 pcs)", aciklama: "Ev yapımı acı sos, ranch dip, patates", aciklamaEn: "House hot sauce, ranch dip, fries", fiyat: 215, populer: true, ekstralar: KANAT_EKSTRALARI },
        { id: "ak-2", ad: "Ballı Soslu Kanat (10 adet)", adEn: "Honey Glazed Wings (10 pcs)", aciklama: "Bal-hardal glaze, susam, turşu", aciklamaEn: "Honey-mustard glaze, sesame, pickles", fiyat: 235, ekstralar: KANAT_EKSTRALARI },
        { id: "ak-3", ad: "Buffalo Kanat (10 adet)", adEn: "Buffalo Wings (10 pcs)", aciklama: "Klasik buffalo sos, kereviz çubukları", aciklamaEn: "Classic buffalo sauce, celery sticks", fiyat: 240, populer: true, ekstralar: KANAT_EKSTRALARI },
        { id: "ak-4", ad: "BBQ Baget (8 adet)", adEn: "BBQ Drumsticks (8 pcs)", aciklama: "Odun dumanı aromalı barbekü sos", aciklamaEn: "Wood-smoked barbecue sauce", fiyat: 225, ekstralar: KANAT_EKSTRALARI },
        { id: "ak-5", ad: "Karışık Tabak (14 adet)", adEn: "Mixed Platter (14 pcs)", aciklama: "Üç farklı sos, iki kişilik", aciklamaEn: "Three different sauces, serves two", fiyat: 385, ekstralar: KANAT_EKSTRALARI },
      ],
    },
    {
      ad: "Yanında İyi Gider",
      urunler: [
        { id: "ak-6", ad: "Baharatlı Patates", adEn: "Spiced Fries", aciklama: "Cajun baharat, parmesan", aciklamaEn: "Cajun spice, parmesan", fiyat: 78 },
        { id: "ak-7", ad: "Soğan Halkası", adEn: "Onion Rings", aciklama: "8 adet, çıtır kaplama", aciklamaEn: "8 pieces, crispy coating", fiyat: 72 },
        { id: "ak-8", ad: "Coleslaw", adEn: "Coleslaw", aciklama: "Taze lahana salatası", aciklamaEn: "Fresh cabbage salad", fiyat: 45 },
        { id: "ak-9", ad: "Limonata", adEn: "Lemonade", aciklama: "Ev yapımı, 400 ml", aciklamaEn: "Home-made, 400 ml", fiyat: 52 },
      ],
    },
  ],

  "kirmizi-firin": [
    {
      ad: "Taş Fırın Pizzalar",
      urunler: [
        { id: "kf-1", ad: "Margherita", adEn: "Margherita", aciklama: "San marzano domates, fior di latte, taze fesleğen", aciklamaEn: "San Marzano tomatoes, fior di latte, fresh basil", fiyat: 245, populer: true, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-2", ad: "Diavola", adEn: "Diavola", aciklama: "Acı salam, mozzarella, kalabria biberi", aciklamaEn: "Spicy salami, mozzarella, Calabrian chilli", fiyat: 295, populer: true, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-3", ad: "Quattro Formaggi", adEn: "Quattro Formaggi", aciklama: "Mozzarella, gorgonzola, parmesan, taleggio", aciklamaEn: "Mozzarella, gorgonzola, parmesan, taleggio", fiyat: 320, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-4", ad: "Prosciutto e Funghi", adEn: "Prosciutto e Funghi", aciklama: "Pişmiş jambon, mantar, mozzarella", aciklamaEn: "Cooked ham, mushrooms, mozzarella", fiyat: 310, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-5", ad: "Vegetariana", adEn: "Vegetariana", aciklama: "Mevsim sebzeleri, kabak çiçeği, ricotta", aciklamaEn: "Seasonal vegetables, courgette flower, ricotta", fiyat: 275, ekstralar: PIZZA_EKSTRALARI },
        { id: "kf-6", ad: "Tartufo", adEn: "Tartufo", aciklama: "Trüf kremi, mantar, parmesan", aciklamaEn: "Truffle cream, mushrooms, parmesan", fiyat: 385, ekstralar: PIZZA_EKSTRALARI },
      ],
    },
    {
      ad: "Başlangıç & Salata",
      urunler: [
        { id: "kf-7", ad: "Bruschetta (4 dilim)", adEn: "Bruschetta (4 slices)", aciklama: "Domates, fesleğen, sarımsaklı ekmek", aciklamaEn: "Tomato, basil, garlic bread", fiyat: 105 },
        { id: "kf-8", ad: "Caprese", adEn: "Caprese", aciklama: "Mozzarella di bufala, domates, pesto", aciklamaEn: "Mozzarella di bufala, tomato, pesto", fiyat: 165 },
        { id: "kf-9", ad: "Sezar Salata", adEn: "Caesar Salad", aciklama: "Tavuk, parmesan, kruton, sezar sos", aciklamaEn: "Chicken, parmesan, croutons, Caesar dressing", fiyat: 185 },
      ],
    },
    {
      ad: "Tatlı & İçecek",
      urunler: [
        { id: "kf-10", ad: "Tiramisu", adEn: "Tiramisu", aciklama: "Mascarpone, espresso, kakao", aciklamaEn: "Mascarpone, espresso, cocoa", fiyat: 135 },
        { id: "kf-11", ad: "Panna Cotta", adEn: "Panna Cotta", aciklama: "Orman meyveli sos", aciklamaEn: "Forest berry sauce", fiyat: 120 },
        { id: "kf-12", ad: "İtalyan Limonata", adEn: "Italian Lemonade", aciklama: "330 ml", aciklamaEn: "330 ml", fiyat: 58 },
      ],
    },
  ],

  "sef-mangal": [
    {
      ad: "Izgara & Kebap",
      urunler: [
        { id: "sm-1", ad: "Adana Kebap (1,5 porsiyon)", adEn: "Adana Kebab (1.5 portions)", aciklama: "Zırh kıyma, közlenmiş domates-biber, lavaş", aciklamaEn: "Hand-minced lamb, charred tomato and pepper, lavash", fiyat: 340, populer: true, ekstralar: KEBAP_EKSTRALARI },
        { id: "sm-2", ad: "Kuzu Şiş", adEn: "Lamb Shish", aciklama: "Marine kuzu but, pilav, ızgara sebze", aciklamaEn: "Marinated leg of lamb, rice, grilled vegetables", fiyat: 420, populer: true, ekstralar: KEBAP_EKSTRALARI },
        { id: "sm-3", ad: "Tavuk Şiş", adEn: "Chicken Shish", aciklama: "Yoğurt marinasyonu, bulgur pilavı", aciklamaEn: "Yoghurt marinade, bulgur pilaf", fiyat: 285, ekstralar: KEBAP_EKSTRALARI },
        { id: "sm-4", ad: "Kaburga (350 g)", adEn: "Ribs (350 g)", aciklama: "Odun ateşinde 4 saat, patates püresi", aciklamaEn: "Four hours over wood fire, mashed potato", fiyat: 495, ekstralar: KEBAP_EKSTRALARI },
        { id: "sm-5", ad: "Karışık Izgara", adEn: "Mixed Grill", aciklama: "Adana, kuzu şiş, tavuk şiş, kanat", aciklamaEn: "Adana, lamb shish, chicken shish, wings", fiyat: 620, ekstralar: KEBAP_EKSTRALARI },
      ],
    },
    {
      ad: "Mezeler",
      urunler: [
        { id: "sm-6", ad: "Haydari", adEn: "Haydari", aciklama: "Süzme yoğurt, nane, sarımsak", aciklamaEn: "Strained yoghurt, mint, garlic", fiyat: 85 },
        { id: "sm-7", ad: "Acılı Ezme", adEn: "Acılı Ezme (spicy relish)", aciklama: "El kıyması domates, biber, nar ekşisi", aciklamaEn: "Hand-chopped tomato, pepper, pomegranate molasses", fiyat: 80 },
        { id: "sm-8", ad: "Humus", adEn: "Hummus", aciklama: "Tahin, zeytinyağı, kimyon", aciklamaEn: "Tahini, olive oil, cumin", fiyat: 95 },
        { id: "sm-9", ad: "Meze Tabağı (5 çeşit)", adEn: "Meze Platter (5 kinds)", aciklama: "Şefin seçimi", aciklamaEn: "Chef's selection", fiyat: 265 },
      ],
    },
    {
      ad: "Tatlı",
      urunler: [
        { id: "sm-10", ad: "Künefe", adEn: "Künefe", aciklama: "Antep fıstığı, kaymak", aciklamaEn: "Shredded pastry with cheese, pistachio, clotted cream", fiyat: 155 },
        { id: "sm-11", ad: "Fırın Sütlaç", adEn: "Baked Rice Pudding", aciklama: "Tarçın, fıstık", aciklamaEn: "Cinnamon, pistachio", fiyat: 95 },
      ],
    },
  ],

  "anne-sofrasi": [
    {
      ad: "Günün Yemekleri",
      urunler: [
        { id: "as-1", ad: "Etli Türlü", adEn: "Lamb and Vegetable Stew", aciklama: "Mevsim sebzeleri, kuzu kuşbaşı, pilav", aciklamaEn: "Seasonal vegetables, diced lamb, rice", fiyat: 195, populer: true },
        { id: "as-2", ad: "Kuru Fasulye", adEn: "White Beans in Tomato Sauce", aciklama: "Pastırmalı, pilav ve turşu ile", aciklamaEn: "With pastırma, served with rice and pickles", fiyat: 165, populer: true },
        { id: "as-3", ad: "Karnıyarık", adEn: "Karnıyarık", aciklama: "Patlıcan, kıyma, domates sos", aciklamaEn: "Stuffed aubergine with minced meat in tomato sauce", fiyat: 185 },
        { id: "as-4", ad: "Tavuk Sote", adEn: "Chicken Sauté", aciklama: "Sebzeli, tereyağlı pilav", aciklamaEn: "With vegetables and buttered rice", fiyat: 175 },
        { id: "as-5", ad: "İçli Köfte (3 adet)", adEn: "İçli Köfte (3 pcs)", aciklama: "El yapımı, cevizli iç", aciklamaEn: "Hand-made bulgur shells with walnut filling", fiyat: 145 },
        { id: "as-6", ad: "Zeytinyağlı Yaprak Sarma", adEn: "Stuffed Vine Leaves in Olive Oil", aciklama: "8 adet, limon", aciklamaEn: "8 pieces, lemon", fiyat: 155 },
      ],
    },
    {
      ad: "Çorbalar",
      urunler: [
        { id: "as-7", ad: "Ezogelin", adEn: "Ezogelin Soup", aciklama: "Kırmızı mercimek, nane yağı", aciklamaEn: "Red lentils, mint oil", fiyat: 72 },
        { id: "as-8", ad: "Mercimek", adEn: "Lentil Soup", aciklama: "Kremalı, limonlu", aciklamaEn: "Creamy, with lemon", fiyat: 68 },
        { id: "as-9", ad: "Tavuk Suyu Şehriye", adEn: "Chicken Noodle Soup", aciklama: "Günlük tavuk suyu", aciklamaEn: "Made with fresh chicken stock", fiyat: 75 },
      ],
    },
    {
      ad: "Tatlı",
      urunler: [
        { id: "as-10", ad: "Kazandibi", adEn: "Kazandibi", aciklama: "Ev yapımı", aciklamaEn: "Home-made caramelised milk pudding", fiyat: 88 },
        { id: "as-11", ad: "Ayva Tatlısı", adEn: "Quince Dessert", aciklama: "Kaymaklı", aciklamaEn: "With clotted cream", fiyat: 95 },
      ],
    },
  ],

  "burger-atolyesi": [
    {
      ad: "Burgerler",
      urunler: [
        { id: "ba-1", ad: "Atölye Klasik", adEn: "Workshop Classic", aciklama: "160 g dana, cheddar, turşu, özel sos", aciklamaEn: "160 g beef, cheddar, pickles, house sauce", fiyat: 235, populer: true, ekstralar: BURGER_EKSTRALARI },
        { id: "ba-2", ad: "Çift Katlı Cheese", adEn: "Double Cheese", aciklama: "2×140 g, çifte cheddar, karamelize soğan", aciklamaEn: "2×140 g, double cheddar, caramelised onion", fiyat: 315, populer: true, ekstralar: BURGER_EKSTRALARI },
        { id: "ba-3", ad: "Mantarlı Truffle", adEn: "Mushroom Truffle", aciklama: "Sotelenmiş mantar, trüf mayonez, gruyere", aciklamaEn: "Sautéed mushrooms, truffle mayo, gruyère", fiyat: 295, ekstralar: BURGER_EKSTRALARI },
        { id: "ba-4", ad: "Acı Jalapeño", adEn: "Spicy Jalapeño", aciklama: "Jalapeño, pepper jack, chipotle sos", aciklamaEn: "Jalapeño, pepper jack, chipotle sauce", fiyat: 275, ekstralar: BURGER_EKSTRALARI },
        { id: "ba-5", ad: "Nohut Köfteli (vegan)", adEn: "Chickpea Patty (vegan)", aciklama: "Nohut-pancar köfte, tahin sos", aciklamaEn: "Chickpea-beetroot patty, tahini sauce", fiyat: 225, ekstralar: BURGER_EKSTRALARI },
      ],
    },
    {
      ad: "Yan Ürün & İçecek",
      urunler: [
        { id: "ba-6", ad: "Elma Dilim Patates", adEn: "Wedge Potatoes", aciklama: "Kabuklu, deniz tuzu", aciklamaEn: "Skin on, sea salt", fiyat: 82 },
        { id: "ba-7", ad: "Trüflü Patates", adEn: "Truffle Fries", aciklama: "Parmesan, trüf yağı", aciklamaEn: "Parmesan, truffle oil", fiyat: 115 },
        { id: "ba-8", ad: "Milkshake", adEn: "Milkshake", aciklama: "Vanilya / çikolata / çilek", aciklamaEn: "Vanilla / chocolate / strawberry", fiyat: 95 },
        { id: "ba-9", ad: "Ev Yapımı Limonata", adEn: "Home-made Lemonade", aciklama: "400 ml", aciklamaEn: "400 ml", fiyat: 55 },
      ],
    },
  ],

  "doner-vadisi": [
    {
      ad: "Döner",
      urunler: [
        { id: "dv-1", ad: "Et Döner Porsiyon (150 g)", adEn: "Beef Doner Plate (150 g)", aciklama: "Pilav üstü, yeşillik", aciklamaEn: "Over rice, with greens", fiyat: 175, populer: true, ekstralar: DONER_EKSTRALARI },
        { id: "dv-2", ad: "Tavuk Döner Porsiyon (180 g)", adEn: "Chicken Doner Plate (180 g)", aciklama: "Pilav üstü, turşu", aciklamaEn: "Over rice, with pickles", fiyat: 145, ekstralar: DONER_EKSTRALARI },
        { id: "dv-3", ad: "Et Dürüm", adEn: "Beef Doner Wrap", aciklama: "Lavaş, domates, biber, marul", aciklamaEn: "Lavash, tomato, pepper, lettuce", fiyat: 135, populer: true, ekstralar: DONER_EKSTRALARI },
        { id: "dv-4", ad: "Tavuk Dürüm", adEn: "Chicken Doner Wrap", aciklama: "Lavaş, patates, sos", aciklamaEn: "Lavash, fries, sauce", fiyat: 115, ekstralar: DONER_EKSTRALARI },
        { id: "dv-5", ad: "İskender (200 g)", adEn: "İskender (200 g)", aciklama: "Tereyağı, yoğurt, domates sos", aciklamaEn: "Doner over bread with butter, yoghurt and tomato sauce", fiyat: 265, ekstralar: DONER_EKSTRALARI },
      ],
    },
    {
      ad: "Ekstralar",
      urunler: [
        { id: "dv-6", ad: "Patates Kızartması", adEn: "Fries", aciklama: "Orta boy", aciklamaEn: "Medium", fiyat: 55 },
        { id: "dv-7", ad: "Mevsim Salata", adEn: "Seasonal Salad", aciklama: "Limon, zeytinyağı", aciklamaEn: "Lemon, olive oil", fiyat: 48 },
        { id: "dv-8", ad: "Ayran", adEn: "Ayran", aciklama: "300 ml, ev yapımı", aciklamaEn: "300 ml, home-made yoghurt drink", fiyat: 32 },
        { id: "dv-9", ad: "Şalgam", adEn: "Şalgam", aciklama: "300 ml, acılı", aciklamaEn: "300 ml, spicy fermented turnip juice", fiyat: 30 },
      ],
    },
  ],

  "tatli-kacamak": [
    {
      ad: "Pastalar",
      urunler: [
        { id: "tk-1", ad: "San Sebastian (dilim)", adEn: "San Sebastian (slice)", aciklama: "Bask usulü yanık cheesecake", aciklamaEn: "Basque burnt cheesecake", fiyat: 155, populer: true },
        { id: "tk-2", ad: "Çikolatalı Brownie", adEn: "Chocolate Brownie", aciklama: "%70 bitter, ceviz", aciklamaEn: "70% dark chocolate, walnuts", fiyat: 125 },
        { id: "tk-3", ad: "Frambuazlı Cheesecake", adEn: "Raspberry Cheesecake", aciklama: "Taze frambuaz sos", aciklamaEn: "Fresh raspberry sauce", fiyat: 145, populer: true },
        { id: "tk-4", ad: "Havuçlu Kek", adEn: "Carrot Cake", aciklama: "Krem peynirli krema", aciklamaEn: "Cream cheese frosting", fiyat: 115 },
        { id: "tk-5", ad: "Profiterol", adEn: "Profiteroles", aciklama: "Çikolata soslu, 6 adet", aciklamaEn: "Chocolate sauce, 6 pieces", fiyat: 135 },
      ],
    },
    {
      ad: "Dondurma & İçecek",
      urunler: [
        { id: "tk-6", ad: "Kaymaklı Dondurma (3 top)", adEn: "Clotted Cream Ice Cream (3 scoops)", aciklama: "Antep fıstığı serpme", aciklamaEn: "Sprinkled with pistachio", fiyat: 105 },
        { id: "tk-7", ad: "Çikolatalı Dondurma (3 top)", adEn: "Chocolate Ice Cream (3 scoops)", aciklama: "Belçika çikolatası", aciklamaEn: "Belgian chocolate", fiyat: 105 },
        { id: "tk-8", ad: "Filtre Kahve", adEn: "Filter Coffee", aciklama: "250 ml", aciklamaEn: "250 ml", fiyat: 68 },
      ],
    },
  ],

  "cekirdek-kahve": [
    {
      ad: "Kahveler",
      urunler: [
        { id: "ck-1", ad: "Flat White", adEn: "Flat White", aciklama: "Çift shot, mikroköpük", aciklamaEn: "Double shot, microfoam", fiyat: 88, populer: true },
        { id: "ck-2", ad: "Filtre Kahve", adEn: "Filter Coffee", aciklama: "Günün çekirdeği, V60", aciklamaEn: "Bean of the day, V60", fiyat: 78 },
        { id: "ck-3", ad: "Cortado", adEn: "Cortado", aciklama: "Espresso, az süt", aciklamaEn: "Espresso with a little milk", fiyat: 82 },
        { id: "ck-4", ad: "Ice Latte", adEn: "Iced Latte", aciklama: "Soğuk demleme bazlı", aciklamaEn: "Cold brew base", fiyat: 95, populer: true },
        { id: "ck-5", ad: "Türk Kahvesi", adEn: "Turkish Coffee", aciklama: "Orta şekerli, lokumla", aciklamaEn: "Medium sweet, served with Turkish delight", fiyat: 62 },
      ],
    },
    {
      ad: "Kahvaltı & Sandviç",
      urunler: [
        { id: "ck-6", ad: "Avokadolu Ekşi Maya Tost", adEn: "Avocado Sourdough Toast", aciklama: "Poşe yumurta, pul biber", aciklamaEn: "Poached egg, chilli flakes", fiyat: 165, populer: true },
        { id: "ck-7", ad: "Kaşarlı Tost", adEn: "Cheese Toastie", aciklama: "Ekşi maya ekmek, tereyağı", aciklamaEn: "Sourdough bread, butter", fiyat: 95 },
        { id: "ck-8", ad: "Tavuklu Wrap", adEn: "Chicken Wrap", aciklama: "Izgara tavuk, kaesar sos", aciklamaEn: "Grilled chicken, Caesar dressing", fiyat: 145 },
        { id: "ck-9", ad: "Tereyağlı Croissant", adEn: "Butter Croissant", aciklama: "Günlük üretim", aciklamaEn: "Baked fresh daily", fiyat: 72 },
      ],
    },
  ],

  "deniz-kenari": [
    {
      ad: "Ana Yemekler",
      urunler: [
        { id: "dk-1", ad: "Levrek Izgara", adEn: "Grilled Sea Bass", aciklama: "Günlük levrek, roka, limon", aciklamaEn: "Daily catch, rocket, lemon", fiyat: 520, populer: true },
        { id: "dk-2", ad: "Çipura Izgara", adEn: "Grilled Sea Bream", aciklama: "Zeytinyağlı otlar", aciklamaEn: "Herbs in olive oil", fiyat: 480 },
        { id: "dk-3", ad: "Kalamar Tava", adEn: "Fried Calamari", aciklama: "Tartar sos, mısır unu", aciklamaEn: "Tartare sauce, cornmeal crust", fiyat: 385, populer: true },
        { id: "dk-4", ad: "Karides Güveç", adEn: "Prawn Casserole", aciklama: "Kaşar, kiraz domates, tereyağı", aciklamaEn: "Cheese, cherry tomatoes, butter", fiyat: 445 },
        { id: "dk-5", ad: "Hamsi Tava (mevsim)", adEn: "Fried Anchovies (seasonal)", aciklama: "Mısır unu, soğan salatası", aciklamaEn: "Cornmeal crust, onion salad", fiyat: 295 },
      ],
    },
    {
      ad: "Mezeler",
      urunler: [
        { id: "dk-6", ad: "Girit Ezmesi", adEn: "Cretan Dip", aciklama: "Beyaz peynir, ceviz, dereotu", aciklamaEn: "White cheese, walnuts, dill", fiyat: 105 },
        { id: "dk-7", ad: "Fava", adEn: "Fava", aciklama: "Zeytinyağlı, dereotu", aciklamaEn: "Broad bean purée with olive oil and dill", fiyat: 95 },
        { id: "dk-8", ad: "Ahtapot Salatası", adEn: "Octopus Salad", aciklama: "Kırmızı soğan, limon", aciklamaEn: "Red onion, lemon", fiyat: 225 },
        { id: "dk-9", ad: "Deniz Börülcesi", adEn: "Sea Beans", aciklama: "Sarımsaklı zeytinyağı", aciklamaEn: "Garlic and olive oil", fiyat: 88 },
      ],
    },
  ],

  "yesil-kase": [
    {
      ad: "Kaseler",
      urunler: [
        { id: "yk-1", ad: "Buddha Bowl", adEn: "Buddha Bowl", aciklama: "Kinoa, nohut, avokado, tahin sos", aciklamaEn: "Quinoa, chickpeas, avocado, tahini dressing", fiyat: 215, populer: true },
        { id: "yk-2", ad: "Falafel Kase", adEn: "Falafel Bowl", aciklama: "Ev yapımı falafel, bulgur, humus", aciklamaEn: "Home-made falafel, bulgur, hummus", fiyat: 195, populer: true },
        { id: "yk-3", ad: "Mercimekli Köz Patlıcan", adEn: "Lentils with Smoked Aubergine", aciklama: "Yeşil mercimek, köz patlıcan, nar ekşisi", aciklamaEn: "Green lentils, charred aubergine, pomegranate molasses", fiyat: 185 },
        { id: "yk-4", ad: "Tofu Teriyaki Kase", adEn: "Teriyaki Tofu Bowl", aciklama: "Esmer pirinç, edamame, susam", aciklamaEn: "Brown rice, edamame, sesame", fiyat: 225 },
      ],
    },
    {
      ad: "Salata & İçecek",
      urunler: [
        { id: "yk-5", ad: "Kale Sezar (vegan)", adEn: "Kale Caesar (vegan)", aciklama: "Karalahana, kaju sos, kruton", aciklamaEn: "Kale, cashew dressing, croutons", fiyat: 175 },
        { id: "yk-6", ad: "Pancarlı Portakal Salata", adEn: "Beetroot and Orange Salad", aciklama: "Ceviz, keçi peyniri opsiyonel", aciklamaEn: "Walnuts, goat's cheese optional", fiyat: 165 },
        { id: "yk-7", ad: "Yeşil Detoks", adEn: "Green Detox", aciklama: "Ispanak, elma, zencefil, 400 ml", aciklamaEn: "Spinach, apple, ginger, 400 ml", fiyat: 85 },
        { id: "yk-8", ad: "Kombucha", adEn: "Kombucha", aciklama: "Ev yapımı, 330 ml", aciklamaEn: "Home-made, 330 ml", fiyat: 78 },
      ],
    },
  ],

  "kars-cig-borek": [
    {
      ad: "Çiğ Börek",
      urunler: [
        { id: "cb-1", ad: "Kıymalı Çiğ Börek (1 adet)", adEn: "Çiğ Börek with Minced Beef (1 pc)", aciklama: "El açması, dana kıyma", aciklamaEn: "Hand-rolled fried pastry with beef", fiyat: 48, populer: true },
        { id: "cb-2", ad: "Peynirli Çiğ Börek (1 adet)", adEn: "Çiğ Börek with Cheese (1 pc)", aciklama: "Kars kaşarı", aciklamaEn: "Kars kaşar cheese", fiyat: 45 },
        { id: "cb-3", ad: "Patatesli Çiğ Börek (1 adet)", adEn: "Çiğ Börek with Potato (1 pc)", aciklama: "Baharatlı patates", aciklamaEn: "Spiced potato", fiyat: 42 },
        { id: "cb-4", ad: "6'lı Karışık Tabak", adEn: "Mixed Platter of 6", aciklama: "Üç çeşit, ayran ile", aciklamaEn: "Three kinds, served with ayran", fiyat: 265, populer: true },
      ],
    },
    {
      ad: "Yanında",
      urunler: [
        { id: "cb-5", ad: "Kars Ayranı", adEn: "Kars Ayran", aciklama: "300 ml", aciklamaEn: "300 ml yoghurt drink", fiyat: 35 },
        { id: "cb-6", ad: "Mercimek Çorbası", adEn: "Lentil Soup", aciklama: "Limonlu", aciklamaEn: "With lemon", fiyat: 62 },
        { id: "cb-7", ad: "Sütlaç", adEn: "Rice Pudding", aciklama: "Fırında", aciklamaEn: "Baked", fiyat: 78 },
      ],
    },
  ],

  "pide-ustasi": [
    {
      ad: "Pideler",
      urunler: [
        { id: "pu-1", ad: "Kıymalı Pide", adEn: "Pide with Minced Meat", aciklama: "Taş fırın, tereyağlı", aciklamaEn: "Stone oven, buttered", fiyat: 165, populer: true },
        { id: "pu-2", ad: "Kaşarlı Pide", adEn: "Cheese Pide", aciklama: "Bol kaşar", aciklamaEn: "Plenty of kaşar cheese", fiyat: 155 },
        { id: "pu-3", ad: "Kuşbaşılı Kaşarlı", adEn: "Diced Beef and Cheese Pide", aciklama: "Dana kuşbaşı, kaşar", aciklamaEn: "Diced beef, kaşar cheese", fiyat: 215, populer: true },
        { id: "pu-4", ad: "Sucuklu Yumurtalı", adEn: "Sucuk and Egg Pide", aciklama: "Kayseri sucuğu", aciklamaEn: "Kayseri sucuk sausage", fiyat: 185 },
        { id: "pu-5", ad: "Karışık Pide", adEn: "Mixed Pide", aciklama: "Kıyma, kaşar, sucuk", aciklamaEn: "Minced meat, cheese, sucuk", fiyat: 225 },
      ],
    },
    {
      ad: "Lahmacun & Çorba",
      urunler: [
        { id: "pu-6", ad: "Lahmacun (2 adet)", adEn: "Lahmacun (2 pcs)", aciklama: "Acılı / acısız", aciklamaEn: "Thin flatbread with minced meat — spicy or mild", fiyat: 125, populer: true },
        { id: "pu-7", ad: "Ayvalık Tost Pide", adEn: "Ayvalık Toast Pide", aciklama: "Sucuk, kaşar, turşu", aciklamaEn: "Sucuk, cheese, pickles", fiyat: 145 },
        { id: "pu-8", ad: "Ezogelin Çorba", adEn: "Ezogelin Soup", aciklama: "Nane yağlı", aciklamaEn: "With mint oil", fiyat: 68 },
        { id: "pu-9", ad: "Ayran", adEn: "Ayran", aciklama: "300 ml", aciklamaEn: "300 ml yoghurt drink", fiyat: 32 },
      ],
    },
  ],

  "baharat-yolu": [
    {
      ad: "Hint Mutfağı",
      urunler: [
        { id: "by-1", ad: "Butter Chicken", adEn: "Butter Chicken", aciklama: "Tereyağlı domates sos, basmati pilav", aciklamaEn: "Buttery tomato sauce, basmati rice", fiyat: 315, populer: true },
        { id: "by-2", ad: "Chicken Tikka Masala", adEn: "Chicken Tikka Masala", aciklama: "Tandır tavuk, baharatlı sos", aciklamaEn: "Tandoori chicken, spiced sauce", fiyat: 325, populer: true },
        { id: "by-3", ad: "Palak Paneer", adEn: "Palak Paneer", aciklama: "Ispanak, taze paneer (vejetaryen)", aciklamaEn: "Spinach, fresh paneer (vegetarian)", fiyat: 275 },
        { id: "by-4", ad: "Dal Tadka", adEn: "Dal Tadka", aciklama: "Sarı mercimek, kimyon tadka", aciklamaEn: "Yellow lentils, cumin tadka", fiyat: 225 },
        { id: "by-5", ad: "Lamb Rogan Josh", adEn: "Lamb Rogan Josh", aciklama: "Kuzu, Keşmir baharatları", aciklamaEn: "Lamb, Kashmiri spices", fiyat: 385 },
      ],
    },
    {
      ad: "Uzak Doğu",
      urunler: [
        { id: "by-6", ad: "Pad Thai", adEn: "Pad Thai", aciklama: "Pirinç eriştesi, yer fıstığı, tamarind", aciklamaEn: "Rice noodles, peanuts, tamarind", fiyat: 285 },
        { id: "by-7", ad: "Yeşil Köri", adEn: "Green Curry", aciklama: "Hindistan cevizi sütü, Tay fesleğeni", aciklamaEn: "Coconut milk, Thai basil", fiyat: 295 },
        { id: "by-8", ad: "Gyoza (6 adet)", adEn: "Gyoza (6 pcs)", aciklama: "Tavuk, ponzu sos", aciklamaEn: "Chicken, ponzu sauce", fiyat: 165 },
      ],
    },
    {
      ad: "Ekmek & İçecek",
      urunler: [
        { id: "by-9", ad: "Sarımsaklı Naan", adEn: "Garlic Naan", aciklama: "Tandır ekmeği", aciklamaEn: "Tandoor bread", fiyat: 65 },
        { id: "by-10", ad: "Mango Lassi", adEn: "Mango Lassi", aciklama: "300 ml", aciklamaEn: "300 ml", fiyat: 88 },
      ],
    },
  ],

  "sabah-simit": [
    {
      ad: "Kahvaltı",
      urunler: [
        { id: "ss-1", ad: "Serpme Kahvaltı (2 kişi)", adEn: "Turkish Breakfast Spread (serves 2)", aciklama: "18 çeşit, çay dahil", aciklamaEn: "18 items, tea included", fiyat: 545, populer: true },
        { id: "ss-2", ad: "Simit + Çay + Peynir", adEn: "Simit + Tea + Cheese", aciklama: "Klasik sabah menüsü", aciklamaEn: "The classic morning set", fiyat: 95, populer: true },
        { id: "ss-3", ad: "Menemen", adEn: "Menemen", aciklama: "Sucuklu / sade, ekmek ile", aciklamaEn: "Scrambled eggs with tomato and pepper — with or without sucuk, served with bread", fiyat: 155 },
        { id: "ss-4", ad: "Kaşarlı Omlet", adEn: "Cheese Omelette", aciklama: "3 yumurta, yeşillik", aciklamaEn: "3 eggs, herbs", fiyat: 135 },
      ],
    },
    {
      ad: "Fırın",
      urunler: [
        { id: "ss-5", ad: "Su Böreği (dilim)", adEn: "Su Böreği (slice)", aciklama: "El açması, peynirli", aciklamaEn: "Hand-rolled layered pastry with cheese", fiyat: 88 },
        { id: "ss-6", ad: "Açma", adEn: "Açma", aciklama: "Tereyağlı, 2 adet", aciklamaEn: "Buttery soft roll, 2 pieces", fiyat: 62 },
        { id: "ss-7", ad: "Poğaça", adEn: "Poğaça", aciklama: "Peynirli / patatesli, 2 adet", aciklamaEn: "Savoury bun with cheese or potato, 2 pieces", fiyat: 58 },
        { id: "ss-8", ad: "Demleme Çay", adEn: "Brewed Tea", aciklama: "Bardak", aciklamaEn: "One glass", fiyat: 25 },
      ],
    },
  ],

  "gece-lezzetleri": [
    {
      ad: "Tost & Sandviç",
      urunler: [
        { id: "gl-1", ad: "Kaşarlı Tost", adEn: "Cheese Toastie", aciklama: "Çift kaşar, tereyağlı", aciklamaEn: "Double kaşar cheese, buttered", fiyat: 98, populer: true },
        { id: "gl-2", ad: "Karışık Tost", adEn: "Mixed Toastie", aciklama: "Sucuk, kaşar, domates", aciklamaEn: "Sucuk, cheese, tomato", fiyat: 125, populer: true },
        { id: "gl-3", ad: "Ayvalık Tost", adEn: "Ayvalık Toastie", aciklama: "Sucuk, piyaz, turşu, russian sos", aciklamaEn: "Sucuk, bean salad, pickles, russian sauce", fiyat: 165 },
        { id: "gl-4", ad: "Tavuklu Sandviç", adEn: "Chicken Sandwich", aciklama: "Izgara tavuk, ranch", aciklamaEn: "Grilled chicken, ranch", fiyat: 145 },
      ],
    },
    {
      ad: "Gece Menüsü",
      urunler: [
        { id: "gl-5", ad: "İşkembe Çorbası", adEn: "Tripe Soup", aciklama: "Sarımsaklı sirke ile", aciklamaEn: "Served with garlic vinegar", fiyat: 115 },
        { id: "gl-6", ad: "Mercimek Çorbası", adEn: "Lentil Soup", aciklama: "Limonlu", aciklamaEn: "With lemon", fiyat: 68 },
        { id: "gl-7", ad: "Patates Kızartması", adEn: "Fries", aciklama: "Büyük boy, soslu", aciklamaEn: "Large, with sauce", fiyat: 72 },
        { id: "gl-8", ad: "Soda / Ayran", adEn: "Soda / Ayran", aciklama: "300 ml", aciklamaEn: "300 ml", fiyat: 28 },
      ],
    },
  ],

  "hizli-market": [
    {
      ad: "Temel İhtiyaç",
      urunler: [
        { id: "hm-1", ad: "Süt 1 L", adEn: "Milk 1 L", aciklama: "Tam yağlı, günlük", aciklamaEn: "Whole, delivered daily", fiyat: 42, populer: true },
        { id: "hm-2", ad: "Yumurta (10 adet)", adEn: "Eggs (10 pcs)", aciklama: "Gezen tavuk", aciklamaEn: "Free range", fiyat: 98 },
        { id: "hm-3", ad: "Ekmek", adEn: "Bread", aciklama: "Ekşi maya, 500 g", aciklamaEn: "Sourdough, 500 g", fiyat: 35 },
        { id: "hm-4", ad: "Beyaz Peynir 500 g", adEn: "White Cheese 500 g", aciklama: "Tam yağlı, inek", aciklamaEn: "Full fat, cow's milk", fiyat: 145 },
        { id: "hm-5", ad: "Tereyağı 250 g", adEn: "Butter 250 g", aciklama: "Günlük üretim", aciklamaEn: "Made daily", fiyat: 165 },
      ],
    },
    {
      ad: "Atıştırmalık & İçecek",
      urunler: [
        { id: "hm-6", ad: "Cips (Büyük Boy)", adEn: "Crisps (Large)", aciklama: "Baharatlı / sade", aciklamaEn: "Spicy or plain", fiyat: 58, populer: true },
        { id: "hm-7", ad: "Çikolata (70 g)", adEn: "Chocolate (70 g)", aciklama: "Bitter / sütlü", aciklamaEn: "Dark or milk", fiyat: 45 },
        { id: "hm-8", ad: "Maden Suyu (6'lı)", adEn: "Sparkling Water (6-pack)", aciklama: "200 ml × 6", aciklamaEn: "200 ml × 6", fiyat: 72 },
        { id: "hm-9", ad: "Soğuk Kahve", adEn: "Iced Coffee", aciklama: "250 ml, şekersiz", aciklamaEn: "250 ml, unsweetened", fiyat: 62 },
        { id: "hm-10", ad: "Dondurma (Kutu)", adEn: "Ice Cream (Tub)", aciklama: "500 ml, vanilya", aciklamaEn: "500 ml, vanilla", fiyat: 125 },
      ],
    },
  ],

  /*
   * ŞEF / EV HANIMI MUTFAKLARI
   * ---------------------------------------------------------------------------
   * Bölüm başlıkları content/mutfak-bolumleri.ts ile BİREBİR aynı yazılıyor
   * ("Ana Yemekler", "Ev Yapımı Ürünler"…). Böylece şef kendi panelinden ürün
   * eklediğinde ürün buradaki aynı başlığın altına düşüyor, menüde ikinci bir
   * "Ana Yemekler" bölümü açılmıyor (bkz. lib/mutfak-menusu.ts).
   *
   * FİYATLAR BİLEREK BOŞ (taslak). Bir ev hanımının tereyağını kaça satacağı
   * onun kararı — maliyeti, kaç kavanoz çıkardığı, kâr payı bilinmeden buraya
   * rakam yazmak uydurma olur. Fiyatı şef kendi panelinden girer, o an ürün
   * sipariş edilebilir hâle gelir.
   */
  "makbule-sef": [
    {
      ad: "Ana Yemekler",
      urunler: [
        { id: "ms-4", ad: "Taze Fasulye", adEn: "Green Beans in Olive Oil", aciklama: "Zeytinyağlı, ev usulü", aciklamaEn: "Home style", fiyat: 0, taslak: true },
        { id: "ms-5", ad: "Kuru Fasulye (Pilavlı)", adEn: "White Beans with Rice", aciklama: "Etli kuru fasulye, yanında pirinç pilavı", aciklamaEn: "White beans cooked with meat, served with rice pilaf", fiyat: 0, taslak: true },
        { id: "ms-1", ad: "Ev Yapımı Hamburger", adEn: "Home-made Burger", aciklama: "El açması ekmek, taze köfte harcı", aciklamaEn: "Hand-rolled bun, freshly made patty", fiyat: 0, taslak: true },
      ],
    },
    {
      ad: "Ara Sıcaklar",
      urunler: [
        { id: "ms-3", ad: "İçli Köfte", adEn: "İçli Köfte", aciklama: "Bulgur kabuğu, kıymalı iç harç", aciklamaEn: "Bulgur shell with a spiced minced meat filling", fiyat: 0, taslak: true, birim: "4 adet" },
        { id: "ms-9", ad: "Sigara Böreği", adEn: "Sigara Böreği", aciklama: "El açması yufka, beyaz peynirli", aciklamaEn: "Hand-rolled filo cigars with white cheese", fiyat: 0, taslak: true, birim: "8 adet" },
      ],
    },
    {
      ad: "Hamur İşleri",
      urunler: [
        { id: "ms-2", ad: "El Yapımı Mantı", adEn: "Hand-made Mantı", aciklama: "İnce açılmış hamur, yoğurtlu sarımsak sos", aciklamaEn: "Thinly rolled dumplings with garlic yoghurt sauce", fiyat: 0, taslak: true },
        { id: "ms-10", ad: "Su Böreği", adEn: "Su Böreği", aciklama: "Kat kat el açması, peynirli", aciklamaEn: "Layer upon layer of hand-rolled pastry with cheese", fiyat: 0, taslak: true, birim: "Orta boy tepsi" },
      ],
    },
    {
      ad: "Ev Yapımı Ürünler",
      urunler: [
        { id: "ms-11", ad: "Köy Tereyağı", adEn: "Village Butter", aciklama: "Köy sütünden, yayıkta çalkalanmış, katkısız", aciklamaEn: "From village milk, churned by hand, no additives", fiyat: 0, taslak: true, birim: "500 g" },
        { id: "ms-12", ad: "Ev Yoğurdu", adEn: "Home-made Yoghurt", aciklama: "Tam yağlı, kaymaklı, güveçte mayalanmış", aciklamaEn: "Full fat, creamy, set in an earthenware pot", fiyat: 0, taslak: true, birim: "1 kg kase" },
        { id: "ms-13", ad: "El Açması Erişte", adEn: "Hand-cut Noodles", aciklama: "Yumurtalı, gölgede kurutulmuş", aciklamaEn: "Made with egg, dried in the shade", fiyat: 0, taslak: true, birim: "1 kg" },
        { id: "ms-14", ad: "Tarhana", adEn: "Tarhana", aciklama: "Yoğurt, biber ve domatesle mayalanıp güneşte kurutuldu", aciklamaEn: "Fermented with yoghurt, pepper and tomato, then sun-dried", fiyat: 0, taslak: true, birim: "500 g" },
      ],
    },
    {
      ad: "Tatlılar",
      urunler: [
        { id: "ms-6", ad: "Sütlaç", adEn: "Rice Pudding", aciklama: "Fırında kavrulmuş, ev yapımı", aciklamaEn: "Baked, home-made", fiyat: 0, taslak: true },
        { id: "ms-7", ad: "Güllaç", adEn: "Güllaç", aciklama: "Ceviz ve nar taneli, mevsimlik", aciklamaEn: "Milk-soaked wafer dessert with walnuts and pomegranate, seasonal", fiyat: 0, taslak: true },
      ],
    },
    {
      ad: "İçecekler",
      urunler: [
        { id: "ms-8", ad: "Sarıyer Kola", adEn: "Sarıyer Cola", aciklama: "330 ml, soğuk servis", aciklamaEn: "330 ml, served cold", fiyat: 0, taslak: true, birim: "330 ml" },
      ],
    },
  ],

  "gonul-sef": [
    {
      ad: "Ana Yemekler",
      urunler: [
        { id: "gs-5", ad: "Kuru Fasulye (Pilavlı)", adEn: "White Beans with Rice", aciklama: "Etli kuru fasulye, yanında pirinç pilavı", aciklamaEn: "White beans cooked with meat, served with rice pilaf", fiyat: 0, taslak: true },
        { id: "gs-4", ad: "Taze Fasulye", adEn: "Green Beans in Olive Oil", aciklama: "Zeytinyağlı, ev usulü", aciklamaEn: "Home style", fiyat: 0, taslak: true },
        { id: "gs-1", ad: "Ev Yapımı Hamburger", adEn: "Home-made Burger", aciklama: "El açması ekmek, taze köfte harcı", aciklamaEn: "Hand-rolled bun, freshly made patty", fiyat: 0, taslak: true },
      ],
    },
    {
      ad: "Çorbalar",
      urunler: [
        { id: "gs-9", ad: "Tarhana Çorbası", adEn: "Tarhana Soup", aciklama: "Kendi kuruttuğu tarhanadan", aciklamaEn: "Made from her own sun-dried tarhana", fiyat: 0, taslak: true },
      ],
    },
    {
      ad: "Ara Sıcaklar",
      urunler: [
        { id: "gs-3", ad: "İçli Köfte", adEn: "İçli Köfte", aciklama: "Bulgur kabuğu, kıymalı iç harç", aciklamaEn: "Bulgur shell with a spiced minced meat filling", fiyat: 0, taslak: true, birim: "4 adet" },
        { id: "gs-10", ad: "Mücver", adEn: "Mücver", aciklama: "Kabak, dereotu, taze soğan", aciklamaEn: "Courgette fritters with dill and spring onion", fiyat: 0, taslak: true, birim: "6 adet" },
      ],
    },
    {
      ad: "Hamur İşleri",
      urunler: [
        { id: "gs-2", ad: "El Yapımı Mantı", adEn: "Hand-made Mantı", aciklama: "İnce açılmış hamur, yoğurtlu sarımsak sos", aciklamaEn: "Thinly rolled dumplings with garlic yoghurt sauce", fiyat: 0, taslak: true },
      ],
    },
    {
      ad: "Ev Yapımı Ürünler",
      urunler: [
        { id: "gs-11", ad: "Köy Tereyağı", adEn: "Village Butter", aciklama: "Yayık tereyağı, tuzsuz", aciklamaEn: "Churned butter, unsalted", fiyat: 0, taslak: true, birim: "500 g" },
        { id: "gs-12", ad: "Süzme Yoğurt", adEn: "Strained Yoghurt", aciklama: "Bezde süzülmüş, koyu kıvamlı", aciklamaEn: "Strained through cloth, thick set", fiyat: 0, taslak: true, birim: "750 g kase" },
        { id: "gs-13", ad: "Vişne Reçeli", adEn: "Sour Cherry Jam", aciklama: "Şeker dışında katkı yok, taş taş kaynatıldı", aciklamaEn: "Nothing but sugar added, slowly simmered", fiyat: 0, taslak: true, birim: "500 g cam kavanoz" },
        { id: "gs-14", ad: "Karışık Turşu", adEn: "Mixed Pickles", aciklama: "Lahana, havuç, biber; sirke ve kaya tuzuyla", aciklamaEn: "Cabbage, carrot and pepper in vinegar and rock salt", fiyat: 0, taslak: true, birim: "1,5 L kavanoz" },
        { id: "gs-15", ad: "Ev Salçası", adEn: "Home-made Pepper Paste", aciklama: "Kırmızı biber ve domates, güneşte kurutuldu", aciklamaEn: "Red pepper and tomato, sun-dried", fiyat: 0, taslak: true, birim: "700 g kavanoz" },
      ],
    },
    {
      ad: "Tatlılar",
      urunler: [
        { id: "gs-6", ad: "Sütlaç", adEn: "Rice Pudding", aciklama: "Fırında kavrulmuş, ev yapımı", aciklamaEn: "Baked, home-made", fiyat: 0, taslak: true },
        { id: "gs-7", ad: "Güllaç", adEn: "Güllaç", aciklama: "Ceviz ve nar taneli, mevsimlik", aciklamaEn: "Milk-soaked wafer dessert with walnuts and pomegranate, seasonal", fiyat: 0, taslak: true },
      ],
    },
    {
      ad: "İçecekler",
      urunler: [
        { id: "gs-16", ad: "Ev Yapımı Limonata", adEn: "Home-made Lemonade", aciklama: "Taze sıkılmış limon, nane", aciklamaEn: "Freshly squeezed lemon, mint", fiyat: 0, taslak: true, birim: "1 L şişe" },
        { id: "gs-8", ad: "Sarıyer Kola", adEn: "Sarıyer Cola", aciklama: "330 ml, soğuk servis", aciklamaEn: "330 ml, served cold", fiyat: 0, taslak: true, birim: "330 ml" },
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
