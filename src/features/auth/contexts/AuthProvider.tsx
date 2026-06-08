import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { Usuario } from '../../../shared/lib/mockData';
import { fetchApi, AuthError } from '../../../lib/api';
import { toast } from 'sonner';

// Helper reutilizable para verificar si un rol es Administrador
const isAdminRole = (role?: string | null): boolean => {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === 'administrador' || r === 'admin';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hasPermission = (modulo: string, accion: 'crear' | 'leer' | 'actualizar' | 'eliminar' = 'leer'): boolean => {
    if (!user) return false;

    // Admin o Administrador siempre tienen todos los permisos
    const currentRole = roleName || user.rol || user.rol_nombre;
    if (isAdminRole(currentRole)) return true;

    // Obtener los permisos del usuario logueado
    const permisos = user.permisos || [];
    const permiso = permisos.find((p) => p.modulo.toLowerCase() === modulo.toLowerCase());

    return permiso ? permiso[accion] === true : false;
  };

  /**
   * Limpia el estado de sesión de forma controlada, SIN recargar la página.
   * Centraliza toda la lógica de logout/expiración.
   */
  const clearSession = useCallback(() => {
    setUser(null);
    setRoleName(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('currentView');
    localStorage.removeItem('navigationData');
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      // Leer datos guardados ANTES de cualquier llamada a la API
      // para no perderlos si fetchApi lanza un error.
      const savedToken = localStorage.getItem('token');
      const savedUserStr = localStorage.getItem('user');

      if (!savedToken) {
        // Sin token: no hay sesión que restaurar
        setIsLoading(false);
        return;
      }

      try {
        // Intentar cargar perfil actualizado desde el servidor
        const response = await fetchApi('/auth/profile');
        if (response.success && response.user) {
          setUser(response.user);
          setRoleName(response.user.rol || response.user.rol_nombre || null);
          localStorage.setItem('user', JSON.stringify(response.user));
        } else if (savedUserStr) {
          // El servidor respondió OK pero sin datos: usar caché local
          const userData = JSON.parse(savedUserStr);
          setUser(userData);
          setRoleName(userData.rol || userData.rol_nombre || null);
        }
      } catch (err) {
        if (err instanceof AuthError) {
          if (err.status === 401) {
            // Token expirado o inválido → limpiar sesión sin recargar
            clearSession();
          } else if (err.status === 403) {
            // Sin permiso para /profile (poco probable), pero la sesión
            // puede seguir siendo válida → usar datos guardados como fallback
            if (savedUserStr) {
              try {
                const userData = JSON.parse(savedUserStr);
                setUser(userData);
                setRoleName(userData.rol || userData.rol_nombre || null);
              } catch {
                clearSession();
              }
            }
          }
        } else {
          // Error de red u otro error inesperado → usar datos guardados como fallback
          if (savedUserStr) {
            try {
              const userData = JSON.parse(savedUserStr);
              setUser(userData);
              setRoleName(userData.rol || userData.rol_nombre || null);
            } catch {
              // Datos corruptos en localStorage
              clearSession();
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [clearSession]);

  // Escuchar el evento de sesión expirada emitido por fetchApi
  // cuando cualquier llamada de la app recibe un 401.
  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [clearSession]);

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
        localStorage.setItem('currentView', 'dashboard');
        localStorage.removeItem('navigationData');

        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    clearSession();
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

  const refetchProfile = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;

    try {
      const response = await fetchApi('/auth/profile');
      if (response.success && response.user) {
        setUser(response.user);
        setRoleName(response.user.rol || response.user.rol_nombre || null);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (err) {
      console.error("Error al sincronizar perfil:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        roleName,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        confirmResetPassword,
        hasPermission,
        isAuthenticated: !!user,
        refetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
