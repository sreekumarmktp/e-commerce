import { api } from './api';
import { ApiResponse } from '../types/api';

export interface OrderItem {
    productId: string;
    quantity: number;
}

export interface CreateOrderRequest {
    items: OrderItem[];
}

export interface Order {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
}

export const createOrder = async (items: OrderItem[]): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>('/orders', { items });
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
};

export const getUserOrders = async (): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>('/orders');
    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
};
