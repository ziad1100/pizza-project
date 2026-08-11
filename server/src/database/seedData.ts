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

export const seedSections: SeedSection[] = [
  {
    ar: 'المقبلات',
    en: 'Starters',
    icon: 'utensils',
    subs: [
      {
        ar: 'المقبلات',
        en: 'Appetizers',
        items: [
          { ar: 'باكيت بطاطس', en: 'Potato Bag', ingredients: ['بطاطس مقلية', 'ملح', 'صوص'], tags: [...vegTags, ...snacksTags], prices: [20, null, 35] },
          { ar: 'بطاطس شيدر', en: 'Cheddar Potato', ingredients: ['بطاطس مقلية', 'شيدر', 'صوص'], tags: [...vegTags, ...snacksTags], prices: [50, null, null] },
          { ar: 'بطاطس موتزريلا فرن', en: 'Baked Mozzarella Potato', ingredients: ['بطاطس', 'موتزريلا', 'صوص', 'فرن'], tags: [...vegTags, ...snacksTags], prices: [50, null, null] },
        ],
      },
      {
        ar: 'الإضافات',
        en: 'Add-ons',
        items: [
          { ar: 'موتزريلا', en: 'Mozzarella', ingredients: ['موتزريلا'], tags: cheeseTags, prices: [15, 25, 35], image: '/images/products/mozzarella-cheese.jpg' },
          { ar: 'فراخ', en: 'Chicken', ingredients: ['فراخ'], tags: chickenTags, prices: [25, 35, 50], image: '/images/products/chicken-chicken.jpg' },
          { ar: 'لحوم', en: 'Meat', ingredients: ['لحوم'], tags: meatTags, prices: [25, 35, 50], image: '/images/products/beef-meat.jpg' },
          { ar: 'قطعة كيري', en: 'Kiri Cheese Piece', ingredients: ['جبنة كيري'], tags: cheeseTags, prices: [15, null, null], image: '/images/products/kiri-cheese-cheese.jpg' },
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
          { ar: 'مكرونة نجرسكو', en: 'Negresco Pasta', ingredients: ['مكرونة', 'بشاميل', 'لحم مفروم'], tags: pastaTags, prices: [70, null, null] },
          { ar: 'نابولي', en: 'Napolitana Pasta', ingredients: ['مكرونة', 'صوص طماطم', 'ريحان'], tags: [...pastaTags, ...vegTags], prices: [40, null, null] },
          { ar: 'فراخ', en: 'Chicken Pasta', ingredients: ['مكرونة', 'فراخ', 'صوص كريمة'], tags: [...pastaTags, ...chickenTags], prices: [60, null, null] },
          { ar: 'لحمه', en: 'Meat Pasta', ingredients: ['مكرونة', 'لحمة مفرومة', 'صوص'], tags: [...pastaTags, ...meatTags], prices: [60, null, null] },
          { ar: 'الفريدو', en: 'Alfredo Pasta', ingredients: ['مكرونة', 'صوص ألفريدو', 'كريمة', 'جبن'], tags: [...pastaTags, ...cheeseTags], prices: [80, null, null] },
          { ar: 'سجق', en: 'Sausage Pasta', ingredients: ['مكرونة', 'سجق', 'صوص'], tags: [...pastaTags, ...meatTags], prices: [50, null, null] },
          { ar: 'هوت دوج', en: 'Hot Dog Pasta', ingredients: ['مكرونة', 'هوت دوج', 'صوص'], tags: [...pastaTags, ...meatTags], prices: [60, null, null] },
          { ar: 'جمبري', en: 'Shrimp Pasta', ingredients: ['مكرونة', 'جمبري', 'صوص'], tags: [...pastaTags, ...fishTags], prices: [90, null, null] },
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
          { ar: 'سجق حواوشي', en: 'Sausage Hawawshi', ingredients: ['عجين', 'سجق', 'بصل', 'خضار'], tags: [...hawawshiTags, ...meatTags], prices: [70, null, null] },
          { ar: 'لحمه حواوشي', en: 'Meat Hawawshi', ingredients: ['عجين', 'لحمة مفرومة', 'بصل', 'خضار'], tags: [...hawawshiTags, ...meatTags], prices: [95, null, null] },
          { ar: 'فراخ حواوشي', en: 'Chicken Hawawshi', ingredients: ['عجين', 'فراخ', 'بصل', 'خضار'], tags: [...hawawshiTags, ...chickenTags], prices: [85, null, null] },
          { ar: 'تونه حواوشي', en: 'Tuna Hawawshi', ingredients: ['عجين', 'تونة', 'بصل', 'خضار'], tags: [...hawawshiTags, ...fishTags], prices: [110, null, null] },
          { ar: 'مكس جبن حواوشي', en: 'Cheese Mix Hawawshi', ingredients: ['عجين', 'جبن موتزريلا', 'جبن رومي', 'كيري'], tags: [...hawawshiTags, ...cheeseTags], prices: [110, null, null] },
          { ar: 'مكس لحوم حواوشي', en: 'Meat Mix Hawawshi', ingredients: ['عجين', 'لحمة', 'سجق', 'بسطرمة'], tags: [...hawawshiTags, ...meatTags], prices: [110, null, null] },
          { ar: 'مكس فراخ حواوشي', en: 'Chicken Mix Hawawshi', ingredients: ['عجين', 'فراخ', 'بانيه', 'استربس'], tags: [...hawawshiTags, ...chickenTags], prices: [110, null, null] },
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
          { ar: 'كريب استريس', en: 'Estris Crepe', ingredients: ['كريب', 'فراخ', 'صوص استريس'], tags: [...crepeTags, ...chickenTags], prices: [70, null, null] },
          { ar: 'كريب باتيه', en: 'Pate Crepe', ingredients: ['كريب', 'باتيه', 'فراخ'], tags: [...crepeTags, ...chickenTags], prices: [55, null, null] },
          { ar: 'شاورما فراخ', en: 'Chicken Shawarma Crepe', ingredients: ['كريب', 'شاورما فراخ', 'صوص ثوم'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null] },
          { ar: 'اتشكن باربيكيو', en: 'BBQ Chicken Crepe', ingredients: ['كريب', 'فراخ', 'صوص باربيكيو'], tags: [...crepeTags, ...chickenTags], prices: [80, null, null] },
          { ar: 'اتشكن رانش', en: 'Ranch Chicken Crepe', ingredients: ['كريب', 'فراخ', 'صوص رانش'], tags: [...crepeTags, ...chickenTags], prices: [55, null, null] },
          { ar: 'اتشكن كرسبي', en: 'Crispy Chicken Crepe', ingredients: ['كريب', 'فراخ كرسبي', 'صوص'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null] },
          { ar: 'فاهيتا فراخ', en: 'Chicken Fajita Crepe', ingredients: ['كريب', 'فراخ فاهيتا', 'فلفل ملون', 'بصل'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null] },
          { ar: 'اتشكن كرانشي', en: 'Crunchy Chicken Crepe', ingredients: ['كريب', 'فراخ كرانشي'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null] }, // JSON price empty; set to Crispy's rate
        ],
      },
      {
        ar: 'كريب لحوم',
        en: 'Meat Crepe',
        items: [
          { ar: 'لحمه', en: 'Meat Crepe', ingredients: ['كريب', 'لحمة', 'صوص'], tags: [...crepeTags, ...meatTags], prices: [65, null, null] },
          { ar: 'برجر لحمه', en: 'Meat Burger Crepe', ingredients: ['كريب', 'برجر لحم', 'جبن شيدر', 'صوص'], tags: [...crepeTags, ...meatTags], prices: [60, null, null] },
          { ar: 'هوت دوج', en: 'Hot Dog Crepe', ingredients: ['كريب', 'هوت دوج', 'خردل', 'صوص'], tags: [...crepeTags, ...meatTags], prices: [60, null, null] },
          { ar: 'هوت دوج مكسيكانو', en: 'Mexican Hot Dog Crepe', ingredients: ['كريب', 'هوت دوج', 'فلفل حار', 'صوص مكسيكاني'], tags: [...crepeTags, ...meatTags], prices: [55, null, null] },
          { ar: 'كريب سجق بلدي', en: 'Baladi Sausage Crepe', ingredients: ['كريب', 'سجق بلدي', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [60, null, null] },
          { ar: 'سجق اسكندراني', en: 'Alexandrian Sausage Crepe', ingredients: ['كريب', 'سجق اسكندراني', 'بسطرمة', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [60, null, null] },
          { ar: 'كفته', en: 'Kofta Crepe', ingredients: ['كريب', 'كفتة', 'بصل', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [60, null, null] },
        ],
      },
      {
        ar: 'كريب مكس',
        en: 'Mix Crepe',
        items: [
          { ar: 'مكس فراخ', en: 'Chicken Mix Crepe', ingredients: ['كريب', 'فراخ', 'بانيه', 'استربس'], tags: [...crepeTags, ...chickenTags], prices: [100, null, null] },
          { ar: 'اسابيس شاورما بانيه', en: 'Shawarma-Pane Mix Crepe', ingredients: ['كريب', 'شاورما', 'بانيه', 'صوص'], tags: [...crepeTags, ...chickenTags], prices: [75, null, null] },
          { ar: 'مكس جبن', en: 'Cheese Mix Crepe', ingredients: ['كريب', 'جبن رومي', 'موتزريلا', 'شيدر'], tags: [...crepeTags, ...cheeseTags], prices: [90, null, null] },
          { ar: 'اسابيس شاورما بطاطس باربيكيو', en: 'Shawarma-Potato-BBQ Mix Crepe', ingredients: ['كريب', 'شاورما', 'بطاطس', 'صوص باربيكيو'], tags: [...crepeTags, ...chickenTags], prices: [110, null, null] },
          { ar: 'مكس الاسطورة', en: 'Legend Mix Crepe', ingredients: ['كريب', 'فراخ', 'لحمة', 'سجق', 'جبن'], tags: [...crepeTags, ...meatTags, ...chickenTags], prices: [100, null, null] },
          { ar: 'سوبر كرانشي', en: 'Super Crunchy Crepe', ingredients: ['كريب', 'فراخ كرسبي', 'هوت دوج', 'جبن'], tags: [...crepeTags, ...meatTags, ...chickenTags], prices: [100, null, null] },
          { ar: 'سكة قليه', en: 'Sekket Alia Crepe', ingredients: ['كريب', 'موزات لحوم', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [100, null, null] },
          { ar: 'قلبانة عرابي', en: 'Orabi Qalbana Crepe', ingredients: ['كريب', 'لحمة', 'سجق', 'فلفل', 'جبن'], tags: [...crepeTags, ...meatTags], prices: [100, null, null] },
        ],
      },
      {
        ar: 'كريب متنوع',
        en: 'Assorted Crepe',
        items: [
          { ar: 'بطاطس', en: 'Potato Crepe', ingredients: ['كريب', 'بطاطس مقلية', 'صوص'], tags: [...crepeTags, ...vegTags], prices: [40, null, null] },
          { ar: 'مشروم', en: 'Mushroom Crepe', ingredients: ['كريب', 'مشروم', 'جبن'], tags: [...crepeTags, ...vegTags], prices: [50, null, null] },
          { ar: 'موتزريلا', en: 'Mozzarella Crepe', ingredients: ['كريب', 'موتزريلا'], tags: [...crepeTags, ...cheeseTags], prices: [50, null, null] },
          { ar: 'جبنه رومي', en: 'Roman Cheese Crepe', ingredients: ['كريب', 'جبن رومي'], tags: [...crepeTags, ...cheeseTags], prices: [60, null, null], image: '/images/products/roumy-cheese-cheese.jpg' },
          { ar: 'بطاطس شيدر', en: 'Cheddar Potato Crepe', ingredients: ['كريب', 'بطاطس', 'شيدر'], tags: [...crepeTags, ...vegTags], prices: [55, null, null] },
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
          { ar: 'شيكولاتة', en: 'Chocolate Crepe', ingredients: ['كريب', 'شيكولاتة'], tags: [...crepeTags, ...sweetTags], prices: [50, null, null], image: '/images/products/chocolate-sweet-feteer.jpg' },
          { ar: 'شيكولاتة موز', en: 'Chocolate Banana Crepe', ingredients: ['كريب', 'شيكولاتة', 'موز'], tags: [...crepeTags, ...sweetTags], prices: [60, null, null], image: '/images/products/chocolate-banana-sweet-feteer.jpg' },
          { ar: 'شيكولاتة أوريو', en: 'Chocolate Oreo Crepe', ingredients: ['كريب', 'شيكولاتة', 'أوريو'], tags: [...crepeTags, ...sweetTags], prices: [60, null, null], image: '/images/products/chocolate-oreo-sweet-feteer.jpg' },
          { ar: 'لوتس', en: 'Lotus Crepe', ingredients: ['كريب', 'صوص لوتس', 'بسكويت'], tags: [...crepeTags, ...sweetTags], prices: [65, null, null], image: '/images/products/lotus-sweet-feteer.jpg' },
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
          { ar: 'طاجن لحمة', en: 'Meat Tagine', ingredients: ['لحمة', 'بصل', 'طماطم', 'بهارات'], tags: [...tagineTags, ...meatTags], prices: [40, null, null] },
          { ar: 'طاجن فراخ', en: 'Chicken Tagine', ingredients: ['فراخ', 'بصل', 'طماطم', 'بهارات'], tags: [...tagineTags, ...chickenTags], prices: [45, null, null] },
          { ar: 'طاجن مكس لحمة', en: 'Meat Mix Tagine', ingredients: ['لحمة', 'سجق', 'كفتة', 'بهارات'], tags: [...tagineTags, ...meatTags], prices: [50, null, null] },
          { ar: 'طاجن مكس فراخ', en: 'Chicken Mix Tagine', ingredients: ['فراخ', 'بانيه', 'استربس', 'بهارات'], tags: [...tagineTags, ...chickenTags], prices: [55, null, null] },
          { ar: 'طاجن موتزاريلا لحمة', en: 'Meat Mozzarella Tagine', ingredients: ['لحمة', 'موتزريلا', 'فرن'], tags: [...tagineTags, ...meatTags, ...cheeseTags], prices: [55, null, null] },
          { ar: 'طاجن موتزاريلا فراخ', en: 'Chicken Mozzarella Tagine', ingredients: ['فراخ', 'موتزريلا', 'فرن'], tags: [...tagineTags, ...chickenTags, ...cheeseTags], prices: [60, null, null] },
        ],
      },
      {
        ar: 'سفرة',
        en: 'Delivery Cans',
        items: [
          { ar: 'علبة عادة', en: 'Regular Can', ingredients: ['سفرة'], tags: ['سفرة'], prices: [15, null, null] },
          { ar: 'علبة عرابي', en: 'Orabi Can', ingredients: ['سفرة'], tags: ['سفرة'], prices: [20, null, null] },
          { ar: 'علبة سوبر', en: 'Super Can', ingredients: ['سفرة'], tags: ['سفرة'], prices: [30, null, null] },
          { ar: 'علبة جامبو', en: 'Jumbo Can', ingredients: ['سفرة'], tags: ['سفرة'], prices: [40, null, null] },
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
          { ar: 'أرز عادي', en: 'Regular Rice', ingredients: ['أرز', 'زبدة', 'ملح'], tags: sweetTags, prices: [15, null, null] },
          { ar: 'أرز فرن', en: 'Baked Rice', ingredients: ['أرز باللبن', 'سكر'], tags: sweetTags, prices: [17, null, null] },
          { ar: 'كاتز', en: 'Custard', ingredients: ['كاسترد', 'سكر'], tags: sweetTags, prices: [25, null, null], image: '/images/products/custard-sweet-feteer.jpg' },
          { ar: 'مياه', en: 'Water', ingredients: ['مياه معدنية'], tags: ['مشروبات'], prices: [10, null, null] },
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