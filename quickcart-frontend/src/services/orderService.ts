import apiClient from './apiClient';
import returnService from './returnService';

export enum OrderStatus {
  ORDER_PLACED = 'ORDER_PLACED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURN_APPROVED = 'RETURN_APPROVED', 
  RETURNED = 'RETURNED',
  PARTIALLY_RETURNED = 'PARTIALLY_RETURNED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  COD = 'COD',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  UPI = 'UPI',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET'
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  shippingFee: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  items: OrderItem[];
  placedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  trackingNumber?: string;
  expectedDeliveryDate?: string;
  customerName?: string;
  customerEmail?: string;
  refundDeadline?: string;
  cancellationReason?: string;
}

// Sample orders for development - removed due to TypeScript errors

export interface PlaceOrderRequest {
  shippingAddressId: number;
  paymentMethod: string;
}

const orderService = {
  placeOrder: async (request: PlaceOrderRequest): Promise<Order> => {
    try {
      console.log('Placing order with data:', request);
      const response = await apiClient.post('/orders', request);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  },

  getOrderDetails: async (orderId: number): Promise<Order> => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },

  getUserOrders: async (): Promise<Order[]> => {
    try {
      console.log('Fetching user orders...');
      
      // Get the current user's email from local storage
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('User email not found in localStorage');
        return [];
      }
      
      // Call the correct endpoint from the OrderController
      const response = await apiClient.get(`/orders/user/${userEmail}`);
      const orders = response.data || [];
      
      // For each order, check if there are any active return requests
      for (const order of orders) {
        try {
          const returnData = await returnService.getOrderReturns(order.id);
          if (Array.isArray(returnData) && returnData.length > 0) {
            // Check if there's an active return request
            const active = returnData.find(r => 
              r.status !== 'CANCELLED' && 
              r.status !== 'REFUNDED'
            );
            
            if (active) {
              // Update order status based on return status - keep APPROVED as RETURN_REQUESTED
              switch (active.status) {
                case 'REQUESTED':
                  order.status = OrderStatus.RETURN_REQUESTED;
                  break;
                case 'APPROVED':
                  order.status = OrderStatus.RETURN_REQUESTED; // Keep as RETURN_REQUESTED for consistency
                  break;
                case 'PROCESSED':
                  // Check if all items are returned (full return) or some items (partial)
                  const totalOrderItems = order.items ? order.items.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;
                  const totalReturnedItems = active.returnItems ? active.returnItems.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;
                  order.status = totalOrderItems === totalReturnedItems ? 
                    OrderStatus.RETURNED : OrderStatus.PARTIALLY_RETURNED;
                  break;
                case 'REFUND_INITIATED':
                  order.status = OrderStatus.REFUND_INITIATED;
                  break;
                case 'REFUNDED':
                  order.status = OrderStatus.REFUNDED;
                  break;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch return requests for order ${order.id}:`, err);
        }
      }
      
      console.log('Orders response:', orders);
      return orders;
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  cancelOrder: async (orderId: number, reason: string): Promise<Order> => {
    try {
      const response = await apiClient.patch(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  },

  updatePayment: async (orderId: number, paymentInfo: any): Promise<Order> => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/payments`, paymentInfo);
      return response.data;
    } catch (error) {
      console.error(`Error updating payment for order ${orderId}:`, error);
      throw error;
    }
  },

  requestReturn: async (orderId: number, items: { productId: number, quantity: number }[], reason: string): Promise<any> => {
    try {
      // First get the order details to map productId to orderItemId
      const response = await apiClient.get(`/orders/${orderId}`);
      const order = response.data;
      
      // Create a mapping from productId to orderItemId
      const productToOrderItemMap: Record<number, number> = {};
      if (order && order.items) {
        order.items.forEach((item: OrderItem) => {
          if (item.productId) {
            productToOrderItemMap[item.productId] = item.id;
          }
        });
      }
      
      // Map the return items using the correct orderItemId
      const returnItems = items
        .filter(item => item.quantity > 0)
        .map(item => {
          const orderItemId = productToOrderItemMap[item.productId];
          if (!orderItemId) {
            console.error(`Could not find orderItemId for productId: ${item.productId}`);
          }
          return {
            orderItemId: orderItemId,
            quantity: item.quantity,
            reason: reason
          };
        });
      
      // Check if we have any valid items to return
      if (returnItems.length === 0) {
        throw new Error("No valid items to return");
      }
      
      // Build the request
      const request = {
        orderId: orderId,
        type: returnItems.length === order.items.length ? "FULL" : "PARTIAL",
        reason: reason,
        items: returnItems
      };
      
      return await returnService.createReturnRequest(request);
    } catch (error) {
      console.error(`Error requesting return for order ${orderId}:`, error);
      throw error;
    }
  },

  getReturnById: async (returnId: number): Promise<any> => {
    return returnService.getReturnRequestById(returnId);
  },

  cancelReturnRequest: async (returnId: number): Promise<any> => {
    return returnService.cancelReturnRequest(returnId);
  },
  
  getOrderReturns: async (orderId: number): Promise<any[]> => {
    return returnService.getOrderReturns(orderId);
  },

  createOrder: async (orderData: Omit<Order, 'id' | 'status' | 'placedAt' | 'shippedAt' | 'deliveredAt'>): Promise<Order> => {
    try {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  getAllOrders: async (): Promise<Order[]> => {
    try {
      // Try the correct endpoint for all orders
      try {
        const response = await apiClient.get('/orders');
        return response.data;
      } catch (error) {
        console.warn('Error accessing /orders endpoint:', error);
        
        // Try with full URL as fallback
        try {
          const response = await apiClient.get('http://localhost:8765/api/orders');
          return response.data;
        } catch (fullUrlError) {
          console.warn('Error accessing full URL orders endpoint:', fullUrlError);
          
          // Last resort fallback with query parameter
          const response = await apiClient.get('/orders?admin=true');
          return response.data;
        }
      }
    } catch (error) {
      console.error('Failed to fetch all orders:', error);
      throw error;
    }
  },

  getUserOrdersByEmail: async (email: string): Promise<Order[]> => {
    try {
      let orders: Order[] = [];
      
      // Try the correct endpoint for user orders
      try {
        const response = await apiClient.get(`/orders/user/${email}`);
        orders = response.data;
      } catch (error) {
        console.warn(`Error accessing /orders/user/${email} endpoint:`, error);
        
        // Try with full URL as fallback
        try {
          const response = await apiClient.get(`http://localhost:8765/api/orders/user/${email}`);
          orders = response.data;
        } catch (fullUrlError) {
          console.warn(`Error accessing full URL orders/user/${email} endpoint:`, fullUrlError);
          
          // Last resort fallback
          throw new Error(`Failed to fetch orders for user ${email}`);
        }
      }
      
      // For each order, check if there are any active return requests
      for (const order of orders) {
        try {
          const returnData = await returnService.getOrderReturns(order.id);
          if (Array.isArray(returnData) && returnData.length > 0) {
            // Check if there's an active return request
            const active = returnData.find(r => 
              r.status !== 'CANCELLED' && 
              r.status !== 'REFUNDED'
            );
            
            if (active) {
              // Update order status based on return status - keep APPROVED as RETURN_REQUESTED
              switch (active.status) {
                case 'REQUESTED':
                  order.status = OrderStatus.RETURN_REQUESTED;
                  break;
                case 'APPROVED':
                  order.status = OrderStatus.RETURN_REQUESTED; // Keep as RETURN_REQUESTED for consistency
                  break;
                case 'PROCESSED':
                  // Check if all items are returned (full return) or some items (partial)
                  const totalOrderItems = order.items ? order.items.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;
                  const totalReturnedItems = active.returnItems ? active.returnItems.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;
                  order.status = totalOrderItems === totalReturnedItems ? 
                    OrderStatus.RETURNED : OrderStatus.PARTIALLY_RETURNED;
                  break;
                case 'REFUND_INITIATED':
                  order.status = OrderStatus.REFUND_INITIATED;
                  break;
                case 'REFUNDED':
                  order.status = OrderStatus.REFUNDED;
                  break;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch return requests for order ${order.id}:`, err);
        }
      }
      
      return orders;
    } catch (error) {
      console.error(`Failed to fetch orders for user ${email}:`, error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId: number, status: OrderStatus, trackingNumber?: string): Promise<Order> => {
    try {
      const params = new URLSearchParams();
      params.append('status', status);
      if (trackingNumber) {
        params.append('trackingNumber', trackingNumber);
      }
      
      const response = await apiClient.patch(`/orders/${orderId}/status?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to update status for order ${orderId}:`, error);
      throw error;
    }
  },

  approveReturn: async (returnId: number): Promise<any> => {
    try {
      const response = await apiClient.patch(`/returns/${returnId}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Failed to approve return ${returnId}:`, error);
      throw error;
    }
  },

  updateReturnStatus: async (returnId: number, status: string): Promise<any> => {
    try {
      const params = new URLSearchParams();
      params.append('newStatus', status);
      
      const response = await apiClient.patch(`/returns/${returnId}/status?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to update status for return ${returnId}:`, error);
      throw error;
    }
  },

  getOrderItemById: async (orderItemId: number): Promise<any> => {
    const response = await apiClient.get(`/order-items/${orderItemId}`);
    return response.data;
  }
};

export default orderService; 