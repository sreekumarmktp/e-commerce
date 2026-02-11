export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    userId: string;
    totalAmount: number;
    status: 'pending' | 'paid' | 'shipped' | 'cancelled';
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOrderRequest {
    items: {
        productId: string;
        quantity: number;
    }[];
}
