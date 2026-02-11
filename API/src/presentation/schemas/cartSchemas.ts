export const cartItemIdParamsSchema = {
  type: 'object',
  properties: {
    itemId: { type: 'string', minLength: 1 }
  },
  required: ['itemId']
} as const;

export const addToCartBodySchema = {
  type: 'object',
  properties: {
    productId: { type: 'string', minLength: 1 },
    quantity: { type: 'number', minimum: 1 }
  },
  required: ['productId', 'quantity'],
  additionalProperties: false
} as const;

export const updateCartItemBodySchema = {
  type: 'object',
  properties: {
    quantity: { type: 'number', minimum: 1 }
  },
  required: ['quantity'],
  additionalProperties: false
} as const;

