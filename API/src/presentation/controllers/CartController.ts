import { FastifyReply, FastifyRequest } from 'fastify';
import { ICartService } from '../../domain/services/ICartService';
import { AddToCartRequest, UpdateCartItemRequest } from '../../domain/entities/Cart';

export class CartController {
  constructor(private cartService: ICartService) {}

  async getCart(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const cart = await this.cartService.getCart();
      reply.send({
        success: true,
        data: cart,
        message: 'Cart retrieved successfully'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async addToCart(
    req: FastifyRequest<{ Body: AddToCartRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const cartData: AddToCartRequest = req.body as AddToCartRequest;
      const cartItem = await this.cartService.addToCart(cartData);
      
      // Fetch complete cart data after adding item
      const cart = await this.cartService.getCart();
      
      reply.code(201).send({
        success: true,
        data: {
          items: cart.items,
          itemCount: cart.itemCount,
          totalPrice: cart.totalAmount
        },
        message: 'Item added to cart successfully'
      });
    } catch (error) {
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid cart data'
      });
    }
  }

  async updateCartItem(
    req: FastifyRequest<{ Params: { itemId: string }; Body: UpdateCartItemRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { itemId } = req.params as { itemId: string };
      const cartData: UpdateCartItemRequest = req.body as UpdateCartItemRequest;
      const cartItem = await this.cartService.updateCartItem(itemId, cartData);
      
      if (!cartItem) {
        reply.code(404).send({
          success: false,
          error: 'Cart item not found'
        });
        return;
      }

      // Fetch complete cart data after updating quantity
      const cart = await this.cartService.getCart();

      reply.send({
        success: true,
        data: {
          items: cart.items,
          itemCount: cart.itemCount,
          totalPrice: cart.totalAmount
        },
        message: 'Cart item updated successfully'
      });
    } catch (error) {
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid cart data'
      });
    }
  }

  async removeFromCart(
    req: FastifyRequest<{ Params: { itemId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { itemId } = req.params as { itemId: string };
      const removed = await this.cartService.removeFromCart(itemId);
      
      if (!removed) {
        reply.code(404).send({
          success: false,
          error: 'Cart item not found'
        });
        return;
      }

      reply.send({
        success: true,
        message: 'Item removed from cart successfully'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async clearCart(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      await this.cartService.clearCart();
      reply.send({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}
