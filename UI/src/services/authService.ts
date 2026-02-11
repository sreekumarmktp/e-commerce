import axios from 'axios';
import { LoginResponse } from '../types/auth';

const API_URL = 'http://localhost:3000/api';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, { email, password });
    return response.data;
};

export const register = async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/register`, { email, password });
    return response.data;
};
