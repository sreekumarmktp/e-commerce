import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import AdminLayout from './pages/admin/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/admin/Dashboard';
import AdminProductList from './pages/admin/ProductList';
import AdminProductForm from './pages/admin/ProductForm';
import AdminOrderList from './pages/admin/OrderList';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Container, Box } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2c2c2c', // Sophisticated Off-Black
      light: '#555555',
      dark: '#000000',
    },
    secondary: {
      main: '#d4a373', // Elegant Camel/Gold
      light: '#e9edc9',
      dark: '#a98467',
    },
    background: {
      default: '#ffffff',
      paper: '#fefefe',
    },
    text: {
      primary: '#2c2c2c',
      secondary: '#6b705c',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <Router>
            <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
              <Header />
              <Container maxWidth="lg" sx={{ py: 4 }}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<ProductList />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<AdminProductList />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/:id" element={<AdminProductForm />} />
                    <Route path="orders" element={<AdminOrderList />} />
                  </Route>
                </Routes>
              </Container>
            </Box>
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
