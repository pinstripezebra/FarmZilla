import api from './apli-client';
import type { UserData } from '../context/UserContex';

export const userService = {
  // Fetch user by ID
  async getUserById(userId: string): Promise<UserData> {
    const response = await api.get(`/v1/user/?user_id=${userId}`);
    if (!response.data || response.data.length === 0) {
      throw new Error("User not found");
    }
    return response.data[0];
  },

  // Fetch user by username
  async getUserByUsername(username: string): Promise<UserData> {
    const response = await api.get(`/v1/user/?username=${username}`);
    if (!response.data || response.data.length === 0) {
      throw new Error("User not found");
    }
    return response.data[0];
  },

  // Update user profile
  async updateUser(userId: string, userData: Partial<UserData>): Promise<UserData> {
    const response = await api.put(`/v1/user/${userId}`, userData);
    return response.data;
  }
};