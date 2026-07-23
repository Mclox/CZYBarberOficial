import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, LoginForm, RegisterForm, RecoverPasswordForm } from './features/auth';
import { Toaster } from './components/ui/sonner';
import { MainLayout } from './core';
import { Dashboard } from './features/dashboard';
import { ClienteDashboard } from './features/cliente-dashboard';
import { RolesView } from './features/roles';
import { UsuariosView } from './features/usuarios';
import { ProductosView } from './features/productos';
import { ProveedoresView } from './features/proveedores';
import { ComprasView } from './features/compras';
import { DevolucionesStockView } from './features/devoluciones';
// import { DevolucionesProveedorView } from './features/devoluciones-proveedor';
import { ConsignacionesView } from './features/consignaciones';
import { EntradaProductosView } from './features/entrada-productos';
import { ServiciosView } from './features/servicios';
import { CitasView } from './features/citas';
import { EmpleadosView } from './features/empleados';
import { ClientesView } from './features/clientes';
import { ClientesTemporalesView } from './features/clientes-temporales';
import { VentasView } from './features/ventas';
import { LandingPage } from './components/LandingPage';
import { MiPerfilView } from './features/mi-perfil';
import { ConfiguracionLandingView } from './features/configuracion-landing';
import { ReporteCitasView, ReporteProductosView, ReporteServiciosView, ReporteEmpleadosView, ReporteIngresosView } from './features/medicion-desempeno';
import { NotificacionesView } from './features/notificaciones';

type AuthView = 'login' | 'register' | 'recover' | 'landing';

function AuthPages() {
  const [authView, setAuthView] = useState<AuthView>('landing');

  // Detectar si venimos de un enlace de recuperación de contraseña
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token') && params.get('email')) {
      setAuthView('recover');
    }
  }, []);

  if (authView === 'landing') {
    return <LandingPage onGetStarted={() => setAuthView('login')} />;
  }

  return (
    <div className="min-h-screen">
      {/* Content */}
      <div className="w-full">
        {authView === 'login' && (
          <LoginForm
            onRegisterClick={() => setAuthView('register')}
            onRecoverClick={() => setAuthView('recover')}
            onBackToLanding={() => setAuthView('landing')}
          />
        )}
        {authView === 'register' && (
          <RegisterForm
            onBackToLogin={() => setAuthView('login')}
            onBackToLanding={() => setAuthView('landing')}
          />
        )}
        {authView === 'recover' && (
          <RecoverPasswordForm
            onBackToLogin={() => setAuthView('login')}
            onBackToLanding={() => setAuthView('landing')}
          />
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, user, isLoading, hasPermission } = useAuth(); // <-- Agrega isLoading
  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      return localStorage.getItem('currentView') || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  const [navigationData, setNavigationData] = useState<any>(null);

  const handleNavigate = (view: string, data?: any) => {
    setCurrentView(view);
    setNavigationData(data || null);
    try {
      localStorage.setItem('currentView', view);
    } catch (e) {
      // ignore storage errors
    }
  };

  // <-- PEGA ESTE BLOQUE NUEVO AQUÍ
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#0057FF] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium tracking-widest uppercase text-sm">Autenticando...</p>
      </div>
    );
  }
  // <-- HASTA AQUÍ

  if (!isAuthenticated) {
    return <AuthPages />;
  }

  const renderView = () => {
    const isCliente = user?.id_rol === 3;

    // Función para manejar la reserva de cita desde cualquier vista
    const handleReservarCita = (_empleadoId?: number, _servicioId?: number) => {
      handleNavigate('citas');
    };

    switch (currentView) {
      case 'dashboard':
        if (isCliente) {
          return <ClienteDashboard onReservarCita={handleReservarCita} />;
        }
        if (hasPermission && !hasPermission('Dashboard General', 'leer')) {
          return (
            <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">
              Acceso Denegado. No tienes permisos para este módulo.
            </div>
          );
        }
        return <Dashboard />;
      case 'roles':
        if (hasPermission && !hasPermission('Roles', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <RolesView />;
      case 'usuarios':
        if (hasPermission && !hasPermission('Usuarios', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <UsuariosView />;
      case 'productos':
        if (hasPermission && !hasPermission('Productos', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <ProductosView />;
      case 'entrada-productos':
        if (hasPermission && !hasPermission('Entradas de Productos', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <EntradaProductosView />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'compras':
        return <ComprasView />;
      case 'devoluciones':
        if (hasPermission && !hasPermission('Devoluciones', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <DevolucionesStockView preSelectedSale={navigationData?.sale} />;
      // case 'devoluciones-proveedor':
      //   return <DevolucionesProveedorView />;
      case 'consignaciones':
        return <ConsignacionesView />;
      case 'servicios':
        if (hasPermission && !hasPermission('Servicios', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <ServiciosView />;
      case 'citas':
        if (hasPermission && !hasPermission('Citas', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <CitasView />;
      case 'empleados':
        if (hasPermission && !hasPermission('Empleados', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <EmpleadosView />;
      case 'clientes':
        if (hasPermission && !hasPermission('Clientes', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <ClientesView />;
      case 'clientes-temporales':
        return <ClientesTemporalesView />;
      case 'ventas':
        if (hasPermission && !hasPermission('Ventas', 'leer')) return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl border shadow-sm m-4 md:m-8">Acceso Denegado</div>;
        return <VentasView onNavigate={handleNavigate} />;
      case 'mi-perfil':
        return <MiPerfilView />;
      case 'configuracion-landing':
        return <ConfiguracionLandingView />;
      case 'notificaciones':
        return <NotificacionesView />;
      case 'reporte-citas':
        return <ReporteCitasView />;
      case 'reporte-productos':
        return <ReporteProductosView />;
      case 'reporte-servicios':
        return <ReporteServiciosView />;
      case 'reporte-empleados':
        return <ReporteEmpleadosView />;
      case 'reporte-ingresos':
        return <ReporteIngresosView />;
      default:
        return isCliente ? <ClienteDashboard onReservarCita={handleReservarCita} /> : <Dashboard />;
    }
  };

  return (
    <MainLayout currentView={currentView} onNavigate={handleNavigate}>
      {renderView()}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
