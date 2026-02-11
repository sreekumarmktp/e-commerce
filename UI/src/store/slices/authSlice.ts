import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginResponse } from '../../types/auth';
import { login as loginApi, register as registerApi } from '../../services/authService';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    userId: string;
    role: 'admin' | 'customer';
    exp: number;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: false,
    error: null,
};

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }) => {
        const response = await loginApi(email, password);
        if (!response.success) throw new Error(response.message);

        // Store token
        localStorage.setItem('token', response.data.token);
        return response.data;
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async ({ email, password }: { email: string; password: string }) => {
        const response = await registerApi(email, password);
        if (!response.success) throw new Error(response.message);

        // Store token
        localStorage.setItem('token', response.data.token);
        return response.data;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('token');
        },
        checkAuth: (state) => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode<DecodedToken>(token);
                    if (decoded.exp * 1000 < Date.now()) {
                        // Token expired
                        state.user = null;
                        state.token = null;
                        state.isAuthenticated = false;
                        localStorage.removeItem('token');
                    } else {
                        state.token = token;
                        state.isAuthenticated = true;
                        // Optimistically set user role/id from token
                        state.user = {
                            id: decoded.userId,
                            email: '', // We might need to fetch profile to get email if not in token
                            role: decoded.role,
                        };
                    }
                } catch (e) {
                    state.user = null;
                    state.token = null;
                    state.isAuthenticated = false;
                    localStorage.removeItem('token');
                }
            }
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse['data']>) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = action.payload.user;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Login failed';
            })
            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action: PayloadAction<LoginResponse['data']>) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = action.payload.user;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Registration failed';
            });
    },
});

export const { logout, checkAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
