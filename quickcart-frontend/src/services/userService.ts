import apiClient from './apiClient';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}

export interface UserResponse {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  gender?: Gender;
  dob?: string;
  createdAt?: string;
  deleted?: boolean;
  deletedAt?: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: Gender;
  dob?: string;
}

const userService = {
  // Admin-only: Get all users
  getAllUsers: async (): Promise<UserResponse[]> => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },
  
  // Admin-only: Get all users including deleted ones
  getAllUsersIncludingDeleted: async (): Promise<UserResponse[]> => {
    try {
      const response = await apiClient.get('/users/all');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all users:', error);
      throw error;
    }
  },
  
  // Get user by email (can be used by admin or the user themselves)
  getUserByEmail: async (email: string): Promise<UserResponse> => {
    try {
      const response = await apiClient.get(`/users/${email}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user with email ${email}:`, error);
      throw error;
    }
  },
  
  // Update user (can be used by admin or the user themselves)
  updateUser: async (email: string, userData: UserUpdateRequest): Promise<UserResponse> => {
    try {
      const response = await apiClient.put(`/users/${email}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update user with email ${email}:`, error);
      throw error;
    }
  },
  
  // Delete user (can be used by admin or the user themselves)
  deleteUser: async (email: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/${email}`);
    } catch (error) {
      console.error(`Failed to delete user with email ${email}:`, error);
      throw error;
    }
  }
};

export default userService; 