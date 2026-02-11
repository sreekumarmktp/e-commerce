import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { fetchCart, Cart } from '../store/slices/cartSlice';
import { api } from '../services/api';
import type { AppDispatch } from '../store/store';

// Mock the api module
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Helper type for test store
type TestStore = ReturnType<typeof configureStore<{ cart: ReturnType<typeof cartReducer> }>>;

describe('cartSlice - fetchCart state updates', () => {
  let store: TestStore;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cart: cartReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('fetchCart updates all cart state fields', () => {
    it('should update items, itemCount, and totalAmount from server response', async () => {
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
            quantity: 1,
            totalPrice: 8000,
          },
        ],
        totalAmount: 18000,
        itemCount: 3,
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
      const state = store.getState().cart;
      expect(state.cart).toEqual(mockCart);
      expect(state.cart?.items).toHaveLength(2);
      expect(state.cart?.itemCount).toBe(3);
      expect(state.cart?.totalAmount).toBe(18000);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should update itemCount to 0 when cart is empty', async () => {
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
      const state = store.getState().cart;
      expect(state.cart?.items).toHaveLength(0);
      expect(state.cart?.itemCount).toBe(0);
      expect(state.cart?.totalAmount).toBe(0);
    });

    it('should update itemCount correctly with single item', async () => {
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
            quantity: 5,
            totalPrice: 25000,
          },
        ],
        totalAmount: 25000,
        itemCount: 5,
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
      const state = store.getState().cart;
      expect(state.cart?.items).toHaveLength(1);
      expect(state.cart?.itemCount).toBe(5);
      expect(state.cart?.totalAmount).toBe(25000);
    });

    it('should update itemCount correctly with multiple items of varying quantities', async () => {
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
            quantity: 3,
            totalPrice: 15000,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            productName: 'Designer Lehenga',
            productImage: '/images/lehenga1.jpg',
            price: 8000,
            quantity: 1,
            totalPrice: 8000,
          },
          {
            id: 'item-3',
            productId: 'prod-3',
            productName: 'Kurta Set',
            productImage: '/images/kurta1.jpg',
            price: 2000,
            quantity: 7,
            totalPrice: 14000,
          },
        ],
        totalAmount: 37000,
        itemCount: 11, // 3 + 1 + 7
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
      const state = store.getState().cart;
      expect(state.cart?.items).toHaveLength(3);
      expect(state.cart?.itemCount).toBe(11);
      expect(state.cart?.totalAmount).toBe(37000);
    });

    it('should set loading to true during fetch and false after completion', async () => {
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

      // Act & Assert - check loading state
      const promise = (store.dispatch as AppDispatch)(fetchCart());
      expect(store.getState().cart.loading).toBe(true);

      await promise;
      expect(store.getState().cart.loading).toBe(false);
    });

    it('should handle fetch errors without corrupting state', async () => {
      // Arrange
      const initialState = store.getState().cart;
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      // Act
      await (store.dispatch as AppDispatch)(fetchCart());

      // Assert
      const state = store.getState().cart;
      expect(state.cart).toBe(initialState.cart); // State unchanged
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('should clear previous error on successful fetch', async () => {
      // Arrange - first create an error state
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));
      await (store.dispatch as AppDispatch)(fetchCart());
      expect(store.getState().cart.error).toBe('Network error');

      // Now succeed
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
      const state = store.getState().cart;
      expect(state.error).toBeNull();
      expect(state.cart).toEqual(mockCart);
    });
  });
});

