import { ICartService } from '../../domain/services/ICartService';
import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '../../domain/entities/Cart';
import { ValidationError } from '../../domain/errors/ValidationError';

export class CartService implements ICartService {
  constructor(private cartRepository: ICartRepository) {}

  async getCart(): Promise<Cart> {
    return this.cartRepository.getCart();
  }

  async addToCart(request: AddToCartRequest): Promise<CartItem> {
    if (!request.productId) {
      throw new ValidationError('Product ID is required');
    }
    if (!request.quantity || request.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }
    return this.cartRepository.addToCart(request);
  }

  async updateCartItem(itemId: string, request: UpdateCartItemRequest): Promise<CartItem | null> {
    if (!itemId) {
      throw new ValidationError('Cart item ID is required');
    }
    if (!request.quantity || request.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }
    return this.cartRepository.updateCartItem(itemId, request);
  }

  async removeFromCart(itemId: string): Promise<boolean> {
    if (!itemId) {
      throw new ValidationError('Cart item ID is required');
    }
    return this.cartRepository.removeFromCart(itemId);
  }

  async clearCart(): Promise<boolean> {
    return this.cartRepository.clearCart();
  }
}
