import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { fetchProducts, deleteProduct } from '../../store/slices/productSlice';
import { RootState, AppDispatch } from '../../store/store';
import { getImageUrl } from '../../utils/imageUtils';

const AdminProductList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { products, loading } = useSelector((state: RootState) => state.products);

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await dispatch(deleteProduct(id)); // Assuming deleteProduct thunk exists or will exist
            dispatch(fetchProducts());
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Products</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/admin/products/new')}
                >
                    Add Product
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Image</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Stock</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <img src={getImageUrl(product.image)} alt={product.name} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                                </TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>₹{product.price.toFixed(2)}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => navigate(`/admin/products/${product.id}`)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(product.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AdminProductList;
