import React, { useState, useEffect } from 'react';
import { useAuth } from '..';
import { toast } from 'sonner';
import { ArrowLeft, Scissors, Eye, EyeOff } from 'lucide-react';
import { Label } from '../../../components/ui/label';

interface RecoverPasswordFormProps {
  onBackToLogin: () => void;
  onBackToLanding: () => void;
}

export const RecoverPasswordForm: React.FC<RecoverPasswordFormProps> = ({ onBackToLogin, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [token, setToken] = useState<string | null>(null);

  const { resetPassword, confirmResetPassword } = useAuth();

  // Detectar si el usuario llegó a través del enlace de su correo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');

    if (urlToken && urlEmail) {
      setToken(urlToken);
      setEmail(urlEmail);
      setStep('reset');
      
      // Limpiamos la URL para que no quede expuesto el token
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await resetPassword(email);
    if (success) {
      // Se queda en la misma pantalla mostrando un mensaje de éxito. 
      // El usuario debe ir a su correo para continuar.
      setStep('request'); 
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!token) {
      toast.error('Token de seguridad no encontrado');
      return;
    }

    setLoading(true);

    // Enviar nueva contraseña al Backend (se encriptará con Bcrypt allá)
    const success = await confirmResetPassword(email, token, newPassword);

    if (success) {
      setTimeout(() => onBackToLogin(), 1500);
    }

    setLoading(false);
  };

  const renderContent = () => {
    if (step === 'request') {
      return (
        <form onSubmit={handleRequestReset}>
          <div style={{ marginBottom: 32 }}>
            <Label htmlFor="email" style={{ display: 'block', color: '#444444', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Correo Electrónico</Label>
            <input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              background: loading ? '#60a5fa' : '#FF4B2B', 
              boxShadow: loading ? 'none' : '0 4px 12px rgba(255,75,43,0.2)',
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
            {loading ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
          </button>

          <div className="text-center" style={{ marginBottom: 24, textAlign: 'center' }}>
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#0057FF',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0046CC')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#0057FF')}
            >
              Volver al inicio de sesión
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onBackToLanding}
              style={backButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              Volver al Inicio
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handleResetPassword}>
        <div style={{ marginBottom: 28 }}>
          <Label htmlFor="newPassword" style={{ display: 'block', color: '#444444', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Nueva Contraseña</Label>
          <div style={{ position: 'relative' }}>
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={eyeButtonStyle}>
              {showNewPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <Label htmlFor="confirmPassword" style={{ display: 'block', color: '#444444', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Confirmar Contraseña</Label>
          <div style={{ position: 'relative' }}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeButtonStyle}>
              {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            background: loading ? '#60a5fa' : '#FF4B2B',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(255,75,43,0.2)',
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
          {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
        </button>
      </form>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: "'Inter', sans-serif",
        background: '#FFFFFF',
        width: '100%',
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
            position: 'absolute', inset: 0,
            backgroundImage: "url('/assets/images/hero_bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute', inset: 0,
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
              Recuperar Acceso
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
            {step === 'request' ? '¿Olvidaste tu\ncontraseña?' : 'Crea tu nueva\ncontraseña'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.6, maxWidth: 360, fontWeight: 400 }}>
            {step === 'request' 
              ? 'No te preocupes, dinos tu correo y te enviaremos las instrucciones para restablecerla.'
              : 'Ya casi terminamos. Ingresa una nueva contraseña segura para recuperar el acceso a tu cuenta.'
            }
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

        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={titleStyle}>
              {step === 'request' ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
            </h2>
            <p style={{ color: '#666666', fontSize: 16, lineHeight: 1.5 }}>
              {step === 'request' 
                ? 'Ingresa tu correo para recibir instrucciones'
                : `Ingresa tu nueva contraseña para ${email}`
              }
            </p>
          </div>

          {renderContent()}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @media (min-width: 1024px) {
          .left-panel {
            display: flex !important;
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

const buttonStyle: React.CSSProperties = {
  width: '100%',
  color: '#000000',
  border: 'none',
  borderRadius: 8,
  padding: '16px 0',
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginBottom: 28,
};

const titleStyle: React.CSSProperties = {
  color: '#000000',
  fontSize: 32,
  fontWeight: 800,
  marginBottom: 12,
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
};

const backButtonStyle: React.CSSProperties = {
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
};

const eyeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '8px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
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