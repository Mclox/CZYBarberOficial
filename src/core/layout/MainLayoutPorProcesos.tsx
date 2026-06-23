import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';
import {
  Bell,
  Search,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Menu,
  Home,
  Users,
  Shield,
  Package,
  ShoppingCart,
  RotateCcw,
  Briefcase,
  Calendar,
  UserCircle,
  Receipt,
  LogOut,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Store,
  CalendarClock,
  DollarSign,
  PackagePlus,
  Scissors,
  CalendarCheck
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import ErrorBoundary from '../../components/ErrorBoundary';
import { cn } from '../../components/ui/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProcessItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems: SubMenuItem[];
  adminOnly?: boolean;
  barberoAccess?: boolean;
  clienteAccess?: boolean;
}

// Definición de procesos y subprocesos
const processMenuItems: ProcessItem[] = [
  // PROCESO DE CONFIGURACIÓN
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    adminOnly: true,
    subItems: [
      { id: 'roles', label: 'Gestión de Roles', icon: Shield },
      // { id: 'configuracion-landing', label: 'Config. Landing Page', icon: Settings },
    ]
  },

  // PROCESO DE USUARIOS
  {
    id: 'usuarios-proceso',
    label: 'Usuarios',
    icon: Users,
    adminOnly: true,
    subItems: [
      { id: 'usuarios', label: 'Gestión de Usuarios', icon: Users },
    ]
  },

  // PROCESO DE PRODUCTOS
  {
    id: 'compras-proceso',
    label: 'Productos',
    icon: ShoppingCart,
    adminOnly: true,
    subItems: [
      { id: 'productos', label: 'Gestión de Productos', icon: Package },
      { id: 'entrada-productos', label: 'Entrada de Productos', icon: PackagePlus },
    ]
  },

  // PROCESO DE AGENDAMIENTO
  {
    id: 'agendamiento-proceso',
    label: 'Agendamiento',
    icon: CalendarClock,
    adminOnly: false,
    barberoAccess: true,
    clienteAccess: true,
    subItems: [
      { id: 'servicios', label: 'Gestión de Servicios', icon: Briefcase },
      { id: 'citas', label: 'Gestión de Citas', icon: Calendar },
      { id: 'empleados', label: 'Gestión de Empleados', icon: Users },
    ]
  },

  // PROCESO DE VENTAS
  {
    id: 'ventas-proceso',
    label: 'Ventas',
    icon: DollarSign,
    adminOnly: false,
    barberoAccess: true,
    subItems: [
      { id: 'clientes', label: 'Gestión de Clientes', icon: UserCircle },
      { id: 'ventas', label: 'Gestión de Ventas', icon: Receipt },
      { id: 'devoluciones', label: 'Devolución al Stock', icon: RotateCcw },
    ]
  },

  // PROCESO DE MEDICIÓN DE DESEMPEÑO
  {
    id: 'medicion-proceso',
    label: 'Medición de Desempeño',
    icon: BarChart3,
    adminOnly: false,
    barberoAccess: true,
    clienteAccess: false,
    subItems: [
      { id: 'dashboard', label: 'Dashboard General', icon: Home },
      { id: 'reporte-citas', label: 'Reporte de Citas', icon: CalendarCheck },
      { id: 'reporte-productos', label: 'Reporte de Productos', icon: Package },
      { id: 'reporte-servicios', label: 'Reporte de Servicios', icon: Scissors },
      { id: 'reporte-empleados', label: 'Reporte de Empleados', icon: Users },
      { id: 'reporte-ingresos', label: 'Reporte de Ingresos', icon: DollarSign },
    ]
  },
];

// Items individuales (fuera de procesos)
const individualMenuItems: any[] = [];

const moduloMapping: Record<string, string> = {
  'roles': 'Roles',
  'configuracion-landing': 'Roles', // Solo admin, pero mapeado para consistencia
  'usuarios': 'Usuarios',
  'productos': 'Productos',
  'entrada-productos': 'Productos',
  'servicios': 'Servicios',
  'citas': 'Citas',
  'empleados': 'Empleados',
  'clientes': 'Clientes',
  'ventas': 'Ventas',
  'devoluciones': 'Devoluciones',
  'reporte-citas': 'Citas',
  'reporte-productos': 'Productos',
  'reporte-servicios': 'Servicios',
  'reporte-empleados': 'Empleados',
  'reporte-ingresos': 'Ventas',
};

