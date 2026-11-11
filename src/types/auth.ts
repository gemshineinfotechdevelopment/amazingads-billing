export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

