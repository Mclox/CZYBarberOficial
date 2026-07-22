import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Package, Users, Search, Scissors, Mail, Phone, Calendar, Clock } from 'lucide-react';
import { fetchApi, API_BASE_URL } from '../../lib/api'; // Conexión a la API
import { toast } from 'sonner';
import { formatCOP } from '../../lib/format';

interface ClienteDashboardProps {
  onReservarCita?: (empleadoId?: number, servicioId?: number) => void;
}

export function ClienteDashboard({ onReservarCita }: ClienteDashboardProps) {
  // Estados para datos reales
  const [productos, setProductos] = useState<any[]>([]);
  const [barberos, setBarberos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para búsqueda y filtrado
  const [searchTermProductos, setSearchTermProductos] = useState('');
  const [searchTermBarberos, setSearchTermBarberos] = useState('');

  // --- CARGAR DATOS DESDE LA BASE DE DATOS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Hacemos 3 peticiones en paralelo para cargar todo rápido
      const [resProductos, resUsuarios, resServicios] = await Promise.all([
        fetchApi('/products'),
        fetchApi('/users'),
        fetchApi('/services')
      ]);

      if (resProductos.success) {
        // Solo mostramos productos activos al cliente
        setProductos(resProductos.data.filter((p: any) => p.estado === 'Activo' || p.estado === 'activo'));
      }

      if (resUsuarios.success) {
        // Filtramos solo a los barberos (rol 2) y que estén activos
        const listBarberos = resUsuarios.data.filter(
          (u: any) => (u.id_rol === 2 || u.rol_nombre?.toLowerCase() === 'barbero')
            && (u.estado === 'Activo' || u.estado === 'activo')
        );
        setBarberos(listBarberos);
      }

      if (resServicios.success) {
        setServicios(resServicios.data);
      }

    } catch (error: any) {
      toast.error('Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTROS DE BÚSQUEDA ---
  const filteredProductos = productos.filter(producto => {
    const term = searchTermProductos.toLowerCase();
    return (producto.nombre || '').toLowerCase().includes(term) ||
      (producto.categoria_nombre || '').toLowerCase().includes(term) ||
      (producto.descripcion || '').toLowerCase().includes(term);
  });

  const filteredBarberos = barberos.filter(barbero => {
    const term = searchTermBarberos.toLowerCase();
    return (barbero.nombre || '').toLowerCase().includes(term) ||
      (barbero.rol_nombre || '').toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Scissors className="w-6 h-6 text-[#D4AF37]" />
          Catálogo
        </h1>
        <p className="text-muted-foreground">Explora nuestros productos y conoce a nuestro equipo</p>
      </div>

      <Tabs defaultValue="productos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1">
          <TabsTrigger value="productos" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="barberos" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Barberos</span>
          </TabsTrigger>
          <TabsTrigger value="servicios" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            <span className="hidden sm:inline">Servicios</span>
          </TabsTrigger>
        </TabsList>

        {/* --- TAB PRODUCTOS --- */}
        <TabsContent value="productos" className="space-y-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTermProductos}
                onChange={(e) => setSearchTermProductos(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProductos.map((producto) => (
              <Card key={producto.id_producto} className="hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-[#D4AF37]/30">
                {producto.img || producto.nombre?.toLowerCase().includes('minoxidil') || producto.codigo === 'PRD-MIN-01' ? (
                  <div className="w-full h-48 overflow-hidden bg-white flex items-center justify-center p-4">
                    <img
                      src={
                        producto.nombre?.toLowerCase().includes('minoxidil') || producto.codigo === 'PRD-MIN-01'
                          ? '/assets/images/minoxidil.png'
                          : producto.img.startsWith('http')
                          ? producto.img
                          : `${API_BASE_URL.replace('/api', '')}${producto.img}`
                      }
                      alt={producto.nombre}
                      className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-xs font-medium">Sin imagen</span>
                  </div>
                )}
                <CardHeader className="pb-2 bg-gradient-to-b from-transparent to-muted/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{producto.nombre}</CardTitle>
                      <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mt-1">
                        {producto.categoria_nombre || 'Sin categoría'}
                      </p>
                    </div>
                    <Badge className="bg-slate-900 text-white text-sm font-bold px-3 py-1">
                      {formatCOP(producto.precio_neto)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
                    {producto.descripcion || 'Sin descripción disponible.'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-muted">
                    <span className="text-xs flex items-center gap-1 font-medium">
                      <span className="text-muted-foreground">Stock:</span>
                      <span className={producto.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                        {producto.stock} uds.
                      </span>
                    </span>
                    {producto.stock > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Disponible</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] uppercase">Agotado</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProductos.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No se encontraron productos disponibles.</p>
            </div>
          )}
        </TabsContent>

        {/* --- TAB BARBEROS --- */}
        <TabsContent value="barberos" className="space-y-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar barberos por nombre..."
                value={searchTermBarberos}
                onChange={(e) => setSearchTermBarberos(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBarberos.map((barbero) => (
              <Card key={barbero.id_usuario} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#D4AF37]">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center shadow-inner">
                      {barbero.img ? (
                        <img src={barbero.img} alt={barbero.nombre} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-white text-xl font-bold">{barbero.nombre.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{barbero.nombre}</CardTitle>
                      <Badge variant="secondary" className="mt-1 bg-amber-50 text-amber-700 border border-amber-200">
                        {barbero.rol_nombre || 'Barbero Profesional'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {barbero.email && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="p-1.5 bg-muted rounded-md"><Mail className="w-3.5 h-3.5" /></div>
                      <span>{barbero.email}</span>
                    </div>
                  )}
                  {barbero.telefono && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="p-1.5 bg-muted rounded-md"><Phone className="w-3.5 h-3.5" /></div>
                      <span>{barbero.telefono}</span>
                    </div>
                  )}
                  <div className="pt-4 mt-2 border-t">
                    {onReservarCita && (
                      <Button
                        onClick={() => {
                          try {
                            localStorage.setItem('prefillReserva', JSON.stringify({ empleadoId: barbero.id_usuario }));
                          } catch (e) { }
                          onReservarCita(barbero.id_usuario);
                        }}
                        className="w-full bg-slate-900 hover:bg-[#D4AF37] hover:text-black text-white transition-colors shadow-md"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Agendar con {barbero.nombre.split(' ')[0]}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBarberos.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No se encontraron barberos disponibles.</p>
            </div>
          )}
        </TabsContent>

        {/* --- TAB SERVICIOS --- */}
        <TabsContent value="servicios" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio) => (
              <Card key={servicio.id_servicio} className="hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-md rotate-3">
                      <Scissors className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{servicio.nombre}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-6 flex-1">
                    {servicio.descripcion || 'Servicio profesional de barbería.'}
                  </p>

                  <div className="bg-muted/30 rounded-lg p-4 mb-4 flex justify-between items-center border border-muted">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Inversión</span>
                      <span className="text-xl font-black text-[#D4AF37]">{formatCOP(servicio.precio_neto)}</span>
                    </div>
                    <div className="h-8 w-px bg-border"></div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Tiempo Estimado</span>
                      <span className="text-sm font-bold flex items-center justify-end gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {servicio.duracion_minutos || 30} min
                      </span>
                    </div>
                  </div>

                  {onReservarCita && (
                    <Button
                      onClick={() => {
                        try {
                          localStorage.setItem('prefillReserva', JSON.stringify({ servicioId: servicio.id_servicio }));
                        } catch (e) { }
                        onReservarCita(undefined, servicio.id_servicio);
                      }}
                      className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold shadow-md"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Reservar este servicio
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {servicios.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed">
              <Scissors className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No se encontraron servicios registrados.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Nota informativa */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-none text-white mt-8 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 border border-[#D4AF37]/50">
              <Package className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-[#D4AF37]">Información Importante</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Los productos mostrados en este catálogo están disponibles físicamente en nuestro establecimiento.
                Para adquirirlos, por favor visítanos y consulta con tu barbero de confianza.
                Las compras en línea directas no están habilitadas por el momento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}