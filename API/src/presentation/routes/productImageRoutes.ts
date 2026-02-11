import { FastifyInstance } from 'fastify';
import { ProductImageController } from '../controllers/ProductImageController';
import { IProductImageService } from '../../domain/services/IProductImageService';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import {
  productIdParamSchema,
  productAndImageIdParamsSchema,
  reorderImagesBodySchema,
} from '../schemas/productImageSchemas';

/**
 * Register product image routes
 * All routes require admin authentication
 *
 * Routes:
 * - POST /api/products/:productId/images - Upload images
 * - GET /api/products/:productId/images - Get all images
 * - PATCH /api/products/:productId/images/order - Reorder images
 * - PATCH /api/products/:productId/images/:imageId/primary - Set primary
 * - DELETE /api/products/:productId/images/:imageId - Delete image
 */
export function registerProductImageRoutes(
  app: FastifyInstance,
  productImageService: IProductImageService
): void {
  const controller = new ProductImageController(productImageService);

  /**
   * POST /api/products/:productId/images
   * Upload multiple images for a product
   * Requires: Admin authentication, multipart form data with image files
   * Returns: Array of created ProductImage objects
   */
  app.post(
    '/:productId/images',
    {
      schema: {
        tags: ['product-images'],
        description: 'Upload multiple images for a product',
        params: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
          },
          required: ['productId'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    productId: { type: 'string' },
                    imagePath: { type: 'string' },
                    imageUrl: { type: 'string' },
                    displayOrder: { type: 'number' },
                    isPrimary: { type: 'boolean' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              message: { type: 'string' },
            },
            required: ['success'],
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
            required: ['success', 'error'],
          },
        },
      },
      preHandler: [authenticate, authorizeAdmin],
    },
    (req, reply) => controller.uploadImages(req as any, reply)
  );

  /**
   * GET /api/products/:productId/images
   * Get all images for a product
   * Requires: Admin authentication
   * Returns: Array of ProductImage objects ordered by displayOrder
   */
  app.get(
    '/:productId/images',
    {
      schema: {
        tags: ['product-images'],
        description: 'Get all images for a product',
        params: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
          },
          required: ['productId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    productId: { type: 'string' },
                    imagePath: { type: 'string' },
                    imageUrl: { type: 'string' },
                    displayOrder: { type: 'number' },
                    isPrimary: { type: 'boolean' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              message: { type: 'string' },
            },
            required: ['success'],
          },
        },
      },
      preHandler: [authenticate, authorizeAdmin],
    },
    (req, reply) => controller.getProductImages(req as any, reply)
  );

  /**
   * PATCH /api/products/:productId/images/order
   * Reorder images for a product
   * Requires: Admin authentication
   * Body: { imageOrders: Array<{ imageId: string, newOrder: number }> }
   * Returns: Array of ProductImage objects with updated order
   */
  app.patch(
    '/:productId/images/order',
    {
      schema: {
        tags: ['product-images'],
        description: 'Reorder images for a product',
        params: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
          },
          required: ['productId'],
        },
        body: {
          type: 'object',
          properties: {
            imageOrders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  imageId: { type: 'string' },
                  newOrder: { type: 'number' },
                },
                required: ['imageId', 'newOrder'],
              },
            },
          },
          required: ['imageOrders'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    productId: { type: 'string' },
                    imagePath: { type: 'string' },
                    imageUrl: { type: 'string' },
                    displayOrder: { type: 'number' },
                    isPrimary: { type: 'boolean' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              message: { type: 'string' },
            },
            required: ['success'],
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
            required: ['success', 'error'],
          },
        },
      },
      preHandler: [authenticate, authorizeAdmin],
    },
    (req, reply) => controller.reorderImages(req as any, reply)
  );

  /**
   * PATCH /api/products/:productId/images/:imageId/primary
   * Set an image as the primary image for a product
   * Requires: Admin authentication
   * Returns: Array of ProductImage objects with updated primary status
   */
  app.patch(
    '/:productId/images/:imageId/primary',
    {
      schema: {
        tags: ['product-images'],
        description: 'Set an image as the primary image for a product',
        params: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            imageId: { type: 'string' },
          },
          required: ['productId', 'imageId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    productId: { type: 'string' },
                    imagePath: { type: 'string' },
                    imageUrl: { type: 'string' },
                    displayOrder: { type: 'number' },
                    isPrimary: { type: 'boolean' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              message: { type: 'string' },
            },
            required: ['success'],
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
            required: ['success', 'error'],
          },
        },
      },
      preHandler: [authenticate, authorizeAdmin],
    },
    (req, reply) => controller.setPrimaryImage(req as any, reply)
  );

  /**
   * DELETE /api/products/:productId/images/:imageId
   * Delete an image from a product
   * Requires: Admin authentication
   * Returns: Array of remaining ProductImage objects
   */
  app.delete(
    '/:productId/images/:imageId',
    {
      schema: {
        tags: ['product-images'],
        description: 'Delete an image from a product',
        params: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            imageId: { type: 'string' },
          },
          required: ['productId', 'imageId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    productId: { type: 'string' },
                    imagePath: { type: 'string' },
                    imageUrl: { type: 'string' },
                    displayOrder: { type: 'number' },
                    isPrimary: { type: 'boolean' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              message: { type: 'string' },
            },
            required: ['success'],
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
            required: ['success', 'error'],
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
            required: ['success', 'error'],
          },
        },
      },
      preHandler: [authenticate, authorizeAdmin],
    },
    (req, reply) => controller.deleteImage(req as any, reply)
  );
}
