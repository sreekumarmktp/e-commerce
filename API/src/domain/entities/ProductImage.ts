export interface ProductImage {
  id: string;
  productId: string;
  imagePath: string;
  displayOrder: number;
  isPrimary: boolean;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImageData {
  imagePath: string;
  displayOrder: number;
  isPrimary?: boolean;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
}

export interface ImageOrderUpdate {
  imageId: string;
  newOrder: number;
}
