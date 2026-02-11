export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
