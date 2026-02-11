import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Snackbar,
} from '@mui/material';
import { AddShoppingCart, ArrowBack, ShoppingCart } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store/store';
import { fetchProductById, clearSelectedProduct } from '../store/slices/productSlice';
import { fetchProductImages, clearImages } from '../store/slices/productImagesSlice';
import { selectImagesSortedByOrder } from '../store/selectors/productImagesSelectors';
import { addToCart, clearError } from '../store/slices/cartSlice';
import { getImageUrl } from '../utils/imageUtils';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedProduct, loading, error } = useSelector((state: RootState) => state.products);
  const { error: cartError } = useSelector((state: RootState) => state.cart);
  const productImages = useSelector((state: RootState) => selectImagesSortedByOrder(state));
  const [quantity, setQuantity] = useState<number>(1);
  const [mainImage, setMainImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      dispatch(fetchProductImages(id));
    }

    return () => {
      dispatch(clearSelectedProduct());
      dispatch(clearImages());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct) {
      setMainImage(getImageUrl(selectedProduct.image));
      if (selectedProduct.sizes && selectedProduct.sizes.length > 0) {
        setSelectedSize(selectedProduct.sizes[0]);
      }
      if (selectedProduct.colors && selectedProduct.colors.length > 0) {
        setSelectedColor(selectedProduct.colors[0]);
      }
    }
  }, [selectedProduct]);

  // Show snackbar when cart error occurs
  useEffect(() => {
    if (cartError) {
      setSnackbarOpen(true);
    }
  }, [cartError]);

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
    dispatch(clearError());
  };

  const handleAddToCart = () => {
    if (id && selectedProduct) {
      // In a real app, we'd add size and color to the cart item too
      dispatch(addToCart({ productId: id, quantity }));
    }
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (value > 0 && selectedProduct && value <= selectedProduct.stock) {
      setQuantity(value);
    }
  };

  // Determine if selectors should be shown based on enabled flags and available values
  const showSizeSelector = selectedProduct ? 
    selectedProduct.sizesEnabled && selectedProduct.sizes.length > 0 : false;
  const showColorSelector = selectedProduct ? 
    selectedProduct.colorsEnabled && selectedProduct.colors.length > 0 : false;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} color="secondary" />
      </Box>
    );
  }

  if (error || !selectedProduct) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error || 'Product not found'}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {cartError}
        </Alert>
      </Snackbar>

      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/')}
        sx={{ mb: 3, color: 'text.secondary', '&:hover': { backgroundColor: 'transparent', color: 'primary.main' } }}
      >
        Back to Collection
      </Button>

      <Grid container spacing={6}>
        {/* Product Images Gallery */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row-reverse' }, gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Card elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
                <CardMedia
                  component="img"
                  image={mainImage || getImageUrl(selectedProduct.image) || '/placeholder-image.png'}
                  alt={selectedProduct.name}
                  sx={{
                    width: '100%',
                    aspectRatio: '3/4',
                    objectFit: 'cover',
                    transition: 'opacity 0.3s ease-in-out'
                  }}
                />
              </Card>
            </Box>

            {/* Thumbnails */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'column' },
                gap: 1.5,
                width: { xs: '100%', sm: '100px' },
                maxHeight: { sm: '600px' },
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#ddd', borderRadius: '4px' }
              }}
            >
              {productImages.length > 0
                ? productImages.map((img, index) => (
                    <Box
                      key={img.id}
                      onClick={() => setMainImage(img.imageUrl)}
                      sx={{
                        width: { xs: '70px', sm: '100%' },
                        aspectRatio: '1/1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: (mainImage === img.imageUrl || (!mainImage && index === 0)) ? 'primary.main' : 'transparent',
                        opacity: (mainImage === img.imageUrl || (!mainImage && index === 0)) ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                        '&:hover': { opacity: 1 },
                        position: 'relative',
                      }}
                    >
                      <img
                        src={img.imageUrl}
                        alt={`Thumbnail ${index}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {img.isPrimary && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                          }}
                        >
                          ★
                        </Box>
                      )}
                    </Box>
                  ))
                : [getImageUrl(selectedProduct.image), ...(selectedProduct.images || []).map(img => getImageUrl(img))].filter((img, idx, self) => self.indexOf(img) === idx).map((img, index) => (
                    <Box
                      key={index}
                      onClick={() => setMainImage(img)}
                      sx={{
                        width: { xs: '70px', sm: '100%' },
                        aspectRatio: '1/1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: (mainImage === img || (!mainImage && index === 0)) ? 'primary.main' : 'transparent',
                        opacity: (mainImage === img || (!mainImage && index === 0)) ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
            </Box>
          </Box>
        </Grid>

        {/* Product Details */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
              {selectedProduct.category.toUpperCase()}
            </Typography>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="600" sx={{ mt: 1, color: '#2c2c2c' }}>
              {selectedProduct.name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                ₹{selectedProduct.price.toFixed(2)}
              </Typography>
              {selectedProduct.stock < 10 && selectedProduct.stock > 0 && (
                <Chip
                  label={`Only ${selectedProduct.stock} left!`}
                  color="error"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4, lineHeight: 1.8, fontSize: '1.1rem' }}>
              {selectedProduct.description}
            </Typography>

            <Divider sx={{ my: 4 }} />

            {/* Color Selection */}
            {showColorSelector && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Select Color: <Typography component="span" fontWeight="normal" color="text.secondary">{selectedColor}</Typography>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
                  {selectedProduct.colors.map((color) => (
                    <Chip
                      key={color}
                      label={color}
                      onClick={() => setSelectedColor(color)}
                      variant={selectedColor === color ? 'filled' : 'outlined'}
                      color={selectedColor === color ? 'primary' : 'default'}
                      sx={{
                        borderRadius: '8px',
                        px: 1,
                        fontWeight: selectedColor === color ? 600 : 400,
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Size Selection */}
            {showSizeSelector && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Select Size: <Typography component="span" fontWeight="normal" color="text.secondary">{selectedSize}</Typography>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
                  {selectedProduct.sizes.map((size) => (
                    <Box
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      sx={{
                        width: '45px',
                        height: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderRadius: '50%',
                        borderColor: selectedSize === size ? 'primary.main' : '#ddd',
                        backgroundColor: selectedSize === size ? 'primary.main' : 'transparent',
                        color: selectedSize === size ? 'white' : 'text.primary',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main', color: selectedSize === size ? 'white' : 'primary.main' }
                      }}
                    >
                      {size}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Quantity
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                <TextField
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  inputProps={{ min: 1, max: selectedProduct.stock }}
                  size="small"
                  sx={{ width: 80 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {selectedProduct.stock > 0 ? `${selectedProduct.stock} units available` : 'Currently out of stock'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 6 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<AddShoppingCart />}
                onClick={handleAddToCart}
                disabled={selectedProduct.stock === 0}
                sx={{
                  py: 2,
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
                  '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }
                }}
              >
                Add to Cart
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<ShoppingCart />}
                onClick={() => navigate('/cart')}
                sx={{
                  py: 2,
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  borderColor: '#ddd',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(0,0,0,0.02)' }
                }}
              >
                View Cart
              </Button>
            </Box>

            {/* Extra Info */}
            <Box sx={{ mt: 6, display: 'flex', gap: 4, color: 'text.secondary' }}>
              <Box>
                <Typography variant="caption" display="block">AUTHENTICITY</Typography>
                <Typography variant="body2">100% Original</Typography>
              </Box>
              <Box>
                <Typography variant="caption" display="block">SHIPPING</Typography>
                <Typography variant="body2">Free delivery</Typography>
              </Box>
              <Box>
                <Typography variant="caption" display="block">RETURNS</Typography>
                <Typography variant="body2">30-day return policy</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDetail;
