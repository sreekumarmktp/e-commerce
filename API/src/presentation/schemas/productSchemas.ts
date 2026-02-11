import { z } from 'zod';

export const productIdParamsSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 }
  },
  required: ['id']
} as const;

export const categoryParamsSchema = {
  type: 'object',
  properties: {
    category: { type: 'string', minLength: 1 }
  },
  required: ['category']
} as const;

export const createProductBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    price: { type: 'number', exclusiveMinimum: 0 },
    image: { type: 'string' },
    category: { type: 'string' },
    stock: { type: 'number', minimum: 0 }
  },
  required: ['name', 'price', 'image', 'category', 'stock'],
  additionalProperties: false
} as const;

export const updateProductBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    price: { type: 'number', exclusiveMinimum: 0 },
    image: { type: 'string' },
    category: { type: 'string' },
    stock: { type: 'number', minimum: 0 }
  },
  additionalProperties: false
} as const;

// Zod schemas for variant management
export const ToggleVariantsSchema = z.object({
  sizesEnabled: z.boolean().optional(),
  colorsEnabled: z.boolean().optional()
}).refine(
  data => data.sizesEnabled !== undefined || data.colorsEnabled !== undefined,
  { message: 'At least one variant setting must be provided' }
);

export const AddVariantValueSchema = z.object({
  size: z.string().min(1).max(20).optional(),
  color: z.string().min(1).max(30).optional()
}).refine(
  data => data.size !== undefined || data.color !== undefined,
  { message: 'Either size or color must be provided' }
);

export type ToggleVariantsRequest = z.infer<typeof ToggleVariantsSchema>;
export type AddVariantValueRequest = z.infer<typeof AddVariantValueSchema>;

