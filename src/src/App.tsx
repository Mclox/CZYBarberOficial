import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, LoginForm, RegisterForm, RecoverPasswordForm } from '../features/auth';
import { Toaster } from '../components/ui/sonner';
import { MainLayout } from '../core';
import { Dashboard } from '../features/dashboard';
import { ClienteDashboard } from '../features/cliente-dashboard';
import { RolesView } from '../features/roles';
import { UsuariosView } from '../features/usuarios';
import { ProductosView } from '../features/productos';
import { ProveedoresView } from '../features/proveedores';
import { ComprasView } from '../features/compras';
import { DevolucionesStockView } from '../features/devoluciones';
import { DevolucionesProveedorView } from '../features/devoluciones-proveedor';
import { ConsignacionesView } from '../features/consignaciones';
import { ServiciosView } from '../features/servicios';
import { CitasView } from '../features/citas';
import { EmpleadosView } from '../features/empleados';
import { ClientesView } from '../features/clientes';
import { ClientesTemporalesView } from '../features/clientes-temporales';
import { VentasView } from '../features/ventas';
import { LandingPage } from '../components/LandingPage';
import { MiPerfilView } from '../features/mi-perfil';
import { ConfiguracionLandingView } from '../features/configuracion-landing';
import { ReportesVentasView, RendimientoEmpleadosView } from '../features/medicion-desempeno';

type AuthView = 'login' | 'register' | 'recover' | 'landing';

// function AuthPages() {
//   const [authView, setAuthView] = useState<AuthView>('landing');

//   if (authView === 'landing') {
//     return <LandingPage onGetStarted={() => setAuthView('login')} />;
//   }

function AuthPages() {
  const [authView, setAuthView] = useState<AuthView>('landing');

  // Detectar si el usuario viene de un link de recuperación de correo
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
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image with Overlay - mismo que landing */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1667539916671-b9e7039ccee5?w=1600')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black"></div>
      </div>
      
      {/* Content */}
      <div className="w-full max-w-md relative z-10">
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
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  if (!isAuthenticated) {
    return <AuthPages />;
  }

  const renderView = () => {
    const isCliente = user?.id_rol === 3;
    
    // Función para manejar la reserva de cita desde cualquier vista
    const handleReservarCita = (_empleadoId?: number, _servicioId?: number) => {
      setCurrentView('citas');
    };
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'roles':
        return <RolesView />;
      case 'usuarios':
        return <UsuariosView />;
      case 'productos':
        return <ProductosView />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'compras':
        return <ComprasView />;
      case 'devoluciones':
        return <DevolucionesStockView />;
      case 'devoluciones-proveedor':
        return <DevolucionesProveedorView />;
      case 'consignaciones':
        return <ConsignacionesView />;
      case 'servicios':
        return <ServiciosView />;
      case 'citas':
        return <CitasView />;
      case 'empleados':
        return <EmpleadosView />;
      case 'clientes':
        return <ClientesView />;
      case 'clientes-temporales':
        return <ClientesTemporalesView />;
      case 'ventas':
        return <VentasView />;
      case 'mi-perfil':
        return <MiPerfilView />;
      case 'configuracion-landing':
        return <ConfiguracionLandingView />;
      case 'reportes-ventas':
        return <ReportesVentasView />;
      case 'rendimiento-empleados':
        return <RendimientoEmpleadosView />;
      default:
        return isCliente ? <ClienteDashboard onReservarCita={handleReservarCita} /> : <Dashboard />;
    }
  };

  return (
    <MainLayout currentView={currentView} onNavigate={setCurrentView}>
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
