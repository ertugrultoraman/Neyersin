#!/usr/bin/env node
/**
 * Ne Yersin? — içerikten türeyen görsel promptlarını senkronize eder
 * ============================================================================
 *
 * `src/content/menuler.ts` ve `src/content/restoranlar.ts` içindeki veriden
 * şu anahtarları üretir ve `src/content/image-prompts.json` dosyasına yazar:
 *
 *   menu/<restoranSlug>/<urunId>   → ürün fotoğrafı            (4/3, foto)
 *   restoran/<restoranSlug>        → restoran kapak fotoğrafı  (16/9, foto)
 *   sef/<restoranSlug>             → ev şefi profil görseli     (4/3, foto)
 *
 * Elle yazılmış diğer anahtarlar (home/…, blog/…, sektor/…, veri/…) olduğu gibi
 * korunur — bu script yalnızca yukarıdaki üç önekin sahibidir.
 *
 * Yemek adları Türkçe; görsel modelleri İngilizce betimlemeyle çok daha isabetli
 * sonuç veriyor. Bu yüzden her ürün için elle yazılmış İngilizce betim
 * `URUN_BETIMLERI` içinde durur. Sözlükte olmayan ürünler için Türkçe addan
 * genel bir betim üretilir ve uyarı basılır.
 *
 * Kullanım:  node scripts/sync-image-prompts.mjs [--dry-run]
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROMPT_DOSYASI = path.join(KOK, "src/content/image-prompts.json");
const BIZIM_ONEKLER = ["menu/", "restoran/", "sef/"];
const KURU = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// İçerik dosyalarını (TS) çalışma zamanında yükle
// ---------------------------------------------------------------------------

/** Tip anotasyonlarını söküp CommonJS'e çevirerek TS içerik modülünü yükler. */
async function icerikYukle(gorecelYol) {
  const kaynak = await readFile(path.join(KOK, gorecelYol), "utf8");
  const { outputText } = ts.transpileModule(kaynak, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const modul = { exports: {} };
  // İçerik dosyaları saf veri; hiçbir import içermez (script bunu varsayar).
  new Function("exports", "module", "require", outputText)(modul.exports, modul, () => {
    throw new Error(`${gorecelYol} beklenmedik biçimde import içeriyor`);
  });
  return modul.exports;
}

// ---------------------------------------------------------------------------
// Ürün betimleri — anahtar: ürün id'si (menü genelinde benzersiz)
// ---------------------------------------------------------------------------

const URUN_BETIMLERI = {
  // Ateş Kanat
  "ak-1": "eight crispy fried spicy chicken drumettes coated in glossy red hot sauce, a small bowl of ranch dip and golden fries beside them",
  "ak-2": "ten sticky honey mustard glazed chicken wings sprinkled with sesame seeds, pickles on the side",
  "ak-3": "ten classic buffalo chicken wings in bright orange hot sauce with celery sticks and a blue cheese dip",
  "ak-4": "eight smoky barbecue glazed chicken drumettes with dark caramelized sauce and lightly charred edges",
  "ak-5": "a large sharing platter of fourteen assorted chicken wings and drumettes with three different dipping sauces",
  "ak-6": "cajun spiced french fries topped with grated parmesan and parsley, served in a metal basket",
  "ak-7": "eight golden crispy battered onion rings stacked on parchment paper",
  "ak-8": "fresh creamy cabbage and carrot coleslaw salad in a small white bowl",
  "ak-9": "a tall glass of homemade cloudy lemonade with ice, lemon slices and mint",

  // Kırmızı Fırın
  "kf-1": "an authentic neapolitan margherita pizza with san marzano tomato, fior di latte mozzarella and fresh basil, leopard spotted charred crust, on a wooden board",
  "kf-2": "a neapolitan pizza topped with spicy salami slices, melted mozzarella and calabrian chili flakes",
  "kf-3": "a four cheese pizza with mozzarella, gorgonzola, parmesan and taleggio, bubbling golden melted cheese",
  "kf-4": "a pizza with cooked ham, sliced mushrooms and mozzarella, one slice being lifted",
  "kf-5": "a vegetable pizza with seasonal vegetables, zucchini blossoms and dollops of ricotta",
  "kf-6": "a truffle cream pizza with sauteed mushrooms and shaved parmesan, warm earthy tones",
  "kf-7": "four slices of grilled garlic bruschetta topped with diced tomato and fresh basil on a slate board",
  "kf-8": "a caprese salad with buffalo mozzarella, sliced ripe tomatoes and a pesto drizzle",
  "kf-9": "a caesar salad with grilled chicken strips, parmesan shavings and croutons in a wide white bowl",
  "kf-10": "a single portion of tiramisu with visible mascarpone layers dusted with cocoa powder",
  "kf-11": "panna cotta on a plate with a glossy forest berry sauce and fresh berries",
  "kf-12": "chilled italian lemonade poured into a glass with ice and a lemon slice",

  // Şef Mangal
  "sm-1": "a turkish adana kebab skewer served on lavash bread with grilled tomato, grilled green pepper and sumac onion salad",
  "sm-2": "a turkish grilled lamb shish kebab skewer with rice pilaf and grilled vegetables",
  "sm-3": "a turkish grilled chicken shish kebab skewer with bulgur pilaf and fresh salad",
  "sm-4": "slow cooked beef ribs with a glossy dark crust, served with creamy mashed potatoes",
  "sm-5": "a large turkish mixed grill platter with adana kebab, lamb shish, chicken shish and wings over lavash bread",
  "sm-6": "turkish haydari meze, thick strained yogurt with mint and garlic and an olive oil drizzle in a small bowl",
  "sm-7": "turkish spicy ezme meze, finely chopped tomato and pepper salad with pomegranate molasses",
  "sm-8": "a creamy hummus swirl topped with tahini, olive oil and cumin in a shallow bowl",
  "sm-9": "a turkish meze platter with five different small mezes in white bowls",
  "sm-10": "turkish kunefe dessert in a small copper pan, shredded kadayif pastry with melting cheese, crushed pistachio and clotted cream",
  "sm-11": "turkish baked rice pudding in a clay bowl with a browned caramelized top, cinnamon and pistachio",

  // Anne Sofrası
  "as-1": "turkish home style vegetable and lamb stew with rice pilaf on a simple plate",
  "as-2": "turkish white bean stew in tomato sauce with pastirma, served with rice pilaf and pickles",
  "as-3": "turkish karniyarik, stuffed eggplant with minced meat in tomato sauce on a plate",
  "as-4": "turkish chicken saute with peppers and vegetables served with buttered rice pilaf",
  "as-5": "three turkish icli kofte bulgur croquettes filled with minced meat and walnut, with lemon wedges",
  "as-6": "eight turkish stuffed vine leaves with olive oil, lemon wedges and a sprig of dill",
  "as-7": "turkish ezogelin red lentil soup with a mint oil drizzle in a bowl",
  "as-8": "creamy turkish lentil soup with a lemon wedge and a slice of bread",
  "as-9": "clear chicken noodle soup with orzo in a white bowl",
  "as-10": "a slice of turkish kazandibi dessert with a caramelized burnt bottom",
  "as-11": "turkish quince dessert in ruby syrup topped with clotted cream and a walnut",

  // Burger Atölyesi
  "ba-1": "a classic cheeseburger with a thick beef patty, melted cheddar, pickles and special sauce in a toasted brioche bun",
  "ba-2": "a double cheeseburger with two beef patties, double cheddar and caramelized onions, cut to show the layers",
  "ba-3": "a gourmet burger with sauteed mushrooms, melted gruyere and truffle mayo",
  "ba-4": "a spicy burger with jalapeno slices, pepper jack cheese and chipotle sauce",
  "ba-5": "a vegan chickpea and beetroot patty burger with tahini sauce and fresh greens",
  "ba-6": "rustic skin-on potato wedges with sea salt served in a small basket",
  "ba-7": "truffle fries topped with grated parmesan and chopped parsley",
  "ba-8": "a thick vanilla milkshake in a tall glass topped with whipped cream and a straw",
  "ba-9": "homemade lemonade in a mason jar with ice, lemon slices and mint",

  // Döner Vadisi
  "dv-1": "turkish beef doner kebab shavings over rice pilaf with fresh greens on a plate",
  "dv-2": "turkish chicken doner over rice pilaf with pickles on a plate",
  "dv-3": "a turkish beef doner wrap in thin lavash bread, cut in half showing tomato, pepper and lettuce",
  "dv-4": "a turkish chicken doner wrap in lavash with fries and sauce, cut open",
  "dv-5": "turkish iskender kebab, doner meat over bread cubes with tomato sauce, melted butter and yogurt",
  "dv-6": "a medium portion of golden french fries",
  "dv-7": "a fresh mixed seasonal salad with lemon and olive oil",
  "dv-8": "turkish ayran yogurt drink in a copper cup with thick foam on top",
  "dv-9": "a glass of turkish salgam turnip juice, deep red, with a pickled carrot stick",

  // Tatlı Kaçamak
  "tk-1": "a slice of basque burnt cheesecake with a dark caramelized top and creamy center",
  "tk-2": "a fudgy dark chocolate brownie square with walnuts",
  "tk-3": "a slice of cheesecake with fresh raspberry sauce and berries",
  "tk-4": "a slice of carrot cake with thick cream cheese frosting",
  "tk-5": "profiteroles covered in glossy chocolate sauce in a dessert bowl",
  "tk-6": "three scoops of turkish clotted cream ice cream sprinkled with crushed pistachio",
  "tk-7": "three scoops of belgian chocolate ice cream in a bowl",
  "tk-8": "a cup of black filter coffee on a saucer",

  // Çekirdek Kahve
  "ck-1": "a flat white coffee in a ceramic cup with delicate rosetta latte art and silky microfoam",
  "ck-2": "a v60 pour over filter coffee dripping into a glass carafe next to a cup",
  "ck-3": "a cortado, espresso with a little steamed milk, in a small glass",
  "ck-4": "an iced latte in a tall glass with milk swirling over cold brew and ice cubes",
  "ck-5": "turkish coffee in a small porcelain cup with foam, served on a copper tray with turkish delight",
  "ck-6": "avocado toast on sourdough bread with a poached egg and chili flakes",
  "ck-7": "a grilled cheese toast on sourdough with a melted cheese pull, cut diagonally",
  "ck-8": "a grilled chicken caesar wrap cut in half showing the filling",
  "ck-9": "a flaky golden butter croissant on parchment paper",

  // Deniz Kenarı
  "dk-1": "a grilled sea bass with arugula and lemon on a white plate",
  "dk-2": "a whole grilled sea bream drizzled with olive oil and fresh herbs",
  "dk-3": "fried calamari rings in a cornmeal crust with tartar sauce and lemon",
  "dk-4": "turkish shrimp casserole in a clay pot with melted cheese and cherry tomatoes",
  "dk-5": "turkish fried anchovies arranged in a circle in a pan with onion salad",
  "dk-6": "turkish cretan meze with white cheese, walnut and dill in a bowl",
  "dk-7": "turkish fava bean puree meze, sliced, with dill and olive oil",
  "dk-8": "an octopus salad with red onion, lemon and olive oil",
  "dk-9": "sea beans salad with a garlic olive oil dressing",

  // Yeşil Kase
  "yk-1": "a colorful buddha bowl with quinoa, chickpeas, avocado and tahini dressing, seen from above",
  "yk-2": "a falafel bowl with bulgur, hummus and fresh vegetables",
  "yk-3": "a green lentil and smoked eggplant bowl drizzled with pomegranate molasses",
  "yk-4": "a teriyaki tofu bowl with brown rice, edamame and sesame seeds",
  "yk-5": "a vegan kale caesar salad with cashew dressing and croutons",
  "yk-6": "a beetroot and orange salad with walnuts and crumbled goat cheese",
  "yk-7": "a green detox juice in a glass with spinach, apple and ginger arranged beside it",
  "yk-8": "homemade kombucha in a glass bottle next to a glass with fine bubbles",

  // Kars Çiğ Börek
  "cb-1": "a single turkish cig borek, a golden fried crescent pastry filled with minced meat, on a plate",
  "cb-2": "a single fried crescent pastry cut open to show melted kars cheese inside",
  "cb-3": "a single fried crescent pastry filled with spiced mashed potato",
  "cb-4": "a plate of six assorted fried turkish cig borek pastries with a glass of ayran",
  "cb-5": "foamy turkish ayran in a tall glass",
  "cb-6": "turkish lentil soup with a lemon wedge in a bowl",
  "cb-7": "turkish baked rice pudding in a clay bowl with a browned top",

  // Pide Ustası
  "pu-1": "a turkish boat shaped pide with minced meat topping brushed with butter, on a wooden board",
  "pu-2": "a turkish cheese pide with bubbling melted kasar cheese",
  "pu-3": "a turkish pide topped with diced beef cubes and melted cheese",
  "pu-4": "a turkish pide topped with turkish sucuk sausage slices and egg",
  "pu-5": "a turkish mixed pide with minced meat, cheese and sucuk, cut into pieces",
  "pu-6": "two turkish lahmacun flatbreads with minced meat topping, lemon wedge and parsley, one of them rolled up",
  "pu-7": "a turkish pide filled like an ayvalik toast with sucuk, melted cheese and pickles",
  "pu-8": "turkish ezogelin soup with a mint oil drizzle",
  "pu-9": "a glass of turkish ayran with thick foam",

  // Baharat Yolu
  "by-1": "indian butter chicken in a creamy tomato sauce with basmati rice, a cream swirl and fresh coriander",
  "by-2": "chicken tikka masala in a bowl with rich spiced sauce and coriander leaves",
  "by-3": "palak paneer, a spinach curry with paneer cubes, in a bowl",
  "by-4": "dal tadka, yellow lentil curry with cumin tempering, in a copper bowl",
  "by-5": "kashmiri lamb rogan josh curry in a deep red sauce",
  "by-6": "thai pad thai rice noodles with peanuts, lime wedge and bean sprouts",
  "by-7": "thai green curry with coconut milk and thai basil served with jasmine rice",
  "by-8": "six pan fried chicken gyoza dumplings with crispy bottoms and a ponzu dipping sauce",
  "by-9": "garlic naan bread brushed with butter and chopped coriander",
  "by-10": "a mango lassi in a tall glass topped with crushed pistachio",

  // Sabah Simit
  "ss-1": "a large turkish breakfast spread for two with many small plates of cheeses, olives, jams, eggs, tomatoes and cucumbers, with tulip shaped tea glasses, seen from above",
  "ss-2": "a turkish simit sesame bagel with white cheese and a tulip shaped glass of turkish tea",
  "ss-3": "turkish menemen, scrambled eggs with tomato and pepper, in a small copper pan with bread",
  "ss-4": "a three egg cheese omelette with fresh greens on a plate",
  "ss-5": "a slice of turkish su boregi, layered cheese pastry, on a plate",
  "ss-6": "two turkish acma, soft buttery bread rings, on a plate",
  "ss-7": "two turkish pogaca pastries, one filled with cheese and one with potato",
  "ss-8": "turkish tea in a tulip shaped glass on a saucer with sugar cubes",

  // Gece Lezzetleri
  "gl-1": "a turkish pressed grilled cheese toast with a generous melted cheese pull, cut in half",
  "gl-2": "a turkish mixed pressed toast with sucuk, cheese and tomato, cut in half",
  "gl-3": "a turkish ayvalik toast sandwich with sucuk, pickles and russian salad, cut open",
  "gl-4": "a grilled chicken sandwich with ranch sauce and lettuce",
  "gl-5": "turkish iskembe tripe soup in a bowl with garlic vinegar on the side",
  "gl-6": "turkish lentil soup with a lemon wedge",
  "gl-7": "a large portion of french fries with dipping sauce",
  "gl-8": "a bottle of sparkling mineral water beside a glass of turkish ayran",

  // Hızlı Market
  "hm-1": "a one liter carton of fresh whole milk beside a full glass of milk on a clean kitchen counter",
  "hm-2": "an open carton of ten free range brown eggs on a wooden surface",
  "hm-3": "a round sourdough bread loaf with a scored crust and one slice cut",
  "hm-4": "a block of turkish white cheese on a plate with mint leaves",
  "hm-5": "a block of fresh butter on parchment paper with a butter knife",
  "hm-6": "a large bag of potato chips with chips spilling onto the table",
  "hm-7": "a dark chocolate bar broken into squares on parchment paper",
  "hm-8": "six small sparkling mineral water glass bottles grouped together",
  "hm-9": "a bottle of unsweetened cold brew coffee beside a glass with ice",
  "hm-10": "an open tub of vanilla ice cream with an ice cream scoop",

  // Makbule Şef — ev yapımı, sade sunum
  "ms-1": "a homemade burger with a hand kneaded bun and a thick handmade beef patty, plated simply in a home kitchen",
  "ms-2": "turkish manti dumplings in a bowl with garlic yogurt sauce, melted butter with red pepper and dried mint",
  "ms-3": "homemade turkish icli kofte bulgur croquettes filled with minced meat, on a plain plate",
  "ms-4": "turkish taze fasulye, green beans cooked in olive oil and tomato, in a bowl",
  "ms-5": "turkish white bean stew with beef in tomato sauce served with rice pilaf",
  "ms-6": "turkish baked rice pudding in a clay bowl with a caramelized browned top",
  "ms-7": "turkish gullac dessert with walnut and pomegranate seeds in a bowl",
  "ms-8": "a chilled bottle of dark cola drink with condensation next to a glass of cola with ice",
};

/** Restoran kapak fotoğrafları — anahtar: restoran slug'ı. */
const RESTORAN_KAPAKLARI = {
  "ates-kanat": "a rustic table covered with baskets of crispy chicken wings and dipping sauces in a warm pub setting",
  "kirmizi-firin": "a wood fired pizza oven with visible flames and a neapolitan pizza on a wooden peel",
  "sef-mangal": "a turkish kebab grill with skewers of meat over glowing charcoal, light smoke rising",
  "anne-sofrasi": "a turkish home cooking table with several pots and plates of home style dishes, warm family atmosphere",
  "burger-atolyesi": "a burger counter with a juicy double cheeseburger and fries, moody warm lighting",
  "doner-vadisi": "a vertical turkish doner kebab spit being sliced by a chef in a restaurant",
  "tatli-kacamak": "a patisserie display case full of cakes and cheesecakes under warm lights",
  "cekirdek-kahve": "a specialty coffee bar with an espresso machine, a flat white cup and scattered coffee beans",
  "deniz-kenari": "a seaside fish restaurant table with grilled fish and mezes, blurred sea in the background",
  "yesil-kase": "several healthy grain bowls with fresh colorful vegetables on a bright table, seen from above",
  "kars-cig-borek": "a plate of golden fried turkish cig borek pastries with a glass of ayran on a rustic table",
  "pide-ustasi": "a stone oven bakery with long boat shaped turkish pides on wooden peels",
  "baharat-yolu": "indian and asian curry dishes with naan bread and colorful spices on a dark table",
  "sabah-simit": "a turkish breakfast table with tea glasses, simit and many small plates in morning light",
  "gece-lezzetleri": "a late night sandwich counter with pressed toasts, cozy warm lighting",
  "hizli-market": "clean bright neighborhood grocery shelves with milk, bread and eggs",
  "makbule-sef": "a home kitchen counter with freshly cooked homemade turkish dishes in warm domestic light",
};

/**
 * Ev şefi profil görseli. Gerçek bir kişinin yüzünü uydurmamak için kasıtlı
 * olarak insansız bir mutfak sahnesi kullanılır — insan figürü istemek AI'da
 * bozuk el/uzuv hatası da doğuruyordu.
 */
const SEF_GORSELI =
  "a warm empty home kitchen counter still life: thin rolled dough with a wooden rolling pin on a floured wooden board, a bowl of flour, copper pots and fresh herbs around, freshly cooked homemade turkish dishes at the back, completely empty of people, no hands, no human figure, cozy domestic morning light through a window";

// ---------------------------------------------------------------------------
// Prompt üretimi
// ---------------------------------------------------------------------------

function urunPromptu(urun, restoran) {
  const betim = URUN_BETIMLERI[urun.id];
  if (betim) return `A single serving of ${betim}`;
  // Sözlükte yoksa Türkçe ad + açıklamayla idare et; uyarı ayrıca basılır.
  return `A single serving of the turkish dish "${urun.ad}" (${urun.aciklama}), as served in a ${restoran.mutfaklar.join(", ")} restaurant`;
}

async function main() {
  const { menuler } = await icerikYukle("src/content/menuler.ts");
  const { restoranlar } = await icerikYukle("src/content/restoranlar.ts");

  const uretilen = [];
  const eksikBetim = [];

  for (const restoran of restoranlar) {
    uretilen.push({
      key: `restoran/${restoran.slug}`,
      aspect: "16/9",
      alt: `${restoran.ad} — ${restoran.mutfaklar.join(", ")}`,
      style: "foto",
      prompt: RESTORAN_KAPAKLARI[restoran.slug] ?? `a ${restoran.mutfaklar.join(", ")} restaurant scene`,
    });

    if (restoran.evSefi) {
      uretilen.push({
        key: `sef/${restoran.slug}`,
        aspect: "4/3",
        alt: `${restoran.ad} mutfağından bir kare`,
        style: "foto",
        prompt: SEF_GORSELI,
      });
    }

    for (const kategori of menuler[restoran.slug] ?? []) {
      for (const urun of kategori.urunler) {
        if (!URUN_BETIMLERI[urun.id]) eksikBetim.push(`${restoran.slug}/${urun.id} (${urun.ad})`);
        uretilen.push({
          key: `menu/${restoran.slug}/${urun.id}`,
          aspect: "4/3",
          alt: `${urun.ad} — ${urun.aciklama}`,
          style: "foto",
          prompt: urunPromptu(urun, restoran),
        });
      }
    }
  }

  const mevcut = JSON.parse(await readFile(PROMPT_DOSYASI, "utf8"));
  const elleYazilan = mevcut.filter((p) => !BIZIM_ONEKLER.some((o) => p.key.startsWith(o)));
  const sonuc = [...elleYazilan, ...uretilen];

  console.log("");
  console.log(`elle yazılan  : ${elleYazilan.length}`);
  console.log(`üretilen      : ${uretilen.length}`);
  console.log(`toplam        : ${sonuc.length}`);
  if (eksikBetim.length > 0) {
    console.log("");
    console.log(`⚠ ${eksikBetim.length} ürünün İngilizce betimi yok (genel prompt kullanıldı):`);
    for (const e of eksikBetim) console.log(`  - ${e}`);
  }
  console.log("");

  if (KURU) {
    console.log("Kuru çalışma (--dry-run): dosya yazılmadı.");
    return;
  }

  await writeFile(PROMPT_DOSYASI, `${JSON.stringify(sonuc, null, 2)}\n`, "utf8");
  console.log(`✓ ${path.relative(KOK, PROMPT_DOSYASI)} güncellendi.`);
  console.log("  Sıradaki adım: npm run images:generate");
  console.log("");
}

main().catch((err) => {
  console.error(`Hata: ${err.message}`);
  process.exit(1);
});
