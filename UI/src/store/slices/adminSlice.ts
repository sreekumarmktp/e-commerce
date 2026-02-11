import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface DashboardStats {
    totalOrders: number;
    totalSales: number;
}

interface DailySales {
    date: string;
    sales: number;
}

interface Order {
    id: string;
    userId: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: any[];
}

interface AdminState {
    stats: DashboardStats | null;
    dailySales: DailySales[];
    orders: Order[];
    loading: boolean;
    error: string | null;
}

const initialState: AdminState = {
    stats: null,
    dailySales: [],
    orders: [],
    loading: false,
    error: null,
};

export const fetchDashboardStats = createAsyncThunk(
    'admin/fetchDashboardStats',
    async () => {
        const response = await api.get<{ success: boolean; data: DashboardStats }>('/admin/stats');
        if (!response.data.success) throw new Error('Failed to fetch stats');
        return response.data.data;
    }
);

export const fetchDailySales = createAsyncThunk(
    'admin/fetchDailySales',
    async () => {
        const response = await api.get<{ success: boolean; data: DailySales[] }>('/admin/daily-sales');
        if (!response.data.success) throw new Error('Failed to fetch daily sales');
        return response.data.data;
    }
);

export const fetchAllOrders = createAsyncThunk(
    'admin/fetchAllOrders',
    async () => {
        const response = await api.get<{ success: boolean; data: Order[] }>('/admin/orders');
        if (!response.data.success) throw new Error('Failed to fetch orders');
        return response.data.data;
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Stats
            .addCase(fetchDashboardStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch dashboard stats';
            })
            // Daily Sales
            .addCase(fetchDailySales.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDailySales.fulfilled, (state, action: PayloadAction<DailySales[]>) => {
                state.loading = false;
                state.dailySales = action.payload;
            })
            .addCase(fetchDailySales.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch daily sales';
            })
            // Orders
            .addCase(fetchAllOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
                state.loading = false;
                state.orders = action.payload;
            })
            .addCase(fetchAllOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch orders';
            });
    },
});

export default adminSlice.reducer;
