export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const RESOURCES = [
  'products',
  'categories',
  'orders',
  'users',
  'branches',
  'offers',
  'banners',
  'coupons',
  'reviews',
  'contacts',
  'newsletter',
  'notifications',
  'settings',
  'analytics',
  'activity',
  'posts',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ['create', 'read', 'update', 'delete', 'hide'] as const;
export type Action = (typeof ACTIONS)[number];

export const PERMISSION_PRESETS: Record<
  Role,
  Record<Resource, Action[]>
> = {
  admin: Object.fromEntries(RESOURCES.map((r) => [r, [...ACTIONS]])) as never,
  manager: Object.fromEntries(
    RESOURCES.map((r) => [
      r,
      r === 'settings' || r === 'activity' ? ['read'] : ['create', 'read', 'update', 'hide', 'delete'],
    ]),
  ) as never,
  employee: {
    products: ['read', 'update'],
    categories: ['read'],
    orders: ['read', 'update', 'create'],
    reviews: ['read', 'create', 'update'],
    contacts: ['read', 'update'],
    newsletter: ['read'],
    notifications: ['read'],
    ...Object.fromEntries(
      RESOURCES.filter((r) => !['products', 'categories', 'orders', 'reviews', 'contacts', 'newsletter', 'notifications'].includes(r)).map((r) => [r, ['read']]),
    ),
  } as never,
  customer: {
    orders: ['create', 'read', 'update'],
    reviews: ['create', 'read', 'update', 'delete'],
    notifications: ['read'],
    ...Object.fromEntries(RESOURCES.map((r) => [r, []])),
  } as never,
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  ON_DELIVERY: 'on_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.ON_DELIVERY,
  ORDER_STATUS.COMPLETED,
];

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  VODAFONE_CASH: 'vodafone_cash',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const COUPON_TYPES = {
  PERCENT: 'percent',
  FIXED: 'fixed',
} as const;

export const OFFER_TYPES = {
  PERCENT: 'percent',
  FIXED: 'fixed',
} as const;

export const DEFAULT_SETTINGS = {
  restaurantName: { ar: 'مطعم عرابي', en: 'ORABI Restaurant' },
  logo: '',
  tagline: { ar: 'برجر، ساندويتشات وفراخ مقرمشة بمكونات طازجة يومياً', en: 'Burgers, sandwiches & crispy chicken made fresh daily' },
  themeColors: { primary: '#E31E24', accent: '#F6B100', background: '#0D0D0D' },
  workingHours: { ar: 'يومياً من 10 صباحاً حتى 3 صباحاً', en: 'Daily 10AM - 3AM' },
  phone: '01070003535',
  whatsapp: '01070003535',
  facebook: 'ORABI - مطعم عرابي',
  instagram: '@orabirestaurant',
  tiktok: '',
  googleMaps: '',
  deliveryFee: 25,
  minimumOrder: 100,
};
