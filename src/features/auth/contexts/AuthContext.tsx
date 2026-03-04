import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, mockUsuarios, mockRoles } from '../../../shared/lib/mockData';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: Usuario | null;
  roleName: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<Usuario>) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved session
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        const role = mockRoles.find(r => r.id_rol === userData.id_rol);
        setRoleName(role?.nombre || null);
      }
    } catch (e) {
      // ignore malformed saved user
    }
  }, []);

  // const login = async (email: string, password: string): Promise<boolean> => {
  //   // Simulate API call
  //   await new Promise(resolve => setTimeout(resolve, 500));
    
  //   const foundUser = mockUsuarios.find(
  //     u => u.email === email && u.password === password && u.estado === 'activo'
  //   );

  //   if (foundUser) {
  //     const userToSave = { ...foundUser };
  //     delete (userToSave as any).password; // Don't save password
  //     setUser(userToSave as Usuario);
      
  //     const role = mockRoles.find(r => r.id_rol === foundUser.id_rol);
  //     setRoleName(role?.nombre || null);
      
  //     localStorage.setItem('user', JSON.stringify(userToSave));
  //     return true;
  //   }
    
  //   return false;
  // };

  // Asegúrate de importar el fetchApi arriba:
// import { fetchApi } from '../../../lib/api'; 
// (Ajusta la ruta según dónde hayas guardado api.ts)

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Hacemos la petición POST a nuestra API real
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        // El backend nos devolvió el usuario y el TOKEN
        const userToSave = response.user;
        const token = response.token;
        
        setUser(userToSave);
        setRoleName(userToSave.rol);
        
        // Guardamos el token y los datos en el navegador
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en login:", error);
      return false;
    }
  };

  // También actualiza la función logout para borrar el token:
  const logout = () => {
    setUser(null);
    setRoleName(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // <-- Agrega esta línea
  };

  const register = async (userData: Partial<Usuario>): Promise<boolean> => {
    try {
      // Usamos fetchApi para ir al backend real por el puerto 4000
      const response = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre: userData.nombre,
          email: userData.email,
          password: userData.password,
          telefono: userData.telefono
        })
      });

      // Si el backend dice success: true, el registro fue un éxito en la Base de Datos
      if (response.success) {
        return true;
      }
      return false;
      
    } catch (error) {
      console.error("Error en registro:", error);
      return false;
    }
  };
  
  // const register = async (userData: Partial<Usuario>): Promise<boolean> => {
  //   // Simulate API call
  //   await new Promise(resolve => setTimeout(resolve, 500));
    
  //   // Check if email already exists
  //   const existingUser = mockUsuarios.find(u => u.email === userData.email);
  //   if (existingUser) {
  //     return false;
  //   }

  //   // In a real app, this would save to backend
  //   // For now, just simulate success
  //   return true;
  // }; esta es la primer version de la funcion register era una ficticia

  // const resetPassword = async (email: string): Promise<boolean> => {
  //   // Simulate API call
  //   await new Promise(resolve => setTimeout(resolve, 500));
    
    const resetPassword = async (email: string): Promise<boolean> => {
    try {
      // Llamamos a la API real en el puerto 4000
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
      console.error("Error en recuperación:", error);
      toast.error(error.message || 'No se pudo procesar la recuperación.');
      return false;
    }
  };
  //   const foundUser = mockUsuarios.find(u => u.email === email);
  //   return !!foundUser;
  // }; funcion antigua posiblemente para eliminar despues

  // const logout = () => {
  //   setUser(null);
  //   setRoleName(null);
  //   localStorage.removeItem('user');
  // };

  return (
    <AuthContext.Provider
      value={{
        user,
        roleName,
        login,
        register,
        logout,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
