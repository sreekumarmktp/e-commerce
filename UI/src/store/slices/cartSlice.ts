import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '../../types/api';
import { api } from '../../services/api';

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
  createdAt: string;
  updatedAt: string;
}

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Cart>>('/cart');
      if (!response.data.success) throw new Error(response.data.error);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch cart');
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { cart: CartState };
      // Prevent duplicate requests when already loading
      return !state.cart.loading;
    },
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }: { productId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<{ items: CartItem[]; itemCount: number; totalPrice: number }>>('/cart', { productId, quantity });
      if (!response.data.success) throw new Error(response.data.error);
      
      // Backend now returns complete cart data, no need for separate fetch
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to add item to cart');
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { cart: CartState };
      // Prevent duplicate requests when already loading
      return !state.cart.loading;
    },
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<{ items: CartItem[]; itemCount: number; totalPrice: number }>>(`/cart/${itemId}`, { quantity });
      if (!response.data.success) throw new Error(response.data.error);
      
      // Backend now returns complete cart data, no need for separate fetch
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update cart item');
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { cart: CartState };
      // Prevent duplicate requests when already loading
      return !state.cart.loading;
    },
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const response = await api.delete<ApiResponse<unknown>>(`/cart/${itemId}`);
      if (!response.data.success) throw new Error(response.data.error);
      return itemId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to remove item from cart');
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { cart: CartState };
      // Prevent duplicate requests when already loading
      return !state.cart.loading;
    },
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete<ApiResponse<unknown>>('/cart');
      if (!response.data.success) throw new Error(response.data.error);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to clear cart');
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { cart: CartState };
      // Prevent duplicate requests when already loading
      return !state.cart.loading;
    },
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action: PayloadAction<Cart>) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch cart';
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action: PayloadAction<{ items: CartItem[]; itemCount: number; totalPrice: number }>) => {
        state.loading = false;
        if (state.cart) {
          state.cart.items = action.payload.items;
          state.cart.itemCount = action.payload.itemCount;
          state.cart.totalAmount = action.payload.totalPrice;
        } else {
          // Initialize cart if it doesn't exist
          state.cart = {
            id: 'default-cart',
            items: action.payload.items,
            itemCount: action.payload.itemCount,
            totalAmount: action.payload.totalPrice,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to add item to cart';
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action: PayloadAction<{ items: CartItem[]; itemCount: number; totalPrice: number }>) => {
        state.loading = false;
        if (state.cart) {
          state.cart.items = action.payload.items;
          state.cart.itemCount = action.payload.itemCount;
          state.cart.totalAmount = action.payload.totalPrice;
        } else {
          // Initialize cart if it doesn't exist
          state.cart = {
            id: 'default-cart',
            items: action.payload.items,
            itemCount: action.payload.itemCount,
            totalAmount: action.payload.totalPrice,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to update cart item';
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        if (state.cart) {
          state.cart.items = state.cart.items.filter(item => item.id !== action.payload);
          // Update cart totals
          state.cart.totalAmount = state.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
          state.cart.itemCount = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to remove item from cart';
      })
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        if (state.cart) {
          state.cart.items = [];
          state.cart.totalAmount = 0;
          state.cart.itemCount = 0;
        }
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to clear cart';
      });
  },
});

export const { clearError } = cartSlice.actions;
export default cartSlice.reducer;
