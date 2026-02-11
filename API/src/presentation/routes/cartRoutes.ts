import { CartController } from '../controllers/CartController';
import { ICartService } from '../../domain/services/ICartService';
import { FastifyInstance } from 'fastify';
import { addToCartBodySchema, cartItemIdParamsSchema, updateCartItemBodySchema } from '../schemas/cartSchemas';

export function registerCartRoutes(app: FastifyInstance, cartService: ICartService): void {
  const cartController = new CartController(cartService);

  // GET /api/cart - Get cart
  app.get(
    '/',
    {
      schema: {
        tags: ['cart']
      }
    },
    (req, reply) => cartController.getCart(req as any, reply)
  );

  // POST /api/cart - Add item to cart
  app.post(
    '/',
    {
      schema: {
        tags: ['cart'],
        body: addToCartBodySchema
      }
    },
    (req, reply) => cartController.addToCart(req as any, reply)
  );

  // PUT /api/cart/:itemId - Update cart item
  app.put(
    '/:itemId',
    {
      schema: {
        tags: ['cart'],
        params: cartItemIdParamsSchema,
        body: updateCartItemBodySchema
      }
    },
    (req, reply) => cartController.updateCartItem(req as any, reply)
  );

  // DELETE /api/cart/:itemId - Remove item from cart
  app.delete(
    '/:itemId',
    {
      schema: {
        tags: ['cart'],
        params: cartItemIdParamsSchema
      }
    },
    (req, reply) => cartController.removeFromCart(req as any, reply)
  );

  // DELETE /api/cart - Clear cart
  app.delete(
    '/',
    {
      schema: {
        tags: ['cart']
      }
    },
    (req, reply) => cartController.clearCart(req as any, reply)
  );
}
