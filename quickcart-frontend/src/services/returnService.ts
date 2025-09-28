import apiClient from './apiClient';

export enum ReturnReason {
  DAMAGED = 'DAMAGED',
  WRONG_ITEM = 'WRONG_ITEM',
  CHANGED_MIND = 'CHANGED_MIND',
  UNSATISFIED = 'UNSATISFIED',
  OTHER = 'OTHER'
}

export enum ReturnStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
  PROCESSED = 'PROCESSED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUNDED = 'REFUNDED',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface ReturnItem {
  id: number;
  orderItemId: number;
  quantity: number;
  reason: string;
  productName: string;
  productPrice: number;
  refundAmount: number;
  imageUrl?: string;
}

export interface ReturnRequest {
  id: number;
  orderId: number;
  customerEmail: string;
  status: ReturnStatus;
  createdAt: string;
  returnItems: ReturnItem[];
  totalRefundAmount: number;
  comments?: string;
}

export interface CreateReturnRequest {
  orderId: number;
  type: string;
  reason: string;
  items?: {
    orderItemId: number;
    quantity: number;
    reason?: string;
  }[];
}

const returnService = {
  getReturnRequests: async (): Promise<ReturnRequest[]> => {
    try {
      const response = await apiClient.get('/returns');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch return requests:', error);
      return [];
    }
  },

  getAllReturns: async (): Promise<ReturnRequest[]> => {
    try {
      const response = await apiClient.get('/returns/admin');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all returns:', error);
      return [];
    }
  },

  getUserReturnsByEmail: async (email: string): Promise<ReturnRequest[]> => {
    try {
      const response = await apiClient.get(`/returns/user/${email}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch returns for user ${email}:`, error);
      return [];
    }
  },

  getReturnRequestById: async (returnId: number): Promise<ReturnRequest> => {
    try {
      const response = await apiClient.get(`/returns/${returnId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch return ${returnId}:`, error);
      throw error;
    }
  },
  
  getOrderReturns: async (orderId: number): Promise<ReturnRequest[]> => {
    try {
      const response = await apiClient.get(`/returns?orderId=${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch returns for order ${orderId}:`, error);
      return [];
    }
  },

  createReturnRequest: async (returnRequest: CreateReturnRequest): Promise<ReturnRequest> => {
    try {
      const response = await apiClient.post('/returns', returnRequest);
      return response.data;
    } catch (error) {
      console.error('Failed to create return request:', error);
      throw error;
    }
  },

  cancelReturnRequest: async (returnId: number): Promise<ReturnRequest> => {
    try {
      const response = await apiClient.patch(`/returns/${returnId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Failed to cancel return ${returnId}:`, error);
      throw error;
    }
  },
  
  updateReturnStatus: async (returnId: number, status: string): Promise<ReturnRequest> => {
    try {
      const response = await apiClient.patch(`/returns/${returnId}/status?newStatus=${status}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to update return status for ${returnId}:`, error);
      throw error;
    }
  },

  getReturnItemsForRequest: async (returnRequestId: number): Promise<ReturnItem[]> => {
    try {
      const response = await apiClient.get(`/return-items/return-request/${returnRequestId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch return items for request ${returnRequestId}:`, error);
      return [];
    }
  }
  
};

export default returnService; 