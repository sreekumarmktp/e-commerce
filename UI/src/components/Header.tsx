import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Badge,
  IconButton,
  Box,
} from '@mui/material';
import { ShoppingCart, Store, AccountCircle } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { fetchCart } from '../store/slices/cartSlice';
import { selectCartItemCount } from '../store/selectors/cartSelectors';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const cartItemCount = useSelector(selectCartItemCount);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Fetch cart on component mount
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'white', borderBottom: '1px solid #eee', color: '#2c2c2c' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              fontFamily: '"Inter", sans-serif',
              color: '#2c2c2c'
            }}
          >
            LUMINA
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, letterSpacing: 1 }}
          >
            Collections
          </Button>

          {isAuthenticated && user?.role === 'admin' && (
            <Button
              color="inherit"
              onClick={() => navigate('/admin/dashboard')}
              sx={{ textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, letterSpacing: 1 }}
            >
              Admin
            </Button>
          )}

          <IconButton
            color="inherit"
            onClick={() => navigate('/cart')}
            sx={{ ml: 1 }}
          >
            <Badge badgeContent={cartItemCount} color="secondary" sx={{ '& .MuiBadge-badge': { backgroundColor: '#d4a373', color: 'white' } }}>
              <ShoppingCart />
            </Badge>
          </IconButton>

          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="inherit" onClick={() => navigate('/profile')}>
                <AccountCircle sx={{ fontSize: '1.8rem' }} />
              </IconButton>
              <Button
                color="inherit"
                onClick={handleLogout}
                sx={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Logout
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                textTransform: 'uppercase',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '20px',
                px: 3,
                boxShadow: 'none',
                backgroundColor: '#2c2c2c',
                '&:hover': { backgroundColor: '#000', boxShadow: 'none' }
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

