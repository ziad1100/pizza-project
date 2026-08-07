import { check } from 'express-validator';

export const registerRules = [
  check('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 80 }),
  check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  check('phone').optional().trim().isLength({ max: 20 }),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain letters')
    .matches(/[0-9]/)
    .withMessage('Password must contain numbers'),
  check('role')
    .optional()
    .isIn(['admin', 'customer'])
    .withMessage('Invalid role'),
  check('adminCode')
    .if(check('role').equals('admin'))
    .notEmpty()
    .withMessage('Admin access code is required'),
];

export const loginRules = [
  check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  check('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordRules = [
  check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const resetPasswordRules = [
  check('token').notEmpty().withMessage('Token is required'),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[0-9]/)
    .withMessage('Password must contain numbers'),
];

export const changePasswordRules = [
  check('currentPassword').notEmpty().withMessage('Current password is required'),
  check('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];
