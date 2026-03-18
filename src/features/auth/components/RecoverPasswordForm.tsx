import React, { useState } from 'react';
import { Label } from '../../../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Scissors } from 'lucide-react';

interface RecoverPasswordFormProps {
  onBackToLogin: () => void;
  onBackToLanding: () => void;
}

export const RecoverPasswordForm: React.FC<RecoverPasswordFormProps> = ({ onBackToLogin, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await resetPassword(email);

    if (success) {
      toast.success('Se ha enviado un correo con instrucciones para recuperar tu contraseña', {
        style: { background: '#10b981', color: '#fff' }
      });
      setTimeout(() => onBackToLogin(), 2000);
    } else {
      toast.error('No se encontró una cuenta con ese correo', {
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
            ¿Olvidaste tu<br />contraseña?
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.6, maxWidth: 360, fontWeight: 400 }}>
            No te preocupes, dinos tu correo y te enviaremos las instrucciones para restablecerla.
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
          {/* Encabezado */}
          <div style={{ marginBottom: 40 }}>
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
              Recuperar Contraseña
            </h2>
            <p style={{ color: '#666666', fontSize: 16, lineHeight: 1.5 }}>
              Ingresa tu correo para recibir instrucciones
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 32 }}>
              <Label htmlFor="email" style={{ display: 'block', color: '#444444', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Correo Electrónico</Label>
              <input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
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
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0057FF';
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,87,255,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
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
                marginBottom: 28,
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
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </button>

            <div className="text-center mb-6">
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

            <div className="flex justify-center">
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
