// ORABI menu seed data (source of truth: new authoritative English menu)
// prices = [small, medium, large] in EGP; null = size not offered
// English names are adopted verbatim from the menu; Arabic names are kept.
// Every product's dish photo lives in public/images/products. The default URL
// is derived from the English name + sub-section (see seed.ts imageFor());
// "image" overrides that for renamed/new items that reuse an existing photo.

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

const chicken = ['فراخ', 'جبن موتزريلا', 'صوص', 'بصل', 'فلفل'];
const meatTags = ['لحوم'];
const chickenTags = ['فراخ'];
const cheeseTags = ['جبن'];
const vegTags = ['نباتي'];
const fishTags = ['أسماك'];
const sweetTags = ['حلو'];

export const seedSections: SeedSection[] = [
  {
    ar: 'إيطالى',
    en: 'Italian',
    icon: 'pizza',
    subs: [
      {
        ar: 'الفراخ',
        en: 'Chicken',
        items: [
          { ar: 'فراخ', en: 'Chicken', ingredients: chicken, tags: chickenTags, prices: [100, 130, 160] },
          { ar: 'تشيكن رانش', en: 'Ranch Chicken', ingredients: [...chicken, 'صوص رانش'], tags: chickenTags, prices: [100, 130, 160], image: '/images/products/chicken-ranch-chicken.jpg' },
          { ar: 'تشيكن باربيكيو', en: 'BBQ Chicken', ingredients: [...chicken, 'صوص باربيكيو'], tags: chickenTags, prices: [105, 135, 165], image: '/images/products/chicken-bbq-chicken.jpg' },
          { ar: 'تشيكن كرانشي', en: 'Kranshi Chicken', ingredients: ['فراخ كرسبي', 'جبن', 'صوص'], tags: chickenTags, prices: [95, 125, 165], image: '/images/products/crispy-chicken-chicken.jpg' },
          { ar: 'تركي مدخن', en: 'Smoked Turkey', ingredients: ['تركي مدخن', 'جبن', 'صوص'], tags: chickenTags, prices: [95, 125, 155] },
          { ar: 'فراخ كرسبي', en: 'Chicken & Crispy', ingredients: ['فراخ كرسبي', 'جبن', 'صوص'], tags: chickenTags, prices: [90, 120, 140], image: '/images/products/crispy-chicken-chicken.jpg' },
          { ar: 'فاهيتا', en: 'Fajita', ingredients: ['فراخ فاهيتا', 'فلفل ملون', 'بصل', 'جبن'], tags: chickenTags, prices: [105, 130, 160] },
          { ar: 'استربس', en: 'Strips', ingredients: ['استربس فراخ', 'جبن', 'صوص'], tags: chickenTags, prices: [100, 130, 160] },
        ],
      },
      {
        ar: 'اللحوم',
        en: 'Meat',
        items: [
          { ar: 'سجق اسكندراني', en: 'Alexandrian Sausage', ingredients: ['سجق اسكندراني', 'جبن', 'صوص'], tags: meatTags, prices: [80, 100, 140] },
          { ar: 'سجق بلدي', en: 'Beldi Sausage', ingredients: ['سجق بلدي', 'جبن', 'صوص'], tags: meatTags, prices: [110, 135, 165], image: '/images/products/beef-sausage-meat.jpg' },
          { ar: 'لحمه', en: 'Meat', ingredients: ['لحمة', 'جبن', 'صوص'], tags: meatTags, prices: [90, 130, 155], image: '/images/products/beef-meat.jpg' },
          { ar: 'بسطرمة', en: 'Pastrami', ingredients: ['بسطرمة', 'جبن', 'صوص'], tags: meatTags, prices: [95, 130, 155] },
          { ar: 'سلامي', en: 'Salami', ingredients: ['سلامي', 'جبن', 'صوص'], tags: meatTags, prices: [90, 125, 145] },
          { ar: 'كفته', en: 'Kofta', ingredients: ['كفتة', 'جبن', 'صوص'], tags: meatTags, prices: [100, 125, 150] },
        ],
      },
      {
        ar: 'الجبن',
        en: 'Cheese',
        items: [
          { ar: 'مارجريتا', en: 'Margherita', ingredients: ['موتزريلا', 'صوص طماطم', 'ريحان'], tags: [...cheeseTags, ...vegTags], prices: [60, 85, 120] },
          { ar: 'خضروات', en: 'Vegetables', ingredients: ['فلفل', 'مشروم', 'زيتون', 'ذرة', 'طماطم'], tags: vegTags, prices: [70, 90, 130] },
          { ar: 'جبنه رومي', en: 'Roumi Cheese', ingredients: ['جبنة رومي', 'موتزريلا'], tags: cheeseTags, prices: [85, 120, 150], image: '/images/products/roumy-cheese-cheese.jpg' },
          { ar: 'جبنه كيري', en: 'Extra Cheese', ingredients: ['جبنة كيري', 'موتزريلا'], tags: cheeseTags, prices: [100, 130, 160], image: '/images/products/kiri-cheese-cheese.jpg' },
        ],
      },
      {
        ar: 'الأسماك',
        en: 'Seafood',
        items: [
          { ar: 'تونه', en: 'Tuna', ingredients: ['تونة', 'بصل', 'زيتون', 'جبن'], tags: fishTags, prices: [85, 110, 160] },
          { ar: 'جمبري', en: 'Shrimp', ingredients: ['جمبري', 'جبن', 'صوص'], tags: fishTags, prices: [null, 150, 180] },
          { ar: 'سي فود', en: 'Seafood', ingredients: ['جمبري', 'كاليماري', 'جبن', 'صوص'], tags: fishTags, prices: [null, 170, 200], image: '/images/products/sea-food-seafood.jpg' },
        ],
      },
      {
        ar: 'المكسات',
        en: 'Mix',
        items: [
          { ar: 'مكس لحوم', en: 'Meat Mix', ingredients: ['لحمة', 'سجق', 'بسطرمة'], tags: meatTags, prices: [110, 135, 165] },
          { ar: 'مكس فراخ وبسطرمة ولحمه', en: "Chicken/Pastrami/Meat Mix", ingredients: ['فراخ', 'بسطرمة', 'لحمه'], tags: meatTags, prices: [110, 135, 165], image: '/images/products/meat-mix-mix.jpg' },
          { ar: 'مكس فراخ ولحمه وسجق', en: 'Chicken, Beef, Sausage', ingredients: ['فراخ', 'لحمه', 'سجق'], tags: meatTags, prices: [110, 135, 165], image: '/images/products/meat-mix-mix.jpg' },
          { ar: 'مكس فراخ', en: 'Chicken Mix', ingredients: ['فراخ + بانيه + استربس'], tags: chickenTags, prices: [110, 135, 165] },
          { ar: 'مكس جبن', en: 'Cheese Mix', ingredients: ['جبنه رومي + كيري + شيدر + موتزريلا'], tags: cheeseTags, prices: [110, 135, 165] },
          { ar: 'مكس حلواني', en: 'Smoked Sweet Mix', ingredients: ['تركي + سلامي + سوسيس'], tags: meatTags, prices: [110, 135, 165], image: '/images/products/helwany-mix-mix.jpg' },
          { ar: 'سوبر سوبريم', en: 'Super Supreme', ingredients: ['سوسيس + مشروم + سلامي'], tags: meatTags, prices: [110, 135, 165] },
          { ar: 'ثورة عرابي', en: 'Thawret Orabi', ingredients: ['لحمه + سجق + كفتة + بسطرمة + سلامي'], tags: meatTags, prices: [120, 145, 190] },
        ],
      },
    ],
  },
  {
    ar: 'شرقى',
    en: 'Eastern',
    icon: 'utensils',
    subs: [
      {
        ar: 'الفراخ',
        en: 'Chicken',
        items: [
          { ar: 'فراخ', en: 'Chicken', ingredients: chicken, tags: chickenTags, prices: [100, 130, 160] },
          { ar: 'تشيكن رانش', en: 'Ranch Chicken', ingredients: [...chicken, 'صوص رانش'], tags: chickenTags, prices: [105, 135, 160], image: '/images/products/chicken-ranch-chicken.jpg' },
          { ar: 'تشيكن باربيكيو', en: 'BBQ Chicken', ingredients: [...chicken, 'صوص باربيكيو'], tags: chickenTags, prices: [105, 135, 160], image: '/images/products/chicken-bbq-chicken.jpg' },
          { ar: 'تركي مدخن', en: 'Smoked Turkey', ingredients: ['تركي مدخن', 'جبن', 'صوص'], tags: chickenTags, prices: [90, 130, 160] },
          { ar: 'كرسبي', en: 'Crispy Chicken', ingredients: ['فراخ كرسبي', 'جبن', 'صوص'], tags: chickenTags, prices: [100, 125, 160] },
          { ar: 'شيش', en: 'Shish Chicken', ingredients: ['شيش طاووق', 'جبن', 'صوص'], tags: chickenTags, prices: [100, 130, 160], image: '/images/products/sheesh-chicken.jpg' },
          { ar: 'فاهيتا', en: 'Fajita Chicken', ingredients: ['فراخ فاهيتا', 'فلفل ملون', 'بصل', 'جبن'], tags: chickenTags, prices: [100, 130, 160], image: '/images/products/fajita-chicken.jpg' },
          { ar: 'استربس', en: 'Strips', ingredients: ['استربس فراخ', 'جبن', 'صوص'], tags: chickenTags, prices: [95, 120, 160] },
        ],
      },
      {
        ar: 'اللحوم',
        en: 'Meat',
        items: [
          { ar: 'سجق اسكندراني', en: 'Alexandrian Sausage', ingredients: ['سجق اسكندراني', 'جبن', 'صوص'], tags: meatTags, prices: [60, 95, 130] },
          { ar: 'سجق بلدي', en: 'Beldi Sausage', ingredients: ['سجق بلدي', 'جبن', 'صوص'], tags: meatTags, prices: [100, 130, 160], image: '/images/products/beef-sausage-meat.jpg' },
          { ar: 'لحمه', en: 'Meat', ingredients: ['لحمة', 'جبن', 'صوص'], tags: meatTags, prices: [85, 110, 150], image: '/images/products/beef-meat.jpg' },
          { ar: 'بسطرمة', en: 'Pastrami', ingredients: ['بسطرمة', 'جبن', 'صوص'], tags: meatTags, prices: [95, 110, 160] },
          { ar: 'سوسيس', en: 'Sausage', ingredients: ['سوسيس', 'جبن', 'صوص'], tags: meatTags, prices: [80, 100, 140] },
          { ar: 'سلامي', en: 'Salami', ingredients: ['سلامي', 'جبن', 'صوص'], tags: meatTags, prices: [100, 130, 160] },
          { ar: 'كفته', en: 'Kofta', ingredients: ['كفتة', 'جبن', 'صوص'], tags: meatTags, prices: [90, 120, 150] },
        ],
      },
      {
        ar: 'الجبن',
        en: 'Cheese',
        items: [
          { ar: 'موتزريلا', en: 'Mozzarella', ingredients: ['موتزريلا', 'صوص'], tags: [...cheeseTags, ...vegTags], prices: [60, 80, 110] },
          { ar: 'جبنه رومي', en: 'Roumi Cheese', ingredients: ['جبنة رومي', 'موتزريلا'], tags: cheeseTags, prices: [80, 110, 150], image: '/images/products/roumy-cheese-cheese.jpg' },
          { ar: 'جبنه كيري', en: 'Extra Cheese', ingredients: ['جبنة كيري', 'موتزريلا'], tags: cheeseTags, prices: [100, 130, 160], image: '/images/products/kiri-cheese-cheese.jpg' },
        ],
      },
      {
        ar: 'الأسماك',
        en: 'Seafood',
        items: [
          { ar: 'تونه', en: 'Tuna', ingredients: ['تونة', 'بصل', 'زيتون', 'جبن'], tags: fishTags, prices: [80, 110, 160] },
          { ar: 'جمبري', en: 'Shrimp', ingredients: ['جمبري', 'جبن', 'صوص'], tags: fishTags, prices: [100, 130, 160] },
          { ar: 'سي فود', en: 'Seafood', ingredients: ['جمبري', 'كاليماري', 'جبن', 'صوص'], tags: fishTags, prices: [110, 140, 180], image: '/images/products/sea-food-seafood.jpg' },
        ],
      },
      {
        ar: 'المكسات',
        en: 'Mix',
        items: [
          { ar: 'مكس لحوم', en: 'Meat Mix', ingredients: ['سجق', 'بسطرمة', 'لحمه'], tags: meatTags, prices: [105, 130, 160] },
          { ar: 'مكس فراخ', en: 'Chicken Mix', ingredients: ['فراخ', 'بانيه', 'استربس'], tags: chickenTags, prices: [105, 130, 160] },
          { ar: 'مكس جبن', en: 'Cheese Mix', ingredients: ['جبنة رومي', 'كيري', 'شيدر', 'موتزريلا'], tags: cheeseTags, prices: [105, 130, 160] },
          { ar: 'مكس حلواني مدخن', en: 'Smoked Sweet Mix', ingredients: ['تركي', 'سلامي', 'سوسيس'], tags: meatTags, prices: [105, 130, 160], image: '/images/products/smoked-helwany-mix-mix.jpg' },
          { ar: 'ثورة عرابي', en: 'Arabi Loura', ingredients: ['لحمة', 'سجق', 'كفتة', 'بسطرمة', 'سلامي'], tags: meatTags, prices: [130, 150, 190], image: '/images/products/thawret-orabi-mix.jpg' },
        ],
      },
    ],
  },
  {
    ar: 'فطائر',
    en: 'Feteer',
    icon: 'cake',
    subs: [
      {
        ar: 'الفراخ',
        en: 'Chicken',
        items: [
          { ar: 'فراخ', en: 'Chicken', ingredients: ['فراخ', 'جبن', 'صوص'], tags: chickenTags, prices: [100, 130, 160] },
          { ar: 'تشيكن رانش', en: 'Ranch Chicken', ingredients: ['فراخ', 'صوص رانش'], tags: chickenTags, prices: [105, 135, 160], image: '/images/products/chicken-ranch-chicken.jpg' },
          { ar: 'تشيكن باربيكيو', en: 'BBQ Chicken', ingredients: ['فراخ', 'صوص باربيكيو'], tags: chickenTags, prices: [105, 135, 160], image: '/images/products/chicken-bbq-chicken.jpg' },
          { ar: 'تركي مدخن', en: 'Smoked Turkey', ingredients: ['تركي مدخن', 'جبن'], tags: chickenTags, prices: [100, 130, 160] },
          { ar: 'كرسبي', en: 'Crispy Chicken', ingredients: ['فراخ كرسبي', 'جبن'], tags: chickenTags, prices: [100, 125, 160] },
          { ar: 'شيش', en: 'Shish Chicken', ingredients: ['شيش طاووق', 'جبن'], tags: chickenTags, prices: [100, 130, 160], image: '/images/products/sheesh-chicken.jpg' },
          { ar: 'فاهيتا', en: 'Fajita Chicken', ingredients: ['فراخ فاهيتا', 'فلفل', 'بصل'], tags: chickenTags, prices: [100, 130, 160], image: '/images/products/fajita-chicken.jpg' },
          { ar: 'استربس', en: 'Strips', ingredients: ['استربس فراخ', 'جبن'], tags: chickenTags, prices: [95, 120, 160] },
        ],
      },
      {
        ar: 'اللحوم',
        en: 'Meat',
        items: [
          { ar: 'سجق اسكندراني', en: 'Alexandrian Sausage', ingredients: ['سجق اسكندراني', 'جبن'], tags: meatTags, prices: [60, 95, 130] },
          { ar: 'سجق بلدي', en: 'Beldi Sausage', ingredients: ['سجق بلدي', 'جبن'], tags: meatTags, prices: [100, 130, 160], image: '/images/products/beef-sausage-meat.jpg' },
          { ar: 'لحمه', en: 'Meat', ingredients: ['لحمة', 'جبن'], tags: meatTags, prices: [85, 110, 150], image: '/images/products/beef-meat.jpg' },
          { ar: 'بسطرمة', en: 'Pastrami', ingredients: ['بسطرمة', 'جبن'], tags: meatTags, prices: [95, 110, 160] },
          { ar: 'سوسيس', en: 'Sausage', ingredients: ['سوسيس', 'جبن'], tags: meatTags, prices: [80, 100, 140] },
          { ar: 'سلامي', en: 'Salami', ingredients: ['سلامي', 'جبن'], tags: meatTags, prices: [100, 130, 160] },
          { ar: 'كفته', en: 'Kofta', ingredients: ['كفتة', 'جبن'], tags: meatTags, prices: [90, 120, 150] },
        ],
      },
      {
        ar: 'الجبن',
        en: 'Cheese',
        items: [
          { ar: 'موتزريلا', en: 'Mozzarella', ingredients: ['موتزريلا'], tags: [...cheeseTags, ...vegTags], prices: [60, 80, 110] },
          { ar: 'جبنه رومي', en: 'Roumi Cheese', ingredients: ['جبنة رومي'], tags: cheeseTags, prices: [80, 110, 150], image: '/images/products/roumy-cheese-cheese.jpg' },
          { ar: 'جبنه كيري', en: 'Extra Cheese', ingredients: ['جبنة كيري'], tags: cheeseTags, prices: [100, 130, 160], image: '/images/products/kiri-cheese-cheese.jpg' },
        ],
      },
      {
        ar: 'الأسماك',
        en: 'Seafood',
        items: [
          { ar: 'تونه', en: 'Tuna', ingredients: ['تونة', 'بصل', 'زيتون'], tags: fishTags, prices: [80, 110, 160] },
          { ar: 'جمبري', en: 'Shrimp', ingredients: ['جمبري'], tags: fishTags, prices: [100, 130, 160] },
          { ar: 'سي فود', en: 'Seafood', ingredients: ['جمبري', 'كاليماري'], tags: fishTags, prices: [110, 140, 180], image: '/images/products/sea-food-seafood.jpg' },
        ],
      },
      {
        ar: 'المكسات',
        en: 'Mix',
        items: [
          { ar: 'مكس لحوم', en: 'Meat Mix', ingredients: ['سجق', 'بسطرمة', 'لحمه'], tags: meatTags, prices: [105, 130, 160] },
          { ar: 'مكس فراخ', en: 'Chicken Mix', ingredients: ['فراخ', 'بانيه', 'استربس'], tags: chickenTags, prices: [105, 130, 160] },
          { ar: 'مكس جبن', en: 'Cheese Mix', ingredients: ['جبنة رومي', 'كيري', 'شيدر', 'موتزريلا'], tags: cheeseTags, prices: [105, 130, 160] },
          { ar: 'مكس حلواني مدخن', en: 'Smoked Sweet Mix', ingredients: ['تركي', 'سلامي', 'سوسيس'], tags: meatTags, prices: [105, 130, 160], image: '/images/products/smoked-helwany-mix-mix.jpg' },
          { ar: 'ثورة عرابي', en: 'Arabi Loura', ingredients: ['لحمة', 'سجق', 'كفتة', 'بسطرمة', 'سلامي'], tags: meatTags, prices: [130, 150, 190], image: '/images/products/thawret-orabi-mix.jpg' },
        ],
      },
    ],
  },
  {
    ar: 'صاروخ رول',
    en: 'Rocket Roll',
    icon: 'sandwich',
    subs: [
      {
        ar: 'صاروخ رول',
        en: 'Rocket Roll',
        items: [
          { ar: 'سجق بلدي', en: 'Beldi Sausage', ingredients: ['سجق بلدي', 'جبن'], tags: meatTags, prices: [70, null, null], image: '/images/products/beef-sausage-rocket-roll.jpg' },
          { ar: 'سجق كيري', en: 'Large Sausage', ingredients: ['سجق', 'جبنة كيري'], tags: meatTags, prices: [65, null, null], image: '/images/products/sausage-kiri-rocket-roll.jpg' },
          { ar: 'سجق', en: 'Extra Large Sausage', ingredients: ['سجق', 'جبن'], tags: meatTags, prices: [50, null, null], image: '/images/products/sausage-rocket-roll.jpg' },
          { ar: 'لحمه', en: 'Meat', ingredients: ['لحمة', 'جبن'], tags: meatTags, prices: [70, null, null], image: '/images/products/beef-rocket-roll.jpg' },
          { ar: 'تونة', en: 'Tuna', ingredients: ['تونة', 'بصل', 'زيتون'], tags: fishTags, prices: [60, null, null] },
          { ar: 'ميكس جبن', en: 'Cheese Mix', ingredients: ['جبنة رومي', 'كيري', 'موتزريلا'], tags: cheeseTags, prices: [60, null, null] },
          { ar: 'ميكس لحوم', en: 'Meat Mix', ingredients: ['سجق', 'بسطرمة', 'لحمه'], tags: meatTags, prices: [70, null, null] },
          { ar: 'ميكس فراخ', en: 'Chicken Mix', ingredients: ['فراخ', 'بانيه', 'استربس'], tags: chickenTags, prices: [70, null, null] },
          { ar: 'سوبر سوبريم', en: 'Super Supreme', ingredients: ['سوسيس', 'مشروم', 'سلامي'], tags: meatTags, prices: [55, null, null] },
          { ar: 'عرابي', en: 'Arayes', ingredients: ['لحمة', 'سجق', 'كفتة', 'بسطرمة', 'سلامي'], tags: meatTags, prices: [100, null, null], image: '/images/products/orabi-rocket-roll.jpg' },
        ],
      },
    ],
  },
  {
    ar: 'الفطير الحلو',
    en: 'Sweet Feteer',
    icon: 'candy',
    subs: [
      {
        ar: 'الفطير الحلو',
        en: 'Sweet Feteer',
        items: [
          { ar: 'سكر', en: 'Sugar', ingredients: ['سكر', 'زبد بلدي'], tags: sweetTags, prices: [25, null, 50] },
          { ar: 'بغاشه', en: 'Custard Cream', ingredients: ['بغاشة', 'سكر'], tags: sweetTags, prices: [30, null, 60], image: '/images/products/baghasha-sweet-feteer.jpg' },
          { ar: 'كنافه', en: 'Kunafa', ingredients: ['كنافة', 'سكر'], tags: sweetTags, prices: [50, null, 100] },
          { ar: 'بسبوسه', en: 'Basbousa', ingredients: ['بسبوسة', 'سكر'], tags: sweetTags, prices: [50, null, 100] },
          { ar: 'كاسترد', en: 'Custard', ingredients: ['كاسترد', 'سكر'], tags: sweetTags, prices: [65, null, 130] },
          { ar: 'بسبوسه وكنافه', en: 'Basbousa & Cocoa', ingredients: ['بسبوسة', 'كنافة'], tags: sweetTags, prices: [65, null, 130], image: '/images/products/basbousa-kunafa-sweet-feteer.jpg' },
          { ar: 'مشكل حلو', en: 'Mixed Sweets', ingredients: ['سكر', 'قشطة', 'مكسرات'], tags: sweetTags, prices: [75, null, 150], image: '/images/products/sweet-mix-sweet-feteer.jpg' },
          { ar: 'قشطه وعسل', en: 'Cream & Honey', ingredients: ['قشطة', 'عسل'], tags: sweetTags, prices: [75, null, 150] },
          { ar: 'قشطه ومكسرات', en: 'Cream & Nuts', ingredients: ['قشطة', 'مكسرات'], tags: sweetTags, prices: [60, null, 130] },
          { ar: 'شيكولاته', en: 'Chocolate', ingredients: ['شيكولاتة', 'سكر'], tags: sweetTags, prices: [60, null, 135] },
          { ar: 'شيكولاته مكس', en: 'Chocolate Mix', ingredients: ['شيكولاتة', 'مكسرات'], tags: sweetTags, prices: [70, null, 140] },
          { ar: 'شيكولاته اوريو', en: 'Oreo Chocolate', ingredients: ['شيكولاتة', 'أوريو'], tags: sweetTags, prices: [70, null, 140], image: '/images/products/chocolate-oreo-sweet-feteer.jpg' },
          { ar: 'شيكولاته مكسرات', en: 'Chocolate & Nuts', ingredients: ['شيكولاتة', 'مكسرات'], tags: sweetTags, prices: [70, null, 140], image: '/images/products/chocolate-nuts-sweet-feteer.jpg' },
          { ar: 'شيكولاته وايت', en: 'White Chocolate', ingredients: ['شيكولاتة بيضاء'], tags: sweetTags, prices: [70, null, 140] },
          { ar: 'لوتس', en: 'Lotus', ingredients: ['صوص لوتس', 'بسكويت'], tags: sweetTags, prices: [70, null, 140] },
        ],
      },
    ],
  },
  {
    ar: 'مشلتت',
    en: 'Meshaltet',
    icon: 'layers',
    subs: [
      {
        ar: 'مشلتت',
        en: 'Meshaltet',
        items: [
          { ar: 'مشلتت بالزبده البلدي', en: 'Beldi Butter Meshaltet', ingredients: ['زبدة بلدي'], tags: [...sweetTags, ...cheeseTags], prices: [100, 150, 200], image: '/images/products/meshaltet-butter-meshaltet.jpg' },
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

// Bestsellers (deterministic)
export const bestSellerNames = [
  'فراخ', 'تشيكن رانش', 'تشيكن باربيكيو', 'مارجريتا', 'مكس لحوم',
  'سوبر سوبريم', 'ثورة عرابي', 'شيش', 'بسطرمة', 'سي فود',
];

// Offers flagged with a discount % (deterministic, spread across sections)
export const offerNames = [
  'مارجريتا', 'تشيكن كرانشي', 'سجق كيري', 'كنافه', 'شيكولاته اوريو',
  'لوتس', 'مشلتت بالزبده البلدي', 'استربس', 'مشكل حلو', 'عرابي',
];