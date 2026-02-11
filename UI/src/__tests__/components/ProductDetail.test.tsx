import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductDetail from '../../components/ProductDetail';
import productReducer, { Product } from '../../store/slices/productSlice';
import productImagesReducer from '../../store/slices/productImagesSlice';

// Mock the API module
jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'test-product-id' }),
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Import the mocked api after mocking
import { api } from '../../services/api';

/**
 * Helper function to create a test store with a product
 */
const createTestStore = (product: Product | null) => {
  // Mock cart reducer that returns initial state
  const mockCartReducer = jest.fn((state = { cart: null, loading: false, error: null }) => state);
  
  return configureStore({
    reducer: {
      products: productReducer,
      cart: mockCartReducer,
      productImages: productImagesReducer,
    },
    preloadedState: {
      products: {
        products: [],
        selectedProduct: product,
        loading: false,
        error: null,
        variantLoading: false,
        variantError: null,
      },
      cart: {
        cart: null,
        loading: false,
        error: null,
      },
      productImages: {
        images: [],
        loading: false,
        error: null,
      },
    },
  });
};

/**
 * Helper function to render ProductDetail with a test store
 */
const renderProductDetail = (product: Product | null) => {
  const store = createTestStore(product);
  
  // Mock the API response for fetchProductById
  const mockApi = api as jest.Mocked<typeof api>;
  mockApi.get.mockResolvedValue({
    data: {
      success: true,
      data: product,
    },
  });
  
  return render(
    <Provider store={store}>
      <ProductDetail />
    </Provider>
  );
};

/**
 * Helper to create a mock product
 */
