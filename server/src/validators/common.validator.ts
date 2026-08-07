import { check } from 'express-validator';

export const productCreateRules = [
  check('name').trim().notEmpty().withMessage('Product name (Arabic) is required').isLength({ max: 120 }),
  check('category').notEmpty().withMessage('Category is required'),
  check('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
];

export const reviewRules = [
  check('product').notEmpty().withMessage('Product is required'),
  check('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  check('comment').optional().trim().isLength({ max: 600 }),
];

export const contactRules = [
  check('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  check('phone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 20 }),
  check('email').optional().isEmail().withMessage('Valid email is required'),
  check('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
];

export const newsletterRules = [
  check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const orderRules = [
  check('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  check('phone').trim().notEmpty().withMessage('Phone is required'),
  check('address').isObject().withMessage('Delivery address is required'),
];

export const postRules = [
  check('title').optional().trim().isLength({ max: 200 }),
  check('titleEn').optional().trim().isLength({ max: 200 }),
  check('excerpt').optional().trim().isLength({ max: 400 }),
  check('excerptEn').optional().trim().isLength({ max: 400 }),
  check('content').optional().trim().isLength({ max: 50000 }),
  check('contentEn').optional().trim().isLength({ max: 50000 }),
  check('slug').optional().trim().isLength({ max: 200 }),
  check('image').optional().trim().isLength({ max: 500 }),
  check('tags').optional().isArray().withMessage('Tags must be an array'),
  check('tags.*').optional().isString().isLength({ max: 50 }),
  check('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
  check('publishedAt').optional().isISO8601().withMessage('publishedAt must be a valid date'),
];

export const postCreateRules = [
  check('title').trim().notEmpty().withMessage('Post title is required').isLength({ max: 200 }),
  ...postRules,
];