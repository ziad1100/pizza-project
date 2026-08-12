// ORABI menu seed data (source of truth: orabi_menu.json delivered by the owner)
// prices = [small, medium, large] in EGP; null = size not offered.
// One-column JSON prices ([P]) map to regular/full portion; two-column ([A,B])
// map to small+large (ascending); three-column ([A,B,C]) map to small/medium/large
// (ascending). Arabic names are kept as the primary name; English names are
// adopted verbatim from the JSON.
// Every product's dish photo lives in public/images/products. The default URL
// is derived from the English name + sub-section (see seed.ts imageFor());
// "image" overrides that for items that reuse an existing legacy photo
// (see scripts/menu-photos.mjs REUSE_MAP -> scripts/menu-photo-map.json).

export interface SeedItem {
  ar: string;
  en: string;
  ingredients?: string[];
  tags: string[];
  prices: [number | null, number | null, number | null];
  image?: string;
  // Display order within the section (Egyptian-priority menu order). Falls back to
  // insertion order when unset.
  sortOrder?: number;
}

export interface SeedSub {
  ar: string;
  en: string;
  items: SeedItem[];
}

export interface SeedSection {
  ar: string;
  en: string;
  icon: string;
  subs: SeedSub[];
}

const chickenTags = ['فراخ'];
const meatTags = ['لحوم'];
const cheeseTags = ['جبن'];
const vegTags = ['نباتي'];
const fishTags = ['أسماك'];
const sweetTags = ['حلو'];
const pastaTags = ['باستا'];
const crepeTags = ['كريب'];
const hawawshiTags = ['حواوشي'];
const tagineTags = ['طواجن'];
const snacksTags = ['مقبلات'];

