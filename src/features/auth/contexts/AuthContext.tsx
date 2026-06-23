import { createContext, useContext } from 'react';
import { Usuario } from '../../../shared/lib/mockData';

export interface AuthContextType {
  user: Usuario | null;
  roleName: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<Usuario>) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  confirmResetPassword: (email: string, token: string, newPassword: string) => Promise<boolean>;
  hasPermission: (modulo: string, accion?: 'crear' | 'leer' | 'actualizar' | 'eliminar') => boolean;
  isAuthenticated: boolean;
  refetchProfile: () => Promise<void>;
  updateUser: (updatedData: Partial<Usuario>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};