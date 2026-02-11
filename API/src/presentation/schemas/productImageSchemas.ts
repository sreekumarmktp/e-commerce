import { z } from 'zod';

/**
 * Schema for reordering images
 * Validates that imageOrders is an array of objects with imageId and newOrder
 */
export const reorderImagesBodySchema = z.object({
  imageOrders: z
    .array(
      z.object({
        imageId: z.string().uuid('Invalid image ID format'),
        newOrder: z
          .number()
          .int('Display order must be an integer')
          .min(0, 'Display order must be non-negative'),
      })
    )
    .min(1, 'At least one image order must be provided'),
});

/**
 * Schema for setting primary image
 * Validates that imageId is a valid UUID
 */
export const setPrimaryImageBodySchema = z.object({
  imageId: z.string().uuid('Invalid image ID format'),
});

/**
 * Schema for product ID parameter
 */
export const productIdParamSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
});

/**
 * Schema for image ID parameter
 */
export const imageIdParamSchema = z.object({
  imageId: z.string().uuid('Invalid image ID format'),
});

/**
 * Schema for product ID and image ID parameters
 */
export const productAndImageIdParamsSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  imageId: z.string().uuid('Invalid image ID format'),
});

/**
 * Type exports for use in route handlers
 */
export type ReorderImagesBody = z.infer<typeof reorderImagesBodySchema>;
export type SetPrimaryImageBody = z.infer<typeof setPrimaryImageBodySchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type ImageIdParam = z.infer<typeof imageIdParamSchema>;
export type ProductAndImageIdParams = z.infer<
  typeof productAndImageIdParamsSchema
>;
