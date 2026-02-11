import { configureStore } from '@reduxjs/toolkit';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import productImagesReducer from './slices/productImagesSlice';

export const store = configureStore({
  reducer: {
    products: productReducer,
    cart: cartReducer,
    auth: authReducer,
    admin: adminReducer,
    productImages: productImagesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
