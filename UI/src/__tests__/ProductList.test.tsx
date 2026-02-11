import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import productReducer from '../store/slices/productSlice';
import ProductList from '../components/ProductList';

// Mock the API module
jest.mock('../services/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: [],
      },
    }),
  },
}));

// Create a test store with initial state
const createTestStore = () => {
  return configureStore({
    reducer: {
      products: productReducer,
    },
    preloadedState: {
      products: {
        products: [],
        selectedProduct: null,
        loading: false,
        error: null,
        variantLoading: false,
        variantError: null,
      },
    },
  });
};

describe('ProductList', () => {
  test('renders heading', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProductList />
      </Provider>
    );

    // Wait for the heading to appear after loading completes
    await waitFor(() => {
      expect(screen.getByText(/The Ethnic Collection/i)).toBeInTheDocument();
    });
  });
});

