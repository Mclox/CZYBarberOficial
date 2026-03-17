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
  heroBackground: 'https://images.unsplash.com/photo-1667539916671-b9e7039ccee5?w=1600',
  servicesBackground: 'https://images.unsplash.com/photo-1656921350183-7935040cf7fb?w=1600',
  aboutBackground: 'https://images.unsplash.com/photo-1674287146797-87c893c7407a?w=1600',
  heroTitle: 'El Arte de la Barbería Clásica',
  heroSubtitle: 'Estilo • Elegancia • Excelencia',
  heroDescription: 'Donde la tradición se encuentra con el estilo moderno. Experimenta el mejor servicio de barbería en la ciudad.',
  aboutTitle: 'Sobre CzBarber',
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
          setConfig(JSON.parse(savedConfig));
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
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black"></div>
        </div>

        {/* Header */}
        <header className="relative z-50 bg-black/50 backdrop-blur-md border-b border-[#D4AF37]/20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.logo ? (
                <ImageWithFallback
                  src={config.logo}
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Scissors className="w-8 h-8 text-[#D4AF37]" />
              )}
              <span className="text-2xl font-bold text-white">{config.businessName}</span>
            </div>
            <nav className="hidden md:flex gap-6 text-white">
              <a href="#servicios" className="hover:text-[#D4AF37] transition">Servicios</a>
              <a href="#nosotros" className="hover:text-[#D4AF37] transition">Nosotros</a>
              <a href="#contacto" className="hover:text-[#D4AF37] transition">Contacto</a>
            </nav>
            <Button onClick={onGetStarted} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
              Acceder
            </Button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37] rounded-full backdrop-blur-sm">
              <span className="text-[#D4AF37]">{config.heroSubtitle}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              {config.heroTitle}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              {config.heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setBookingOpen(true)}
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-black text-lg px-8 py-6"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Cita
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black text-lg px-8 py-6"
              >
                Ver Servicios
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-black relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url('${config.servicesBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Nuestros Servicios</h2>
            <p className="text-gray-400 text-lg">Servicios premium para el caballero moderno</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="bg-gray-900/80 backdrop-blur-sm border-gray-800 hover:border-[#D4AF37] transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/20 rounded-full">
                    <service.icon className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-gray-400">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="py-20 bg-gray-900 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-15"
          style={{
            backgroundImage: `url('${config.aboutBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">{config.aboutTitle}</h2>
              <p className="text-gray-300 text-lg mb-4">
                {config.aboutDescription1}
              </p>
              <p className="text-gray-300 text-lg mb-6">
                {config.aboutDescription2}
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-4 bg-black/50 rounded-lg border border-[#D4AF37]/30 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-[#D4AF37] mb-1">{config.yearsExperience}</div>
                  <div className="text-gray-400">Años de Experiencia</div>
                </div>
              </div>
            </div>
            <div className="bg-[#D4AF37]/10 backdrop-blur-sm rounded-lg p-8 border border-[#D4AF37]/30">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Users className="w-8 h-8 text-[#D4AF37] flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Barberos Profesionales</h3>
                    <p className="text-gray-300">Equipo altamente capacitado y certificado</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Star className="w-8 h-8 text-[#D4AF37] flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Calidad Premium</h3>
                    <p className="text-gray-300">Productos y herramientas de alta gama</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-8 h-8 text-[#D4AF37] flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Horarios Flexibles</h3>
                    <p className="text-gray-300">Abierto 7 días a la semana</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Contáctanos</h2>
              <p className="text-gray-400 text-lg">Estamos aquí para atenderte</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                <CardContent className="p-6 text-center">
                  <MapPin className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">Dirección</h3>
                  <p className="text-gray-400">{config.contactAddress}</p>
                </CardContent>
              </Card>
              <Card className="bg-black border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                <CardContent className="p-6 text-center">
                  <Phone className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">Teléfono</h3>
                  <p className="text-gray-400">{config.contactPhone}</p>
                </CardContent>
              </Card>
              <Card className="bg-black border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                <CardContent className="p-6 text-center">
                  <Mail className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">Email</h3>
                  <p className="text-gray-400">{config.contactEmail}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            {config.logo ? (
              <ImageWithFallback
                src={config.logo}
                alt="Logo"
                className="w-6 h-6 object-contain"
              />
            ) : (
              <Scissors className="w-6 h-6 text-[#D4AF37]" />
            )}
            <span className="text-xl font-bold text-white">{config.businessName}</span>
          </div>
          <p>&copy; 2026 {config.businessName}. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Booking Form Modal */}
      <PublicBookingForm open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}