import apiClient from './apiClient';
import reviewService from './reviewService';

export type Gender = 'MEN' | 'WOMEN' | 'KIDS' | 'GENZ' | 'OTHER';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stockQuantity: number;
  isActive: boolean;
  gender: Gender;
  averageRating?: number;
  reviewCount?: number;
  orderCount?: number;
}

const productService = {
  getAllProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get('/products');
      return response.data.map((product: any) => ({
        ...product,
        stockQuantity: product.stock,
        isActive: product.active,
        gender: product.gender || 'OTHER'
      }));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  },

  getAllProductsIncludingInactive: async (): Promise<Product[]> => {
    try {
      // First try the /products/all endpoint
      try {
        const response = await apiClient.get('/products/all');
        return response.data.map((product: any) => ({
          ...product,
          stockQuantity: product.stock,
          isActive: product.active,
          gender: product.gender || 'OTHER'
        }));
      } catch (allError) {
        console.warn('Error getting all products from /products/all:', allError);
        
        // Fall back to regular endpoint and include both active and inactive products
        const response = await apiClient.get('/products?includeInactive=true');
        return response.data.map((product: any) => ({
          ...product,
          stockQuantity: product.stock,
          isActive: product.active,
          gender: product.gender || 'OTHER'
        }));
      }
    } catch (error) {
      console.error('Failed to fetch all products including inactive:', error);
      return [];
    }
  },

  getProductById: async (id: number): Promise<Product> => {
    if (isNaN(id)) {
      throw new Error('Invalid product ID');
    }
    
    try {
      const response = await apiClient.get(`/products/${id}`);
      if (!response.data.id) {
        throw new Error('Product data is invalid');
      }
      return {
        ...response.data,
        stockQuantity: response.data.stock,
        isActive: response.data.active,
        gender: response.data.gender || 'OTHER'
      };
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      throw error;
    }
  },

  getProductByIdAdmin: async (id: number): Promise<Product> => {
    if (isNaN(id)) {
      throw new Error('Invalid product ID');
    }
    
    try {
      // Use the admin-specific endpoint that can fetch both active and inactive products
      const response = await apiClient.get(`/products/admin/${id}`);
      if (!response.data.id) {
        throw new Error('Product data is invalid');
      }
      return {
        ...response.data,
        stockQuantity: response.data.stock,
        isActive: response.data.active,
        gender: response.data.gender || 'OTHER'
      };
    } catch (error) {
      console.error(`Failed to fetch product ${id} for admin:`, error);
      throw error;
    }
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get(`/products/search?query=${query}`);
      return response.data.map((product: any) => ({
        ...product,
        stockQuantity: product.stock,
        isActive: product.active,
        gender: product.gender || 'OTHER'
      }));
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  },

  filterProducts: async (category?: string, minPrice?: number, maxPrice?: number, gender?: string): Promise<Product[]> => {
    try {
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
      if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
      if (gender) params.append('gender', gender);
      
      const response = await apiClient.get(`/products/filter?${params.toString()}`);
      return response.data.map((product: any) => ({
        ...product,
        stockQuantity: product.stock,
        isActive: product.active,
        gender: product.gender || 'OTHER'
      }));
    } catch (error) {
      console.error('Failed to filter products:', error);
      return [];
    }
  },

  getProductsByGender: async (gender: string): Promise<Product[]> => {
    try {
      // Ensure we're using the correct API path structure
      const response = await apiClient.get(`/products/gender/${gender}`);
      return response.data.map((product: any) => ({
        ...product,
        stockQuantity: product.stock,
        isActive: product.active,
        gender: product.gender || 'OTHER'
      }));
    } catch (error) {
      console.error(`Failed to get products by gender ${gender}:`, error);
      return [];
    }
  },

  // Admin operations
  createProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const { stockQuantity, isActive, gender, ...rest } = productData;
    try {
      const response = await apiClient.post('/products', {
        ...rest,
        stock: stockQuantity,
        active: isActive,
        gender: gender || 'OTHER'
      });
      return {
        ...response.data,
        stockQuantity: response.data.stock,
        isActive: response.data.active,
        gender: response.data.gender || 'OTHER'
      };
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  },

  updateProduct: async (id: number, productData: Partial<Product>): Promise<Product> => {
    // Create a direct mapping to backend format, ensuring category and gender are preserved
    const requestData: Record<string, any> = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stockQuantity,
      active: productData.isActive,
      imageUrl: productData.imageUrl,
      category: productData.category,
      gender: productData.gender
    };
    
    // Remove undefined properties
    Object.keys(requestData).forEach(key => 
      requestData[key] === undefined && delete requestData[key]
    );
    
    console.log('Updating product with data:', requestData);
    
    try {
      const response = await apiClient.put(`/products/${id}`, requestData);
      return {
        ...response.data,
        stockQuantity: response.data.stock,
        isActive: response.data.active,
        gender: response.data.gender || 'OTHER'
      };
    } catch (error) {
      console.error(`Failed to update product ${id}:`, error);
      throw error;
    }
  },

  deleteProduct: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      throw error;
    }
  },

  getProductRating: async (id: number): Promise<number> => {
    try {
      return await reviewService.getProductRating(id);
    } catch (error) {
      console.error(`Failed to fetch rating for product ${id}:`, error);
      return 0;
    }
  },

  getProductOrderCount: async (id: number): Promise<number> => {
    try {
      // Get order count from backend
      const response = await apiClient.get(`/products/${id}/order-count`);
      return response.data;
    } catch (error) {
      const backendError = error as Error;
      console.error(`Failed to get order count for product ${id}:`, backendError);
      return 0;
    }
  }
};

export default productService; 