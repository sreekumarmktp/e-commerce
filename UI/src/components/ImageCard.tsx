import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardActions,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
  Typography,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { ProductImage } from '../store/slices/productImagesSlice';

interface ImageCardProps {
  image: ProductImage;
  isPrimary: boolean;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  isPrimary,
  onSetPrimary,
  onDelete,
  isDragging = false,
  dragHandleProps,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete(image.id);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleSetPrimary = () => {
    onSetPrimary(image.id);
  };

  const sizeInMB = (image.fileSize / (1024 * 1024)).toFixed(2);
  const dimensions = `${image.width}x${image.height}`;

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 3,
          },
        }}
      >
        {/* Primary Image Badge */}
        {isPrimary && (
          <Chip
            icon={<StarIcon />}
            label="Primary"
            color="primary"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
            }}
          />
        )}

        {/* Drag Handle */}
        <Box
          {...dragHandleProps}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            cursor: 'grab',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
        >
          <Tooltip title="Drag to reorder">
            <DragIndicatorIcon
              sx={{
                color: 'white',
                textShadow: '0 0 3px rgba(0,0,0,0.5)',
                fontSize: 24,
              }}
            />
          </Tooltip>
        </Box>

        {/* Image */}
        <CardMedia
          component="img"
          height="200"
          image={image.imageUrl}
          alt="Product image"
          sx={{
            objectFit: 'cover',
          }}
        />

        {/* Metadata */}
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" display="block" color="text.secondary">
            Size: {sizeInMB} MB
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Dimensions: {dimensions}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Type: {image.mimeType}
          </Typography>
        </Box>

        {/* Actions */}
        <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
          <Tooltip title={isPrimary ? 'Already primary' : 'Set as primary'}>
            <span>
              <IconButton
                size="small"
                onClick={handleSetPrimary}
                disabled={isPrimary}
                color={isPrimary ? 'primary' : 'default'}
              >
                {isPrimary ? <StarIcon /> : <StarOutlineIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete image">
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Image?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this image? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageCard;