// Helper local para verificar rol admin (consistente con AuthContext)
const isAdminRole = (role?: string | null): boolean => {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === 'administrador' || r === 'admin';
};

function ProcessMenuItem({
  process,
  currentView,
  onNavigate,
  isOpen,
  onToggle,
}: {
  process: ProcessItem;
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  // Los sub-ítems ya vienen filtrados desde SidebarContent
  const visibleSubItems = process.subItems;

  if (visibleSubItems.length === 0) return null;

  const Icon = process.icon;
  const isActive = visibleSubItems.some(item => item.id === currentView);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 mb-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100",
            isActive && "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 text-blue-700 font-medium"
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="flex-1 text-left">{process.label}</span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {visibleSubItems.map((subItem) => {
          const SubIcon = subItem.icon;
          const isSubActive = currentView === subItem.id;

          return (
            <Button
              key={subItem.id}
              variant={isSubActive ? "secondary" : "ghost"}
              onClick={() => onNavigate(subItem.id)}
              className={cn(
                "w-full justify-start gap-3 pl-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                isSubActive && "bg-blue-50 text-blue-700 font-medium"
              )}
            >
              <SubIcon className="w-4 h-4" />
              <span>{subItem.label}</span>
            </Button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarContent({ currentView, onNavigate, onClose, user }: {
  currentView: string;
  onNavigate: (view: string) => void;
  onClose?: () => void;
  user: any;
}) {
  const { logout, roleName, user: authUser, hasPermission, refetchProfile } = useAuth();

  // Sincronizar permisos del usuario con la base de datos al montar y al cambiar de vista
  useEffect(() => {
    if (refetchProfile) {
      refetchProfile();
    }
  }, [currentView, refetchProfile]);
  const isAdmin = isAdminRole(roleName);

  // Usar el usuario de auth si no se proporciona uno por props
  const currentUser = user || authUser;

  // Estado para controlar qué procesos están abiertos (ahora todos cerrados por defecto)
  const [openProcesses, setOpenProcesses] = useState<Record<string, boolean>>({
    'configuracion': false,
    'usuarios-proceso': false,
    'compras-proceso': false,
    'agendamiento-proceso': false,
    'ventas-proceso': false,
    'medicion-proceso': false,
  });

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const toggleProcess = (processId: string) => {
    setOpenProcesses(prev => ({
      ...prev,
      [processId]: !prev[processId]
    }));
  };

  // Filtrar procesos basados en rol y permisos de subitems
  const filteredProcesses = processMenuItems.map(process => {
    // Administrador ve todo
    if (isAdmin) return process;

    const filteredSub = process.subItems.filter(subItem => {
      // Verificar permisos del módulo de forma dinámica según la base de datos
      const moduloName = moduloMapping[subItem.id];
      if (moduloName) {
        return hasPermission(moduloName, 'leer');
      }
      // Items sin mapeo de módulo (ej: dashboard) → siempre visibles
      return subItem.id === 'dashboard';
    });

    return {
      ...process,
      subItems: filteredSub
    };
  }).filter(process => process.subItems.length > 0);

  // Filtrar items individuales
  const filteredIndividualItems = individualMenuItems.filter(item => {
    if (isAdmin) return true;
    const moduloName = moduloMapping[item.id];
    if (moduloName) {
      return hasPermission(moduloName, 'leer');
    }
    return item.id === 'dashboard' || item.id === 'mi-perfil';
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">CzBarber</h2>
            <p className="text-xs text-gray-500">Gestión Profesional</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md overflow-hidden">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.nombre} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{currentUser?.nombre || 'Usuario'}</p>
            <p className="text-xs text-blue-600 font-medium">{roleName}</p>
          </div>
        </div>
      </div>

      <Separator className="bg-gray-200" />

      {/* Menu Items con Scroll */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-2 pb-4">
          {/* Items individuales primero */}
          {filteredIndividualItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "w-full justify-start gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                  isActive && "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 text-blue-700 font-medium"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Button>
            );
          })}

          {filteredIndividualItems.length > 0 && <Separator className="my-4 bg-gray-200" />}

          {/* Procesos colapsables - sub-ítems ya filtrados */}
          {filteredProcesses.map((process) => (
            <ProcessMenuItem
              key={process.id}
              process={process}
              currentView={currentView}
              onNavigate={handleNavigate}
              isOpen={openProcesses[process.id] ?? false}
              onToggle={() => toggleProcess(process.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Logout Button - Fijo al fondo */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
}

export function MainLayoutPorProcesos({ children, currentView, onNavigate }: MainLayoutProps) {
  const { user, roleName } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // No renderizar el layout si no hay usuario autenticado (evita errores de referencia)
  if (!user) return null;

  const isAdmin = isAdminRole(roleName);
  const isCliente = roleName?.toLowerCase() === 'cliente';

  // Notificaciones dinámicas por rol
  const getNotifications = () => {
    if (isCliente) {
      return [
        {
          title: 'Cita Confirmada',
          description: 'Tu cita para Corte + Barba ha sido confirmada',
          time: 'Hace 10 min',
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Recordatorio',
          description: 'Mañana tienes una cita a las 10:00 AM',
          time: 'Hace 1 hora',
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          title: 'Promoción',
          description: '20% de descuento en productos capilares',
          time: 'Hace 3 horas',
          icon: Store,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100'
        }
      ];
    }

    // Admin y Barbero comparten notificaciones operativas
    return [
      {
        title: 'Stock Crítico',
        description: 'Pomada strong - Solo 2 unidades',
        time: 'Hace 5 min',
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      },
      {
        title: 'Nueva Cita',
        description: 'Roberto S. para hoy 16:00',
        time: 'Hace 15 min',
        icon: Calendar,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Venta Completada',
        description: 'Pago aprobado: $45.00',
        time: 'Hace 1 hora',
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      }
    ];
  };

  const notifications = getNotifications();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-80 border-r border-gray-200 shadow-lg">
        <SidebarContent currentView={currentView} onNavigate={onNavigate} user={user} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon" className="bg-white border-gray-300 shadow-md">
            <Menu className="w-5 h-5 text-gray-700" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent
            currentView={currentView}
            onNavigate={onNavigate}
            onClose={() => setSidebarOpen(false)}
            user={user}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={isCliente ? "Buscar servicios, barberos, citas..." : "Buscar clientes, citas, productos..."}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Actions (Admin only) */}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                      <Plus className="w-4 h-4" />
                      <span>Acción Rápida</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Nueva Operación</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onNavigate('ventas')} className="gap-2">
                      <Receipt className="w-4 h-4" /> Registrar Venta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('citas')} className="gap-2">
                      <Calendar className="w-4 h-4" /> Nueva Cita
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('clientes')} className="gap-2">
                      <UserCircle className="w-4 h-4" /> Nuevo Cliente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('productos')} className="gap-2">
                      <Package className="w-4 h-4" /> Agregar Producto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-gray-600 hover:bg-gray-100">
                    <Bell className="w-5 h-5" />
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 border-2 border-white">
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificaciones</span>
                    <Badge variant="outline" className="text-[10px] py-0">{notifications.length} Nuevas</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif, idx) => {
                      const NotifIcon = notif.icon;
                      return (
                        <DropdownMenuItem key={idx} className="p-3 focus:bg-blue-50 cursor-pointer">
                          <div className="flex gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", notif.bgColor)}>
                              <NotifIcon className={cn("w-4 h-4", notif.color)} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-500">{notif.description}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-blue-600 font-medium text-xs cursor-pointer hover:text-blue-700">
                    Ver todas las notificaciones
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('mi-perfil')}
                className={cn(
                  "gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3",
                  currentView === 'mi-perfil' && "bg-blue-100 text-blue-700 font-medium"
                )}
              >
                {user?.avatar ? (
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="bg-blue-500 text-white text-[10px]">
                      {user?.nombre?.[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.nombre?.[0] || 'U'}
                  </div>
                )}
                <span className="hidden sm:inline">Mi Perfil</span>
              </Button>
            </div>
          </div>
        </div>
        <ErrorBoundary>
          <div className="relative">
            {children}
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
