import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  LayoutDashboard, 
  Users, 
  Package, 
  Truck, 
  ShoppingCart, 
  RotateCcw, 
  Wrench,
  Calendar,
  UserCog,
  UserCheck,
  CreditCard,
  ShoppingBag,
  Shield,
  Menu,
  LogOut,
  User,
  Building2,
} from 'lucide-react';
import { cn } from '../ui/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'mi-perfil', label: 'Mi Perfil', icon: User },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'roles', label: 'Roles', icon: Shield, adminOnly: true },
  { id: 'usuarios', label: 'Usuarios', icon: Users, adminOnly: true },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'proveedores', label: 'Proveedores', icon: Truck },
  { id: 'compras', label: 'Productos', icon: ShoppingCart },
  { id: 'devoluciones', label: 'Devoluciones', icon: RotateCcw },
  { id: 'devoluciones-proveedor', label: 'Dev. Proveedor', icon: Package },
  { id: 'servicios', label: 'Servicios', icon: Wrench },
  { id: 'citas', label: 'Citas', icon: Calendar },
  { id: 'empleados', label: 'Empleados', icon: UserCog },
  { id: 'clientes', label: 'Clientes', icon: UserCheck },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
  { id: 'ventas', label: 'Ventas', icon: ShoppingBag },
];

function SidebarContent({ currentView, onNavigate, onClose, user }: {
  currentView: string;
  onNavigate: (view: string) => void;
  onClose?: () => void;
  user: any;
}) {
  const { logout, roleName } = useAuth();
  const isAdmin = roleName === 'Administrador';

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2>Sistema Gestión</h2>
            <p className="text-sm text-muted-foreground">{roleName}</p>
          </div>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                )}
                onClick={() => handleNavigate(item.id)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4 space-y-2">
        <div className="px-3 py-2 bg-muted rounded-lg">
          <p className="text-sm">{user?.nombre}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}

export function MainLayout({ children, currentView, onNavigate }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r">
        <SidebarContent 
          currentView={currentView} 
          onNavigate={onNavigate}
          user={user}
        />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h2>Sistema Gestión</h2>
        </div>
        
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent 
              currentView={currentView} 
              onNavigate={onNavigate}
              onClose={() => setSidebarOpen(false)}
              user={user}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}