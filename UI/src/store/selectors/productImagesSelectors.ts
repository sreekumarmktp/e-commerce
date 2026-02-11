import { createSelector } from 'reselect';
import { RootState } from '../../store/store';
import { ProductImage } from '../../store/slices/productImagesSlice';

// Basic selectors
export const selectProductImages = (state: RootState): ProductImage[] =>
  state.productImages.images;

export const selectImageLoading = (state: RootState): boolean =>
  state.productImages.loading;

export const selectImageError = (state: RootState): string | null =>
  state.productImages.error;

// Memoized selectors
export const selectImagesSortedByOrder = createSelector(
  [selectProductImages],
  (images: ProductImage[]) => {
    return [...images].sort((a, b) => a.displayOrder - b.displayOrder);
  }
);

export const selectPrimaryImage = createSelector(
  [selectProductImages],
  (images: ProductImage[]) => {
    return images.find((img) => img.isPrimary) || images[0] || null;
  }
);

export const selectImageCount = createSelector(
  [selectProductImages],
  (images: ProductImage[]) => images.length
);

export const selectCanAddMoreImages = createSelector(
  [selectImageCount],
  (count: number) => count < 7 // Max 7 images per product
);

export const selectImagesByProductId = createSelector(
  [selectProductImages, (_: RootState, productId: string) => productId],
  (images: ProductImage[], productId: string) => {
    return images.filter((img) => img.productId === productId);
  }
);
