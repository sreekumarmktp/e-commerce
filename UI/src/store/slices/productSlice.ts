import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '../../types/api';
import { api } from '../../services/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  sizesEnabled: boolean;
  colorsEnabled: boolean;
  category: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  variantLoading: boolean;
  variantError: string | null;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  variantLoading: false,
  variantError: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    const response = await api.get<ApiResponse<Product[]>>('/products');
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string) => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchProductsByCategory',
  async (category: string) => {
    const response = await api.get<ApiResponse<Product[]>>(`/products/category/${category}`);
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<ApiResponse<Product>>('/products', productData);
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async (productData: Partial<Product> & { id: string }) => {
    const { id, ...data } = productData;
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: string) => {
    const response = await api.delete<ApiResponse<unknown>>(`/products/${id}`);
    if (!response.data.success) throw new Error(response.data.error);
    return id;
  }
);

// Variant management thunks
export const toggleProductVariants = createAsyncThunk(
  'products/toggleProductVariants',
  async ({ id, settings }: { id: string; settings: { sizesEnabled?: boolean; colorsEnabled?: boolean } }) => {
    const response = await api.patch<ApiResponse<Product>>(`/products/${id}/variants`, settings);
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const addProductSize = createAsyncThunk(
  'products/addProductSize',
  async ({ id, size }: { id: string; size: string }) => {
    const response = await api.post<ApiResponse<Product>>(`/products/${id}/sizes`, { size });
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const removeProductSize = createAsyncThunk(
  'products/removeProductSize',
  async ({ id, size }: { id: string; size: string }) => {
    const response = await api.delete<ApiResponse<Product>>(`/products/${id}/sizes/${encodeURIComponent(size)}`);
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const addProductColor = createAsyncThunk(
  'products/addProductColor',
  async ({ id, color }: { id: string; color: string }) => {
    const response = await api.post<ApiResponse<Product>>(`/products/${id}/colors`, { color });
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

export const removeProductColor = createAsyncThunk(
  'products/removeProductColor',
  async ({ id, color }: { id: string; color: string }) => {
    const response = await api.delete<ApiResponse<Product>>(`/products/${id}/colors/${encodeURIComponent(color)}`);
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearVariantError: (state) => {
      state.variantError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action: PayloadAction<Product>) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch product';
      })
      // Fetch products by category
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products by category';
      })
      // Add Product
      .addCase(addProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        state.products.unshift(action.payload);
        state.loading = false;
      })
      // Update Product
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.loading = false;
      })
      // Delete Product
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<string>) => {
        state.products = state.products.filter(p => p.id !== action.payload);
        state.loading = false;
      })
      // Toggle Product Variants
      .addCase(toggleProductVariants.pending, (state) => {
        state.variantLoading = true;
        state.variantError = null;
      })
      .addCase(toggleProductVariants.fulfilled, (state, action: PayloadAction<Product>) => {
        state.variantLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(toggleProductVariants.rejected, (state, action) => {
        state.variantLoading = false;
        state.variantError = action.error.message || 'Failed to toggle product variants';
      })
      // Add Product Size
      .addCase(addProductSize.pending, (state) => {
        state.variantLoading = true;
        state.variantError = null;
      })
      .addCase(addProductSize.fulfilled, (state, action: PayloadAction<Product>) => {
        state.variantLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(addProductSize.rejected, (state, action) => {
        state.variantLoading = false;
        state.variantError = action.error.message || 'Failed to add product size';
      })
      // Remove Product Size
      .addCase(removeProductSize.pending, (state) => {
        state.variantLoading = true;
        state.variantError = null;
      })
      .addCase(removeProductSize.fulfilled, (state, action: PayloadAction<Product>) => {
        state.variantLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(removeProductSize.rejected, (state, action) => {
        state.variantLoading = false;
        state.variantError = action.error.message || 'Failed to remove product size';
      })
      // Add Product Color
      .addCase(addProductColor.pending, (state) => {
        state.variantLoading = true;
        state.variantError = null;
      })
      .addCase(addProductColor.fulfilled, (state, action: PayloadAction<Product>) => {
        state.variantLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(addProductColor.rejected, (state, action) => {
        state.variantLoading = false;
        state.variantError = action.error.message || 'Failed to add product color';
      })
      // Remove Product Color
      .addCase(removeProductColor.pending, (state) => {
        state.variantLoading = true;
        state.variantError = null;
      })
      .addCase(removeProductColor.fulfilled, (state, action: PayloadAction<Product>) => {
        state.variantLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(removeProductColor.rejected, (state, action) => {
        state.variantLoading = false;
        state.variantError = action.error.message || 'Failed to remove product color';
      });
  },
});

export const { clearSelectedProduct, clearError, clearVariantError } = productSlice.actions;
export default productSlice.reducer;
