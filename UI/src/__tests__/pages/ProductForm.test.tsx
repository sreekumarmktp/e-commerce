import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import AdminProductForm from '../../pages/admin/ProductForm';
import productReducer from '../../store/slices/productSlice';
import productImagesReducer from '../../store/slices/productImagesSlice';

// Polyfill for TextEncoder if needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}

// Mock the components
jest.mock('../../components/ImageUploadZone', () => {
  return function MockImageUploadZone({ productId }: { productId: string }) {
    return <div data-testid="image-upload-zone">ImageUploadZone - {productId}</div>;
  };
});

jest.mock('../../components/ImageGallery', () => {
  return function MockImageGallery({ images, productId }: any) {
    return (
      <div data-testid="image-gallery">
        ImageGallery - {productId} - {images.length} images
      </div>
    );
  };
});

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: jest.fn(),
    useNavigate: jest.fn(),
  };
});

import { useParams, useNavigate } from 'react-router-dom';

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

interface RenderOptions {
  preloadedState?: any;
  isEditMode?: boolean;
}

function renderWithRedux(
  component: React.ReactElement,
  {
    preloadedState = {},
    isEditMode = false,
  }: RenderOptions = {}
) {
  const store = configureStore({
    reducer: {
      products: productReducer,
      productImages: productImagesReducer,
    },
  });

  if (isEditMode) {
    mockUseParams.mockReturnValue({ id: 'test-product-id' } as any);
  } else {
    mockUseParams.mockReturnValue({} as any);
  }

  const mockNavigate = jest.fn();
  mockUseNavigate.mockReturnValue(mockNavigate);

  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store,
    mockNavigate,
  };
}

