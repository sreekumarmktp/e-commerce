import { ProductController } from '../controllers/ProductController';
import { IProductService } from '../../domain/services/IProductService';
import { FastifyInstance } from 'fastify';
import { PaginationQuery, Paginated } from '../types/Pagination';
import { Product } from '../../domain/entities/Product';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import {
  categoryParamsSchema,
  createProductBodySchema,
  productIdParamsSchema,
  updateProductBodySchema
} from '../schemas/productSchemas';

export function registerProductRoutes(app: FastifyInstance, productService: IProductService): void {
  const productController = new ProductController(productService);

  // GET /api/products - Get all products
  app.get(
    '/',
    {
      schema: {
        tags: ['products'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1 },
            pageSize: { type: 'number', minimum: 1, maximum: 200 }
          },
          additionalProperties: false
        }
      }
    },
    async (req, reply) => {
      const query = (req.query ?? {}) as PaginationQuery;
      const page = query.page;
      const pageSize = query.pageSize;

      // Backwards compatible: if no pagination params, return the same array response as before
      if (!page || !pageSize) {
        return productController.getAllProducts(req, reply);
      }

      const all = await productService.getAllProducts();
      const totalItems = all.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const start = (safePage - 1) * pageSize;
      const items = all.slice(start, start + pageSize);

      const data: Paginated<Product> = {
        items,
        page: safePage,
        pageSize,
        totalItems,
        totalPages
      };

      reply.send({ success: true, data, message: 'Products retrieved successfully' });
    }
  );

  // GET /api/products/:id - Get product by ID
  app.get(
    '/:id',
    {
      schema: {
        tags: ['products'],
        params: productIdParamsSchema
      }
    },
    (req, reply) => productController.getProductById(req as any, reply)
  );

  // GET /api/products/category/:category - Get products by category
  app.get(
    '/category/:category',
    {
      schema: {
        tags: ['products'],
        params: categoryParamsSchema
      }
    },
    (req, reply) => productController.getProductsByCategory(req as any, reply)
  );

  // POST /api/products - Create new product
  app.post(
    '/',
    {
      schema: {
        tags: ['products'],
        body: createProductBodySchema
      },
      preHandler: [authenticate, authorizeAdmin]
    },
    (req, reply) => productController.createProduct(req as any, reply)
  );

  // PUT /api/products/:id - Update product
  app.put(
    '/:id',
    {
      schema: {
        tags: ['products'],
        params: productIdParamsSchema,
        body: updateProductBodySchema
      },
      preHandler: [authenticate, authorizeAdmin]
    },
    (req, reply) => productController.updateProduct(req as any, reply)
  );

  // DELETE /api/products/:id - Delete product
  app.delete(
    '/:id',
    {
      schema: {
        tags: ['products'],
        params: productIdParamsSchema
      },
      preHandler: [authenticate, authorizeAdmin]
    },
    (req, reply) => productController.deleteProduct(req as any, reply)
  );

  // PATCH /api/products/:id/variants - Toggle variant settings
  app.patch(
    '/:id/variants',
    {
      schema: {
        tags: ['products'],
        params: productIdParamsSchema
      },
      preHandler: [authenticate, authorizeAdmin]
    },
    (req, reply) => productController.toggleVariants(req as any, reply)
  );

  // POST /api/products/:id/sizes - Add size to product
  app.post(
    '/:id/sizes',
    {
      schema: {
        tags: ['products'],
        params: productIdParamsSchema
      },
      preHandler: [authenticate, authorizeAdmin]
    },
    (req, reply) => productController.addSize(req as any, reply)
  );

  // DELETE /api/products/:id/sizes/:size - Remove size from product
  app.delete(
    '/:id/sizes/:size',
    {
      schema: {
        tags: ['products'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', minLength: 1 },
            size: { type: 'string', minLength: 1 }
          },
          required: ['id', 'size']
        }
      },
      preHandler: [authenticate, authorizeAdmin]
    },
    (req, reply) => productController.removeSize(req as any, reply)
  );

  // POST /api/products/:id/colors - Add color to product
  app.post(
    '/:id/colors',
    {
      schema: {
        tags: ['products'],
        params: productIdParamsSchema
      },
      preHandler: [authenticate, authorizeAdmin]
    },
    (req, reply) => productController.addColor(req as any, reply)
  );

  // DELETE /api/products/:id/colors/:color - Remove color from product
  app.delete(
    '/:id/colors/:color',
    {
      schema: {
        tags: ['products'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', minLength: 1 },
            color: { type: 'string', minLength: 1 }
          },
          required: ['id', 'color']
        }
      },
      preHandler: [authenticate, authorizeAdmin]
    },
    (req, reply) => productController.removeColor(req as any, reply)
  );
}
