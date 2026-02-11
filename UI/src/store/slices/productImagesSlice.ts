import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '../../types/api';
import { api } from '../../services/api';

export interface ProductImage {
  id: string;
  productId: string;
  imagePath: string;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImageOrderUpdate {
  imageId: string;
  newOrder: number;
}

interface ProductImagesState {
  images: ProductImage[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductImagesState = {
  images: [],
  loading: false,
  error: null,
};

// Async thunks for API calls
export const uploadImages = createAsyncThunk(
  'productImages/uploadImages',
  async (
    { productId, files }: { productId: string; files: File[] },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post<ApiResponse<ProductImage[]>>(
        `/products/${productId}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.error);
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to upload images'
      );
    }
  }
);

export const fetchProductImages = createAsyncThunk(
  'productImages/fetchProductImages',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<ProductImage[]>>(
        `/products/${productId}/images`
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.error);
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch images'
      );
    }
  }
);

export const reorderImages = createAsyncThunk(
  'productImages/reorderImages',
  async (
    { productId, imageOrders }: { productId: string; imageOrders: ImageOrderUpdate[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch<ApiResponse<ProductImage[]>>(
        `/products/${productId}/images/order`,
        { imageOrders }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.error);
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to reorder images'
      );
    }
  }
);

export const setPrimaryImage = createAsyncThunk(
  'productImages/setPrimaryImage',
  async (
    { productId, imageId }: { productId: string; imageId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch<ApiResponse<ProductImage[]>>(
        `/products/${productId}/images/${imageId}/primary`
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.error);
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to set primary image'
      );
    }
  }
);

export const deleteImage = createAsyncThunk(
  'productImages/deleteImage',
  async (
    { productId, imageId }: { productId: string; imageId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.delete<ApiResponse<ProductImage[]>>(
        `/products/${productId}/images/${imageId}`
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.error);
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete image'
      );
    }
  }
);

const productImagesSlice = createSlice({
  name: 'productImages',
  initialState,
  reducers: {
    setImages: (state, action: PayloadAction<ProductImage[]>) => {
      state.images = action.payload;
    },
    addImages: (state, action: PayloadAction<ProductImage[]>) => {
      state.images = [...state.images, ...action.payload];
    },
    updateImageOrder: (state, action: PayloadAction<ProductImage[]>) => {
      state.images = action.payload;
    },
    setPrimaryImageLocal: (state, action: PayloadAction<string>) => {
      state.images = state.images.map((img) => ({
        ...img,
        isPrimary: img.id === action.payload,
      }));
    },
    deleteImageLocal: (state, action: PayloadAction<string>) => {
      state.images = state.images.filter((img) => img.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearImages: (state) => {
      state.images = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Images
      .addCase(uploadImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadImages.fulfilled, (state, action: PayloadAction<ProductImage[]>) => {
        state.loading = false;
        state.images = [...state.images, ...action.payload];
      })
      .addCase(uploadImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to upload images';
      })
      // Fetch Product Images
      .addCase(fetchProductImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductImages.fulfilled, (state, action: PayloadAction<ProductImage[]>) => {
        state.loading = false;
        state.images = action.payload;
      })
      .addCase(fetchProductImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch images';
      })
      // Reorder Images
      .addCase(reorderImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderImages.fulfilled, (state, action: PayloadAction<ProductImage[]>) => {
        state.loading = false;
        state.images = action.payload;
      })
      .addCase(reorderImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to reorder images';
      })
      // Set Primary Image
      .addCase(setPrimaryImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setPrimaryImage.fulfilled, (state, action: PayloadAction<ProductImage[]>) => {
        state.loading = false;
        state.images = action.payload;
      })
      .addCase(setPrimaryImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to set primary image';
      })
      // Delete Image
      .addCase(deleteImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteImage.fulfilled, (state, action: PayloadAction<ProductImage[]>) => {
        state.loading = false;
        state.images = action.payload;
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete image';
      });
  },
});

export const {
  setImages,
  addImages,
  updateImageOrder,
  setPrimaryImageLocal,
  deleteImageLocal,
  setLoading,
  setError,
  clearImages,
} = productImagesSlice.actions;

export default productImagesSlice.reducer;
