import apiClient from './apiClient';

export interface Address {
  id: number;
  addressLine1: string;
  addressLine2?: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  postalCode?: string;
  country: string;
  landmark?: string;
  isDefault: boolean;
  name?: string;
  recipientName?: string;
  phone?: string;
  recipientPhone?: string;
  email?: string;
  type: string; // HOME, OFFICE, OTHER
  isSameAsUser?: boolean;
  defaultAddress?: boolean;
}

export interface AddressRequest {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  isDefault: boolean;
  type: string; // HOME, OFFICE, OTHER
  isSameAsUser: boolean;
}

const addressService = {
  getAllAddresses: async (): Promise<Address[]> => {
    try {
      const response = await apiClient.get('/addresses');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      return [];
    }
  },

  getUserAddresses: async (): Promise<Address[]> => {
    try {
      console.log('Fetching user addresses...');
      const response = await apiClient.get('/addresses');
      console.log('User addresses response:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch user addresses:', error);
      return []; // Return empty array instead of throwing
    }
  },

  getAddressById: async (id: number): Promise<Address> => {
    try {
      const response = await apiClient.get(`/addresses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch address ${id}:`, error);
      throw error;
    }
  },

  createAddress: async (addressData: AddressRequest): Promise<Address> => {
    try {
      // Convert postalCode to zipCode if backend expects zipCode
      const dataToSend = {
        ...addressData,
        zipCode: addressData.postalCode,
        recipientName: addressData.name,
        recipientPhone: addressData.phone
      };
      const response = await apiClient.post('/addresses', dataToSend);
      return response.data;
    } catch (error) {
      console.error('Failed to create address:', error);
      throw error;
    }
  },

  updateAddress: async (id: number, addressData: Partial<AddressRequest>): Promise<Address> => {
    try {
      // Convert postalCode to zipCode if backend expects zipCode
      const dataToSend: { [key: string]: any } = {
        ...addressData
      };
      
      if (addressData.postalCode) {
        dataToSend.zipCode = addressData.postalCode;
      }

      if (addressData.name) {
        dataToSend.recipientName = addressData.name;
      }

      if (addressData.phone) {
        dataToSend.recipientPhone = addressData.phone;
      }
      
      const response = await apiClient.put(`/addresses/${id}`, dataToSend);
      return response.data;
    } catch (error) {
      console.error(`Failed to update address ${id}:`, error);
      throw error;
    }
  },

  deleteAddress: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/addresses/${id}`);
    } catch (error) {
      console.error(`Failed to delete address ${id}:`, error);
      throw error;
    }
  },

  setDefaultAddress: async (id: number): Promise<Address> => {
    try {
      console.log(`Setting address ${id} as default`);
      // Using POST instead of PUT as the backend doesn't support PUT for this endpoint
      const response = await apiClient.post(`/addresses/${id}/default`);
      return response.data;
    } catch (error) {
      console.error(`Failed to set address ${id} as default:`, error);
      throw error;
    }
  }
};

export default addressService; 