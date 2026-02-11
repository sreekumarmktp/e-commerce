import React, { useState } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import {
  reorderImages,
  setPrimaryImage,
  deleteImage,
  ProductImage,
  ImageOrderUpdate,
} from '../store/slices/productImagesSlice';
import ImageCard from './ImageCard';

interface ImageGalleryProps {
  images: ProductImage[];
  productId: string;
  onReorder?: (newOrder: ImageOrderUpdate[]) => void;
  onSetPrimary?: (imageId: string) => void;
  onDelete?: (imageId: string) => void;
  isLoading?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productId,
  onReorder,
  onSetPrimary,
  onDelete,
  isLoading = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [draggedImage, setDraggedImage] = useState<ProductImage | null>(null);
  const [dragOverImage, setDragOverImage] = useState<ProductImage | null>(null);
  const [localImages, setLocalImages] = useState<ProductImage[]>(images);

  // Update local images when props change
  React.useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const handleDragStart = (image: ProductImage) => {
    setDraggedImage(image);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (image: ProductImage) => {
    if (draggedImage && draggedImage.id !== image.id) {
      setDragOverImage(image);
    }
  };

  const handleDragLeave = () => {
    setDragOverImage(null);
  };

  const handleDrop = async (targetImage: ProductImage) => {
    if (!draggedImage || draggedImage.id === targetImage.id) {
      setDraggedImage(null);
      setDragOverImage(null);
      return;
    }

    // Reorder images locally first
    const draggedIndex = localImages.findIndex((img) => img.id === draggedImage.id);
    const targetIndex = localImages.findIndex((img) => img.id === targetImage.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedImage(null);
      setDragOverImage(null);
      return;
    }

    // Create new order
    const newImages = [...localImages];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    // Update display order
    const updatedImages = newImages.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));

    setLocalImages(updatedImages);
    setDraggedImage(null);
    setDragOverImage(null);

    // Persist to backend
    const imageOrders: ImageOrderUpdate[] = updatedImages.map((img) => ({
      imageId: img.id,
      newOrder: img.displayOrder,
    }));

    try {
      await dispatch(
        reorderImages({ productId, imageOrders })
      ).unwrap();

      if (onReorder) {
        onReorder(imageOrders);
      }
    } catch (error) {
      console.error('Failed to reorder images:', error);
      // Revert to original order on error
      setLocalImages(images);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await dispatch(
        setPrimaryImage({ productId, imageId })
      ).unwrap();

      if (onSetPrimary) {
        onSetPrimary(imageId);
      }
    } catch (error) {
      console.error('Failed to set primary image:', error);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await dispatch(
        deleteImage({ productId, imageId })
      ).unwrap();

      if (onDelete) {
        onDelete(imageId);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  // Sort images by display order
  const sortedImages = [...localImages].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (sortedImages.length === 0) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          No images uploaded yet. Use the upload zone above to add images.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Image Gallery ({sortedImages.length})
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Drag and drop images to reorder them
      </Typography>

      <Grid container spacing={2}>
        {sortedImages.map((image) => (
          <Box
            key={image.id}
            sx={{
              display: 'grid',
              gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' },
            }}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(image)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(image)}
            draggable
            onDragStart={() => handleDragStart(image)}
          >
            <Box
              sx={{
                opacity: draggedImage?.id === image.id ? 0.5 : 1,
                backgroundColor:
                  dragOverImage?.id === image.id ? 'action.hover' : 'transparent',
                borderRadius: 1,
                transition: 'all 0.2s ease',
              }}
            >
              <ImageCard
                image={image}
                isPrimary={image.isPrimary}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDelete}
                isDragging={draggedImage?.id === image.id}
              />
            </Box>
          </Box>
        ))}
      </Grid>
    </Box>
  );
};

export default ImageGallery;
