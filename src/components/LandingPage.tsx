import { Button } from './ui/button';
import { Scissors, Calendar, Users, Star, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useState, useEffect } from 'react';
import { PublicBookingForm } from './PublicBookingForm';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onGetStarted?: () => void;
  config?: LandingConfig;
}

interface LandingConfig {
  logo: string;
  businessName: string;
  heroBackground: string;
  servicesBackground: string;
  aboutBackground: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  aboutTitle: string;
  aboutDescription1: string;
  aboutDescription2: string;
  yearsExperience: string;
  happyClients: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
}

const defaultConfig: LandingConfig = {
  logo: '',
  businessName: 'CzBarber',
  heroBackground: '/assets/images/hero_bg.png',
  servicesBackground: '/assets/images/services_bg.png',
  aboutBackground: '/assets/images/about_bg.png',
  heroTitle: 'Corte Superior, Estilo Imparable',
  heroSubtitle: 'Estilo • Elegancia • Excelencia',
  heroDescription: 'Llevamos tu imagen al siguiente nivel con la mezcla perfecta de técnica avanzada y las últimas tendencias. No solo es un corte, es la confianza que necesitas para conquistar la ciudad.',
  aboutTitle: 'Sobre CrazyBarber',
  aboutDescription1: 'Con más de 10 años de experiencia, somos la barbería líder en ofrecer servicios de calidad premium. Nuestro equipo de barberos profesionales está dedicado a brindarte la mejor experiencia.',
  aboutDescription2: 'Combinamos técnicas tradicionales con las últimas tendencias para crear looks únicos y personalizados.',
  yearsExperience: '10+',
  happyClients: '5000+',
  contactAddress: 'Calle Principal 123\nCentro, Ciudad',
  contactPhone: '+1 (555) 123-4567',
  contactEmail: 'info@czbarber.com',
};