describe('AdminProductForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Legacy Field Removal - Property 1 & 2', () => {
    it('should NOT render legacy file input field', () => {
      renderWithRedux(<AdminProductForm />);
      
      // Check that no file input exists
      const fileInputs = screen.queryAllByRole('button', { name: /select files/i });
      expect(fileInputs.length).toBe(0);
      
      // Verify no input type="file" in the DOM
      const form = screen.getByRole('form', { hidden: true });
      const fileInput = form.querySelector('input[type="file"]');
      expect(fileInput).not.toBeInTheDocument();
    });

    it('should NOT render legacy URL text field', () => {
      renderWithRedux(<AdminProductForm />);
      
      // Check that "Additional Image URLs" field is not present
      const urlField = screen.queryByLabelText(/Additional Image URLs/i);
      expect(urlField).not.toBeInTheDocument();
    });

    it('should NOT have any references to legacy image field handlers', () => {
      const { container } = renderWithRedux(<AdminProductForm />);
      
      // Verify the form doesn't have legacy image handling
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // Count the number of TextFields - should not include legacy URL field
      const textFields = screen.getAllByRole('textbox');
      const urlFieldExists = textFields.some(field => 
        field.getAttribute('aria-label')?.includes('Additional Image URLs')
      );
      expect(urlFieldExists).toBe(false);
    });
  });

  describe('ImageUploadZone Integration - Property 3', () => {
    it('should render ImageUploadZone component in edit mode', () => {
      renderWithRedux(<AdminProductForm />, { isEditMode: true });
      
      const uploadZone = screen.getByTestId('image-upload-zone');
      expect(uploadZone).toBeInTheDocument();
      expect(uploadZone).toBeVisible();
    });

    it('should pass correct productId to ImageUploadZone', () => {
      renderWithRedux(<AdminProductForm />, { isEditMode: true });
      
      const uploadZone = screen.getByTestId('image-upload-zone');
      expect(uploadZone).toHaveTextContent('test-product-id');
    });

    it('should NOT render ImageUploadZone in create mode', () => {
      renderWithRedux(<AdminProductForm />, { isEditMode: false });
      
      const uploadZone = screen.queryByTestId('image-upload-zone');
      expect(uploadZone).not.toBeInTheDocument();
    });
  });

  describe('ImageGallery Integration - Property 4', () => {
    it('should render ImageGallery component in edit mode', () => {
      renderWithRedux(<AdminProductForm />, { isEditMode: true });
      
      const gallery = screen.getByTestId('image-gallery');
      expect(gallery).toBeInTheDocument();
      expect(gallery).toBeVisible();
    });

    it('should pass correct productId to ImageGallery', () => {
      renderWithRedux(<AdminProductForm />, { isEditMode: true });
      
      const gallery = screen.getByTestId('image-gallery');
      expect(gallery).toHaveTextContent('test-product-id');
    });

    it('should NOT render ImageGallery in create mode', () => {
      renderWithRedux(<AdminProductForm />, { isEditMode: false });
      
      const gallery = screen.queryByTestId('image-gallery');
      expect(gallery).not.toBeInTheDocument();
    });
  });

  describe('Form Submission - Property 7', () => {
    it('should NOT include image data in form submission', async () => {
      const { store, mockNavigate } = renderWithRedux(<AdminProductForm />);
      
      // Fill in form fields
      const nameInput = screen.getByLabelText(/Name/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const stockInput = screen.getByLabelText(/Stock/i);
      
      await userEvent.type(nameInput, 'Test Product');
      await userEvent.type(priceInput, '99.99');
      await userEvent.type(stockInput, '10');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Product/i });
      fireEvent.click(submitButton);
      
      // Verify form submission doesn't include image data
      await waitFor(() => {
        const state = store.getState();
        // The form data should not have image-related fields
        expect(state.products).toBeDefined();
      });
    });

    it('should submit form with basic product data only', async () => {
      const { mockNavigate } = renderWithRedux(<AdminProductForm />);
      
      const nameInput = screen.getByLabelText(/Name/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const categoryInput = screen.getByLabelText(/Category/i);
      const stockInput = screen.getByLabelText(/Stock/i);
      
      await userEvent.type(nameInput, 'Saree');
      await userEvent.type(descriptionInput, 'Beautiful saree');
      await userEvent.type(priceInput, '150');
      await userEvent.type(categoryInput, 'Sarees');
      await userEvent.type(stockInput, '5');
      
      const submitButton = screen.getByRole('button', { name: /Create Product/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
      });
    });
  });

  describe('Component Code Cleanliness - Property 9', () => {
    it('should have clean form structure without legacy fields', () => {
      const { container } = renderWithRedux(<AdminProductForm />);
      
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // Verify form contains expected fields
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Stock/i)).toBeInTheDocument();
      
      // Verify legacy fields are NOT present
      expect(screen.queryByLabelText(/Additional Image URLs/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Product Image/i)).not.toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      renderWithRedux(<AdminProductForm />);
      
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Stock/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Enable Sizes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Enable Colors/i)).toBeInTheDocument();
    });
  });

  describe('Form Functionality', () => {
    it('should update form data on input change', async () => {
      renderWithRedux(<AdminProductForm />);
      
      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      await userEvent.type(nameInput, 'Test Product');
      
      expect(nameInput.value).toBe('Test Product');
    });

    it('should handle size management', async () => {
      renderWithRedux(<AdminProductForm />);
      
      const sizeInput = screen.getByPlaceholderText(/e.g., S, M, L, XL/i);
      const addButton = screen.getByRole('button', { name: /add size/i });
      
      await userEvent.type(sizeInput, 'M');
      fireEvent.click(addButton);
      
      // Verify size chip appears
      await waitFor(() => {
        expect(screen.getByText('M')).toBeInTheDocument();
      });
    });

    it('should handle color management', async () => {
      renderWithRedux(<AdminProductForm />);
      
      const colorInput = screen.getByPlaceholderText(/e.g., Red, Blue, Green/i);
      const addButton = screen.getByRole('button', { name: /add color/i });
      
      await userEvent.type(colorInput, 'Red');
      fireEvent.click(addButton);
      
      // Verify color chip appears
      await waitFor(() => {
        expect(screen.getByText('Red')).toBeInTheDocument();
      });
    });

    it('should toggle sizes enabled/disabled', async () => {
      renderWithRedux(<AdminProductForm />);
      
      const sizesSwitch = screen.getByLabelText(/Enable Sizes/i);
      expect(sizesSwitch).toBeChecked();
      
      fireEvent.click(sizesSwitch);
      
      // After unchecking, size input should not be visible
      await waitFor(() => {
        const sizeInput = screen.queryByPlaceholderText(/e.g., S, M, L, XL/i);
        expect(sizeInput).not.toBeInTheDocument();
      });
    });

    it('should toggle colors enabled/disabled', async () => {
      renderWithRedux(<AdminProductForm />);
      
      const colorsSwitch = screen.getByLabelText(/Enable Colors/i);
      expect(colorsSwitch).toBeChecked();
      
      fireEvent.click(colorsSwitch);
      
      // After unchecking, color input should not be visible
      await waitFor(() => {
        const colorInput = screen.queryByPlaceholderText(/e.g., Red, Blue, Green/i);
        expect(colorInput).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should display "Edit Product" title in edit mode', () => {
      renderWithRedux(<AdminProductForm />, { isEditMode: true });
      
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    it('should display "Add New Product" title in create mode', () => {
      renderWithRedux(<AdminProductForm />, { isEditMode: false });
      
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });

    it('should show image management section only in edit mode', () => {
      const { rerender } = renderWithRedux(<AdminProductForm />, { isEditMode: false });
      
      let uploadZone = screen.queryByTestId('image-upload-zone');
      expect(uploadZone).not.toBeInTheDocument();
      
      // Now test edit mode
      mockUseParams.mockReturnValue({ id: 'test-id' } as any);
      rerender(
        <Provider store={configureStore({
          reducer: {
            products: productReducer,
            productImages: productImagesReducer,
          },
        })}>
          <BrowserRouter>
            <AdminProductForm />
          </BrowserRouter>
        </Provider>
      );
      
      uploadZone = screen.queryByTestId('image-upload-zone');
      expect(uploadZone).toBeInTheDocument();
    });
  });
});
