import React, { useState } from 'react';
import { Label } from '../../../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Scissors } from 'lucide-react';

interface RegisterFormProps {
  onBackToLogin: () => void;
  onBackToLanding: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin, onBackToLanding }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    setLoading(true);

    // El rol siempre es cliente (id 3) en el registro público
    const success = await register({
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
      telefono: formData.telefono,
      id_rol: 3, // Cliente
      estado: 'activo',
    });

    if (success) {
      toast.success('Registro exitoso. Por favor inicia sesión.', {
        style: { background: '#10b981', color: '#fff' }
      });
      onBackToLogin();
    } else {
      toast.error('El correo ya está registrado', {
        style: { background: '#ef4444', color: '#fff' }
      });
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: "'Inter', sans-serif",
        background: '#FFFFFF',
      }}
    >
      {/* ══════════════════════════════════════
          PANEL IZQUIERDO — branding con imagen
      ══════════════════════════════════════ */}
      <div
        style={{
          display: 'none',
          width: '50%',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '64px',
        }}
        className="left-panel"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/assets/images/hero_bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,87,255,0.4) 0%, rgba(0,0,0,0.7) 100%)',
            }}
          />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Scissors style={{ width: 20, height: 20, color: '#FFFFFF' }} />
            </div>
            <span style={{ color: '#FFFFFF', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
              Únete a CzBarber
            </span>
          </div>

          <h1
            style={{
              color: '#ffffff',
              fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 20,
              letterSpacing: '-0.03em',
            }}
          >
            Forma parte de<br />nuestra comunidad
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.6, maxWidth: 360, fontWeight: 400 }}>
            Regístrate para agendar tus citas mucho más rápido y llevar un seguimiento de tu estilo.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PANEL DERECHO — formulario centrado
      ══════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          minHeight: '100vh',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          position: 'relative',
        }}
      >
        {/* Logo — visible solo en mobile */}
        <div
          className="mobile-logo"
          style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 40 }}
        >
          <div
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#0057FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Scissors style={{ width: 17, height: 17, color: '#FFFFFF' }} />
          </div>
          <span style={{ color: '#0057FF', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 800 }}>
            CzBarber
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Encabezado */}
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                color: '#000000',
                fontSize: 32,
                fontWeight: 800,
                marginBottom: 12,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
              }}
            >
              Crear Cuenta
            </h2>
            <p style={{ color: '#666666', fontSize: 16, lineHeight: 1.5 }}>
              Completa el formulario para registrarte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" style={{ color: '#444444', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Nombre Completo</Label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" style={{ color: '#444444', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Correo Electrónico</Label>
                <input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefono" style={{ color: '#444444', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Teléfono</Label>
              <input
                id="telefono"
                type="tel"
                placeholder="555-1234"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" style={{ color: '#444444', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Contraseña</Label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" style={{ color: '#444444', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Confirmar</Label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#60a5fa' : '#FF4B2B',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '16px 0',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.02em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(255,75,43,0.2)',
                marginTop: 8,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#e03d21';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,75,43,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#FF4B2B';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,75,43,0.2)';
                }
              }}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>

            <div className="pt-4 text-center">
              <span className="text-slate-500 text-sm">¿Ya tienes cuenta? </span>
              <button
                type="button"
                onClick={onBackToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0057FF',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0046CC')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#0057FF')}
              >
                Inicia sesión
              </button>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={onBackToLanding}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 0,
                  transition: 'color 0.2s',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#64748b')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />
                Volver al Inicio
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @media (min-width: 1024px) {
          .left-panel {
            display: flex !important;
          }
          .mobile-logo {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .left-panel {
            display: none !important;
          }
          .mobile-logo {
            display: flex !important;
          }
        }

        input::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  color: '#000000',
  fontSize: 15,
  padding: '12px 16px',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
};

const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#0057FF';
  e.currentTarget.style.background = '#FFFFFF';
  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,87,255,0.1)';
};

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#e2e8f0';
  e.currentTarget.style.background = '#f8fafc';
  e.currentTarget.style.boxShadow = 'none';
};