// Pizza sections are restored from the owner's Menu_Prices.xlsx (the project's
// original pizza menu): two separate categories — بيتزا شرقي (Oriental Pizza)
// and بيتزا إيطالي (Italian Pizza) — each with the sheet's 5 sub-groups
// (الفراخ / اللحوم / الجبن / الأسماك / المكسات) and real 3-size prices.
// Dish photos reuse existing files in public/images/products.
export const seedSections: SeedSection[] = [
  {
    ar: 'بيتزا شرقي',
    en: 'Oriental Pizza',
    icon: 'pizza',
    subs: [
      {
        ar: 'الفراخ',
        en: 'Chicken',
        items: [
          { ar: 'بيتزا فراخ', en: 'Chicken Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ', 'صوص'], tags: [...chickenTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/chicken-chicken.jpg', sortOrder: 4 },
          { ar: 'بيتزا تشيكن رانش', en: 'Chicken Ranch Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ', 'صوص رانش'], tags: [...chickenTags, ...cheeseTags], prices: [105, 135, 160], image: '/images/products/chicken-ranch-chicken.jpg', sortOrder: 16 },
          { ar: 'بيتزا تشيكن باربيكيو', en: 'BBQ Chicken Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ', 'صوص باربيكيو'], tags: [...chickenTags, ...cheeseTags], prices: [105, 135, 160], image: '/images/products/chicken-bbq-chicken.jpg', sortOrder: 17 },
          { ar: 'بيتزا تركي مدخن', en: 'Smoked Turkey Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'تركي مدخن'], tags: [...chickenTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/smoked-turkey-chicken.jpg', sortOrder: 18 },
          { ar: 'بيتزا كرسبي', en: 'Crispy Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ كرسبي'], tags: [...chickenTags, ...cheeseTags], prices: [90, 110, 140], image: '/images/products/crispy-chicken.jpg', sortOrder: 5 },
          { ar: 'بيتزا شيش', en: 'Shish Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'شيش طاووق', 'صوص'], tags: [...chickenTags, ...cheeseTags], prices: [100, 125, 160], image: '/images/products/sheesh-chicken.jpg', sortOrder: 15 },
          { ar: 'بيتزا فاهيتا', en: 'Fajita Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ فاهيتا', 'فلفل ملون', 'بصل'], tags: [...chickenTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/fajita-chicken.jpg', sortOrder: 19 },
          { ar: 'بيتزا استربس', en: 'Chicken Strips Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'استربس فراخ'], tags: [...chickenTags, ...cheeseTags], prices: [95, 120, 160], image: '/images/products/strips-chicken.jpg', sortOrder: 6 },
        ],
      },
      {
        ar: 'اللحوم',
        en: 'Meat',
        items: [
          { ar: 'بيتزا سجق اسكندراني', en: 'Alexandrian Sausage Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سجق اسكندراني'], tags: [...meatTags, ...cheeseTags], prices: [60, 95, 130], image: '/images/products/alexandrian-sausage-meat.jpg', sortOrder: 0 },
          { ar: 'بيتزا سجق بلدي', en: 'Baladi Sausage Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سجق بلدي'], tags: [...meatTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/beef-sausage-meat.jpg', sortOrder: 1 },
          { ar: 'بيتزا لحمه مفرومة', en: 'Minced Meat Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'لحمة مفرومة'], tags: [...meatTags, ...cheeseTags], prices: [85, 110, 150], image: '/images/products/beef-meat.jpg', sortOrder: 2 },
          { ar: 'بيتزا بسطرمة', en: 'Pastrami Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'بسطرمة'], tags: [...meatTags, ...cheeseTags], prices: [95, 110, 160], image: '/images/products/pastrami-meat.jpg', sortOrder: 7 },
          { ar: 'بيتزا سوسيس', en: 'Sausage Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سوسيس'], tags: [...meatTags, ...cheeseTags], prices: [80, 100, 140], image: '/images/products/sausage-meat.jpg', sortOrder: 3 },
          { ar: 'بيتزا سلامي', en: 'Salami Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سلامي'], tags: [...meatTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/salami-meat.jpg', sortOrder: 20 },
          { ar: 'بيتزا كفته', en: 'Kofta Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'كفتة'], tags: [...meatTags, ...cheeseTags], prices: [90, 120, 150], image: '/images/products/kofta-meat.jpg', sortOrder: 21 },
        ],
      },
      {
        ar: 'الجبن',
        en: 'Cheese',
        items: [
          { ar: 'بيتزا موتزريلا', en: 'Mozzarella Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا'], tags: cheeseTags, prices: [60, 80, 110], image: '/images/products/mozzarella-cheese.jpg', sortOrder: 12 },
          { ar: 'بيتزا جبنه رومي', en: 'Roman Cheese Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'جبن رومي'], tags: cheeseTags, prices: [80, 110, 150], image: '/images/products/roumy-cheese-cheese.jpg', sortOrder: 13 },
          { ar: 'بيتزا جبنه كيري', en: 'Kiri Cheese Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'جبنة كيري'], tags: cheeseTags, prices: [100, 130, 160], image: '/images/products/kiri-cheese-cheese.jpg', sortOrder: 14 },
        ],
      },
      {
        ar: 'الأسماك',
        en: 'Seafood',
        items: [
          { ar: 'بيتزا تونه', en: 'Tuna Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'تونة', 'بصل'], tags: [...fishTags, ...cheeseTags], prices: [80, 110, 160], image: '/images/products/tuna-seafood.jpg', sortOrder: 9 },
          { ar: 'بيتزا جمبري', en: 'Shrimp Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'جمبري'], tags: [...fishTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/shrimp-seafood.jpg', sortOrder: 10 },
          { ar: 'بيتزا سي فود', en: 'Seafood Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'جمبري', 'كاليماري', 'أسماك'], tags: [...fishTags, ...cheeseTags], prices: [110, 140, 180], image: '/images/products/sea-food-seafood.jpg', sortOrder: 11 },
        ],
      },
      {
        ar: 'المكسات',
        en: 'Mixes',
        items: [
          { ar: 'بيتزا مكس لحوم', en: 'Meat Mix Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سجق', 'بسطرمة', 'لحمة'], tags: [...meatTags, ...cheeseTags], prices: [105, 130, 160], image: '/images/products/meat-mix-mix.jpg', sortOrder: 8 },
          { ar: 'بيتزا مكس فراخ', en: 'Chicken Mix Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ', 'بانيه', 'استربس'], tags: [...chickenTags, ...cheeseTags], prices: [105, 130, 160], image: '/images/products/chicken-mix-mix.jpg', sortOrder: 22 },
          { ar: 'بيتزا مكس جبن', en: 'Cheese Mix Pizza', ingredients: ['عجينة بيتزا', 'جبن رومي', 'كيري', 'شيدر', 'موتزريلا'], tags: cheeseTags, prices: [105, 130, 160], image: '/images/products/cheese-mix-mix.jpg', sortOrder: 23 },
          { ar: 'بيتزا مكس حلواني مدخن', en: 'Smoked Helwany Mix Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'تركي مدخن', 'سلامي', 'سوسيس'], tags: [...meatTags, ...chickenTags, ...cheeseTags], prices: [105, 130, 160], image: '/images/products/smoked-helwany-mix-mix.jpg', sortOrder: 24 },
          { ar: 'بيتزا ثورة عرابي', en: 'Orabi Revolution Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'لحمة', 'سجق', 'كفتة', 'بسطرمة', 'سلامي'], tags: [...meatTags, ...cheeseTags], prices: [130, 150, 190], image: '/images/products/thawret-orabi-mix.jpg', sortOrder: 25 },
        ],
      },
    ],
  },
  {
    ar: 'بيتزا إيطالي',
    en: 'Italian Pizza',
    icon: 'pizza',
    subs: [
      {
        ar: 'الفراخ',
        en: 'Chicken',
        items: [
          { ar: 'بيتزا فراخ', en: 'Chicken Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ', 'صوص'], tags: [...chickenTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/chicken-chicken.jpg', sortOrder: 0 },
          { ar: 'بيتزا شيش', en: 'Shish Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'شيش طاووق', 'صوص'], tags: [...chickenTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/sheesh-chicken.jpg', sortOrder: 13 },
          { ar: 'بيتزا تشيكن رانش', en: 'Chicken Ranch Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ', 'صوص رانش'], tags: [...chickenTags, ...cheeseTags], prices: [105, 135, 165], image: '/images/products/chicken-ranch-chicken.jpg', sortOrder: 14 },
          { ar: 'بيتزا تشيكن باربيكيو', en: 'BBQ Chicken Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ', 'صوص باربيكيو'], tags: [...chickenTags, ...cheeseTags], prices: [95, 125, 165], image: '/images/products/chicken-bbq-chicken.jpg', sortOrder: 15 },
          { ar: 'بيتزا تشيكن كرانشي', en: 'Crunchy Chicken Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ كرانشي'], tags: [...chickenTags, ...cheeseTags], prices: [105, 130, 160], image: '/images/products/crispy-chicken-chicken.jpg', sortOrder: 16 },
          { ar: 'بيتزا كرسبي', en: 'Crispy Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ كرسبي'], tags: [...chickenTags, ...cheeseTags], prices: [95, 125, 155], image: '/images/products/crispy-chicken.jpg', sortOrder: 17 },
          { ar: 'بيتزا فراخ كرسبي', en: 'Crispy Chicken Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ كرسبي'], tags: [...chickenTags, ...cheeseTags], prices: [105, 130, 160], image: '/images/products/crispy-chicken-chicken.jpg', sortOrder: 18 },
          { ar: 'بيتزا تركي مدخن', en: 'Smoked Turkey Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'تركي مدخن'], tags: [...chickenTags, ...cheeseTags], prices: [90, 120, 140], image: '/images/products/smoked-turkey-chicken.jpg', sortOrder: 19 },
          { ar: 'بيتزا فاهيتا', en: 'Fajita Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ فاهيتا', 'فلفل ملون', 'بصل'], tags: [...chickenTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/fajita-chicken.jpg', sortOrder: 20 },
        ],
      },
      {
        ar: 'اللحوم',
        en: 'Meat',
        items: [
          { ar: 'بيتزا سجق اسكندراني', en: 'Alexandrian Sausage Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سجق اسكندراني'], tags: [...meatTags, ...cheeseTags], prices: [80, 100, 140], image: '/images/products/alexandrian-sausage-meat.jpg', sortOrder: 2 },
          { ar: 'بيتزا سجق بلدي', en: 'Baladi Sausage Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سجق بلدي'], tags: [...meatTags, ...cheeseTags], prices: [110, 135, 165], image: '/images/products/beef-sausage-meat.jpg', sortOrder: 21 },
          { ar: 'بيتزا لحمه مفرومة', en: 'Minced Meat Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'لحمة مفرومة'], tags: [...meatTags, ...cheeseTags], prices: [90, 130, 155], image: '/images/products/beef-meat.jpg', sortOrder: 1 },
          { ar: 'بيتزا بسطرمة', en: 'Pastrami Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'بسطرمة'], tags: [...meatTags, ...cheeseTags], prices: [100, 130, 160], image: '/images/products/pastrami-meat.jpg', sortOrder: 22 },
          { ar: 'بيتزا سلامي', en: 'Salami Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سلامي'], tags: [...meatTags, ...cheeseTags], prices: [95, 130, 155], image: '/images/products/salami-meat.jpg', sortOrder: 23 },
          { ar: 'بيتزا سوسيس', en: 'Sausage Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سوسيس'], tags: [...meatTags, ...cheeseTags], prices: [90, 125, 145], image: '/images/products/sausage-meat.jpg', sortOrder: 3 },
          { ar: 'بيتزا كفته', en: 'Kofta Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'كفتة'], tags: [...meatTags, ...cheeseTags], prices: [100, 125, 150], image: '/images/products/kofta-meat.jpg', sortOrder: 24 },
        ],
      },
      {
        ar: 'الجبن',
        en: 'Cheese',
        items: [
          { ar: 'بيتزا مارجريتا', en: 'Margherita Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'صوص طماطم', 'ريحان'], tags: [...cheeseTags, ...vegTags], prices: [60, 85, 120], image: '/images/products/margherita-cheese.jpg', sortOrder: 11 },
          { ar: 'بيتزا خضروات', en: 'Vegetable Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فلفل ملون', 'مشروم', 'زيتون', 'ذرة'], tags: [...vegTags, ...cheeseTags], prices: [70, 90, 130], image: '/images/products/vegetables-cheese.jpg', sortOrder: 12 },
          { ar: 'بيتزا جبنه رومي', en: 'Roman Cheese Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'جبن رومي'], tags: cheeseTags, prices: [85, 120, 150], image: '/images/products/roumy-cheese-cheese.jpg', sortOrder: 9 },
          { ar: 'بيتزا جبنه كيري', en: 'Kiri Cheese Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'جبنة كيري'], tags: cheeseTags, prices: [100, 130, 160], image: '/images/products/kiri-cheese-cheese.jpg', sortOrder: 10 },
        ],
      },
      {
        ar: 'الأسماك',
        en: 'Seafood',
        items: [
          { ar: 'بيتزا تونه', en: 'Tuna Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'تونة', 'بصل'], tags: [...fishTags, ...cheeseTags], prices: [85, 110, 160], image: '/images/products/tuna-seafood.jpg', sortOrder: 4 },
          { ar: 'بيتزا جمبري', en: 'Shrimp Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'جمبري'], tags: [...fishTags, ...cheeseTags], prices: [150, 180, null], image: '/images/products/shrimp-seafood.jpg', sortOrder: 6 },
          { ar: 'بيتزا سي فود', en: 'Seafood Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'جمبري', 'كاليماري', 'أسماك'], tags: [...fishTags, ...cheeseTags], prices: [170, 200, null], image: '/images/products/sea-food-seafood.jpg', sortOrder: 5 },
        ],
      },
      {
        ar: 'المكسات',
        en: 'Mixes',
        items: [
          { ar: 'بيتزا مكس لحوم', en: 'Meat Mix Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سجق', 'بسطرمة', 'لحمة'], tags: [...meatTags, ...cheeseTags], prices: [110, 135, 165], image: '/images/products/meat-mix-mix.jpg', sortOrder: 7 },
          { ar: 'بيتزا مكس فراخ', en: 'Chicken Mix Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'فراخ', 'بانيه', 'استربس'], tags: [...chickenTags, ...cheeseTags], prices: [110, 135, 165], image: '/images/products/chicken-mix-mix.jpg', sortOrder: 25 },
          { ar: 'بيتزا مكس جبن', en: 'Cheese Mix Pizza', ingredients: ['عجينة بيتزا', 'جبن رومي', 'كيري', 'شيدر', 'موتزريلا'], tags: cheeseTags, prices: [110, 135, 165], image: '/images/products/cheese-mix-mix.jpg', sortOrder: 8 },
          { ar: 'بيتزا مكس حلواني', en: 'Helwany Mix Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'تركي مدخن', 'سلامي', 'سوسيس'], tags: [...meatTags, ...chickenTags, ...cheeseTags], prices: [110, 135, 165], image: '/images/products/helwany-mix-mix.jpg', sortOrder: 26 },
          { ar: 'بيتزا سوبر سوبريم', en: 'Super Supreme Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'سوسيس', 'مشروم', 'سلامي'], tags: [...meatTags, ...cheeseTags], prices: [110, 135, 165], image: '/images/products/super-supreme-mix.jpg', sortOrder: 27 },
          { ar: 'بيتزا ثورة عرابي', en: 'Orabi Revolution Pizza', ingredients: ['عجينة بيتزا', 'موتزريلا', 'لحمة', 'سجق', 'كفتة', 'بسطرمة', 'سلامي'], tags: [...meatTags, ...cheeseTags], prices: [120, 145, 190], image: '/images/products/thawret-orabi-mix.jpg', sortOrder: 28 },
        ],
      },
    ],
  },
  {
    ar: 'المقبلات',
    en: 'Starters',
    icon: 'utensils',
    subs: [
      {
        ar: 'المقبلات',
        en: 'Appetizers',
        items: [
          { ar: 'باكيت بطاطس', en: 'Potato Bag', ingredients: ['بطاطس مقلية', 'ملح', 'صوص'], tags: [...vegTags, ...snacksTags], prices: [20, null, 35], sortOrder: 1 },
          { ar: 'بطاطس شيدر', en: 'Cheddar Potato', ingredients: ['بطاطس مقلية', 'شيدر', 'صوص'], tags: [...vegTags, ...snacksTags], prices: [50, null, null], sortOrder: 0 },
          { ar: 'بطاطس موتزريلا فرن', en: 'Baked Mozzarella Potato', ingredients: ['بطاطس', 'موتزريلا', 'صوص', 'فرن'], tags: [...vegTags, ...snacksTags], prices: [50, null, null], sortOrder: 2 },
        ],
      },
      {
        ar: 'الإضافات',
        en: 'Add-ons',
        items: [
          { ar: 'موتزريلا', en: 'Mozzarella', ingredients: ['موتزريلا'], tags: cheeseTags, prices: [15, 25, 35], image: '/images/products/mozzarella-cheese.jpg', sortOrder: 2 },
          { ar: 'فراخ', en: 'Chicken', ingredients: ['فراخ'], tags: chickenTags, prices: [25, 35, 50], image: '/images/products/chicken-chicken.jpg', sortOrder: 0 },
          { ar: 'لحوم', en: 'Meat', ingredients: ['لحوم'], tags: meatTags, prices: [25, 35, 50], image: '/images/products/beef-meat.jpg', sortOrder: 1 },
          { ar: 'قطعة كيري', en: 'Kiri Cheese Piece', ingredients: ['جبنة كيري'], tags: cheeseTags, prices: [15, null, null], image: '/images/products/kiri-cheese-cheese.jpg', sortOrder: 3 },
        ],
      },
    ],
  },
  {
    ar: 'باستا',
    en: 'Pasta',
    icon: 'pizza',
    subs: [
      {
        ar: 'باستا',
        en: 'Pasta',
        items: [
          { ar: 'مكرونة نجرسكو', en: 'Negresco Pasta', ingredients: ['مكرونة', 'بشاميل', 'لحم مفروم'], tags: pastaTags, prices: [70, null, null], sortOrder: 5 },
          { ar: 'نابولي', en: 'Napolitana Pasta', ingredients: ['مكرونة', 'صوص طماطم', 'ريحان'], tags: [...pastaTags, ...vegTags], prices: [40, null, null], sortOrder: 7 },
          { ar: 'فراخ', en: 'Chicken Pasta', ingredients: ['مكرونة', 'فراخ', 'صوص كريمة'], tags: [...pastaTags, ...chickenTags], prices: [60, null, null], sortOrder: 3 },
          { ar: 'لحمه', en: 'Meat Pasta', ingredients: ['مكرونة', 'لحمة مفرومة', 'صوص'], tags: [...pastaTags, ...meatTags], prices: [60, null, null], sortOrder: 0 },
          { ar: 'الفريدو', en: 'Alfredo Pasta', ingredients: ['مكرونة', 'صوص ألفريدو', 'كريمة', 'جبن'], tags: [...pastaTags, ...cheeseTags], prices: [80, null, null], sortOrder: 6 },
          { ar: 'سجق', en: 'Sausage Pasta', ingredients: ['مكرونة', 'سجق', 'صوص'], tags: [...pastaTags, ...meatTags], prices: [50, null, null], sortOrder: 2 },
          { ar: 'هوت دوج', en: 'Hot Dog Pasta', ingredients: ['مكرونة', 'هوت دوج', 'صوص'], tags: [...pastaTags, ...meatTags], prices: [60, null, null], sortOrder: 4 },
          { ar: 'جمبري', en: 'Shrimp Pasta', ingredients: ['مكرونة', 'جمبري', 'صوص'], tags: [...pastaTags, ...fishTags], prices: [90, null, null], sortOrder: 1 },
        ],
      },
    ],
  },
  {
    ar: 'حواوشي',
    en: 'Hawawshi',
    icon: 'sandwich',
    subs: [
      {
        ar: 'حواوشي',
        en: 'Hawawshi',
        items: [
          { ar: 'سجق حواوشي', en: 'Sausage Hawawshi', ingredients: ['عجين', 'سجق', 'بصل', 'خضار'], tags: [...hawawshiTags, ...meatTags], prices: [70, null, null], sortOrder: 1 },
          { ar: 'لحمه حواوشي', en: 'Meat Hawawshi', ingredients: ['عجين', 'لحمة مفرومة', 'بصل', 'خضار'], tags: [...hawawshiTags, ...meatTags], prices: [95, null, null], sortOrder: 0 },
          { ar: 'فراخ حواوشي', en: 'Chicken Hawawshi', ingredients: ['عجين', 'فراخ', 'بصل', 'خضار'], tags: [...hawawshiTags, ...chickenTags], prices: [85, null, null], sortOrder: 2 },
          { ar: 'تونه حواوشي', en: 'Tuna Hawawshi', ingredients: ['عجين', 'تونة', 'بصل', 'خضار'], tags: [...hawawshiTags, ...fishTags], prices: [110, null, null], sortOrder: 3 },
          { ar: 'مكس جبن حواوشي', en: 'Cheese Mix Hawawshi', ingredients: ['عجين', 'جبن موتزريلا', 'جبن رومي', 'كيري'], tags: [...hawawshiTags, ...cheeseTags], prices: [110, null, null], sortOrder: 6 },
          { ar: 'مكس لحوم حواوشي', en: 'Meat Mix Hawawshi', ingredients: ['عجين', 'لحمة', 'سجق', 'بسطرمة'], tags: [...hawawshiTags, ...meatTags], prices: [110, null, null], sortOrder: 4 },
          { ar: 'مكس فراخ حواوشي', en: 'Chicken Mix Hawawshi', ingredients: ['عجين', 'فراخ', 'بانيه', 'استربس'], tags: [...hawawshiTags, ...chickenTags], prices: [110, null, null], sortOrder: 5 },
        ],
      },
    ],
  },
  {
    ar: 'كريب',
    en: 'Crepe',
    icon: 'layers',
    subs: [
      {
        ar: 'كريب فراخ',
        en: 'Chicken Crepe',
        items: [
          { ar: 'كريب استريس', en: 'Estris Crepe', ingredients: ['كريب', 'فراخ', 'صوص استريس'], tags: [...crepeTags, ...chickenTags], prices: [70, null, null], sortOrder: 6 },
          { ar: 'كريب باتيه', en: 'Pate Crepe', ingredients: ['كريب', 'باتيه', 'فراخ'], tags: [...crepeTags, ...chickenTags], prices: [55, null, null], sortOrder: 7 },
          { ar: 'شاورما فراخ', en: 'Chicken Shawarma Crepe', ingredients: ['كريب', 'شاورما فراخ', 'صوص ثوم'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null], sortOrder: 0 },
          { ar: 'اتشكن باربيكيو', en: 'BBQ Chicken Crepe', ingredients: ['كريب', 'فراخ', 'صوص باربيكيو'], tags: [...crepeTags, ...chickenTags], prices: [80, null, null], sortOrder: 1 },
          { ar: 'اتشكن رانش', en: 'Ranch Chicken Crepe', ingredients: ['كريب', 'فراخ', 'صوص رانش'], tags: [...crepeTags, ...chickenTags], prices: [55, null, null], sortOrder: 4 },
          { ar: 'اتشكن كرسبي', en: 'Crispy Chicken Crepe', ingredients: ['كريب', 'فراخ كرسبي', 'صوص'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null], sortOrder: 2 },
          { ar: 'فاهيتا فراخ', en: 'Chicken Fajita Crepe', ingredients: ['كريب', 'فراخ فاهيتا', 'فلفل ملون', 'بصل'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null], sortOrder: 5 },
          { ar: 'اتشكن كرانشي', en: 'Crunchy Chicken Crepe', ingredients: ['كريب', 'فراخ كرانشي'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null], sortOrder: 3 }, // JSON price empty; set to Crispy's rate
        ],
      },
      {
        ar: 'كريب لحوم',
        en: 'Meat Crepe',
        items: [
          { ar: 'لحمه', en: 'Meat Crepe', ingredients: ['كريب', 'لحمة', 'صوص'], tags: [...crepeTags, ...meatTags], prices: [65, null, null], sortOrder: 0 },
          { ar: 'برجر لحمه', en: 'Meat Burger Crepe', ingredients: ['كريب', 'برجر لحم', 'جبن شيدر', 'صوص'], tags: [...crepeTags, ...meatTags], prices: [60, null, null], sortOrder: 4 },
          { ar: 'هوت دوج', en: 'Hot Dog Crepe', ingredients: ['كريب', 'هوت دوج', 'خردل', 'صوص'], tags: [...crepeTags, ...meatTags], prices: [60, null, null], sortOrder: 5 },
          { ar: 'هوت دوج مكسيكانو', en: 'Mexican Hot Dog Crepe', ingredients: ['كريب', 'هوت دوج', 'فلفل حار', 'صوص مكسيكاني'], tags: [...crepeTags, ...meatTags], prices: [55, null, null], sortOrder: 6 },
          { ar: 'كريب سجق بلدي', en: 'Baladi Sausage Crepe', ingredients: ['كريب', 'سجق بلدي', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [60, null, null], sortOrder: 2 },
          { ar: 'سجق اسكندراني', en: 'Alexandrian Sausage Crepe', ingredients: ['كريب', 'سجق اسكندراني', 'بسطرمة', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [60, null, null], sortOrder: 1 },
          { ar: 'كفته', en: 'Kofta Crepe', ingredients: ['كريب', 'كفتة', 'بصل', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [60, null, null], sortOrder: 3 },
        ],
      },
      {
        ar: 'كريب مكس',
        en: 'Mix Crepe',
        items: [
          { ar: 'مكس فراخ', en: 'Chicken Mix Crepe', ingredients: ['كريب', 'فراخ', 'بانيه', 'استربس'], tags: [...crepeTags, ...chickenTags], prices: [100, null, null], sortOrder: 1 },
          { ar: 'اسابيس شاورما بانيه', en: 'Shawarma-Pane Mix Crepe', ingredients: ['كريب', 'شاورما', 'بانيه', 'صوص'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null], sortOrder: 6 },
          { ar: 'مكس جبن', en: 'Cheese Mix Crepe', ingredients: ['كريب', 'جبن رومي', 'موتزريلا', 'شيدر'], tags: [...crepeTags, ...cheeseTags], prices: [90, null, null], sortOrder: 2 },
          { ar: 'اسابيس شاورما بطاطس باربيكيو', en: 'Shawarma-Potato-BBQ Mix Crepe', ingredients: ['كريب', 'شاورما', 'بطاطس', 'صوص باربيكيو'], tags: [...crepeTags, ...chickenTags], prices: [110, null, null], sortOrder: 7 },
          { ar: 'مكس الاسطورة', en: 'Legend Mix Crepe', ingredients: ['كريب', 'فراخ', 'لحمة', 'سجق', 'جبن'], tags: [...crepeTags, ...meatTags, ...chickenTags], prices: [100, null, null], sortOrder: 0 },
          { ar: 'سوبر كرانشي', en: 'Super Crunchy Crepe', ingredients: ['كريب', 'فراخ كرسبي', 'هوت دوج', 'جبن'], tags: [...crepeTags, ...meatTags, ...chickenTags], prices: [100, null, null], sortOrder: 3 },
          { ar: 'سكة قليه', en: 'Sekket Alia Crepe', ingredients: ['كريب', 'موزات لحوم', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [100, null, null], sortOrder: 4 },
          { ar: 'قلبانة عرابي', en: 'Orabi Qalbana Crepe', ingredients: ['كريب', 'لحمة', 'سجق', 'فلفل', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [100, null, null], sortOrder: 5 },
        ],
      },
      {
        ar: 'كريب متنوع',
        en: 'Assorted Crepe',
        items: [
          { ar: 'بطاطس', en: 'Potato Crepe', ingredients: ['كريب', 'بطاطس مقلية', 'صوص'], tags: [...crepeTags, ...vegTags], prices: [40, null, null], sortOrder: 1 },
          { ar: 'مشروم', en: 'Mushroom Crepe', ingredients: ['كريب', 'مشروم', 'جبن'], tags: [...crepeTags, ...vegTags], prices: [50, null, null], sortOrder: 2 },
          { ar: 'موتزريلا', en: 'Mozzarella Crepe', ingredients: ['كريب', 'موتزريلا'], tags: [...crepeTags, ...cheeseTags], prices: [50, null, null], sortOrder: 3 },
          { ar: 'جبنه رومي', en: 'Roman Cheese Crepe', ingredients: ['كريب', 'جبن رومي'], tags: [...crepeTags, ...cheeseTags], prices: [60, null, null], image: '/images/products/roumy-cheese-cheese.jpg', sortOrder: 4 },
          { ar: 'بطاطس شيدر', en: 'Cheddar Potato Crepe', ingredients: ['كريب', 'بطاطس', 'شيدر'], tags: [...crepeTags, ...vegTags], prices: [55, null, null], sortOrder: 0 },
        ],
      },
    ],
  },
  {
    ar: 'كريب حلو',
    en: 'Sweet Crepe',
    icon: 'candy',
    subs: [
      {
        ar: 'كريب حلو',
        en: 'Sweet Crepe',
        items: [
          { ar: 'شيكولاتة', en: 'Chocolate Crepe', ingredients: ['كريب', 'شيكولاتة'], tags: [...crepeTags, ...sweetTags], prices: [50, null, null], image: '/images/products/chocolate-sweet-feteer.jpg', sortOrder: 0 },
          { ar: 'شيكولاتة موز', en: 'Chocolate Banana Crepe', ingredients: ['كريب', 'شيكولاتة', 'موز'], tags: [...crepeTags, ...sweetTags], prices: [60, null, null], image: '/images/products/chocolate-banana-sweet-feteer.jpg', sortOrder: 2 },
          { ar: 'شيكولاتة أوريو', en: 'Chocolate Oreo Crepe', ingredients: ['كريب', 'شيكولاتة', 'أوريو'], tags: [...crepeTags, ...sweetTags], prices: [60, null, null], image: '/images/products/chocolate-oreo-sweet-feteer.jpg', sortOrder: 1 },
          { ar: 'لوتس', en: 'Lotus Crepe', ingredients: ['كريب', 'صوص لوتس', 'بسكويت'], tags: [...crepeTags, ...sweetTags], prices: [65, null, null], image: '/images/products/lotus-sweet-feteer.jpg', sortOrder: 3 },
        ],
      },
    ],
  },
  {
    ar: 'طواجن وسفرة',
    en: 'Tagine & Delivery',
    icon: 'utensils',
    subs: [
      {
        ar: 'طواجن',
        en: 'Tagine',
        items: [
          { ar: 'طاجن لحمة', en: 'Meat Tagine', ingredients: ['لحمة', 'بصل', 'طماطم', 'بهارات'], tags: [...tagineTags, ...meatTags], prices: [40, null, null], sortOrder: 1 },
          { ar: 'طاجن فراخ', en: 'Chicken Tagine', ingredients: ['فراخ', 'بصل', 'طماطم', 'بهارات'], tags: [...tagineTags, ...chickenTags], prices: [45, null, null], sortOrder: 0 },
          { ar: 'طاجن مكس لحمة', en: 'Meat Mix Tagine', ingredients: ['لحمة', 'سجق', 'كفتة', 'بهارات'], tags: [...tagineTags, ...meatTags], prices: [50, null, null], sortOrder: 3 },
          { ar: 'طاجن مكس فراخ', en: 'Chicken Mix Tagine', ingredients: ['فراخ', 'بانيه', 'استربس', 'بهارات'], tags: [...tagineTags, ...chickenTags], prices: [55, null, null], sortOrder: 2 },
          { ar: 'طاجن موتزاريلا لحمة', en: 'Meat Mozzarella Tagine', ingredients: ['لحمة', 'موتزريلا', 'فرن'], tags: [...tagineTags, ...meatTags, ...cheeseTags], prices: [55, null, null], sortOrder: 4 },
          { ar: 'طاجن موتزاريلا فراخ', en: 'Chicken Mozzarella Tagine', ingredients: ['فراخ', 'موتزريلا', 'فرن'], tags: [...tagineTags, ...chickenTags, ...cheeseTags], prices: [60, null, null], sortOrder: 5 },
        ],
      },
      {
        ar: 'سفرة',
        en: 'Delivery Cans',
        items: [
          { ar: 'علبة عادة', en: 'Regular Can', ingredients: ['سفرة'], tags: ['سفرة'], prices: [15, null, null], sortOrder: 0 },
          { ar: 'علبة عرابي', en: 'Orabi Can', ingredients: ['سفرة'], tags: ['سفرة'], prices: [20, null, null], sortOrder: 1 },
          { ar: 'علبة سوبر', en: 'Super Can', ingredients: ['سفرة'], tags: ['سفرة'], prices: [30, null, null], sortOrder: 2 },
          { ar: 'علبة جامبو', en: 'Jumbo Can', ingredients: ['سفرة'], tags: ['سفرة'], prices: [40, null, null], sortOrder: 3 },
        ],
      },
    ],
  },
  {
    ar: 'حلو',
    en: 'Dessert',
    icon: 'cake',
    subs: [
      {
        ar: 'حلو',
        en: 'Dessert',
        items: [
          { ar: 'أرز عادي', en: 'Regular Rice', ingredients: ['أرز', 'زبدة', 'ملح'], tags: sweetTags, prices: [15, null, null], sortOrder: 0 },
          { ar: 'أرز فرن', en: 'Baked Rice', ingredients: ['أرز باللبن', 'سكر'], tags: sweetTags, prices: [17, null, null], sortOrder: 1 },
          { ar: 'كاتز', en: 'Custard', ingredients: ['كاسترد', 'سكر'], tags: sweetTags, prices: [25, null, null], image: '/images/products/custard-sweet-feteer.jpg', sortOrder: 2 },
          { ar: 'مياه', en: 'Water', ingredients: ['مياه معدنية'], tags: ['مشروبات'], prices: [10, null, null], sortOrder: 3 },
        ],
      },
    ],
  },
];

export const seedExtras = [
  { ar: 'جبنة إضافية', en: 'Extra Cheese', price: 15 },
  { ar: 'فراخ إضافية', en: 'Extra Chicken', price: 30 },
  { ar: 'زيتون', en: 'Olives', price: 10 },
  { ar: 'صوص إضافي', en: 'Extra Sauce', price: 10 },
  { ar: 'مشروم', en: 'Mushroom', price: 10 },
];

// Bestsellers (deterministic) - every name resolves to an item in the catalog
export const bestSellerNames = [
  'شاورما فراخ', 'اتشكن باربيكيو', 'لحمه', 'مكس الاسطورة', 'طاجن فراخ',
  'بطاطس شيدر', 'شيكولاتة', 'شيكولاتة أوريو', 'جمبري', 'لحمه حواوشي',
];

// Offers flagged with a discount % (deterministic, spread across sections)
export const offerNames = [
  'مكس جبن', 'سجق', 'فاهيتا فراخ', 'مكس فراخ', 'طاجن مكس فراخ',
  'كاتز', 'لوتس', 'شيكولاتة موز', 'علبة سوبر', 'كفته',
];

export interface SeedGalleryImage {
  ar: string;
  en: string;
  image: string;
}

// Curated public gallery — real dish photos from public/images/products,
// intentionally varied across the menu (pizzas, crepes, feteer, rocket rolls,
// hawawshi, tagine, pasta, seafood, meat and desserts). Seeded into the
// gallery_images table; admins can then reorder/hide/replace from the dashboard.
export const galleryImagesSeed: SeedGalleryImage[] = [
  // Pizzas
  { ar: 'بيتزا مارجريتا', en: 'Margherita Pizza', image: '/images/products/margherita-cheese.jpg' },
  { ar: 'بيتزا فراخ باربيكيو', en: 'BBQ Chicken Pizza', image: '/images/products/chicken-bbq-chicken.jpg' },
  { ar: 'بيتزا فاهيتا', en: 'Fajita Pizza', image: '/images/products/fajita-chicken.jpg' },
  { ar: 'بيتزا خضروات', en: 'Vegetable Pizza', image: '/images/products/vegetables-cheese.jpg' },
  // Chicken & grilled
  { ar: 'استربس فراخ', en: 'Chicken Strips', image: '/images/products/strips-chicken.jpg' },
  { ar: 'كفتة مشوية', en: 'Grilled Kofta', image: '/images/products/kofta-meat.jpg' },
  { ar: 'حواوشي فراخ', en: 'Chicken Hawawshi', image: '/images/products/chicken-hawawshi-hawawshi.jpg' },
  { ar: 'طاجن فراخ', en: 'Chicken Tagine', image: '/images/products/chicken-tagine-tagine.jpg' },
  // Seafood
  { ar: 'جمبري', en: 'Shrimp', image: '/images/products/shrimp-seafood.jpg' },
  { ar: 'تونة', en: 'Tuna', image: '/images/products/tuna-seafood.jpg' },
  // Cheese & sides
  { ar: 'موتزريلا', en: 'Mozzarella', image: '/images/products/mozzarella-cheese.jpg' },
  { ar: 'بطاطس شيدر', en: 'Cheddar Potato', image: '/images/products/cheddar-potato-appetizers.jpg' },
  // Pasta
  { ar: 'باستا فراخ', en: 'Chicken Pasta', image: '/images/products/chicken-pasta-pasta.jpg' },
  // Meat & mixes
  { ar: 'ميكس لحوم', en: 'Meat Mix', image: '/images/products/meat-mix-mix.jpg' },
  { ar: 'لحمة', en: 'Beef', image: '/images/products/beef-meat.jpg' },
  // Egyptian breads & rolls
  { ar: 'فطير مشلتت', en: 'Feteer Meshaltet', image: '/images/products/meshaltet-butter-meshaltet.jpg' },
  { ar: 'صاروخ سجق', en: 'Sausage Rocket Roll', image: '/images/products/sausage-kiri-rocket-roll.jpg' },
  { ar: 'صاروخ لحمة', en: 'Beef Rocket Roll', image: '/images/products/beef-rocket-roll.jpg' },
  // Sweet feteer & desserts
  { ar: 'كنافة', en: 'Kunafa', image: '/images/products/kunafa-sweet-feteer.jpg' },
  { ar: 'بسبوسة', en: 'Basbousa', image: '/images/products/basbousa-kunafa-sweet-feteer.jpg' },
  { ar: 'فطير شيكولاتة أوريو', en: 'Oreo Chocolate Feteer', image: '/images/products/chocolate-oreo-sweet-feteer.jpg' },
  { ar: 'فطير شيكولاتة بالموز', en: 'Chocolate Banana Feteer', image: '/images/products/chocolate-banana-sweet-feteer.jpg' },
  { ar: 'فطير لوتس', en: 'Lotus Feteer', image: '/images/products/lotus-sweet-feteer.jpg' },
  { ar: 'فطير شيكولاتة بيضاء', en: 'White Chocolate Feteer', image: '/images/products/white-chocolate-sweet-feteer.jpg' },
];