const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: 'test-id',
  name: 'Test Product',
  description: 'Test description',
  price: 100,
  image: 'https://example.com/image.jpg',
  images: ['https://example.com/image1.jpg'],
  sizes: ['S', 'M', 'L'],
  colors: ['Red', 'Blue', 'Green'],
  sizesEnabled: true,
  colorsEnabled: true,
  category: 'Sarees',
  stock: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('ProductDetail - Variant Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.1 - Size selector hidden when sizesEnabled is false
   */
  it('should hide size selector when sizesEnabled is false', async () => {
    const product = createMockProduct({
      sizesEnabled: false,
      sizes: ['S', 'M', 'L'],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Size selector should NOT be displayed
    expect(screen.queryByText(/Select Size/i)).not.toBeInTheDocument();
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.2 - Color selector hidden when colorsEnabled is false
   */
  it('should hide color selector when colorsEnabled is false', async () => {
    const product = createMockProduct({
      colorsEnabled: false,
      colors: ['Red', 'Blue'],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Color selector should NOT be displayed
    expect(screen.queryByText(/Select Color/i)).not.toBeInTheDocument();
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.5 - Size selector hidden when sizes array is empty
   */
  it('should hide size selector when sizes array is empty', async () => {
    const product = createMockProduct({
      sizesEnabled: true,
      sizes: [],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Size selector should NOT be displayed even though sizesEnabled is true
    expect(screen.queryByText(/Select Size/i)).not.toBeInTheDocument();
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.5 - Color selector hidden when colors array is empty
   */
  it('should hide color selector when colors array is empty', async () => {
    const product = createMockProduct({
      colorsEnabled: true,
      colors: [],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Color selector should NOT be displayed even though colorsEnabled is true
    expect(screen.queryByText(/Select Color/i)).not.toBeInTheDocument();
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.3 - All sizes displayed when sizesEnabled is true
   */
  it('should display all sizes when sizesEnabled is true and sizes array is non-empty', async () => {
    const product = createMockProduct({
      sizesEnabled: true,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Size selector should be displayed
    expect(screen.getByText(/Select Size/i)).toBeInTheDocument();

    // All sizes should be displayed (using getAllByText since sizes appear in the selector)
    expect(screen.getAllByText('XS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('S').length).toBeGreaterThan(0);
    expect(screen.getAllByText('M').length).toBeGreaterThan(0);
    expect(screen.getAllByText('L').length).toBeGreaterThan(0);
    expect(screen.getAllByText('XL').length).toBeGreaterThan(0);
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.4 - All colors displayed when colorsEnabled is true
   */
  it('should display all colors when colorsEnabled is true and colors array is non-empty', async () => {
    const product = createMockProduct({
      colorsEnabled: true,
      colors: ['Red', 'Blue', 'Green', 'Yellow'],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Color selector should be displayed
    expect(screen.getByText(/Select Color/i)).toBeInTheDocument();

    // All colors should be displayed (using getAllByText since colors might appear multiple times)
    expect(screen.getAllByText('Red').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Blue').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Green').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Yellow').length).toBeGreaterThan(0);
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.3, 5.4 - Both selectors displayed when both enabled
   */
  it('should display both size and color selectors when both are enabled with values', async () => {
    const product = createMockProduct({
      sizesEnabled: true,
      colorsEnabled: true,
      sizes: ['S', 'M', 'L'],
      colors: ['Red', 'Blue'],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Both selectors should be displayed
    expect(screen.getByText(/Select Size/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Color/i)).toBeInTheDocument();

    // All sizes should be displayed
    expect(screen.getAllByText('S').length).toBeGreaterThan(0);
    expect(screen.getAllByText('M').length).toBeGreaterThan(0);
    expect(screen.getAllByText('L').length).toBeGreaterThan(0);

    // All colors should be displayed
    expect(screen.getAllByText('Red').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Blue').length).toBeGreaterThan(0);
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.1, 5.2 - Neither selector displayed when both disabled
   */
  it('should hide both selectors when both are disabled', async () => {
    const product = createMockProduct({
      sizesEnabled: false,
      colorsEnabled: false,
      sizes: ['S', 'M'],
      colors: ['Red', 'Blue'],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Neither selector should be displayed
    expect(screen.queryByText(/Select Size/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select Color/i)).not.toBeInTheDocument();
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.1, 5.5 - Mixed scenario: one enabled, one disabled
   */
  it('should display only color selector when sizes disabled but colors enabled', async () => {
    const product = createMockProduct({
      sizesEnabled: false,
      colorsEnabled: true,
      sizes: ['S', 'M'],
      colors: ['Red', 'Blue'],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Only color selector should be displayed
    expect(screen.queryByText(/Select Size/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Select Color/i)).toBeInTheDocument();
  });

  /**
   * Feature: product-variant-management
   * Validates: Requirements 5.2, 5.5 - Mixed scenario: one enabled, one disabled
   */
  it('should display only size selector when colors disabled but sizes enabled', async () => {
    const product = createMockProduct({
      sizesEnabled: true,
      colorsEnabled: false,
      sizes: ['S', 'M'],
      colors: ['Red', 'Blue'],
    });

    renderProductDetail(product);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Only size selector should be displayed
    expect(screen.getByText(/Select Size/i)).toBeInTheDocument();
    expect(screen.queryByText(/Select Color/i)).not.toBeInTheDocument();
  });
});

describe('ProductDetail - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: cart-functionality-fixes
   * Validates: Requirements 5.1, 5.2 - Error messages displayed when addToCart fails
   */
  it('should display error message when addToCart fails', async () => {
    const product = createMockProduct();
    
    // Mock cart reducer that returns error state
    const mockCartReducer = jest.fn((state = { cart: null, loading: false, error: 'Failed to add item to cart' }) => state);
    
    // Create a store with cart error
    const store = configureStore({
      reducer: {
        products: productReducer,
        cart: mockCartReducer,
        productImages: productImagesReducer,
      },
      preloadedState: {
        products: {
          products: [],
          selectedProduct: product,
          loading: false,
          error: null,
          variantLoading: false,
          variantError: null,
        },
        cart: {
          cart: null,
          loading: false,
          error: 'Failed to add item to cart',
        },
        productImages: {
          images: [],
          loading: false,
          error: null,
        },
      },
    });

    // Mock the API response for fetchProductById
    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: product,
      },
    });

    render(
      <Provider store={store}>
        <ProductDetail />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Error message should be displayed in the Snackbar
    await waitFor(() => {
      expect(screen.getByText('Failed to add item to cart')).toBeInTheDocument();
    });
  });

  /**
   * Feature: cart-functionality-fixes
   * Validates: Requirements 5.1, 5.2 - Different error types display appropriate messages
   */
  it('should display validation error message', async () => {
    const product = createMockProduct();
    
    // Mock cart reducer that returns validation error state
    const mockCartReducer = jest.fn((state = { cart: null, loading: false, error: 'Validation failed: quantity must be positive' }) => state);
    
    const store = configureStore({
      reducer: {
        products: productReducer,
        cart: mockCartReducer,
        productImages: productImagesReducer,
      },
      preloadedState: {
        products: {
          products: [],
          selectedProduct: product,
          loading: false,
          error: null,
          variantLoading: false,
          variantError: null,
        },
        cart: {
          cart: null,
          loading: false,
          error: 'Validation failed: quantity must be positive',
        },
        productImages: {
          images: [],
          loading: false,
          error: null,
        },
      },
    });

    // Mock the API response for fetchProductById
    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: product,
      },
    });

    render(
      <Provider store={store}>
        <ProductDetail />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Validation error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Validation failed: quantity must be positive')).toBeInTheDocument();
    });
  });

  /**
   * Feature: cart-functionality-fixes
   * Validates: Requirements 5.1, 5.2 - Network error messages displayed
   */
  it('should display network error message', async () => {
    const product = createMockProduct();
    
    // Mock cart reducer that returns network error state
    const mockCartReducer = jest.fn((state = { cart: null, loading: false, error: 'Network error: Unable to connect to server' }) => state);
    
    const store = configureStore({
      reducer: {
        products: productReducer,
        cart: mockCartReducer,
        productImages: productImagesReducer,
      },
      preloadedState: {
        products: {
          products: [],
          selectedProduct: product,
          loading: false,
          error: null,
          variantLoading: false,
          variantError: null,
        },
        cart: {
          cart: null,
          loading: false,
          error: 'Network error: Unable to connect to server',
        },
        productImages: {
          images: [],
          loading: false,
          error: null,
        },
      },
    });

    // Mock the API response for fetchProductById
    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: product,
      },
    });

    render(
      <Provider store={store}>
        <ProductDetail />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Network error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Network error: Unable to connect to server')).toBeInTheDocument();
    });
  });
});
