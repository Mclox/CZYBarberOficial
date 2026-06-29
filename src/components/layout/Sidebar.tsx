import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  RotateCcw,
  Wrench,
  Calendar,
  UserCog,
  UserCheck,
  ShoppingBag,
  Shield,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user, roleName, logout } = useAuth();

  const menuItems = [
    { id: 'mi-perfil', label: 'Mi Perfil', icon: User, roles: ['Administrador', 'Barbero', 'Cliente'] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Barbero', 'Cliente'] },
    { id: 'roles', label: 'Roles', icon: Shield, roles: ['Administrador'] },
    { id: 'usuarios', label: 'Usuarios', icon: Users, roles: ['Administrador'] },
    { id: 'empleados', label: 'Empleados', icon: UserCog, roles: ['Administrador'] },
    { id: 'clientes', label: 'Clientes', icon: UserCheck, roles: ['Administrador', 'Barbero'] },
    { id: 'servicios', label: 'Servicios', icon: Wrench, roles: ['Administrador'] },
    { id: 'productos', label: 'Gestión Productos', icon: Package, roles: ['Administrador', 'Barbero'] },
    { id: 'entrada-productos', label: 'Entradas Inventario', icon: ShoppingCart, roles: ['Administrador'] },
    { id: 'citas', label: 'Agendamiento', icon: Calendar, roles: ['Administrador', 'Barbero'] },
    { id: 'ventas', label: 'Ventas', icon: ShoppingBag, roles: ['Administrador', 'Barbero'] },
    { id: 'devoluciones', label: 'Devolución Stock', icon: RotateCcw, roles: ['Administrador'] },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    roleName && item.roles.includes(roleName)
  );

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg">Sistema Gestión</h2>
            <p className="text-xs text-muted-foreground">{roleName}</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />
      
      <div className="p-4">
        <div className="mb-3 px-3">
          <p className="text-sm truncate">{user?.nombre}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};