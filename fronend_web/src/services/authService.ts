import { springApi } from './api';
import { ENDPOINTS } from '../config/api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await springApi.post(ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await springApi.post(ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await springApi.get(ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await springApi.put(ENDPOINTS.AUTH.UPDATE_PROFILE, data);
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await springApi.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, { oldPassword, newPassword });
  },
};
