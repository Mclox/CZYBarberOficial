import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { toast } from 'sonner';
import { Image, Save, RefreshCw, Eye } from 'lucide-react';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { LandingPage } from '../../../components/LandingPage';

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

export function ConfiguracionLandingView() {
  const [config, setConfig] = useState<LandingConfig>(defaultConfig);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Cargar configuración guardada
    const savedConfig = localStorage.getItem('landingConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('landingConfig', JSON.stringify(config));
    toast.success('Configuración guardada exitosamente');
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('landingConfig');
    toast.success('Configuración restaurada a valores por defecto');
  };

  const handleImageUrlChange = (field: keyof LandingConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuración de Landing Page</h1>
          <p className="text-gray-400 mt-1">Personaliza la apariencia de tu landing page</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(true)}
            className="border-blue-200 text-blue-800 hover:bg-blue-600 hover:text-black"
          >
            <Eye className="w-4 h-4 mr-2" />
            Vista Previa Completa
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restaurar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo y Marca */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-800" />
              Logo y Marca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo" className="text-gray-300">URL del Logo (opcional)</Label>
              <Input
                id="logo"
                value={config.logo}
                onChange={(e) => handleImageUrlChange('logo', e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no agregas un logo, se usará el icono de tijeras por defecto
              </p>
            </div>

            {config.logo && (
              <div className="border border-gray-700 rounded p-4 bg-gray-800">
                <p className="text-xs text-gray-400 mb-2">Vista previa del logo:</p>
                <ImageWithFallback
                  src={config.logo}
                  alt="Logo preview"
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}

            <div>
              <Label htmlFor="businessName" className="text-gray-300">Nombre del Negocio</Label>
              <Input
                id="businessName"
                value={config.businessName}
                onChange={(e) => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sección Hero - Fondos */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-800" />
              Imagen de Fondo - Hero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroBackground" className="text-gray-300">URL de la Imagen Principal</Label>
              <Input
                id="heroBackground"
                value={config.heroBackground}
                onChange={(e) => handleImageUrlChange('heroBackground', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Imagen de fondo para la sección principal
              </p>
            </div>

            {config.heroBackground && (
              <div className="border border-gray-700 rounded overflow-hidden">
                <p className="text-xs text-gray-400 p-2 bg-gray-800">Vista previa:</p>
                <div className="relative h-32">
                  <ImageWithFallback
                    src={config.heroBackground}
                    alt="Hero background preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <p className="text-white text-sm">Fondo Hero</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección Servicios - Fondo */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-800" />
              Imagen de Fondo - Servicios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="servicesBackground" className="text-gray-300">URL de la Imagen de Servicios</Label>
              <Input
                id="servicesBackground"
                value={config.servicesBackground}
                onChange={(e) => handleImageUrlChange('servicesBackground', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {config.servicesBackground && (
              <div className="border border-gray-700 rounded overflow-hidden">
                <p className="text-xs text-gray-400 p-2 bg-gray-800">Vista previa:</p>
                <div className="relative h-32">
                  <ImageWithFallback
                    src={config.servicesBackground}
                    alt="Services background preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <p className="text-white text-sm">Fondo Servicios</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección Nosotros - Fondo */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-800" />
              Imagen de Fondo - Nosotros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="aboutBackground" className="text-gray-300">URL de la Imagen de Nosotros</Label>
              <Input
                id="aboutBackground"
                value={config.aboutBackground}
                onChange={(e) => handleImageUrlChange('aboutBackground', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {config.aboutBackground && (
              <div className="border border-gray-700 rounded overflow-hidden">
                <p className="text-xs text-gray-400 p-2 bg-gray-800">Vista previa:</p>
                <div className="relative h-32">
                  <ImageWithFallback
                    src={config.aboutBackground}
                    alt="About background preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <p className="text-white text-sm">Fondo Nosotros</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Textos de la Landing */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Textos de la Sección Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="heroSubtitle" className="text-gray-300">Subtítulo (Badge)</Label>
              <Input
                id="heroSubtitle"
                value={config.heroSubtitle}
                onChange={(e) => setConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="heroTitle" className="text-gray-300">Título Principal</Label>
              <Input
                id="heroTitle"
                value={config.heroTitle}
                onChange={(e) => setConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="heroDescription" className="text-gray-300">Descripción</Label>
            <Textarea
              id="heroDescription"
              value={config.heroDescription}
              onChange={(e) => setConfig(prev => ({ ...prev, heroDescription: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información de Contacto */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="contactPhone" className="text-gray-300">Teléfono</Label>
              <Input
                id="contactPhone"
                value={config.contactPhone}
                onChange={(e) => setConfig(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail" className="text-gray-300">Email</Label>
              <Input
                id="contactEmail"
                value={config.contactEmail}
                onChange={(e) => setConfig(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="contactAddress" className="text-gray-300">Dirección</Label>
              <Input
                id="contactAddress"
                value={config.contactAddress}
                onChange={(e) => setConfig(prev => ({ ...prev, contactAddress: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Estadísticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yearsExperience" className="text-gray-300">Años de Experiencia</Label>
              <Input
                id="yearsExperience"
                value={config.yearsExperience}
                onChange={(e) => setConfig(prev => ({ ...prev, yearsExperience: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="10+"
              />
            </div>
            <div>
              <Label htmlFor="happyClients" className="text-gray-300">Clientes Satisfechos</Label>
              <Input
                id="happyClients"
                value={config.happyClients}
                onChange={(e) => setConfig(prev => ({ ...prev, happyClients: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="5000+"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón final para guardar */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Restaurar Valores por Defecto
        </Button>
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Todos los Cambios
        </Button>
      </div>

      {/* Vista previa */}
      <Dialog open={previewMode} onOpenChange={setPreviewMode}>
        <DialogContent className="w-screen h-screen max-w-none p-0 overflow-auto flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Vista Previa de Landing Page</DialogTitle>
            <DialogDescription>
              Vista previa de cómo se verá la landing page con la configuración actual
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1">
            <LandingPage config={config} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}