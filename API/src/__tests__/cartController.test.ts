import { CartController } from '../presentation/controllers/CartController';
import { ICartService } from '../domain/services/ICartService';
import { Cart, CartItem } from '../domain/entities/Cart';
import { FastifyReply, FastifyRequest } from 'fastify';

describe('CartController', () => {
  let mockCartService: ICartService;
  let cartController: CartController;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockCartService = {
      getCart: jest.fn(),
      addToCart: jest.fn(),
      updateCartItem: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn()
    };

    cartController = new CartController(mockCartService);

    mockReply = {
      send: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis()
    };
  });

  describe('updateCartItem', () => {
    it('should return complete cart data after updating quantity', async () => {
      const mockUpdatedItem: CartItem = {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Test Product',
        productImage: 'test.jpg',
        price: 100,
        quantity: 3,
        totalPrice: 300
      };

      const mockCart: Cart = {
        id: 'default-cart',
        items: [
          mockUpdatedItem,
          {
            id: 'item-2',
            productId: 'product-2',
            productName: 'Another Product',
            productImage: 'another.jpg',
            price: 50,
            quantity: 2,
            totalPrice: 100
          }
        ],
        totalAmount: 400,
        itemCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockCartService.updateCartItem as jest.Mock).mockResolvedValue(mockUpdatedItem);
      (mockCartService.getCart as jest.Mock).mockResolvedValue(mockCart);

      const mockRequest = {
        params: { itemId: 'item-1' },
        body: { quantity: 3 }
      } as FastifyRequest<{ Params: { itemId: string }; Body: { quantity: number } }>;

      await cartController.updateCartItem(mockRequest, mockReply as FastifyReply);

      expect(mockCartService.updateCartItem).toHaveBeenCalledWith('item-1', { quantity: 3 });
      expect(mockCartService.getCart).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockCart.items,
          itemCount: 5,
          totalPrice: 400
        },
        message: 'Cart item updated successfully'
      });
    });

    it('should return 404 when cart item is not found', async () => {
      (mockCartService.updateCartItem as jest.Mock).mockResolvedValue(null);

      const mockRequest = {
        params: { itemId: 'non-existent' },
        body: { quantity: 1 }
      } as FastifyRequest<{ Params: { itemId: string }; Body: { quantity: number } }>;

      await cartController.updateCartItem(mockRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Cart item not found'
      });
      expect(mockCartService.getCart).not.toHaveBeenCalled();
    });

    it('should return 400 on validation error', async () => {
      const error = new Error('Quantity must be greater than 0');
      (mockCartService.updateCartItem as jest.Mock).mockRejectedValue(error);

      const mockRequest = {
        params: { itemId: 'item-1' },
        body: { quantity: 0 }
      } as FastifyRequest<{ Params: { itemId: string }; Body: { quantity: number } }>;

      await cartController.updateCartItem(mockRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Quantity must be greater than 0'
      });
    });

    it('should include accurate itemCount in response', async () => {
      const mockUpdatedItem: CartItem = {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Test Product',
        productImage: 'test.jpg',
        price: 100,
        quantity: 5,
        totalPrice: 500
      };

      const mockCart: Cart = {
        id: 'default-cart',
        items: [mockUpdatedItem],
        totalAmount: 500,
        itemCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockCartService.updateCartItem as jest.Mock).mockResolvedValue(mockUpdatedItem);
      (mockCartService.getCart as jest.Mock).mockResolvedValue(mockCart);

      const mockRequest = {
        params: { itemId: 'item-1' },
        body: { quantity: 5 }
      } as FastifyRequest<{ Params: { itemId: string }; Body: { quantity: number } }>;

      await cartController.updateCartItem(mockRequest, mockReply as FastifyReply);

      const sendCall = (mockReply.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.data.itemCount).toBe(5);
      expect(sendCall.data.items).toHaveLength(1);
      expect(sendCall.data.totalPrice).toBe(500);
    });
  });

  describe('addToCart', () => {
    it('should return complete cart data after adding item', async () => {
      const mockAddedItem: CartItem = {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Test Product',
        productImage: 'test.jpg',
        price: 100,
        quantity: 2,
        totalPrice: 200
      };

      const mockCart: Cart = {
        id: 'default-cart',
        items: [mockAddedItem],
        totalAmount: 200,
        itemCount: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockCartService.addToCart as jest.Mock).mockResolvedValue(mockAddedItem);
      (mockCartService.getCart as jest.Mock).mockResolvedValue(mockCart);

      const mockRequest = {
        body: { productId: 'product-1', quantity: 2 }
      } as FastifyRequest<{ Body: { productId: string; quantity: number } }>;

      await cartController.addToCart(mockRequest, mockReply as FastifyReply);

      expect(mockCartService.addToCart).toHaveBeenCalledWith({ productId: 'product-1', quantity: 2 });
      expect(mockCartService.getCart).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockCart.items,
          itemCount: 2,
          totalPrice: 200
        },
        message: 'Item added to cart successfully'
      });
    });

    it('should return 400 on validation error', async () => {
      const error = new Error('Product not found');
      (mockCartService.addToCart as jest.Mock).mockRejectedValue(error);

      const mockRequest = {
        body: { productId: 'invalid-product', quantity: 1 }
      } as FastifyRequest<{ Body: { productId: string; quantity: number } }>;

      await cartController.addToCart(mockRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    it('should include accurate itemCount in response', async () => {
      const mockAddedItem: CartItem = {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Test Product',
        productImage: 'test.jpg',
        price: 100,
        quantity: 3,
        totalPrice: 300
      };

      const mockCart: Cart = {
        id: 'default-cart',
        items: [
          mockAddedItem,
          {
            id: 'item-2',
            productId: 'product-2',
            productName: 'Another Product',
            productImage: 'another.jpg',
            price: 50,
            quantity: 2,
            totalPrice: 100
          }
        ],
        totalAmount: 400,
        itemCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockCartService.addToCart as jest.Mock).mockResolvedValue(mockAddedItem);
      (mockCartService.getCart as jest.Mock).mockResolvedValue(mockCart);

      const mockRequest = {
        body: { productId: 'product-1', quantity: 3 }
      } as FastifyRequest<{ Body: { productId: string; quantity: number } }>;

      await cartController.addToCart(mockRequest, mockReply as FastifyReply);

      const sendCall = (mockReply.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.data.itemCount).toBe(5);
      expect(sendCall.data.items).toHaveLength(2);
      expect(sendCall.data.totalPrice).toBe(400);
    });
  });
});
