import { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '../entities/Cart';

export interface ICartService {
  getCart(): Promise<Cart>;
  addToCart(request: AddToCartRequest): Promise<CartItem>;
  updateCartItem(itemId: string, request: UpdateCartItemRequest): Promise<CartItem | null>;
  removeFromCart(itemId: string): Promise<boolean>;
  clearCart(): Promise<boolean>;
}
