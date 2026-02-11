import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectProductsState = (state: RootState) => state.products;

export const selectProducts = createSelector(selectProductsState, (p) => p.products);
export const selectProductsLoading = createSelector(selectProductsState, (p) => p.loading);
export const selectProductsError = createSelector(selectProductsState, (p) => p.error);
export const selectSelectedProduct = createSelector(selectProductsState, (p) => p.selectedProduct);

