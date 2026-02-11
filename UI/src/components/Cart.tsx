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
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  ArrowBack,
  ClearAll,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store/store';
import { fetchCart, updateCartItem, removeFromCart, clearCart, clearError } from '../store/slices/cartSlice';

const Cart: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { cart, loading, error } = useSelector((state: RootState) => state.cart);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    if (cart) {
      const initialQuantities: { [key: string]: number } = {};
      cart.items.forEach(item => {
        initialQuantities[item.id] = item.quantity;
      });
      setQuantities(initialQuantities);
    }
  }, [cart]);

  // Show snackbar when error occurs
  useEffect(() => {
    if (error) {
      setSnackbarOpen(true);
    }
  }, [error]);

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
    dispatch(clearError());
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
      dispatch(updateCartItem({ itemId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    navigate('/checkout');
  };

  if (loading && !cart) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your cart is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Start shopping to add items to your cart
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          startIcon={<ArrowBack />}
        >
          Continue Shopping
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<ClearAll />}
          onClick={handleClearCart}
        >
          Clear Cart
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Shopping Cart
      </Typography>

      <Grid container spacing={3}>
        {/* Cart Items */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Cart Items ({cart.itemCount})
          </Typography>

          {cart.items.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 3, sm: 2 }}>
                    <CardMedia
                      component="img"
                      height="80"
                      image={item.productImage}
                      alt={item.productName}
                      sx={{ objectFit: 'cover', borderRadius: 1 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 9, sm: 4 }}>
                    <Typography variant="h6" component="h3" noWrap>
                      {item.productName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{item.price.toFixed(2)} each
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || item.quantity) - 1)}
                        disabled={(quantities[item.id] || item.quantity) <= 1}
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>

                      <Typography 
                        variant="body1" 
                        sx={{ 
                          minWidth: 40, 
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}
                      >
                        {quantities[item.id] || item.quantity}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || item.quantity) + 1)}
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 3, sm: 2 }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      ₹{item.totalPrice.toFixed(2)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 3, sm: 2 }}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* Cart Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h5" gutterBottom>
              Order Summary
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Items ({cart.itemCount})</Typography>
                <Typography variant="body1">₹{cart.totalAmount.toFixed(2)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Shipping</Typography>
                <Typography variant="body1" color="success.main">
                  Free
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Tax</Typography>
                <Typography variant="body1">₹0.00</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Total</Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                ₹{cart.totalAmount.toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={cart.items.length === 0}
              sx={{ py: 1.5 }}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              Secure checkout powered by Stripe
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Cart;
