import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { fetchDashboardStats, fetchDailySales } from '../../store/slices/adminSlice';
import { RootState, AppDispatch } from '../../store/store';

const Dashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { stats, dailySales, loading, error } = useSelector((state: RootState) => state.admin);

    useEffect(() => {
        dispatch(fetchDashboardStats());
        dispatch(fetchDailySales());
    }, [dispatch]);

    if (loading && !stats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error && !stats) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                Dashboard Overview
            </Typography>

            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, borderRadius: 2 }}>
                        <Typography variant="overline" color="text.secondary">Total Revenue</Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                            ${stats?.totalSales.toFixed(2) || '0.00'}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, borderRadius: 2 }}>
                        <Typography variant="overline" color="text.secondary">Total Orders</Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                            {stats?.totalOrders || 0}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Sales Chart */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Sales Trend (Last 30 Days)
                        </Typography>
                        <Box sx={{ width: '100%', height: 350, mt: 2 }}>
                            <ResponsiveContainer>
                                <AreaChart data={dailySales}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1976d2" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#666', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#666', fontSize: 12 }}
                                        tickFormatter={(value: number) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#1976d2"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
