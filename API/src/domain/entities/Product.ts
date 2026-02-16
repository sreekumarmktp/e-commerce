export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  primaryImagePath: string;
  primaryImageId?: string;
  sizes: string[];
  colors: string[];
  sizesEnabled: boolean;
  colorsEnabled: boolean;
  category: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  primaryImagePath: string;
  sizes: string[];
  colors: string[];
  sizesEnabled?: boolean;
  colorsEnabled?: boolean;
  category: string;
  stock: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  primaryImagePath?: string;
  primaryImageId?: string;
  sizes?: string[];
  colors?: string[];
  sizesEnabled?: boolean;
  colorsEnabled?: boolean;
  category?: string;
  stock?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
