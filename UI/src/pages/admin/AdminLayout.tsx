import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HomeIcon from '@mui/icons-material/Home';
import { logout } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store/store';

const drawerWidth = 240;

const AdminLayout: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Admin Dashboard
                    </Typography>
                    <Button color="inherit" onClick={() => navigate('/')}>View Store</Button>
                    <Button color="inherit" onClick={handleLogout} startIcon={<ExitToAppIcon />}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        <ListItemButton onClick={() => navigate('/admin/dashboard')}>
                            <ListItemIcon>
                                <DashboardIcon />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItemButton>
                        <ListItemButton onClick={() => navigate('/admin/products')}>
                            <ListItemIcon>
                                <ShoppingBagIcon />
                            </ListItemIcon>
                            <ListItemText primary="Products" />
                        </ListItemButton>
                        <ListItemButton onClick={() => navigate('/admin/orders')}>
                            <ListItemIcon>
                                <ShoppingBagIcon />
                            </ListItemIcon>
                            <ListItemText primary="Orders" />
                        </ListItemButton>
                        <ListItemButton onClick={() => navigate('/')}>
                            <ListItemIcon>
                                <HomeIcon />
                            </ListItemIcon>
                            <ListItemText primary="Back to Store" />
                        </ListItemButton>
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;
