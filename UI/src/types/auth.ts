export interface User {
    id: string;
    email: string;
    role: 'admin' | 'customer';
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface LoginResponse {
    success: boolean;
    data: {
        token: string;
        user: User;
    };
    message: string;
}
