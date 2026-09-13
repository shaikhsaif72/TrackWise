import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    return response.data?.data || response.data;
  },
  register: async (email, password, name) => {
    const response = await api.post('/api/v1/auth/register', { email, password, name });
    return response.data?.data || response.data;
  },
};