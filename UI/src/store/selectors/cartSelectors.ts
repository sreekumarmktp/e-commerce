import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectCartState = (state: RootState) => state.cart;

export const selectCart = createSelector(selectCartState, (c) => c.cart);
export const selectCartLoading = createSelector(selectCartState, (c) => c.loading);
export const selectCartError = createSelector(selectCartState, (c) => c.error);
export const selectCartItemCount = createSelector(selectCart, (cart) => cart?.itemCount ?? 0);

