import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../../../shared/lib/mockData';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: Usuario | null;
  roleName: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<Usuario>) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  confirmResetPassword: (email: string, token: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setRoleName(userData.rol || userData.rol_nombre || null);
      }
    } catch (e) {
      console.error("Error leyendo sesión:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, contrasena: password }) 
      });
      
      if (response.success) {
        const userToSave = response.user;
        const token = response.token;
        
        setUser(userToSave);
        setRoleName(userToSave.rol || userToSave.rol_nombre);
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setRoleName(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const register = async (userData: Partial<Usuario>): Promise<boolean> => {
    try {
      const response = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre: userData.nombre,
          email: userData.email,
          password: userData.password,
          telefono: userData.telefono
        })
      });
      return response.success;
    } catch (error) {
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (response.success) {
        toast.success(response.message || 'Correo de recuperación enviado.');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'No se pudo procesar la recuperación.');
      return false;
    }
  };

  const confirmResetPassword = async (email: string, token: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token, newPassword })
      });

      if (response.success) {
        toast.success(response.message);
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'El enlace es inválido o ha caducado.');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, roleName, isLoading, login, register, logout, resetPassword, confirmResetPassword, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};