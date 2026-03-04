import { useState } from 'react';
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
  Truck,
  ShoppingCart,
  RotateCcw,
  PackageOpen,
  Briefcase,
  Calendar,
  UserCircle,
  CreditCard,
  Receipt,
  LogOut,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Store,
  CalendarClock,
  DollarSign
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
      { id: 'configuracion-landing', label: 'Config. Landing Page', icon: Settings },
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

  // PROCESO DE COMPRAS
  {
    id: 'compras-proceso',
    label: 'Compras',
    icon: ShoppingCart,
    adminOnly: false,
    barberoAccess: true,
    subItems: [
      { id: 'productos', label: 'Gestión de Productos', icon: Package },
      { id: 'proveedores', label: 'Gestión de Proveedores', icon: Truck },
      { id: 'compras', label: 'Gestión de Compras', icon: ShoppingCart },
      { id: 'devoluciones-proveedor', label: 'Devoluciones a Proveedor', icon: PackageOpen },
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
      { id: 'pagos', label: 'Gestión de pagos en consignación', icon: CreditCard },
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
      { id: 'reportes-ventas', label: 'Reportes de Ventas', icon: Receipt },
      { id: 'rendimiento-empleados', label: 'Rendimiento de Empleados', icon: Users },
    ]
  },
];

// Items individuales (fuera de procesos)
const individualMenuItems: any[] = [];

function ProcessMenuItem({
  process,
  currentView,
  onNavigate,
  isOpen,
  onToggle,
  isAdmin,
  isBarbero,
  isCliente
}: {
  process: ProcessItem;
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  isBarbero: boolean;
  isCliente: boolean;
}) {
  // Filtrar subitems basados en permisos
  const filteredSubItems = process.subItems.filter(subItem => {
    // Admin tiene acceso a todo dentro de procesos permitidos
    if (isAdmin) return true;

    // Para Barbero
    if (isBarbero) {
      // Proveedores solo lectura (se manejará en la vista)
      if (subItem.id === 'proveedores') return true;
      // Compras solo puede registrar (se manejará en la vista)
      if (subItem.id === 'compras') return true;
      // Servicios solo lectura para barbero
      if (subItem.id === 'servicios') return true;
      // Todo lo demás con acceso normal
      return true;
    }

    // Para Cliente
    if (isCliente) {
      // Solo ver servicios y agendar citas
      if (subItem.id === 'servicios' || subItem.id === 'citas' || subItem.id === 'dashboard') {
        return true;
      }
    }

    return false;
  });

  if (filteredSubItems.length === 0) return null;

  const Icon = process.icon;
  const isActive = filteredSubItems.some(item => item.id === currentView);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 mb-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100",
            isActive && "bg-gradient-to-r from-amber-100 to-orange-50 border-l-4 border-amber-500 text-amber-700 font-medium"
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
        {filteredSubItems.map((subItem) => {
          const SubIcon = subItem.icon;
          const isSubActive = currentView === subItem.id;

          return (
            <Button
              key={subItem.id}
              variant={isSubActive ? "secondary" : "ghost"}
              onClick={() => onNavigate(subItem.id)}
              className={cn(
                "w-full justify-start gap-3 pl-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                isSubActive && "bg-amber-100 text-amber-700 font-medium"
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
  const { logout, roleName, user: authUser } = useAuth();
  const isAdmin = roleName === 'Administrador' || roleName === 'Admin'; // Soportamos ambos por si acaso
  const isBarbero = roleName === 'Barbero';
  const isCliente = roleName === 'Cliente';

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

  // Filtrar procesos basados en rol
  const filteredProcesses = processMenuItems.filter(process => {
    if (isAdmin) return true;
    if (isBarbero && process.barberoAccess) return true;
    if (isCliente && process.clienteAccess) return true;
    return false;
  });

  // Filtrar items individuales
  const filteredIndividualItems = individualMenuItems.filter(item => {
    if (isAdmin) return true;
    if (isBarbero && item.barberoAccess) return true;
    if (isCliente && item.clienteAccess) return true;
    return false;
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Barbería Elite</h2>
            <p className="text-xs text-gray-500">Gestión Profesional</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-md overflow-hidden">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.nombre} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{currentUser?.nombre || 'Usuario'}</p>
            <p className="text-xs text-amber-600 font-medium">{roleName}</p>
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
                  isActive && "bg-gradient-to-r from-amber-100 to-orange-50 border-l-4 border-amber-500 text-amber-700 font-medium"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Button>
            );
          })}

          {filteredIndividualItems.length > 0 && <Separator className="my-4 bg-gray-200" />}

          {/* Procesos colapsables */}
          {filteredProcesses.map((process) => (
            <ProcessMenuItem
              key={process.id}
              process={process}
              currentView={currentView}
              onNavigate={handleNavigate}
              isOpen={openProcesses[process.id] ?? false}
              onToggle={() => toggleProcess(process.id)}
              isAdmin={isAdmin}
              isBarbero={isBarbero}
              isCliente={isCliente}
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

  const isAdmin = roleName === 'Administrador';
  const isCliente = roleName === 'Cliente';

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
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Actions (Admin only) */}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
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
                        <DropdownMenuItem key={idx} className="p-3 focus:bg-amber-50 cursor-pointer">
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
                  <DropdownMenuItem className="justify-center text-amber-600 font-medium text-xs cursor-pointer hover:text-amber-700">
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
                  currentView === 'mi-perfil' && "bg-amber-100 text-amber-700 font-medium"
                )}
              >
                {user?.avatar ? (
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="bg-amber-500 text-white text-[10px]">
                      {user?.nombre?.[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
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
