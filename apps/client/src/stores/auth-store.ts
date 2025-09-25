import { defineStore, acceptHMRUpdate } from 'pinia';
import { api } from 'boot/axios';
import { Notify } from 'quasar';

export interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  nickName: string;
  email: string;
  fullName: string;
  emailVerifiedAt?: string;
  sessionTimeoutDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: number;
  deviceName: string | null;
  deviceType: 'web' | 'desktop' | 'mobile';
  ipAddress: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  isCurrent: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: {
      type: string;
      token: string;
    };
  };
  errors?: Record<string, string>;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data?: User;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('auth_token') || null,
    isLoading: false,
    sessions: [] as Session[],
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isGuest: (state) => !state.token || !state.user,
  },

  actions: {
    setAuthHeaders() {
      if (this.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    },

    async register(data: {
      firstName?: string;
      lastName?: string;
      nickName: string;
      email: string;
      password: string;
    }) {
      this.isLoading = true;
      try {
        const response = await api.post<AuthResponse>('/api/auth/register', data);

        if (response.data.success && response.data.data) {
          console.log(response.data);

          this.user = response.data.data.user;
          this.token = response.data.data.token.token;
          localStorage.setItem('auth_token', this.token);
          this.setAuthHeaders();

          Notify.create({
            type: 'positive',
            message: response.data.message,
          });

          return { success: true };
        } else {
          return { success: false, errors: response.data.errors };
        }
      } catch (error: any) {
        console.log(error);
        const errors = error.response?.data?.errors || {
          general: error.response?.data?.message || 'Registration failed',
        };
        return { success: false, errors };
      } finally {
        this.isLoading = false;
      }
    },

    async login(email: string, password: string) {
      this.isLoading = true;
      try {
        const response = await api.post<AuthResponse>('/api/auth/login', { email, password });

        if (response.data.success && response.data.data) {
          this.user = response.data.data.user;
          this.token = response.data.data.token.token;
          localStorage.setItem('auth_token', this.token);
          this.setAuthHeaders();

          Notify.create({
            type: 'positive',
            message: response.data.message,
          });

          return { success: true };
        } else {
          return { success: false, message: response.data.message };
        }
      } catch (error: any) {
        const message = error.response?.data?.message || 'Login failed';
        return { success: false, message };
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      this.isLoading = true;
      try {
        await api.post('/api/auth/logout');
        Notify.create({
          type: 'positive',
          message: 'Logged out successfully',
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearAuthData();
        this.isLoading = false;
      }
    },

    async logoutAll() {
      this.isLoading = true;
      try {
        await api.delete('/api/auth/logout-all');
        Notify.create({
          type: 'positive',
          message: 'Logged out from all devices',
        });
      } catch (error: any) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to logout from all devices',
        });
      } finally {
        this.clearAuthData();
        this.isLoading = false;
      }
    },

    async fetchUser() {
      if (!this.token) return false;

      this.setAuthHeaders();
      try {
        const response = await api.get<UserResponse>('/api/auth/me');

        console.log(response);
        if (response.data.success && response.data.data) {
          this.user = response.data.data as User;
          return true;
        } else {
          this.clearAuthData();
          return false;
        }
      } catch (error) {
        this.clearAuthData();
        return false;
      }
    },

    async fetchSessions() {
      this.isLoading = true;
      try {
        const response = await api.get<{ success: boolean; data: Session[] }>('/api/auth/sessions');

        if (response.data.success) {
          this.sessions = response.data.data;
        }
      } catch (error: any) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch sessions',
        });
      } finally {
        this.isLoading = false;
      }
    },

    async revokeSession(sessionId: number) {
      try {
        const response = await api.delete<AuthResponse>(`/api/auth/sessions/${sessionId}`);

        if (response.data.success) {
          await this.fetchSessions();
          Notify.create({
            type: 'positive',
            message: response.data.message,
          });
        }
      } catch (error: any) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to revoke session',
        });
      }
    },

    clearAuthData() {
      this.user = null;
      this.token = null;
      this.sessions = [];
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
    },

    async initAuth() {
      if (this.token) {
        const success = await this.fetchUser();

        if (!success) {
          this.clearAuthData();
        }
      }
    },

  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
