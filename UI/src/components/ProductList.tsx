import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { AddShoppingCart } from '@mui/icons-material';
import { AppDispatch } from '../store/store';
import { fetchProducts, fetchProductsByCategory } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { selectProducts, selectProductsError, selectProductsLoading } from '../store/selectors/productSelectors';
import { getImageUrl } from '../utils/imageUtils';

const ProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const products = useSelector(selectProducts);
  const loading = useSelector(selectProductsLoading);
  const error = useSelector(selectProductsError);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = ['all', 'Sarees', 'Suits', 'Lehenga Choli', 'Kurtas', 'Gowns'];

  useEffect(() => {
    if (selectedCategory === 'all') {
      dispatch(fetchProducts());
    } else {
      dispatch(fetchProductsByCategory(selectedCategory));
    }
  }, [dispatch, selectedCategory]);

  const handleAddToCart = (productId: string) => {
    dispatch(addToCart({ productId, quantity: 1 }));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} color="secondary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="700" sx={{ color: '#2c2c2c', mb: 1 }}>
          The Ethnic Collection
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 600, mx: 'auto' }}>
          Handpicked elegance for the modern woman.
        </Typography>
      </Box>

      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search items..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            minWidth: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              backgroundColor: '#fff',
            }
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{
              borderRadius: '25px',
              backgroundColor: '#fff',
            }}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category === 'all' ? 'All Collections' : category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={4}>
        {filteredProducts.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'transparent',
                borderRadius: 0,
                transition: 'all 0.3s ease',
                '&:hover': {
                  '& .MuiCardMedia-root': {
                    transform: 'scale(1.02)',
                  }
                }
              }}
            >
              <Box sx={{ overflow: 'hidden', borderRadius: 2, position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="450"
                  image={getImageUrl(product.image) || '/placeholder-image.png'}
                  alt={product.name}
                  sx={{
                    objectFit: 'cover',
                    cursor: 'pointer',
                    transition: 'transform 0.6s ease',
                  }}
                  onClick={() => navigate(`/product/${product.id}`)}
                />
                {product.stock <= 5 && product.stock > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      bgcolor: 'error.main',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    LOW STOCK
                  </Box>
                )}
              </Box>
              <CardContent sx={{ px: 0, pt: 2, pb: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.5, mb: 0.5 }}>
                  {product.category.toUpperCase()}
                </Typography>
                <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => navigate(`/product/${product.id}`)}>
                  {product.name}
                </Typography>

                <Typography variant="h6" color="primary" fontWeight="700" sx={{ mt: 'auto', mb: 2 }}>
                  ₹{product.price.toFixed(2)}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleAddToCart(product.id)}
                    sx={{
                      flexGrow: 1,
                      borderRadius: '4px',
                      borderColor: '#2c2c2c',
                      color: '#2c2c2c',
                      '&:hover': {
                        backgroundColor: '#2c2c2c',
                        color: '#fff',
                        borderColor: '#2c2c2c'
                      }
                    }}
                  >
                    Add to Bag
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => navigate(`/product/${product.id}`)}
                    sx={{
                      px: 2,
                      color: 'text.secondary',
                      '&:hover': { backgroundColor: 'transparent', color: 'primary.main' }
                    }}
                  >
                    Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredProducts.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No products found matching your criteria.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProductList;
