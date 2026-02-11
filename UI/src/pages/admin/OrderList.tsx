import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import { fetchAllOrders } from '../../store/slices/adminSlice';
import { RootState, AppDispatch } from '../../store/store';
import DownloadIcon from '@mui/icons-material/Download';

const OrderList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { orders, loading, error } = useSelector((state: RootState) => state.admin);
    const { token } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(fetchAllOrders());
    }, [dispatch]);

    const handleExport = () => {
        // In a real app, you might use axios to get it or just window.open if it's a direct download
        // Since we need the token, we'll create a link and click it or use fetch
        const exportUrl = `${window.location.protocol}//${window.location.host}/api/admin/orders/export`;

        fetch(exportUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders_report_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err => alert('Failed to download report'));
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'shipped': return 'info';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    if (loading && orders.length === 0) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Orders Management
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                >
                    Export CSV
                </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Customer ID</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{order.id.substring(0, 8)}...</TableCell>
                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>{order.userId.substring(0, 8)}...</TableCell>
                                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={order.status.toUpperCase()}
                                        color={getStatusColor(order.status) as any}
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default OrderList;
