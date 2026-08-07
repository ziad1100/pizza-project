import { z } from 'zod';
import { objectId } from './common';

export const reviewCreateSchema = z.object({
  product: objectId('Product is required'),
  rating: z.coerce.number().int('Rating must be a whole number').min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  comment: z.string().trim().max(600).optional(),
});

export const reviewModerateSchema = z.object({
  isApproved: z.boolean(),
});