export function LandingPage({ onGetStarted, config: providedConfig }: LandingPageProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [config, setConfig] = useState<LandingConfig>(providedConfig || defaultConfig);

  // Sincronizar el estado local cuando cambie la prop providedConfig (desde la vista de configuración)
  useEffect(() => {
    if (providedConfig) {
      setConfig(providedConfig);
    }
  }, [providedConfig]);

  useEffect(() => {
    // Solo cargar del localStorage si NO se proporcionó una configuración por prop
    if (!providedConfig) {
      const savedConfig = localStorage.getItem('landingConfig');
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          // Migración: Si las imágenes son de Unsplash, forzar las locales
          if (parsed.heroBackground?.includes('unsplash.com')) parsed.heroBackground = defaultConfig.heroBackground;
          if (parsed.servicesBackground?.includes('unsplash.com')) parsed.servicesBackground = defaultConfig.servicesBackground;
          if (parsed.aboutBackground?.includes('unsplash.com')) parsed.aboutBackground = defaultConfig.aboutBackground;

          // Asegurar que el título de la sección "Acerca de" sea siempre "Sobre CrazyBarber"
          if (parsed.aboutTitle === 'Sobre CzBarber') parsed.aboutTitle = 'Sobre CrazyBarber';
          
          setConfig(parsed);
        } catch {
          setConfig(defaultConfig);
        }
      }
    }
  }, [providedConfig]);

  const services = [
    { icon: Scissors, title: 'Corte de Cabello', description: 'Cortes modernos y clásicos' },
    { icon: Scissors, title: 'Barba & Afeitado', description: 'Cuidado y estilo de barba profesional' },
    { icon: Star, title: 'Tinte & Color', description: 'Coloración profesional' },
    { icon: Clock, title: 'Tratamientos', description: 'Tratamientos capilares premium' },
  ];

  // Testimonials removed per client request

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('${config.heroBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,87,255,0.4) 0%, rgba(0,0,0,0.6) 100%)' }}></div>
        </div>

        {/* Transition Gradient for Menu */}
        <div className="absolute top-0 left-0 right-0 h-48 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #0057FF 0%, transparent 100%)' }}></div>

        {/* Header / Navbar */}
        <header className="relative z-50 border-b-0" style={{ background: 'transparent' }}>
          <div className="container mx-auto px-4 pt-14 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.logo ? (
                <ImageWithFallback
                  src={config.logo}
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Scissors className="w-8 h-8" style={{ color: '#FFFFFF' }} />
              )}
              <span className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>{config.businessName}</span>
            </div>
            <nav className="hidden md:flex gap-16 lg:gap-20" style={{ color: '#FFFFFF' }}>
              <a href="#servicios" className="text-[17px] font-bold tracking-wide transition-all duration-300 hover:scale-105 py-2 px-3 rounded-lg" style={{ color: '#FFFFFF' }} onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF2'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} onMouseLeave={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'transparent' }}>Servicios</a>
              <a href="#nosotros" className="text-[17px] font-bold tracking-wide transition-all duration-300 hover:scale-105 py-2 px-3 rounded-lg" style={{ color: '#FFFFFF' }} onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF2'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} onMouseLeave={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'transparent' }}>Nosotros</a>
              <a href="#contacto" className="text-[17px] font-bold tracking-wide transition-all duration-300 hover:scale-105 py-2 px-3 rounded-lg" style={{ color: '#FFFFFF' }} onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF2'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} onMouseLeave={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'transparent' }}>Contacto</a>
            </nav>
            <Button onClick={onGetStarted} style={{ background: '#FFFFFF', color: '#0057FF', fontWeight: 800, border: 'none', padding: '0 24px', height: '44px', borderRadius: '8px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E8EDF2'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Acceder
            </Button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 rounded-full backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 600, letterSpacing: '0.05em' }}>{config.heroSubtitle}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{ color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {config.heroTitle}
            </h1>
            <p className="text-xl mb-8" style={{ color: '#E8EDF2', fontWeight: 400, opacity: 0.9 }}>
              {config.heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setBookingOpen(true)}
                className="text-lg px-8 py-6 transition-all duration-300"
                style={{ background: '#FF4B2B', color: '#FFFFFF', border: 'none', fontWeight: 800, borderRadius: '12px', boxShadow: '0 4px 15px rgba(255,75,43,0.3)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e03d21'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,75,43,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FF4B2B'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,75,43,0.3)'; }}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Cita
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 transition-all duration-300"
                style={{ border: '2px solid #FFFFFF', color: '#FFFFFF', background: 'transparent', fontWeight: 700, borderRadius: '12px' }}
                onMouseEnter={e => { const btn = e.currentTarget as HTMLButtonElement; btn.style.background = '#FFFFFF'; btn.style.color = '#0057FF'; btn.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { const btn = e.currentTarget as HTMLButtonElement; btn.style.background = 'transparent'; btn.style.color = '#FFFFFF'; btn.style.transform = 'translateY(0)'; }}
              >
                Ver Servicios
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section id="servicios" className="py-20 relative overflow-hidden" style={{ background: '#FFFFFF' }}>
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `url('${config.servicesBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(232,237,242,0.4)' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000', letterSpacing: '-0.01em' }}>Nuestros Servicios</h2>
            <p className="text-lg" style={{ color: '#000000', fontWeight: 600, textShadow: '0 0 4px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(255, 75, 43, 0.5)' }}>Servicios premium para el caballero moderno</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="backdrop-blur-sm transition-all duration-300" style={{ background: '#E8EDF2', border: '1px solid #d0d8e4', borderRadius: '16px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1.5px solid #0057FF'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,87,255,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid #d0d8e4'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <CardContent className="p-8 text-center">
                  <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'rgba(0,87,255,0.12)' }}>
                    <service.icon className="w-8 h-8" style={{ color: '#0057FF' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>{service.title}</h3>
                  <p style={{ color: '#555555', lineHeight: 1.6 }}>{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="py-20 relative overflow-hidden" style={{ background: '#E8EDF2' }}>
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `url('${config.aboutBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(232,237,242,0.4)' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6" style={{ color: '#000000', letterSpacing: '-0.01em' }}>{config.aboutTitle}</h2>
              <p className="text-lg mb-4" style={{ color: '#000000', fontWeight: 500, lineHeight: 1.7 }}>
                {config.aboutDescription1}
              </p>
              <p className="text-lg mb-6" style={{ color: '#000000', fontWeight: 500, lineHeight: 1.7 }}>
                {config.aboutDescription2}
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-6 rounded-xl backdrop-blur-sm" style={{ background: '#FFFFFF', border: '1px solid rgba(0,87,255,0.25)', boxShadow: '0 4px 12px rgba(0,87,255,0.05)' }}>
                  <div className="text-4xl font-bold mb-1" style={{ color: '#0057FF' }}>{config.yearsExperience}</div>
                  <div style={{ color: '#555555', fontWeight: 600, textTransform: 'uppercase', fontSize: 13, letterSpacing: '0.1em' }}>Años de Experiencia</div>
                </div>
              </div>
            </div>
            <div className="backdrop-blur-sm rounded-2xl p-8" style={{ background: 'rgba(0,87,255,0.07)', border: '1px solid rgba(0,87,255,0.2)' }}>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,87,255,0.1)' }}>
                    <Users className="w-6 h-6" style={{ color: '#0057FF' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Barberos Profesionales</h3>
                    <p style={{ color: '#333333', lineHeight: 1.5 }}>Equipo altamente capacitado y certificado</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,87,255,0.1)' }}>
                    <Star className="w-6 h-6" style={{ color: '#0057FF' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Calidad Premium</h3>
                    <p style={{ color: '#333333', lineHeight: 1.5 }}>Productos y herramientas de alta gama</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,87,255,0.1)' }}>
                    <Clock className="w-6 h-6" style={{ color: '#0057FF' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Horarios Flexibles</h3>
                    <p style={{ color: '#333333', lineHeight: 1.5 }}>Abierto 7 días a la semana</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

      {/* Contact Section */}
      <section id="contacto" className="py-20 relative overflow-hidden" style={{ background: '#FFFFFF' }}>
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `url('/assets/images/contact_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.4)' }}></div>
        </div>

        {/* Transition Gradient to Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-32 z-10" style={{ background: 'linear-gradient(to bottom, transparent, #0057FF)' }}></div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000', letterSpacing: '-0.01em' }}>Contáctanos</h2>
              <p className="text-lg" style={{ color: '#555555', fontWeight: 500 }}>Estamos aquí para atenderte</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="transition-all duration-300" style={{ background: '#E8EDF2', border: '1px solid #d0d8e4', borderRadius: '16px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1.5px solid #0057FF'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid #d0d8e4'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-4" style={{ color: '#0057FF' }} />
                  <h3 className="font-bold mb-3 text-lg" style={{ color: '#000000' }}>Dirección</h3>
                  <p style={{ color: '#555555', lineHeight: 1.5 }}>{config.contactAddress}</p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300" style={{ background: '#E8EDF2', border: '1px solid #d0d8e4', borderRadius: '16px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1.5px solid #0057FF'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid #d0d8e4'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <CardContent className="p-8 text-center">
                  <Phone className="w-8 h-8 mx-auto mb-4" style={{ color: '#0057FF' }} />
                  <h3 className="font-bold mb-3 text-lg" style={{ color: '#000000' }}>Teléfono</h3>
                  <p style={{ color: '#555555', lineHeight: 1.5 }}>{config.contactPhone}</p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300" style={{ background: '#E8EDF2', border: '1px solid #d0d8e4', borderRadius: '16px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1.5px solid #0057FF'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid #d0d8e4'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <CardContent className="p-8 text-center">
                  <Mail className="w-8 h-8 mx-auto mb-4" style={{ color: '#0057FF' }} />
                  <h3 className="font-bold mb-3 text-lg" style={{ color: '#000000' }}>Email</h3>
                  <p style={{ color: '#555555', lineHeight: 1.5 }}>{config.contactEmail}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 relative z-20" style={{ background: '#0057FF', borderTop: 'none' }}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              {config.logo ? (
                <ImageWithFallback
                  src={config.logo}
                  alt="Logo"
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <Scissors className="w-6 h-6" style={{ color: '#FFFFFF' }} />
              )}
            </div>
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: '#FFFFFF' }}>CzBarber</span>
          </div>
          <p className="text-lg font-medium opacity-90" style={{ color: '#FFFFFF', letterSpacing: '0.02em' }}>
            &copy; 2026 CzBarber. Todos los derechos reservados.
          </p>
          <div className="mt-6 w-24 h-1 bg-white/20 mx-auto rounded-full"></div>
        </div>
      </footer>

      {/* Booking Form Modal */}
      <PublicBookingForm open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}