import { create } from 'zustand';
import api from '@/lib/axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'kitchen' | 'rider';
  phone?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: (token, user) => {
    localStorage.setItem('auth_token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('auth_token');
      set({ token: null, user: null, isAuthenticated: false });
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
  setUser: (user) => set({ user }),
}));
