import api from './apli-client';

export interface Product {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  image_url?: string;
  user_id?: string;
}

export const productService = {
  // Get all products for a specific user
  getUserProducts: async (userId: string): Promise<Product[]> => {
    try {
      const response = await api.get(`/v1/products/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user products:', error);
      throw error;
    }
  },

  // Create a new product
  createProduct: async (productData: {
    product_id: string;
    product_name: string;
    description: string;
    image_url?: string;
    user_id: string;
  }): Promise<Product> => {
    try {
      const response = await api.post('/v1/products/', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Upload file to S3
  uploadFile: async (formData: FormData): Promise<{ message: string }> => {
    try {
      const response = await api.post('/v1/uploadfile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
};

export default productService;