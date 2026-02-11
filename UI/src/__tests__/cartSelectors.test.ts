import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { fetchCart, Cart } from '../store/slices/cartSlice';
import {
  selectCart,
  selectCartItemCount,
  selectCartLoading,
  selectCartError,
} from '../store/selectors/cartSelectors';
import { api } from '../services/api';
import type { AppDispatch } from '../store/store';

// Mock the api module
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Helper type for test store
type TestStore = ReturnType<typeof configureStore<{ cart: ReturnType<typeof cartReducer> }>>;

describe('cartSelectors - selectCartItemCount', () => {
  let store: TestStore;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cart: cartReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('selectCartItemCount uses updated state from fetchCart', () => {
    it('should return correct itemCount after fetchCart completes', async () => {
      // Arrange
      const mockCart: Cart = {
        id: 'cart-123',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Silk Saree',
            productImage: '/images/saree1.jpg',
            price: 5000,
            quantity: 2,
            totalPrice: 10000,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            productName: 'Designer Lehenga',
            productImage: '/images/lehenga1.jpg',
            price: 8000,
            quantity: 3,
            totalPrice: 24000,
          },
        ],
        totalAmount: 34000,
        itemCount: 5, // 2 + 3
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedApi.get.mockResolvedValue({
        data: {
          success: true,
          data: mockCart,
        },
      });

      // Act
      await (store.dispatch as AppDispatch)(fetchCart());

      // Assert
      const state = store.getState() as any;
      const itemCount = selectCartItemCount(state);
      expect(itemCount).toBe(5);
    });

    it('should return 0 when cart is empty', async () => {
      // Arrange
      const mockEmptyCart: Cart = {
        id: 'cart-123',
        items: [],
        totalAmount: 0,
        itemCount: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedApi.get.mockResolvedValue({
        data: {
          success: true,
          data: mockEmptyCart,
        },
      });

      // Act
      await (store.dispatch as AppDispatch)(fetchCart());

      // Assert
      const state = store.getState() as any;
      const itemCount = selectCartItemCount(state);
      expect(itemCount).toBe(0);
    });

    it('should return 0 when cart is null', () => {
      // Arrange - initial state has null cart
      const state = store.getState() as any;

      // Act
      const itemCount = selectCartItemCount(state);

      // Assert
      expect(itemCount).toBe(0);
    });

    it('should return updated itemCount after multiple fetches', async () => {
      // Arrange - first fetch
      const mockCart1: Cart = {
        id: 'cart-123',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Silk Saree',
            productImage: '/images/saree1.jpg',
            price: 5000,
            quantity: 2,
            totalPrice: 10000,
          },
        ],
        totalAmount: 10000,
        itemCount: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedApi.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockCart1,
        },
      });

      await (store.dispatch as AppDispatch)(fetchCart());
      expect(selectCartItemCount(store.getState() as any)).toBe(2);

      // Arrange - second fetch with updated cart
      const mockCart2: Cart = {
        id: 'cart-123',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Silk Saree',
            productImage: '/images/saree1.jpg',
            price: 5000,
            quantity: 2,
            totalPrice: 10000,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            productName: 'Designer Lehenga',
            productImage: '/images/lehenga1.jpg',
            price: 8000,
            quantity: 4,
            totalPrice: 32000,
          },
        ],
        totalAmount: 42000,
        itemCount: 6, // 2 + 4
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:01Z',
      };

      mockedApi.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockCart2,
        },
      });

      // Act
      await (store.dispatch as AppDispatch)(fetchCart());

      // Assert
      const itemCount = selectCartItemCount(store.getState() as any);
      expect(itemCount).toBe(6);
    });

    it('should return correct itemCount with large quantities', async () => {
      // Arrange
      const mockCart: Cart = {
        id: 'cart-123',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Silk Saree',
            productImage: '/images/saree1.jpg',
            price: 5000,
            quantity: 50,
            totalPrice: 250000,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            productName: 'Designer Lehenga',
            productImage: '/images/lehenga1.jpg',
            price: 8000,
            quantity: 25,
            totalPrice: 200000,
          },
        ],
        totalAmount: 450000,
        itemCount: 75, // 50 + 25
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedApi.get.mockResolvedValue({
        data: {
          success: true,
          data: mockCart,
        },
      });

      // Act
      await (store.dispatch as AppDispatch)(fetchCart());

      // Assert
      const state = store.getState() as any;
      const itemCount = selectCartItemCount(state);
      expect(itemCount).toBe(75);
    });
  });

  describe('other cart selectors', () => {
    it('selectCart should return the cart object', async () => {
      // Arrange
      const mockCart: Cart = {
        id: 'cart-123',
        items: [],
        totalAmount: 0,
        itemCount: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedApi.get.mockResolvedValue({
        data: {
          success: true,
          data: mockCart,
        },
      });

      // Act
      await (store.dispatch as AppDispatch)(fetchCart());

      // Assert
      const state = store.getState() as any;
      const cart = selectCart(state);
      expect(cart).toEqual(mockCart);
    });

    it('selectCartLoading should return loading state', async () => {
      // Arrange
      const mockCart: Cart = {
        id: 'cart-123',
        items: [],
        totalAmount: 0,
        itemCount: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedApi.get.mockResolvedValue({
        data: {
          success: true,
          data: mockCart,
        },
      });

      // Act & Assert
      const promise = (store.dispatch as AppDispatch)(fetchCart());
      expect(selectCartLoading(store.getState() as any)).toBe(true);

      await promise;
      expect(selectCartLoading(store.getState() as any)).toBe(false);
    });

    it('selectCartError should return error state', async () => {
      // Arrange
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      // Act
      await (store.dispatch as AppDispatch)(fetchCart());

      // Assert
      const state = store.getState() as any;
      const error = selectCartError(state);
      expect(error).toBe('Network error');
    });
  });
});
